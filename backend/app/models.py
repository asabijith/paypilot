from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Date, DateTime, ForeignKey, Text, UniqueConstraint
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Company(Base):
    __tablename__ = "companies"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    pan = Column(String, default="AABCB1234F")
    tan = Column(String, default="BLRB12345C")
    epf_reg = Column(String, default="KN/BNG/1234567/000")
    esic_reg = Column(String, default="53000123450000001")
    address = Column(String, default="Koramangala, Bengaluru, Karnataka, 560034")
    
    # Commercial SaaS & Multi-Tenancy
    plan_tier = Column(String, default="growth")  # free, starter, growth, enterprise
    max_employees = Column(Integer, default=100)  # free: 10, starter: 25, growth: 100, enterprise: 10000
    subscription_status = Column(String, default="active")  # trial, active, past_due, cancelled
    trial_ends_at = Column(DateTime, nullable=True)
    features_enabled = Column(Text, default='["ai_auditor", "bank_cms", "epfo_ecr", "multi_state_pt", "maker_checker"]')
    
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    # Roles: owner, hr_admin, payroll_admin, manager, employee
    role = Column(String, nullable=False, default="employee")
    employee_id = Column(String, nullable=True)
    password_hash = Column(String, default="hashed_demo_pw")
    is_active = Column(Boolean, default=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires_at = Column(DateTime, nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class EmployeeInvitation(Base):
    __tablename__ = "employee_invitations"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    email = Column(String, nullable=False)
    role = Column(String, default="employee")
    token = Column(String, unique=True, nullable=False)
    status = Column(String, default="pending")  # pending, accepted, expired
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Employee(Base):
    __tablename__ = "employees"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    emp_code = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, default="+91 9876543210")
    department = Column(String, nullable=False)
    designation = Column(String, nullable=False)
    manager_id = Column(String, nullable=True) # Reporting Manager ID
    employment_type = Column(String, default="full_time") # full_time, contract, intern
    employment_status = Column(String, default="active") # active, probation, notice_period, resigned, terminated
    joining_date = Column(Date, default=date.today)
    status = Column(String, default="active")  # active, inactive
    
    # Statutory & KYC Data
    pan = Column(String, default="ABCDE1234F")
    aadhar_masked = Column(String, default="XXXX-XXXX-1234")
    uan = Column(String, default="100987654321")
    bank_name = Column(String, default="HDFC Bank")
    bank_account = Column(String, default="50100234567890")
    ifsc = Column(String, default="HDFC0001234")
    tax_regime = Column(String, default="new")  # new, old
    state = Column(String, default="Karnataka")
    
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('company_id', 'emp_code', name='uix_company_emp_code'),
    )

class SalaryStructure(Base):
    __tablename__ = "salary_structures"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    ctc_annual = Column(Float, default=600000.0)
    basic = Column(Float, nullable=False)
    hra = Column(Float, nullable=False)
    special_allowance = Column(Float, default=0.0)
    conveyance = Column(Float, default=0.0)
    medical_allowance = Column(Float, default=0.0)
    other_allowances = Column(Float, default=0.0)
    reimbursements = Column(Float, default=0.0) # Tax-free reimbursements
    pf_applicable = Column(Boolean, default=True)
    pf_type = Column(String, default="statutory_capped_1800")  # statutory_capped_1800 or actual_basic
    esi_applicable = Column(Boolean, default=True)
    pt_applicable = Column(Boolean, default=True)
    pt_state = Column(String, default="Karnataka")
    tds_monthly_override = Column(Float, default=0.0)
    effective_date = Column(Date, default=date.today)

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String, default="present")  # present, absent, half_day, approved_leave, holiday, weekend
    check_in = Column(String, nullable=True)
    check_out = Column(String, nullable=True)
    notes = Column(String, nullable=True)

    __table_args__ = (
        UniqueConstraint('company_id', 'employee_id', 'date', name='uix_company_emp_date'),
    )

