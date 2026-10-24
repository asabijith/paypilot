import pytest
from datetime import date, timedelta
from app.routes.expenses import evaluate_expense_policy
from app.routes.tax_vault import compare_tax_regimes, compute_new_regime_tax, compute_old_regime_tax
from app.routes.compliance import calculate_filing_penalty
from app.routes.contractors import FX_RATES_TO_INR

def test_expense_policy_evaluation():
    # Below limit - should pass
    flag, notes = evaluate_expense_policy("travel", 4000.0, "29AABCB1234F1Z5")
    assert not flag
    assert notes is None

    # Travel above limit (> 5,000)
    flag, notes = evaluate_expense_policy("travel", 12000.0, None)
    assert flag
    assert "5,000" in notes

    # Internet above limit (> 2,000)
    flag, notes = evaluate_expense_policy("remote_work_internet", 2500.0, None)
    assert flag
    assert "2,000" in notes

    # Client entertainment above limit (> 4,000)
    flag, notes = evaluate_expense_policy("client_entertainment", 6000.0, None)
    assert flag
    assert "4,000" in notes

def test_dual_regime_tax_comparator():
    # Test high earner: ₹18,00,000 annual CTC
    res = compare_tax_regimes(
        ctc_annual=1800000.0,
        basic_annual=900000.0,
        hra_annual=450000.0,
        sec_80c=150000.0,
        sec_80d=25000.0,
        sec_24b=180000.0,
        sec_80ccd=50000.0,
        annual_rent=300000.0,
        city_type="metro"
    )
    
    assert res["annual_ctc"] == 1800000.0
    assert "new_regime" in res
    assert "old_regime" in res
    # Section 115BAC enhanced standard deduction is ₹75,000
    assert res["new_regime"]["standard_deduction"] == 75000.0
    # Old regime standard deduction is ₹50,000
    assert res["old_regime"]["standard_deduction"] == 50000.0
    assert res["recommendation"] in ["new", "old"]
    assert res["annual_tax_savings"] >= 0.0

def test_contractor_fx_rates():
    assert FX_RATES_TO_INR["INR"] == 1.0
    assert FX_RATES_TO_INR["USD"] > 80.0
    assert FX_RATES_TO_INR["EUR"] > 85.0
    assert FX_RATES_TO_INR["GBP"] > 100.0

def test_compliance_penalty_calculator():
    today = date.today()
    due_date = today - timedelta(days=15)
    
    # Delayed filing for Form 24Q (Section 234E late fee: ₹200/day)
    res_24q = calculate_filing_penalty("form_24q", 50000.0, due_date, today)
    assert res_24q["days_overdue"] == 15
    assert res_24q["penalty_amount"] == 15 * 200.0
    assert "Section 234E" in res_24q["statutory_sections"]

    # Timely filing should have zero penalty
    res_timely = calculate_filing_penalty("form_24q", 50000.0, today + timedelta(days=5), today)
    assert res_timely["days_overdue"] == 0
    assert res_timely["penalty_amount"] == 0.0
    assert res_timely["total_statutory_charge"] == 0.0

    # Delayed TDS Challan 281 (Section 201(1A) 1.5% interest per month)
    res_tds = calculate_filing_penalty("tds_challan_281", 100000.0, due_date, today)
    assert res_tds["days_overdue"] == 15
    assert res_tds["interest_amount"] == 1500.0 # 1.5% of 1,00,000 for 1 month
