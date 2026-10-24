import uuid
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import TaxDeclaration, Employee, SalaryStructure, PayrollPeriod, PayrollItem, AuditLog, User
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/tax-vault", tags=["tax-vault"])

# -----------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# -----------------------------------------------------------------------------

class TaxDeclarationUpdate(BaseModel):
    employee_id: str
    financial_year: Optional[str] = "2026-27"
    regime_selected: Optional[str] = "new" # new, old
    sec_80c_declared: Optional[float] = 0.0
    sec_80d_health_declared: Optional[float] = 0.0
    sec_24b_home_loan_interest_declared: Optional[float] = 0.0
    sec_80ccd_nps_declared: Optional[float] = 0.0
    hra_annual_rent_declared: Optional[float] = 0.0
    landlord_pan: Optional[str] = None
    landlord_name: Optional[str] = None
    rental_city_type: Optional[str] = "metro"
    other_exemptions_declared: Optional[float] = 0.0

class TaxVerificationUpdate(BaseModel):
    declaration_id: str
    status: str # verified, rejected, draft
    sec_80c_approved: float
    sec_80d_health_approved: float
    sec_24b_home_loan_interest_approved: float
    sec_80ccd_nps_approved: float
    hra_annual_rent_approved: float
    other_exemptions_approved: float
    verification_notes: Optional[str] = None
    sync_to_payroll: Optional[bool] = False

class RegimeCompareRequest(BaseModel):
    employee_id: str
    custom_ctc: Optional[float] = None
    sec_80c: Optional[float] = 0.0
    sec_80d: Optional[float] = 0.0
    sec_24b: Optional[float] = 0.0
    sec_80ccd: Optional[float] = 0.0
    annual_rent: Optional[float] = 0.0
    city_type: Optional[str] = "metro"

# -----------------------------------------------------------------------------
# DETERMINISTIC DUAL-REGIME TAX CALCULATION ENGINE (FY 2026-27)
# -----------------------------------------------------------------------------

def compute_new_regime_tax(taxable_income: float) -> float:
    """
    Section 115BAC Slabs for FY 2026-27:
    Up to 3,00,000: Nil
    3,00,001 - 7,00,000: 5%
    7,00,001 - 10,00,000: 10%
    10,00,001 - 12,00,000: 15%
    12,00,001 - 15,00,000: 20%
    Above 15,00,000: 30%
    Rebate u/s 87A: If taxable income <= 7,00,000 -> Tax is Nil!
    """
    if taxable_income <= 700000:
        return 0.0
        
    tax = 0.0
    if taxable_income > 1500000:
        tax += (taxable_income - 1500000) * 0.30
        taxable_income = 1500000
    if taxable_income > 1200000:
        tax += (taxable_income - 1200000) * 0.20
        taxable_income = 1200000
    if taxable_income > 1000000:
        tax += (taxable_income - 1000000) * 0.15
        taxable_income = 1000000
    if taxable_income > 700000:
        tax += (taxable_income - 700000) * 0.10
        taxable_income = 700000
    if taxable_income > 300000:
        tax += (taxable_income - 300000) * 0.05
        
    # Health and Education Cess @ 4%
    cess = tax * 0.04
    return round(tax + cess, 2)

def compute_old_regime_tax(taxable_income: float) -> float:
    """
    Old Tax Regime Slabs:
    Up to 2,50,000: Nil
    2,50,001 - 5,00,000: 5%
    5,00,001 - 10,00,000: 20%
    Above 10,00,000: 30%
    Rebate u/s 87A: If taxable income <= 5,00,000 -> Tax is Nil!
    """
    if taxable_income <= 500000:
        return 0.0
        
    tax = 0.0
    if taxable_income > 1000000:
        tax += (taxable_income - 1000000) * 0.30
        taxable_income = 1000000
    if taxable_income > 500000:
        tax += (taxable_income - 500000) * 0.20
        taxable_income = 500000
    if taxable_income > 250000:
        tax += (taxable_income - 250000) * 0.05
        
    cess = tax * 0.04
    return round(tax + cess, 2)

def calculate_hra_exemption(basic_annual: float, hra_annual: float, rent_annual: float, city_type: str = "metro") -> float:
    if rent_annual <= 0 or hra_annual <= 0:
        return 0.0
    excess_rent = max(0.0, rent_annual - (0.10 * basic_annual))
    pct_basic = 0.50 if city_type.lower() == "metro" else 0.40
    return min(hra_annual, excess_rent, pct_basic * basic_annual)