class LeaveBalance(Base):
    __tablename__ = "leave_balances"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    year = Column(Integer, default=2026)
    casual_leave_total = Column(Float, default=12.0)
    casual_leave_used = Column(Float, default=2.0)
    sick_leave_total = Column(Float, default=10.0)
    sick_leave_used = Column(Float, default=1.0)
    earned_leave_total = Column(Float, default=15.0)
    earned_leave_used = Column(Float, default=3.0)

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    leave_type = Column(String, nullable=False)  # casual, sick, earned, unpaid_lop
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days_count = Column(Float, nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, approved, rejected
    applied_on = Column(Date, default=date.today)
    reviewed_by = Column(String, nullable=True)
    review_comment = Column(String, nullable=True)

class PayrollPeriod(Base):
    __tablename__ = "payroll_periods"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    name = Column(String, nullable=False)  # e.g., "October 2026"
    working_days = Column(Integer, default=22)
    
    # Complete Workflow Status:
    # draft -> calculated -> validated -> audited -> reviewed -> approved -> processed -> reconciled
    status = Column(String, default="draft")
    
    # Maker-Checker Fields
    prepared_by = Column(String, nullable=True)     # Maker user ID
    prepared_at = Column(DateTime, nullable=True)
    approved_by = Column(String, nullable=True)     # Checker user ID (must differ from Maker)
    approved_at = Column(DateTime, nullable=True)
    processed_by = Column(String, nullable=True)
    processed_at = Column(DateTime, nullable=True)
    reconciled_by = Column(String, nullable=True)
    reconciled_at = Column(DateTime, nullable=True)
    
    is_locked = Column(Boolean, default=False)       # Locks against edits once approved/processed
    reconciliation_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('company_id', 'month', 'year', name='uix_company_period_month_year'),
    )

