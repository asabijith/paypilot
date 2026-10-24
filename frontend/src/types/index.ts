export type UserRole = 'admin' | 'owner' | 'payroll_admin' | 'manager' | 'employee';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  employee_id?: string;
  department?: string;
  designation?: string;
  company?: {
    id: string;
    name: string;
    pan?: string;
    tan?: string;
    plan_tier?: string;
    subscription_status?: string;
    max_employees?: number;
    trial_ends_at?: string;
  };
  subscription?: {
    plan_tier: string;
    status: string;
    billing_cycle: string;
  };
}

export interface Employee {
  id: string;
  emp_code: string;
  first_name: string;
  last_name: string;
  name?: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  manager_id?: string;
  employment_type?: 'full_time' | 'contract' | 'intern';
  employment_status?: 'active' | 'probation' | 'notice_period' | 'resigned' | 'terminated';
  joining_date: string;
  status: 'active' | 'inactive';
  pan: string;
  bank_name?: string;
  bank_account: string;
  ifsc: string;
  tax_regime: 'new' | 'old';
  state: string;
  monthly_gross?: number;
  ctc_annual?: number;
}

export interface EmployeeDocument {
  id: string;
  document_type: string;
  title: string;
  file_name: string;
  file_size_kb: number;
  file_url: string;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface SaaSPlan {
  id: string;
  name: string;
  tagline: string;
  monthly_price: number;
  annual_price: number;
  max_employees: number;
  features: string[];
  is_popular: boolean;
}

export interface SaaSSubscription {
  company_id: string;
  company_name: string;
  plan_tier: string;
  plan_name: string;
  subscription_status: string;
  max_employees: number;
  current_employee_count: number;
  trial_ends_at?: string;
  trial_days_remaining?: number;
  billing_cycle: string;
  current_period_end?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  payment_method: string;
  paid_at?: string;
  created_at: string;
}

export interface SalaryStructure {
  id?: string;
  employee_id: string;
  employee_name?: string;
  emp_code?: string;
  department?: string;
  designation?: string;
  ctc_annual: number;
  basic: number;
  hra: number;
  special_allowance: number;
  monthly_gross?: number;
  pf_applicable: boolean;
  pf_type: 'statutory_capped_1800' | 'actual_basic';
  esi_applicable: boolean;
  pt_applicable: boolean;
  pt_state: string;
  tds_monthly_override: number;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  emp_code: string;
  department: string;
  date: string;
  status: 'present' | 'absent' | 'half_day' | 'approved_leave' | 'holiday' | 'weekend';
  check_in?: string;
  check_out?: string;
  notes?: string;
}

export interface LeaveBalance {
  employee_id: string;
  employee_name: string;
  emp_code: string;
  year: number;
  casual_total: number;
  casual_used: number;
  casual_remaining: number;
  sick_total: number;
  sick_used: number;
  sick_remaining: number;
  earned_total: number;
  earned_used: number;
  earned_remaining: number;
  total_remaining: number;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  emp_code: string;
  department: string;
  leave_type: 'casual' | 'sick' | 'earned' | 'duty_leave' | 'unpaid_lop' | 'comp_off';
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_on: string;
  reviewed_by?: string;
  review_comment?: string;
}

export interface PayrollPeriod {
  id: string;
  month: number;
  year: number;
  name: string;
  working_days: number;
  status: 'draft' | 'calculated' | 'audited' | 'approved' | 'processed';
  processed_at?: string;
  processed_by?: string;
  employee_count: number;
  flagged_count: number;
  total_gross: number;
  total_net: number;
  total_employer_cost: number;
}

export interface PayrollItem {
  id: string;
  employee_id: string;
  employee_name: string;
  emp_code: string;
  department: string;
  designation: string;
  pan: string;
  bank_account: string;
  basic: number;
  hra: number;
  special_allowance: number;
  bonus_or_variable: number;
  gross_earnings: number;
  employee_pf: number;
  employee_esi: number;
  professional_tax: number;
  tds: number;
  unpaid_leave_days: number;
  lop_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  employer_pf: number;
  employer_esi: number;
  total_employer_cost: number;
  audit_status: 'clean' | 'flagged' | 'resolved';
  open_findings_count?: number;
  notes?: string;
}

export interface AuditFinding {
  id: string;
  period_id: string;
  employee_id: string;
  employee_name: string;
  emp_code: string;
  department: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  expected_value: string;
  observed_value: string;
  recommended_action: string;
  status: 'Open' | 'Investigating' | 'Resolved' | 'Accepted';
  resolution_note?: string;
  resolved_at?: string;
}

export interface PayslipData {
  company: {
    name: string;
    address: string;
    pan: string;
    tan: string;
    epf_reg: string;
    esic_reg: string;
  };
  period: {
    name: string;
    working_days: number;
    status: string;
  };
  employee: {
    id: string;
    emp_code: string;
    name: string;
    department: string;
    designation: string;
    joining_date: string;
    pan: string;
    bank_name: string;
    bank_account: string;
    ifsc: string;
    uan: string;
    tax_regime: string;
  };
  earnings: Array<{ label: string; amount: number }>;
  deductions: Array<{ label: string; amount: number }>;
  summary: {
    gross_earnings: number;
    total_deductions: number;
    net_salary: number;
    net_salary_in_words: string;
    employer_pf: number;
    employer_esi: number;
    total_employer_cost: number;
  };
  leaves: {
    casual_remaining: number;
    sick_remaining: number;
    earned_remaining: number;
  };
}

// ----------------------------------------------------------------------------
// PAYPILOT INTELLIGENCE ENGINE TYPES
// ----------------------------------------------------------------------------

export interface SimulationItem {
  employee_id?: string;
  employee_name: string;
  department: string;
  change_type: 'salary_hike' | 'bonus' | 'new_hire' | 'none';
  hike_pct?: number;
  bonus_amount?: number;
  old_gross: number;
  new_gross: number;
  simulated_basic: number;
  simulated_pf: number;
  simulated_esi: number;
  simulated_pt: number;
  simulated_tds: number;
  simulated_net: number;
  old_employer_cost: number;
  simulated_employer_cost: number;
  cost_delta: number;
}

export interface DepartmentBreakdown {
  department: string;
  baseline_cost: number;
  simulated_cost: number;
  headcount_delta: number;
  delta: number;
  delta_pct: number;
}

export interface SimulationResult {
  base_period_name: string;
  baseline_summary: {
    headcount: number;
    total_gross: number;
    total_net: number;
    total_employer_pf: number;
    total_cost_ctc: number;
  };
  simulated_summary: {
    headcount: number;
    total_gross: number;
    total_net: number;
    total_employer_pf: number;
    total_cost_ctc: number;
  };
  variance: {
    cost_delta_monthly: number;
    cost_delta_pct: number;
    cost_delta_annualized: number;
    headcount_added: number;
  };
  department_breakdown: DepartmentBreakdown[];
  simulated_items: SimulationItem[];
}

export interface SimulationScenario {
  id: string;
  name: string;
  description?: string;
  base_period_id: string;
  baseline_total_cost: number;
  simulated_total_cost: number;
  cost_delta: number;
  cost_delta_pct: number;
  parameters: any;
  created_by?: string;
  status: string;
  created_at: string;
}

export interface ForecastPoint {
  month: string;
  payroll_cost: number;
  lower_bound: number;
  upper_bound: number;
  headcount: number;
  is_forecast: boolean;
}

export interface PayrollForecastData {
  forecast_series: ForecastPoint[];
  next_month_projection: {
    month: string;
    expected_cost: number;
    lower_bound: number;
    upper_bound: number;
    expected_variance_pct: number;
    projected_headcount: number;
  };
  assumptions: string[];
}

export interface AnomalyRadarItem {
  id: string;
  rule_code: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  employee_id: string;
  employee_name: string;
  emp_code: string;
  department: string;
  expected_value: string;
  observed_value: string;
  recommended_investigation_steps: string[];
  status: 'Open' | 'Investigating' | 'Resolved' | 'Accepted';
}

export interface AnomalyRadarData {
  period_id?: string;
  severity_summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  open_count: number;
  anomalies: AnomalyRadarItem[];
}

export interface PayslipComponentDiff {
  name: string;
  prev: number;
  curr: number;
  diff: number;
}

export interface ExplainPayslipResult {
  employee_id: string;
  employee_name: string;
  department: string;
  current_period: string;
  comparison_period: string;
  net_difference: number;
  components: PayslipComponentDiff[];
  grounded_explanation: string;
  is_ai_synthesized: boolean;
}

export interface HRWorkflowTaskItem {
  id: string;
  task_type: string;
  title: string;
  description: string;
  target_employee_id?: string;
  target_employee_name?: string;
  department?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending_approval' | 'approved' | 'rejected';
  requires_approval: boolean;
  consequential_action: string;
  payload: any;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface IntelligenceSummary {
  next_month_projection: {
    month: string;
    expected_cost: number;
    lower_bound: number;
    upper_bound: number;
    expected_variance_pct: number;
    projected_headcount: number;
  };
  anomaly_summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  total_open_anomalies: number;
  scenarios_count: number;
  pending_workflow_tasks: number;
  is_employee: boolean;
}


// ==========================================
// FINOPS & EXPENSE CLAIMS TYPES
// ==========================================

export interface ExpenseClaim {
  id: string;
  company_id: string;
  employee_id: string;
  employee_name: string;
  title: string;
  category: 'travel' | 'remote_work_internet' | 'client_entertainment' | 'learning_certifications' | 'medical_wellness' | 'general_office';
  amount: number;
  currency: string;
  expense_date: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';
  tax_treatment: 'tax_free_sec10' | 'taxable_perquisite_sec17';
  receipt_name: string;
  merchant_name: string;
  gstin?: string;
  policy_violation_flag: boolean;
  policy_violation_notes?: string;
  reimbursement_period_id?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface SalaryAdvance {
  id: string;
  company_id: string;
  employee_id: string;
  employee_name: string;
  amount_requested: number;
  amount_approved: number;
  reason: string;
  tenure_months: number;
  monthly_emi: number;
  amount_recovered: number;
  balance_remaining?: number;
  status: 'pending' | 'approved' | 'active_deduction' | 'fully_recovered' | 'rejected';
  applied_date: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface ExpensesSummary {
  total_claims_count: number;
  total_claimed_amount: number;
  pending_amount: number;
  approved_pending_reimbursement: number;
  reimbursed_amount: number;
  policy_violations_count: number;
  active_salary_advances_count: number;
  total_advance_outstanding: number;
  category_breakdown: Record<string, { count: number; amount: number }>;
}

// ==========================================
// TAX VAULT & FORM 12BB TYPES
// ==========================================

export interface TaxDeclaration {
  id: string;
  employee_id: string;
  employee_name: string;
  financial_year: string;
  regime_selected: 'new' | 'old';
  sec_80c_declared: number;
  sec_80c_approved: number;
  sec_80d_health_declared: number;
  sec_80d_health_approved: number;
  sec_24b_home_loan_interest_declared: number;
  sec_24b_home_loan_interest_approved: number;
  sec_80ccd_nps_declared: number;
  sec_80ccd_nps_approved: number;
  hra_annual_rent_declared: number;
  hra_annual_rent_approved: number;
  landlord_pan?: string;
  landlord_name?: string;
  rental_city_type: 'metro' | 'non_metro';
  other_exemptions_declared: number;
  other_exemptions_approved: number;
  status: 'draft' | 'submitted' | 'verified' | 'locked';
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at?: string;
}

export interface TaxRegimeComparisonResult {
  annual_ctc: number;
  recommendation: 'new' | 'old';
  recommendation_reason: string;
  annual_tax_savings: number;
  new_regime: {
    gross_income: number;
    standard_deduction: number;
    other_exemptions: number;
    taxable_income: number;
    annual_tax: number;
    monthly_tds: number;
  };
  old_regime: {
    gross_income: number;
    standard_deduction: number;
    hra_exemption: number;
    sec_80c: number;
    sec_80d: number;
    sec_24b: number;
    sec_80ccd: number;
    total_deductions: number;
    taxable_income: number;
    annual_tax: number;
    monthly_tds: number;
  };
}

// ==========================================
// GLOBAL CONTRACTORS & CROSS-BORDER TYPES
// ==========================================

export interface Contractor {
  id: string;
  company_id: string;
  contractor_code: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  currency: string;
  contractor_type: 'individual' | 'company';
  service_type: string;
  pan_or_tax_id: string;
  gstin?: string;
  w8ben_status: 'not_applicable' | 'submitted' | 'verified';
  withholding_section: string;
  withholding_rate_pct: number;
  rate_per_hour_or_month: number;
  rate_type: 'hourly' | 'fixed_monthly' | 'milestone';
  bank_name: string;
  bank_account: string;
  ifsc_or_swift: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface ContractorInvoice {
  id: string;
  company_id: string;
  contractor_id: string;
  contractor_name?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  currency: string;
  subtotal_amount: number;
  gst_amount: number;
  tds_withheld_amount: number;
  net_payable_amount: number;
  fx_rate_to_inr: number;
  net_inr_equivalent: number;
  description: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'paid' | 'cancelled';
  paid_at?: string;
  payment_reference?: string;
  created_at: string;
}

// ==========================================
// STATUTORY COMPLIANCE & FORM 16 / 24Q TYPES
// ==========================================

export interface ComplianceFiling {
  id: string;
  company_id: string;
  filing_type: 'epf_ecr' | 'esic_challan' | 'tds_challan_281' | 'pt_return' | 'form_24q';
  period_label: string;
  due_date: string;
  statutory_authority: string;
  amount_payable: number;
  status: 'pending' | 'filed_on_time' | 'delayed_filed' | 'overdue';
  challan_reference?: string;
  bsr_code?: string;
  cin_number?: string;
  filed_at?: string;
  days_remaining: number;
  is_overdue: boolean;
  penalty_info: {
    days_overdue: number;
    penalty_amount: number;
    interest_amount: number;
    total_statutory_charge: number;
    statutory_sections: string;
    risk_severity: 'none' | 'moderate' | 'high' | 'critical';
  };
}

export interface ComplianceCalendarResponse {
  filings: ComplianceFiling[];
  metrics: {
    total_filings: number;
    filed_count: number;
    upcoming_count: number;
    overdue_count: number;
    total_statutory_remitted: number;
    total_statutory_pending: number;
    total_penalties_accrued: number;
    compliance_score_pct: number;
  };
}

export interface Form16Data {
  certificate_id: string;
  assessment_year: string;
  financial_year: string;
  employer: {
    name: string;
    address: string;
    pan: string;
    tan: string;
    cit_tds: string;
  };
  employee: {
    id: string;
    employee_code: string;
    name: string;
    pan: string;
    designation: string;
    department: string;
    tax_regime: string;
  };
  part_a: {
    summary_of_tax_deducted_at_source: Array<{
      quarter: string;
      receipt_number: string;
      amount_paid_credited: number;
      tax_deducted: number;
      tax_deposited: number;
      bsr_code: string;
      challan_cin: string;
      date_of_deposit: string;
      status: string;
    }>;
    total_tds_deducted: number;
    total_tds_deposited: number;
  };
  part_b: {
    gross_salary_sec17_1: number;
    allowances_exempt_sec10: number;
    balance_gross: number;
    standard_deduction_sec16_ia: number;
    tax_on_employment_sec16_iii: number;
    total_deductions_sec16: number;
    income_chargeable_under_salaries: number;
    chapter_via_deductions: {
      section_80c: number;
      section_80d: number;
      section_80ccd_1b: number;
      section_24b_home_loan: number;
      total_chapter_via: number;
    };
    total_taxable_income: number;
    total_tax_payable: number;
    net_tax_refund_or_due: number;
  };
}