# -----------------------------------------------------------------------------
# ENDPOINTS
# -----------------------------------------------------------------------------

@router.get("/declarations")
def list_tax_declarations(
    financial_year: Optional[str] = "2026-27",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(TaxDeclaration).filter(
        TaxDeclaration.company_id == current_user.company_id,
        TaxDeclaration.financial_year == financial_year
    )
    if current_user.role == "employee":
        query = query.filter(TaxDeclaration.employee_id == current_user.employee_id)
        
    declarations = query.all()
    return [
        {
            "id": d.id,
            "employee_id": d.employee_id,
            "employee_name": d.employee_name,
            "financial_year": d.financial_year,
            "regime_selected": d.regime_selected,
            "sec_80c_declared": d.sec_80c_declared,
            "sec_80c_approved": d.sec_80c_approved,
            "sec_80d_health_declared": d.sec_80d_health_declared,
            "sec_80d_health_approved": d.sec_80d_health_approved,
            "sec_24b_home_loan_interest_declared": d.sec_24b_home_loan_interest_declared,
            "sec_24b_home_loan_interest_approved": d.sec_24b_home_loan_interest_approved,
            "sec_80ccd_nps_declared": d.sec_80ccd_nps_declared,
            "sec_80ccd_nps_approved": d.sec_80ccd_nps_approved,
            "hra_annual_rent_declared": d.hra_annual_rent_declared,
            "hra_annual_rent_approved": d.hra_annual_rent_approved,
            "landlord_pan": d.landlord_pan,
            "landlord_name": d.landlord_name,
            "rental_city_type": d.rental_city_type,
            "other_exemptions_declared": d.other_exemptions_declared,
            "other_exemptions_approved": d.other_exemptions_approved,
            "status": d.status,
            "verification_notes": d.verification_notes,
            "verified_by": d.verified_by,
            "verified_at": d.verified_at.isoformat() if d.verified_at else None
        }
        for d in declarations
    ]

@router.get("/declarations/{employee_id}")
def get_employee_tax_declaration(
    employee_id: str,
    financial_year: Optional[str] = "2026-27",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "employee" and current_user.employee_id != employee_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    decl = db.query(TaxDeclaration).filter(
        TaxDeclaration.company_id == current_user.company_id,
        TaxDeclaration.employee_id == employee_id,
        TaxDeclaration.financial_year == financial_year
    ).first()
    
    if not decl:
        # Create initial default draft
        emp = db.query(Employee).filter(
            Employee.id == employee_id,
            Employee.company_id == current_user.company_id
        ).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
            
        decl = TaxDeclaration(
            id=f"tax_{uuid.uuid4().hex[:10]}",
            company_id=current_user.company_id,
            employee_id=emp.id,
            employee_name=f"{emp.first_name} {emp.last_name}",
            financial_year=financial_year or "2026-27",
            regime_selected=emp.tax_regime or "new",
            status="draft"
        )
        db.add(decl)
        db.commit()
        db.refresh(decl)
        
    return {
        "id": decl.id,
        "employee_id": decl.employee_id,
        "employee_name": decl.employee_name,
        "financial_year": decl.financial_year,
        "regime_selected": decl.regime_selected,
        "sec_80c_declared": decl.sec_80c_declared,
        "sec_80c_approved": decl.sec_80c_approved,
        "sec_80d_health_declared": decl.sec_80d_health_declared,
        "sec_80d_health_approved": decl.sec_80d_health_approved,
        "sec_24b_home_loan_interest_declared": decl.sec_24b_home_loan_interest_declared,
        "sec_24b_home_loan_interest_approved": decl.sec_24b_home_loan_interest_approved,
        "sec_80ccd_nps_declared": decl.sec_80ccd_nps_declared,
        "sec_80ccd_nps_approved": decl.sec_80ccd_nps_approved,
        "hra_annual_rent_declared": decl.hra_annual_rent_declared,
        "hra_annual_rent_approved": decl.hra_annual_rent_approved,
        "landlord_pan": decl.landlord_pan,
        "landlord_name": decl.landlord_name,
        "rental_city_type": decl.rental_city_type,
        "other_exemptions_declared": decl.other_exemptions_declared,
        "other_exemptions_approved": decl.other_exemptions_approved,
        "status": decl.status,
        "verification_notes": decl.verification_notes,
        "verified_by": decl.verified_by,
        "verified_at": decl.verified_at.isoformat() if decl.verified_at else None
    }

@router.post("/declarations")
def save_tax_declaration(
    payload: TaxDeclarationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_emp_id = payload.employee_id
    if current_user.role == "employee" and current_user.employee_id:
        target_emp_id = current_user.employee_id
        
    emp = db.query(Employee).filter(
        Employee.id == target_emp_id,
        Employee.company_id == current_user.company_id
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    decl = db.query(TaxDeclaration).filter(
        TaxDeclaration.company_id == current_user.company_id,
        TaxDeclaration.employee_id == target_emp_id,
        TaxDeclaration.financial_year == (payload.financial_year or "2026-27")
    ).first()
    
    if not decl:
        decl = TaxDeclaration(
            id=f"tax_{uuid.uuid4().hex[:10]}",
            company_id=current_user.company_id,
            employee_id=emp.id,
            employee_name=f"{emp.first_name} {emp.last_name}",
            financial_year=payload.financial_year or "2026-27"
        )
        db.add(decl)
        
    decl.regime_selected = payload.regime_selected or "new"
    decl.sec_80c_declared = min(150000.0, max(0.0, payload.sec_80c_declared or 0.0))
    decl.sec_80d_health_declared = min(75000.0, max(0.0, payload.sec_80d_health_declared or 0.0))
    decl.sec_24b_home_loan_interest_declared = min(200000.0, max(0.0, payload.sec_24b_home_loan_interest_declared or 0.0))
    decl.sec_80ccd_nps_declared = min(50000.0, max(0.0, payload.sec_80ccd_nps_declared or 0.0))
    decl.hra_annual_rent_declared = max(0.0, payload.hra_annual_rent_declared or 0.0)
    decl.landlord_pan = payload.landlord_pan
    decl.landlord_name = payload.landlord_name
    decl.rental_city_type = payload.rental_city_type or "metro"
    decl.other_exemptions_declared = max(0.0, payload.other_exemptions_declared or 0.0)
    decl.status = "submitted"
    
    # Update employee tax regime setting
    emp.tax_regime = decl.regime_selected
    
    db.commit()
    return {"message": "Form 12BB tax declarations saved successfully", "id": decl.id}

@router.put("/verify")
def verify_tax_declaration(
    payload: TaxVerificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """HR/FinOps verification of employee investment proofs."""
    if current_user.role not in ["owner", "admin", "hr_admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    decl = db.query(TaxDeclaration).filter(
        TaxDeclaration.id == payload.declaration_id,
        TaxDeclaration.company_id == current_user.company_id
    ).first()
    if not decl:
        raise HTTPException(status_code=404, detail="Declaration record not found")
        
    decl.sec_80c_approved = min(150000.0, payload.sec_80c_approved)
    decl.sec_80d_health_approved = min(75000.0, payload.sec_80d_health_approved)
    decl.sec_24b_home_loan_interest_approved = min(200000.0, payload.sec_24b_home_loan_interest_approved)
    decl.sec_80ccd_nps_approved = min(50000.0, payload.sec_80ccd_nps_approved)
    decl.hra_annual_rent_approved = payload.hra_annual_rent_approved
    decl.other_exemptions_approved = payload.other_exemptions_approved
    decl.status = payload.status
    decl.verification_notes = payload.notes if hasattr(payload, 'notes') else payload.verification_notes
    decl.verified_by = current_user.full_name or current_user.email
    decl.verified_at = datetime.utcnow()
    
    if payload.sync_to_payroll:
        # Calculate new monthly TDS deduction based on approved values
        emp = db.query(Employee).filter(Employee.id == decl.employee_id).first()
        salary = db.query(SalaryStructure).filter(SalaryStructure.employee_id == decl.employee_id).first()
        if emp and salary:
            comp = compare_tax_regimes(
                ctc_annual=salary.ctc_annual,
                basic_annual=salary.basic * 12,
                hra_annual=salary.hra * 12,
                sec_80c=decl.sec_80c_approved,
                sec_80d=decl.sec_80d_health_approved,
                sec_24b=decl.sec_24b_home_loan_interest_approved,
                sec_80ccd=decl.sec_80ccd_nps_approved,
                annual_rent=decl.hra_annual_rent_approved,
                city_type=decl.rental_city_type
            )
            monthly_tds = comp["selected_monthly_tds"] if decl.regime_selected == "old" else comp["new_regime"]["monthly_tds"]
            salary.tds_monthly_override = monthly_tds
            
    db.commit()
    return {"message": "Tax declarations verified and approved successfully", "id": decl.id}

@router.post("/compare")
def compare_tax_regimes_endpoint(
    payload: RegimeCompareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Compares New Regime (Section 115BAC) vs Old Regime with dynamic tax-saving recommendation."""
    emp = db.query(Employee).filter(
        Employee.id == payload.employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    salary = db.query(SalaryStructure).filter(SalaryStructure.employee_id == emp.id).first()
    ctc_annual = payload.custom_ctc or (salary.ctc_annual if salary else 600000.0)
    basic_annual = (salary.basic * 12) if salary else (ctc_annual * 0.50)
    hra_annual = (salary.hra * 12) if salary else (basic_annual * 0.50)
    
    result = compare_tax_regimes(
        ctc_annual=ctc_annual,
        basic_annual=basic_annual,
        hra_annual=hra_annual,
        sec_80c=payload.sec_80c or 0.0,
        sec_80d=payload.sec_80d or 0.0,
        sec_24b=payload.sec_24b or 0.0,
        sec_80ccd=payload.sec_80ccd or 0.0,
        annual_rent=payload.annual_rent or 0.0,
        city_type=payload.city_type or "metro"
    )
    return result

def compare_tax_regimes(
    ctc_annual: float,
    basic_annual: float,
    hra_annual: float,
    sec_80c: float,
    sec_80d: float,
    sec_24b: float,
    sec_80ccd: float,
    annual_rent: float,
    city_type: str = "metro"
) -> Dict[str, Any]:
    # 1. New Regime Calculation
    new_std_deduction = 75000.0 # FY 2026-27 enhanced standard deduction
    new_taxable_income = max(0.0, ctc_annual - new_std_deduction)
    new_tax = compute_new_regime_tax(new_taxable_income)
    
    # 2. Old Regime Calculation
    old_std_deduction = 50000.0
    hra_exemption = calculate_hra_exemption(basic_annual, hra_annual, annual_rent, city_type)
    
    total_deductions_old = (
        old_std_deduction +
        hra_exemption +
        min(150000.0, sec_80c) +
        min(75000.0, sec_80d) +
        min(200000.0, sec_24b) +
        min(50000.0, sec_80ccd)
    )
    old_taxable_income = max(0.0, ctc_annual - total_deductions_old)
    old_tax = compute_old_regime_tax(old_taxable_income)
    
    tax_diff = abs(new_tax - old_tax)
    if new_tax < old_tax:
        recommendation = "new"
        reason = f"New Tax Regime saves you ₹{tax_diff:,.2f}/year with ₹75k standard deduction and lower slab rates."
    elif old_tax < new_tax:
        recommendation = "old"
        reason = f"Old Tax Regime saves you ₹{tax_diff:,.2f}/year because of Chapter VI-A & Home Loan / HRA deductions (₹{total_deductions_old:,.2f})."
    else:
        recommendation = "new"
        reason = "Both regimes result in zero or equal tax liability. New Regime is recommended for minimal paperwork."
        
    return {
        "annual_ctc": ctc_annual,
        "recommendation": recommendation,
        "recommendation_reason": reason,
        "annual_tax_savings": round(tax_diff, 2),
        "new_regime": {
            "gross_income": ctc_annual,
            "standard_deduction": new_std_deduction,
            "other_exemptions": 0.0,
            "taxable_income": round(new_taxable_income, 2),
            "annual_tax": round(new_tax, 2),
            "monthly_tds": round(new_tax / 12, 2)
        },
        "old_regime": {
            "gross_income": ctc_annual,
            "standard_deduction": old_std_deduction,
            "hra_exemption": round(hra_exemption, 2),
            "sec_80c": min(150000.0, sec_80c),
            "sec_80d": min(75000.0, sec_80d),
            "sec_24b": min(200000.0, sec_24b),
            "sec_80ccd": min(50000.0, sec_80ccd),
            "total_deductions": round(total_deductions_old, 2),
            "taxable_income": round(old_taxable_income, 2),
            "annual_tax": round(old_tax, 2),
            "monthly_tds": round(old_tax / 12, 2)
        }
    }
