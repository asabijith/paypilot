import uuid
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.models import (
    Company, User, Employee, SalaryStructure,
    AttendanceRecord, LeaveBalance, LeaveRequest,
    PayrollPeriod, PayrollItem, AuditFinding, AuditLog,
    ExpenseClaim, SalaryAdvance, TaxDeclaration,
    Contractor, ContractorInvoice, ComplianceFiling
)
from app.config import settings
from app.payroll_engine import calculate_payroll_item

def seed_database(db: Session, force: bool = False):
    """
    Populates database with realistic Indian startup data and intentional demo anomalies.
    """
    existing_company = db.query(Company).filter(Company.id == settings.DEFAULT_COMPANY_ID).first()
    if existing_company and not force:
        return

    if force:
        # Clear existing data
        db.query(ExpenseClaim).delete()
        db.query(SalaryAdvance).delete()
        db.query(TaxDeclaration).delete()
        db.query(ContractorInvoice).delete()
        db.query(Contractor).delete()
        db.query(ComplianceFiling).delete()
        db.query(AuditFinding).delete()
        db.query(AuditLog).delete()
        db.query(PayrollItem).delete()
        db.query(PayrollPeriod).delete()
        db.query(LeaveRequest).delete()
        db.query(LeaveBalance).delete()
        db.query(AttendanceRecord).delete()
        db.query(SalaryStructure).delete()
        db.query(Employee).delete()
        db.query(User).delete()
        db.query(Company).delete()
        db.commit()

    # 1. Company
    comp = Company(
        id=settings.DEFAULT_COMPANY_ID,
        name=settings.DEFAULT_COMPANY_NAME,
        pan="AABCB1234F",
        tan="BLRB12345C",
        epf_reg="KN/BNG/1234567/000",
        esic_reg="53000123450000001",
        address="Koramangala 4th Block, Bengaluru, Karnataka 560034"
    )
    db.add(comp)
    db.commit()

    # 2. Employees Data
    raw_employees = [
        {
            "id": "emp_001",
            "emp_code": "BTI-001",
            "first_name": "Sneha",
            "last_name": "Rao",
            "email": "sneha.rao@bharattech.io",
            "phone": "+91 9845012345",
            "department": "Design",
            "designation": "Lead UI/UX Designer",
            "joining_date": date(2023, 4, 15),
            "status": "active",
            "pan": "ABCDE1234F",
            "bank_name": "HDFC Bank",
            "bank_account": "50100456123489",
            "ifsc": "HDFC0001234",
            "tax_regime": "new",
            "state": "Karnataka",
            "basic": 45000.0,
            "hra": 22500.0,
            "special": 12500.0,
            "ctc": 1050000.0
        },
        {
            "id": "emp_002",
            "emp_code": "BTI-002",
            "first_name": "Priya",
            "last_name": "Sharma",
            "email": "priya.sharma@bharattech.io",
            "phone": "+91 9811234567",
            "department": "Marketing",
            "designation": "Product Marketing Lead",
            "joining_date": date(2022, 8, 1),
            "status": "active",
            "pan": "BKPPS9876K",
            "bank_name": "ICICI Bank",
            "bank_account": "002105009876",
            "ifsc": "ICIC0000021",
            "tax_regime": "new",
            "state": "Karnataka",
            "basic": 55000.0,
            "hra": 27500.0,
            "special": 17500.0,
            "ctc": 1300000.0
        },
        {
            "id": "emp_003",
            "emp_code": "BTI-003",
            "first_name": "Rohan",
            "last_name": "Verma",
            "email": "rohan.verma@bharattech.io",
            "phone": "+91 9900887766",
            "department": "Engineering",
            "designation": "Staff Backend Engineer",
            "joining_date": date(2021, 6, 10),
            "status": "active",
            "pan": "CRRPV5432L",
            "bank_name": "Axis Bank",
            "bank_account": "918020045678912",
            "ifsc": "UTIB0000128",
            "tax_regime": "new",
            "state": "Karnataka",
            "basic": 75000.0,
            "hra": 37500.0,
            "special": 27500.0,
            "ctc": 1850000.0
        },
        {
            "id": "emp_004",
            "emp_code": "BTI-004",
            "first_name": "Vikram",
            "last_name": "Singh",
            "email": "vikram.singh@bharattech.io",
            "phone": "+91 9871122334",
            "department": "Engineering",
            "designation": "DevOps Architect",
            "joining_date": date(2022, 11, 20),
            "status": "active",
            "pan": "DABVS3321M",
            "bank_name": "State Bank of India",
            "bank_account": "", # SEEDED INTENTIONAL ISSUE: Missing bank details
            "ifsc": "",         # SEEDED INTENTIONAL ISSUE: Missing IFSC
            "tax_regime": "new",
            "state": "Karnataka",
            "basic": 60000.0,
            "hra": 30000.0,
            "special": 20000.0,
            "ctc": 1420000.0
        },
        {
            "id": "emp_005",
            "emp_code": "BTI-005",
            "first_name": "Amit",
            "last_name": "Patel",
            "email": "amit.patel@bharattech.io",
            "phone": "+91 9723456789",
            "department": "Sales",
            "designation": "Enterprise Account Executive",
            "joining_date": date(2023, 2, 1),
            "status": "active",
            "pan": "ELKPA8765N",
            "bank_name": "Kotak Mahindra Bank",
            "bank_account": "4512349876",
            "ifsc": "KKBK0000456",
            "tax_regime": "new",
            "state": "Karnataka",
            "basic": 25000.0,
            "hra": 12500.0,
            "special": 2500.0,
            "ctc": 520000.0
        },
        {
            "id": "emp_006",
            "emp_code": "BTI-006",
            "first_name": "Kavita",
            "last_name": "Nair",
            "email": "kavita.nair@bharattech.io",
            "phone": "+91 9654321098",
            "department": "Human Resources",
            "designation": "HR Operations Specialist",
            "joining_date": date(2024, 1, 15),
            "status": "active",
            "pan": "FNKPN1298P",
            "bank_name": "HDFC Bank",
            "bank_account": "50100789012345",
            "ifsc": "HDFC0001234",
            "tax_regime": "new",
            "state": "Karnataka",
            "basic": 20000.0,
            "hra": 10000.0,
            "special": 5000.0,
            "ctc": 440000.0
        }
    ]

    for item in raw_employees:
        emp = Employee(
            id=item["id"],
            company_id=comp.id,
            emp_code=item["emp_code"],
            first_name=item["first_name"],
            last_name=item["last_name"],
            email=item["email"],
            phone=item["phone"],
            department=item["department"],
            designation=item["designation"],
            joining_date=item["joining_date"],
            status=item["status"],
            pan=item["pan"],
            bank_name=item["bank_name"],
            bank_account=item["bank_account"],
            ifsc=item["ifsc"],
            tax_regime=item["tax_regime"],
            state=item["state"]
        )
        db.add(emp)

        # Salary Structure
        sal = SalaryStructure(
            id=f"sal_{item['id']}",
            company_id=comp.id,
            employee_id=item["id"],
            ctc_annual=item["ctc"],
            basic=item["basic"],
            hra=item["hra"],
            special_allowance=item["special"],
            pf_applicable=True,
            pf_type="statutory_capped_1800",
            esi_applicable=(item["basic"] + item["hra"] + item["special"]) <= 21000.0,
            pt_applicable=True,
            pt_state="Karnataka"
        )
        db.add(sal)

        # Leave Balance
        lb = LeaveBalance(
            id=f"lb_{item['id']}",
            company_id=comp.id,
            employee_id=item["id"],
            year=2026,
            casual_leave_total=12.0,
            casual_leave_used=2.0 if item["id"] != "emp_002" else 4.0,
            sick_leave_total=10.0,
            sick_leave_used=1.0,
            earned_leave_total=15.0,
            earned_leave_used=3.0
        )
        db.add(lb)
    db.commit()

    # 3. Users for Demo Role-Switching
    users_data = [
        {
            "id": "usr_admin",
            "email": "admin@bharattech.io",
            "full_name": "Ananya Sen",
            "role": "admin",
            "employee_id": "emp_006"
        },
        {
            "id": "usr_payroll",
            "email": "payroll@bharattech.io",
            "full_name": "Rajesh Nair",
            "role": "payroll_admin",
            "employee_id": None
        },
        {
            "id": "usr_emp_rohan",
            "email": "rohan.verma@bharattech.io",
            "full_name": "Rohan Verma",
            "role": "employee",
            "employee_id": "emp_003"
        },
        {
            "id": "usr_emp_sneha",
            "email": "sneha.rao@bharattech.io",
            "full_name": "Sneha Rao",
            "role": "employee",
            "employee_id": "emp_001"
        }
    ]

    for u in users_data:
        usr = User(
            id=u["id"],
            company_id=comp.id,
            email=u["email"],
            full_name=u["full_name"],
            role=u["role"],
            employee_id=u["employee_id"]
        )
        db.add(usr)
    db.commit()

    # 4. Attendance Records for current month
    # Priya Sharma (emp_002) has 4 absent days recorded without approved leave!
    today = date.today()
    for d in range(1, 20):
        c_date = date(2026, 10, d) if d <= 23 else today
        # Weekends
        if c_date.weekday() in [5, 6]:
            continue
        for item in raw_employees:
            status = "present"
            if item["id"] == "emp_002" and d in [8, 9, 10, 11]:
                status = "absent" # SEEDED ISSUE: 4 days unapproved absence
            elif item["id"] == "emp_005" and d == 5:
                status = "half_day"

            rec = AttendanceRecord(
                id=f"att_{item['id']}_{d}",
                company_id=comp.id,
                employee_id=item["id"],
                date=c_date,
                status=status,
                check_in="09:15 AM" if status in ["present", "half_day"] else None,
                check_out="06:30 PM" if status == "present" else ("01:30 PM" if status == "half_day" else None)
            )
            db.add(rec)
    db.commit()

    # 5. Leave Requests
    leave_reqs = [
        LeaveRequest(
            id="lr_001",
            company_id=comp.id,
            employee_id="emp_005",
            leave_type="casual",
            start_date=date(2026, 10, 26),
            end_date=date(2026, 10, 27),
            days_count=2.0,
            reason="Family wedding in Ahmedabad",
            status="pending"
        ),
        LeaveRequest(
            id="lr_002",
            company_id=comp.id,
            employee_id="emp_003",
            leave_type="sick",
            start_date=date(2026, 10, 14),
            end_date=date(2026, 10, 14),
            days_count=1.0,
            reason="Viral fever recovery",
            status="approved",
            reviewed_by="Ananya Sen",
            review_comment="Approved. Get well soon."
        )
    ]
    for lr in leave_reqs:
        db.add(lr)
    db.commit()

    # 6. Payroll Periods:
    # A) Previous Month: September 2026 (Processed)
    prev_period = PayrollPeriod(
        id="period_sep_2026",
        company_id=comp.id,
        month=9,
        year=2026,
        name="September 2026",
        working_days=22,
        status="processed",
        processed_at=datetime(2026, 9, 30, 18, 0, 0),
        processed_by="Rajesh Nair"
    )
    db.add(prev_period)
    db.commit()

    # Add historical September items
    for item in raw_employees:
        res = calculate_payroll_item(
            basic=item["basic"],
            hra=item["hra"],
            special_allowance=item["special"],
            pf_applicable=True,
            pf_type="statutory_capped_1800",
            esi_applicable=(item["basic"] + item["hra"] + item["special"]) <= 21000.0,
            pt_applicable=True,
            pt_state="Karnataka",
            unpaid_leave_days=0.0,
            working_days=22,
            tax_regime=item["tax_regime"]
        )
        p_item = PayrollItem(
            id=f"item_sep_{item['id']}",
            company_id=comp.id,
            period_id=prev_period.id,
            employee_id=item["id"],
            basic=res["basic"],
            hra=res["hra"],
            special_allowance=res["special_allowance"],
            gross_earnings=res["gross_earnings"],
            employee_pf=res["employee_pf"],
            employee_esi=res["employee_esi"],
            professional_tax=res["professional_tax"],
            tds=res["tds"],
            total_deductions=res["total_deductions"],
            net_salary=res["net_salary"],
            employer_pf=res["employer_pf"],
            employer_esi=res["employer_esi"],
            total_employer_cost=res["total_employer_cost"],
            audit_status="clean"
        )
        db.add(p_item)
    db.commit()

    # B) Current Active Period: October 2026 (Draft/Calculated)
    curr_period = PayrollPeriod(
        id="period_oct_2026",
        company_id=comp.id,
        month=10,
        year=2026,
        name="October 2026",
        working_days=22,
        status="calculated",
        created_at=datetime(2026, 10, 1, 9, 0, 0)
    )
    db.add(curr_period)
    db.commit()

    # Add October items with intentional SEEDED ANOMALIES for Hackathon Demo:
    for item in raw_employees:
        bonus = 0.0
        unpaid_days = 0.0
        other_deductions = 0.0
        notes = "Standard monthly payroll"

        # SEEDED ANOMALY 1: Rohan Verma (emp_003) - Unusual Salary Spike (+45% spike, bonus ₹75,000 accidentally duplicated)
        if item["id"] == "emp_003":
            bonus = 75000.0
            notes = "Accidental duplicate festival bonus applied"

        # SEEDED ANOMALY 2: Priya Sharma (emp_002) - Attendance Mismatch (4 unapproved absences, but 0 unpaid_days entered!)
        if item["id"] == "emp_002":
            unpaid_days = 0.0 # Intentional discrepancy: attendance records have 4 absent days
            notes = "Attendance mismatch: 4 absent days in logs but not deducted"

        # SEEDED ANOMALY 3: Amit Patel (emp_005) - Negative Net Pay due to ₹45,000 excessive loan deduction on ₹40,000 gross!
        if item["id"] == "emp_005":
            other_deductions = 45000.0 # Exceeds gross earnings of ₹40,000
            notes = "Excess loan recovery deduction causing negative net pay"

        res = calculate_payroll_item(
            basic=item["basic"],
            hra=item["hra"],
            special_allowance=item["special"],
            bonus_or_variable=bonus,
            pf_applicable=True,
            pf_type="statutory_capped_1800",
            esi_applicable=(item["basic"] + item["hra"] + item["special"]) <= 21000.0,
            pt_applicable=True,
            pt_state="Karnataka",
            unpaid_leave_days=unpaid_days,
            working_days=22,
            tax_regime=item["tax_regime"],
            other_deductions=other_deductions
        )

        curr_p_item = PayrollItem(
            id=f"item_oct_{item['id']}",
            company_id=comp.id,
            period_id=curr_period.id,
            employee_id=item["id"],
            basic=res["basic"],
            hra=res["hra"],
            special_allowance=res["special_allowance"],
            bonus_or_variable=res["bonus_or_variable"],
            gross_earnings=res["gross_earnings"],
            employee_pf=res["employee_pf"],
            employee_esi=res["employee_esi"],
            professional_tax=res["professional_tax"],
            tds=res["tds"],
            unpaid_leave_days=res["unpaid_leave_days"],
            lop_deduction=res["lop_deduction"],
            other_deductions=res["other_deductions"],
            total_deductions=res["total_deductions"],
            net_salary=res["net_salary"],
            employer_pf=res["employer_pf"],
            employer_esi=res["employer_esi"],
            total_employer_cost=res["total_employer_cost"],
            audit_status="flagged" if item["id"] in ["emp_002", "emp_003", "emp_004", "emp_005"] else "clean",
            notes=notes
        )
        db.add(curr_p_item)
    db.commit()

    # 7. Pre-seed the Initial Audit Findings so the Auditor Page is immediately alive and ready to impress!
    findings = [
        AuditFinding(
            id="audit_fnd_001",
            company_id=comp.id,
            period_id=curr_period.id,
            employee_id="emp_003", # Rohan Verma
            category="Salary Spike",
            severity="HIGH",
            title="Unusual Salary Spike of +53.6% (+₹75,000.00)",
            description=(
                "Gross salary for Rohan Verma (BTI-003) jumped from ₹1,40,000.00 in September 2026 "
                "to ₹2,15,000.00 in October 2026. This exceeds the 30% anomaly variance threshold."
            ),
            expected_value="₹1,40,000.00 (±15% variance)",
            observed_value="₹2,15,000.00 (+53.6% spike)",
            recommended_action="Verify if bonus of ₹75,000.00 was legitimately approved by HR. Potential double credit detected.",
            status="Open"
        ),
        AuditFinding(
            id="audit_fnd_002",
            company_id=comp.id,
            period_id=curr_period.id,
            employee_id="emp_002", # Priya Sharma
            category="Attendance Mismatch",
            severity="HIGH",
            title="Attendance Mismatch: 4 Unapproved Absences, 0 LOP Deducted",
            description=(
                "Attendance logs show 4 unapproved absent days for Priya Sharma (BTI-002), "
                "yet 0 Loss of Pay (LOP) days were applied in the payroll calculation."
            ),
            expected_value="4 Unpaid LOP Days (Deduction: ₹18,181.82)",
            observed_value="0 Deducted Days (₹0.00 LOP)",
            recommended_action="Adjust payroll item to apply 4 days LOP or obtain formal manager approval for casual leave conversion.",
            status="Open"
        ),
        AuditFinding(
            id="audit_fnd_003",
            company_id=comp.id,
            period_id=curr_period.id,
            employee_id="emp_005", # Amit Patel
            category="Negative Net Pay",
            severity="CRITICAL",
            title="Negative Net Salary: -₹7,000.00",
            description=(
                "Total deductions (₹47,000.00) exceed gross earnings (₹40,000.00) for Amit Patel (BTI-005) "
                "due to an excess company advance / loan recovery of ₹45,000.00."
            ),
            expected_value="Net Pay >= ₹0.00 (Deductions capped at 50% of gross = ₹20,000.00 max)",
            observed_value="Net Pay = -₹7,000.00",
            recommended_action="Cap loan recovery to ₹15,000.00 per month across 3 installments in compliance with the Payment of Wages Act.",
            status="Open"
        ),
        AuditFinding(
            id="audit_fnd_004",
            company_id=comp.id,
            period_id=curr_period.id,
            employee_id="emp_004", # Vikram Singh
            category="Missing Statutory Information",
            severity="MEDIUM",
            title="Missing Bank Account and IFSC Code",
            description=(
                "DevOps Architect Vikram Singh (BTI-004) has blank bank disbursement details in his profile. "
                "Direct credit via NACH / NEFT will fail during automated bank batch upload."
            ),
            expected_value="Valid bank account number & 11-char IFSC code",
            observed_value="Bank Account: MISSING, IFSC: MISSING",
            recommended_action="Update verified employee bank details before releasing payroll file to payment gateway.",
            status="Open"
        )
    ]
    for f in findings:
        db.add(f)

    # 8. Audit Log
    db.add(AuditLog(
        id=f"log_{uuid.uuid4().hex[:8]}",
        company_id=comp.id,
        user_id="usr_admin",
        action="INITIALIZE_SEED",
        entity_type="SYSTEM",
        entity_id="ALL",
        details="Seeded initial Indian enterprise HR & Payroll records with demonstration data."
    ))

    # 9. FinOps Expense Claims
    exp_claims = [
        ExpenseClaim(
            id="exp_001",
            company_id=comp.id,
            employee_id="emp_001",
            employee_name="Sneha Rao",
            title="Client Meeting in Mumbai (Airfare & Stay)",
            category="travel",
            amount=14500.0,
            currency="INR",
            expense_date=date(2026, 10, 5),
            status="approved",
            tax_treatment="tax_free_sec10",
            receipt_name="indigo_hotel_mumbai.pdf",
            merchant_name="IndiGo & Marriott",
            gstin="27AABCM1234F1Z1",
            policy_violation_flag=False,
            approved_by="usr_admin",
            approved_at=datetime.utcnow() - timedelta(days=15),
            created_at=datetime.utcnow() - timedelta(days=18)
        ),
        ExpenseClaim(
            id="exp_002",
            company_id=comp.id,
            employee_id="emp_002",
            employee_name="Rohan Verma",
            title="Monthly High-Speed Fiber Internet",
            category="remote_work_internet",
            amount=2499.0,
            currency="INR",
            expense_date=date(2026, 10, 1),
            status="approved",
            tax_treatment="tax_free_sec10",
            receipt_name="airtel_broadband_oct.pdf",
            merchant_name="Airtel Broadband Ltd",
            gstin="29AABCA0123F1Z8",
            policy_violation_flag=False,
            approved_by="usr_admin",
            approved_at=datetime.utcnow() - timedelta(days=20),
            created_at=datetime.utcnow() - timedelta(days=22)
        ),
        ExpenseClaim(
            id="exp_003",
            company_id=comp.id,
            employee_id="emp_003",
            employee_name="Priya Sharma",
            title="AWS Solutions Architect Exam & Courseware",
            category="learning_certifications",
            amount=22000.0,
            currency="INR",
            expense_date=date(2026, 10, 12),
            status="submitted",
            tax_treatment="tax_free_sec10",
            receipt_name="aws_certification_fee.pdf",
            merchant_name="Amazon Web Services",
            gstin=None,
            policy_violation_flag=False,
            created_at=datetime.utcnow() - timedelta(days=11)
        ),
        ExpenseClaim(
            id="exp_004",
            company_id=comp.id,
            employee_id="emp_004",
            employee_name="Vikram Singh",
            title="Enterprise Prospect Dinner at Leela",
            category="client_entertainment",
            amount=8200.0,
            currency="INR",
            expense_date=date(2026, 10, 18),
            status="submitted",
            tax_treatment="taxable_perquisite_sec17",
            receipt_name="leela_dining_bill.pdf",
            merchant_name="The Leela Palace",
            gstin="29AABCL5555M1Z2",
            policy_violation_flag=True,
            policy_violation_notes="Claim exceeds standard client dining threshold of ₹5,000 without VP pre-approval.",
            created_at=datetime.utcnow() - timedelta(days=5)
        )
    ]
    for c in exp_claims:
        db.add(c)

    # Salary Advances
    adv = SalaryAdvance(
        id="adv_001",
        company_id=comp.id,
        employee_id="emp_005",
        employee_name="Amit Patel",
        amount_requested=60000.0,
        amount_approved=60000.0,
        reason="Emergency medical expenses for father hospitalization",
        tenure_months=3,
        monthly_emi=20000.0,
        amount_recovered=20000.0,
        status="active_deduction",
        applied_date=date(2026, 9, 10),
        approved_by="usr_admin",
        approved_at=datetime.utcnow() - timedelta(days=40),
        created_at=datetime.utcnow() - timedelta(days=42)
    )
    db.add(adv)

    # 10. Tax Optimization Declarations (Form 12BB)
    tax_decls = [
        TaxDeclaration(
            id="tax_decl_001",
            company_id=comp.id,
            employee_id="emp_001",
            employee_name="Sneha Rao",
            financial_year="2026-27",
            regime_selected="old",
            sec_80c_declared=150000.0,
            sec_80c_approved=150000.0,
            sec_80d_health_declared=25000.0,
            sec_80d_health_approved=25000.0,
            sec_24b_home_loan_interest_declared=180000.0,
            sec_24b_home_loan_interest_approved=180000.0,
            sec_80ccd_nps_declared=50000.0,
            sec_80ccd_nps_approved=50000.0,
            hra_annual_rent_declared=300000.0,
            hra_annual_rent_approved=300000.0,
            landlord_pan="ABCDE1234F",
            landlord_name="Suresh Kulkarni",
            rental_city_type="metro",
            status="verified",
            verification_notes="All 80C, 80D receipts and Rent Agreement verified against landlord PAN.",
            verified_by="usr_admin",
            verified_at=datetime.utcnow() - timedelta(days=30),
            created_at=datetime.utcnow() - timedelta(days=30)
        ),
        TaxDeclaration(
            id="tax_decl_002",
            company_id=comp.id,
            employee_id="emp_002",
            employee_name="Rohan Verma",
            financial_year="2026-27",
            regime_selected="new",
            sec_80c_declared=0.0,
            sec_80c_approved=0.0,
            sec_80d_health_declared=0.0,
            sec_80d_health_approved=0.0,
            sec_24b_home_loan_interest_declared=0.0,
            sec_24b_home_loan_interest_approved=0.0,
            sec_80ccd_nps_declared=0.0,
            sec_80ccd_nps_approved=0.0,
            hra_annual_rent_declared=0.0,
            hra_annual_rent_approved=0.0,
            status="verified",
            verification_notes="Opted for Section 115BAC Default Simplified Slabs (no deductions claimed).",
            verified_by="usr_admin",
            verified_at=datetime.utcnow() - timedelta(days=28),
            created_at=datetime.utcnow() - timedelta(days=28)
        ),
        TaxDeclaration(
            id="tax_decl_003",
            company_id=comp.id,
            employee_id="emp_003",
            employee_name="Priya Sharma",
            financial_year="2026-27",
            regime_selected="old",
            sec_80c_declared=120000.0,
            sec_80c_approved=0.0,
            sec_80d_health_declared=15000.0,
            sec_80d_health_approved=0.0,
            sec_24b_home_loan_interest_declared=0.0,
            sec_24b_home_loan_interest_approved=0.0,
            sec_80ccd_nps_declared=50000.0,
            sec_80ccd_nps_approved=0.0,
            hra_annual_rent_declared=180000.0,
            hra_annual_rent_approved=0.0,
            landlord_pan="BKWPM9876C",
            landlord_name="Kavita Mehta",
            rental_city_type="metro",
            status="submitted",
            verification_notes="Pending verification of NPS deposit acknowledgement.",
            created_at=datetime.utcnow() - timedelta(days=10)
        )
    ]
    for td in tax_decls:
        db.add(td)

    # 11. Global Contractors & Invoices
    c1 = Contractor(
        id="cont_001",
        company_id=comp.id,
        contractor_code="CON-US-001",
        name="Sarah Jenkins",
        email="sarah.jenkins@cloudcraft.io",
        phone="+1 415 555 2671",
        country="United States",
        currency="USD",
        contractor_type="individual",
        service_type="cloud_devops",
        pan_or_tax_id="US-SSN-9021",
        w8ben_status="verified",
        withholding_section="non_resident_wire",
        withholding_rate_pct=0.0,
        rate_per_hour_or_month=4500.0,
        rate_type="fixed_monthly",
        bank_name="JPMorgan Chase Bank N.A.",
        bank_account="987654321098",
        ifsc_or_swift="CHASUS33XXX",
        status="active",
        created_at=datetime.utcnow() - timedelta(days=90)
    )
    c2 = Contractor(
        id="cont_002",
        company_id=comp.id,
        contractor_code="CON-DE-002",
        name="Marco Rossi",
        email="m.rossi@berlinsec.de",
        phone="+49 30 1234567",
        country="Germany",
        currency="EUR",
        contractor_type="individual",
        service_type="software_engineering",
        pan_or_tax_id="DE-TAX-4458",
        w8ben_status="verified",
        withholding_section="non_resident_wire",
        withholding_rate_pct=0.0,
        rate_per_hour_or_month=3800.0,
        rate_type="fixed_monthly",
        bank_name="Deutsche Bank AG",
        bank_account="DE89370400440532013000",
        ifsc_or_swift="DEUTDEDBFXX",
        status="active",
        created_at=datetime.utcnow() - timedelta(days=60)
    )
    c3 = Contractor(
        id="cont_003",
        company_id=comp.id,
        contractor_code="CON-IN-003",
        name="Rajesh Legal & Advisory LLP",
        email="compliance@rajeshpartners.in",
        phone="+91 9820011223",
        country="India",
        currency="INR",
        contractor_type="company",
        service_type="legal_advisory",
        pan_or_tax_id="AAACR1234F",
        gstin="29AAACR1234F1Z5",
        w8ben_status="not_applicable",
        withholding_section="194J",
        withholding_rate_pct=10.0,
        rate_per_hour_or_month=75000.0,
        rate_type="fixed_monthly",
        bank_name="HDFC Bank Ltd",
        bank_account="50200012345678",
        ifsc_or_swift="HDFC0000123",
        status="active",
        created_at=datetime.utcnow() - timedelta(days=120)
    )
    db.add(c1)
    db.add(c2)
    db.add(c3)

    invoices = [
        ContractorInvoice(
            id="inv_001",
            company_id=comp.id,
            contractor_id="cont_001",
            invoice_number="INV-2026-US-081",
            invoice_date=date(2026, 10, 1),
            due_date=date(2026, 10, 20),
            currency="USD",
            subtotal_amount=4500.0,
            gst_amount=0.0,
            tds_withheld_amount=0.0,
            net_payable_amount=4500.0,
            fx_rate_to_inr=86.50,
            net_inr_equivalent=389250.0,
            description="Cloud infrastructure architecture & Kubernetes cluster optimization - October 2026",
            status="approved",
            payment_reference="SWIFT-WIRE-US-9912",
            created_at=datetime.utcnow() - timedelta(days=22)
        ),
        ContractorInvoice(
            id="inv_002",
            company_id=comp.id,
            contractor_id="cont_002",
            invoice_number="INV-2026-DE-082",
            invoice_date=date(2026, 10, 10),
            due_date=date(2026, 10, 28),
            currency="EUR",
            subtotal_amount=3800.0,
            gst_amount=0.0,
            tds_withheld_amount=0.0,
            net_payable_amount=3800.0,
            fx_rate_to_inr=91.20,
            net_inr_equivalent=346560.0,
            description="Penetration testing & OWASP Top 10 security audit",
            status="pending_approval",
            created_at=datetime.utcnow() - timedelta(days=14)
        ),
        ContractorInvoice(
            id="inv_003",
            company_id=comp.id,
            contractor_id="cont_003",
            invoice_number="INV-2026-IN-083",
            invoice_date=date(2026, 10, 2),
            due_date=date(2026, 10, 15),
            currency="INR",
            subtotal_amount=75000.0,
            gst_amount=13500.0,
            tds_withheld_amount=7500.0,
            net_payable_amount=81000.0,
            fx_rate_to_inr=1.0,
            net_inr_equivalent=81000.0,
            description="Monthly legal advisory retainer & corporate MCA filing assistance",
            status="paid",
            payment_reference="CMS-NEFT-IN-4821",
            paid_at=datetime.utcnow() - timedelta(days=9),
            created_at=datetime.utcnow() - timedelta(days=21)
        )
    ]
    for inv in invoices:
        db.add(inv)

    # 12. Statutory Compliance Filings
    filings = [
        ComplianceFiling(
            id="comp_001",
            company_id=comp.id,
            filing_type="epf_ecr",
            period_label="September 2026",
            due_date=date(2026, 10, 15),
            statutory_authority="EPFO India",
            amount_payable=142800.0,
            status="filed_on_time",
            challan_reference="ECR/2026/09/88219",
            bsr_code="0510304",
            cin_number="05103041510202600812",
            filed_at=datetime.utcnow() - timedelta(days=9),
            created_at=datetime.utcnow() - timedelta(days=20)
        ),
        ComplianceFiling(
            id="comp_002",
            company_id=comp.id,
            filing_type="esic_challan",
            period_label="September 2026",
            due_date=date(2026, 10, 15),
            statutory_authority="ESIC Corporation",
            amount_payable=34200.0,
            status="filed_on_time",
            challan_reference="ESIC-CHALLAN-90182",
            bsr_code="0510304",
            cin_number="05103041510202600813",
            filed_at=datetime.utcnow() - timedelta(days=9),
            created_at=datetime.utcnow() - timedelta(days=20)
        ),
        ComplianceFiling(
            id="comp_003",
            company_id=comp.id,
            filing_type="tds_challan_281",
            period_label="October 2026",
            due_date=date(2026, 11, 7),
            statutory_authority="Income Tax Department (TRACES)",
            amount_payable=185600.0,
            status="pending",
            created_at=datetime.utcnow() - timedelta(days=5)
        ),
        ComplianceFiling(
            id="comp_004",
            company_id=comp.id,
            filing_type="pt_return",
            period_label="October 2026",
            due_date=date(2026, 11, 20),
            statutory_authority="Commercial Taxes Department (Karnataka)",
            amount_payable=9800.0,
            status="pending",
            created_at=datetime.utcnow() - timedelta(days=5)
        ),
        ComplianceFiling(
            id="comp_005",
            company_id=comp.id,
            filing_type="form_24q",
            period_label="Q2 FY2026-27",
            due_date=date(2026, 10, 31),
            statutory_authority="Directorate of Income Tax (Systems)",
            amount_payable=556800.0,
            status="pending",
            created_at=datetime.utcnow() - timedelta(days=15)
        )
    ]
    for fil in filings:
        db.add(fil)

    db.commit()