class PayrollItem(Base):
    __tablename__ = "payroll_items"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    period_id = Column(String, ForeignKey("payroll_periods.id"), nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    
    # Earnings
    basic = Column(Float, default=0.0)
    hra = Column(Float, default=0.0)
    special_allowance = Column(Float, default=0.0)
    conveyance = Column(Float, default=0.0)
    medical_allowance = Column(Float, default=0.0)
    bonus_or_variable = Column(Float, default=0.0)
    reimbursements = Column(Float, default=0.0)
    other_earnings = Column(Float, default=0.0)
    gross_earnings = Column(Float, default=0.0)
    
    # Employee Deductions
    employee_pf = Column(Float, default=0.0)
    employee_esi = Column(Float, default=0.0)
    professional_tax = Column(Float, default=0.0)
    tds = Column(Float, default=0.0)
    unpaid_leave_days = Column(Float, default=0.0)
    lop_deduction = Column(Float, default=0.0)
    other_deductions = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    
    # Net Pay
    net_salary = Column(Float, default=0.0)
    
    # Employer Contributions
    employer_pf = Column(Float, default=0.0)
    employer_esi = Column(Float, default=0.0)
    total_employer_cost = Column(Float, default=0.0)
    
    # Audit Status
    audit_status = Column(String, default="clean")  # clean, flagged, resolved
    notes = Column(Text, nullable=True)

class AuditFinding(Base):
    __tablename__ = "audit_findings"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    period_id = Column(String, ForeignKey("payroll_periods.id"), nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    rule_code = Column(String, default="VARIANCE_SPIKE")
    category = Column(String, nullable=False)  # Salary Spike, Negative Pay, Attendance Mismatch, Duplicate Entry, Missing Statutory
    severity = Column(String, nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    expected_value = Column(String, nullable=True)
    observed_value = Column(String, nullable=True)
    recommended_action = Column(Text, nullable=False)
    status = Column(String, default="Open")  # Open, Investigating, Resolved, Accepted
    is_confirmed_error = Column(Boolean, default=False)  # Distinguishes confirmed calculation error from warning anomaly
    evidence_data = Column(Text, nullable=True)          # JSON payload of comparison inputs
    resolution_note = Column(Text, nullable=True)
    resolved_by = Column(String, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    user_id = Column(String, nullable=False)
    user_email = Column(String, nullable=True)
    user_role = Column(String, nullable=True)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String, default="127.0.0.1")
    created_at = Column(DateTime, default=datetime.utcnow)

class EmployeeDocument(Base):
    __tablename__ = "employee_documents"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    document_type = Column(String, nullable=False) # pan_card, aadhaar_card, offer_letter, form_16, resume, appointment_letter
    title = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_size_kb = Column(Integer, default=120)
    file_url = Column(String, nullable=False) # storage url or simulated path
    uploaded_by = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    plan_tier = Column(String, nullable=False) # free_trial, starter, growth, enterprise
    billing_cycle = Column(String, default="monthly") # monthly, annual
    amount = Column(Float, default=0.0)
    currency = Column(String, default="INR")
    status = Column(String, default="trialing") # trialing, active, past_due, canceled
    current_period_start = Column(DateTime, default=datetime.utcnow)
    current_period_end = Column(DateTime, nullable=True)
    razorpay_subscription_id = Column(String, nullable=True)
    razorpay_customer_id = Column(String, nullable=True)
    cancel_at_period_end = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    subscription_id = Column(String, nullable=True)
    invoice_number = Column(String, unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    status = Column(String, default="pending") # pending, paid, failed, refunded
    description = Column(String, nullable=True)
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    razorpay_signature = Column(String, nullable=True)
    payment_method = Column(String, default="UPI / Netbanking")
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ContactInquiry(Base):
    __tablename__ = "contact_inquiries"
    id = Column(String, primary_key=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    company_name = Column(String, nullable=False)
    employee_range = Column(String, default="10-50")
    message = Column(Text, nullable=True)
    inquiry_type = Column(String, default="demo_request") # demo_request, sales_inquiry, contact
    status = Column(String, default="new") # new, contacted, qualified, converted
    created_at = Column(DateTime, default=datetime.utcnow)

class SimulationScenario(Base):
    __tablename__ = "simulation_scenarios"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    base_period_id = Column(String, ForeignKey("payroll_periods.id"), nullable=False)
    baseline_total_cost = Column(Float, default=0.0)
    simulated_total_cost = Column(Float, default=0.0)
    cost_delta = Column(Float, default=0.0)
    cost_delta_pct = Column(Float, default=0.0)
    parameters_json = Column(Text, nullable=False)
    created_by = Column(String, nullable=False)
    status = Column(String, default="draft") # draft, reviewed, approved, rejected
    created_at = Column(DateTime, default=datetime.utcnow)

class SimulationItem(Base):
    __tablename__ = "simulation_items"
    id = Column(String, primary_key=True)
    scenario_id = Column(String, ForeignKey("simulation_scenarios.id"), nullable=False)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(String, nullable=True)
    employee_name = Column(String, nullable=False)
    department = Column(String, nullable=False)
    change_type = Column(String, default="salary_hike") # salary_hike, new_hire, bonus, allowance
    old_gross = Column(Float, default=0.0)
    new_gross = Column(Float, default=0.0)
    simulated_basic = Column(Float, default=0.0)
    simulated_pf = Column(Float, default=0.0)
    simulated_esi = Column(Float, default=0.0)
    simulated_pt = Column(Float, default=0.0)
    simulated_tds = Column(Float, default=0.0)
    simulated_net = Column(Float, default=0.0)
    simulated_employer_cost = Column(Float, default=0.0)
    cost_delta = Column(Float, default=0.0)

class HRWorkflowTask(Base):
    __tablename__ = "hr_workflow_tasks"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    task_type = Column(String, nullable=False) # onboarding_checklist, document_reminder, salary_hike_approval, payroll_approval, tax_declaration_notice
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    target_employee_id = Column(String, nullable=True)
    target_employee_name = Column(String, nullable=True)
    severity = Column(String, default="MEDIUM") # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String, default="pending_approval") # pending_approval, approved, rejected, completed
    requires_approval = Column(Boolean, default=True)
    consequential_action = Column(String, nullable=True)
    payload_json = Column(Text, nullable=True)
    created_by = Column(String, default="system_ai_agent")
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)



class ExpenseClaim(Base):
    __tablename__ = "expense_claims"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    employee_name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False) # travel, remote_work_internet, client_entertainment, learning_certifications, medical_wellness, general_office
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    expense_date = Column(Date, default=date.today)
    status = Column(String, default="submitted") # draft, submitted, approved, rejected, reimbursed
    tax_treatment = Column(String, default="tax_free_sec10") # tax_free_sec10, taxable_perquisite_sec17
    receipt_name = Column(String, default="receipt.pdf")
    merchant_name = Column(String, nullable=False)
    gstin = Column(String, nullable=True)
    policy_violation_flag = Column(Boolean, default=False)
    policy_violation_notes = Column(Text, nullable=True)
    reimbursement_period_id = Column(String, nullable=True)
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SalaryAdvance(Base):
    __tablename__ = "salary_advances"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    employee_name = Column(String, nullable=False)
    amount_requested = Column(Float, nullable=False)
    amount_approved = Column(Float, default=0.0)
    reason = Column(Text, nullable=False)
    tenure_months = Column(Integer, default=1)
    monthly_emi = Column(Float, default=0.0)
    amount_recovered = Column(Float, default=0.0)
    status = Column(String, default="pending") # pending, approved, active_deduction, fully_recovered, rejected
    applied_date = Column(Date, default=date.today)
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class TaxDeclaration(Base):
    __tablename__ = "tax_declarations"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    employee_name = Column(String, nullable=False)
    financial_year = Column(String, default="2026-27")
    regime_selected = Column(String, default="new") # new, old
    sec_80c_declared = Column(Float, default=0.0) # EPF, PPF, ELSS, LIC (max 1.5L)
    sec_80c_approved = Column(Float, default=0.0)
    sec_80d_health_declared = Column(Float, default=0.0) # Medical insurance (self 25k + parents 50k)
    sec_80d_health_approved = Column(Float, default=0.0)
    sec_24b_home_loan_interest_declared = Column(Float, default=0.0) # max 2L
    sec_24b_home_loan_interest_approved = Column(Float, default=0.0)
    sec_80ccd_nps_declared = Column(Float, default=0.0) # NPS up to 50k
    sec_80ccd_nps_approved = Column(Float, default=0.0)
    hra_annual_rent_declared = Column(Float, default=0.0)
    hra_annual_rent_approved = Column(Float, default=0.0)
    landlord_pan = Column(String, nullable=True)
    landlord_name = Column(String, nullable=True)
    rental_city_type = Column(String, default="metro") # metro, non_metro
    other_exemptions_declared = Column(Float, default=0.0)
    other_exemptions_approved = Column(Float, default=0.0)
    status = Column(String, default="draft") # draft, submitted, verified, locked
    verification_notes = Column(Text, nullable=True)
    verified_by = Column(String, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('company_id', 'employee_id', 'financial_year', name='uix_company_emp_fy_tax'),
    )

class Contractor(Base):
    __tablename__ = "contractors"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    contractor_code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, default="+91 9876543210")
    country = Column(String, default="India")
    currency = Column(String, default="INR") # INR, USD, EUR, GBP, AED, SGD
    contractor_type = Column(String, default="individual") # individual, company
    service_type = Column(String, default="software_engineering") # software_engineering, ui_ux_design, cloud_devops, legal_advisory, content_marketing
    pan_or_tax_id = Column(String, default="ABCDE1234F")
    gstin = Column(String, nullable=True)
    w8ben_status = Column(String, default="not_applicable") # not_applicable, submitted, verified
    withholding_section = Column(String, default="194J") # 194J_10_percent, 194J_2_percent, 194C_1_percent, 194C_2_percent, non_resident_wire
    withholding_rate_pct = Column(Float, default=10.0)
    rate_per_hour_or_month = Column(Float, default=0.0)
    rate_type = Column(String, default="fixed_monthly") # hourly, fixed_monthly, milestone
    bank_name = Column(String, default="HDFC Bank")
    bank_account = Column(String, default="50100987654321")
    ifsc_or_swift = Column(String, default="HDFC0001234")
    status = Column(String, default="active") # active, inactive
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('company_id', 'contractor_code', name='uix_company_contractor_code'),
    )

class ContractorInvoice(Base):
    __tablename__ = "contractor_invoices"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    contractor_id = Column(String, ForeignKey("contractors.id"), nullable=False)
    invoice_number = Column(String, nullable=False)
    invoice_date = Column(Date, default=date.today)
    due_date = Column(Date, default=date.today)
    currency = Column(String, default="INR")
    subtotal_amount = Column(Float, nullable=False)
    gst_amount = Column(Float, default=0.0)
    tds_withheld_amount = Column(Float, default=0.0)
    net_payable_amount = Column(Float, nullable=False)
    fx_rate_to_inr = Column(Float, default=1.0)
    net_inr_equivalent = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default="pending_approval") # draft, pending_approval, approved, paid, cancelled
    paid_at = Column(DateTime, nullable=True)
    payment_reference = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ComplianceFiling(Base):
    __tablename__ = "compliance_filings"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    filing_type = Column(String, nullable=False) # epf_ecr, esic_challan, tds_challan_281, pt_return, form_24q
    period_label = Column(String, nullable=False) # e.g. "October 2026", "Q2 FY2026-27"
    due_date = Column(Date, nullable=False)
    statutory_authority = Column(String, nullable=False) # EPFO India, ESIC Corporation, Income Tax Dept, Commercial Taxes
    amount_payable = Column(Float, default=0.0)
    status = Column(String, default="pending") # pending, filed_on_time, delayed_filed, overdue
    challan_reference = Column(String, nullable=True)
    bsr_code = Column(String, nullable=True)
    cin_number = Column(String, nullable=True)
    filed_at = Column(DateTime, nullable=True)
    penalty_computed = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
