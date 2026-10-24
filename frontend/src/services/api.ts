import {
  User, Employee, SalaryStructure, AttendanceRecord, LeaveBalance, LeaveRequest, PayrollPeriod, PayrollItem, AuditFinding, PayslipData,
  SimulationResult, SimulationScenario, PayrollForecastData, AnomalyRadarData, ExplainPayslipResult, HRWorkflowTaskItem, IntelligenceSummary,
  ExpenseClaim, SalaryAdvance, ExpensesSummary, TaxDeclaration, TaxRegimeComparisonResult,
  Contractor, ContractorInvoice, ComplianceFiling, ComplianceCalendarResponse, Form16Data
} from '../types';
import {
  INITIAL_DEMO_USERS,
  INITIAL_EMPLOYEES,
  INITIAL_AUDIT_FINDINGS,
  INITIAL_PAYROLL_ITEMS,
  INITIAL_PERIODS,
  INITIAL_LEAVE_BALANCES,
  INITIAL_LEAVE_REQUESTS
} from './mockData';

let currentUserId: string = 'usr_admin';
let currentToken: string = typeof localStorage !== 'undefined' ? localStorage.getItem('paypilot_token') || '' : '';

export const setApiToken = (token: string) => {
  currentToken = token;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('paypilot_token', token);
  }
};

export const getApiToken = (): string => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('paypilot_token') || currentToken;
  }
  return currentToken;
};

export const setApiUserId = (userId: string, token?: string) => {
  currentUserId = userId;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('paypilot_user_id', userId);
  }
  if (token) {
    setApiToken(token);
  }
};

export const getApiUserId = (): string => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('paypilot_user_id') || currentUserId;
  }
  return currentUserId;
};

// Client-side state persistence for GitHub Pages / static demo mode
const getStore = <T>(key: string, defaultVal: T): T => {
  const saved = localStorage.getItem(`paypilot_store_${key}`);
  if (!saved) {
    localStorage.setItem(`paypilot_store_${key}`, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return defaultVal;
  }
};

const setStore = (key: string, val: any) => {
  localStorage.setItem(`paypilot_store_${key}`, JSON.stringify(val));
};

const request = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const headers = new Headers(options.headers || {});
  const token = getApiToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('X-User-Id', getApiUserId());
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    // Backend unreachable, fallback to client-side mock provider
  }

  return mockRequestHandler<T>(url, options);
};

// Mock request handler for seamless static deployment (e.g. GitHub Pages)
const mockRequestHandler = async <T>(url: string, options: RequestInit): Promise<T> => {
  const method = (options.method || 'GET').toUpperCase();
  const userId = getApiUserId();
  const users = INITIAL_DEMO_USERS;
  const me = users.find(u => u.id === userId) || users[0];

  // Auth
  if (url.includes('/api/auth/demo-users')) {
    return { users } as any;
  }
  if (url.includes('/api/auth/me')) {
    return me as any;
  }
  if (url.includes('/api/auth/switch-demo')) {
    const body = JSON.parse(options.body as string || '{}');
    const targetId = body.user_id || 'usr_admin';
    const targetUser = users.find(u => u.id === targetId) || users[0];
    return {
      status: 'success',
      access_token: `token_demo_${targetId}`,
      token_type: 'Bearer',
      user: targetUser
    } as any;
  }

  // Dashboard stats
  if (url.includes('/api/dashboard/stats')) {
    const findings = getStore<AuditFinding[]>('findings', INITIAL_AUDIT_FINDINGS);
    const openFindings = findings.filter(f => f.status === 'Open');
    const periods = getStore<PayrollPeriod[]>('payroll_periods', INITIAL_PERIODS);
    const currPeriod = periods.find(p => p.id === 'period_oct_2026') || periods[0];
    const items = getStore<PayrollItem[]>('payroll_items', INITIAL_PAYROLL_ITEMS);
    const totalCost = items.reduce((sum, i) => sum + (i.total_employer_cost || 0), 0);
    const grossTotal = items.reduce((sum, i) => sum + (i.gross_earnings || 0), 0);
    const netTotal = items.reduce((sum, i) => sum + (i.net_salary || 0), 0);
    const dedTotal = items.reduce((sum, i) => sum + (i.total_deductions || 0), 0);

    return {
      period_id: currPeriod.id,
      available_periods: periods.map(p => ({
        id: p.id,
        name: p.name,
        year: p.year,
        month: p.month,
        status: p.status,
        working_days: p.working_days
      })),
      total_employees: 6,
      prior_period_employees: 6,
      employee_change_text: "+0 change vs last cycle (100% active roster)",
      present_today: 5,
      absent_today: 1,
      on_leave_today: 0,
      half_day_today: 0,
      attendance_pct: 83.3,
      attendance_date_str: "Friday, Oct 23",
      pending_leaves: 1,
      current_payroll_amount: totalCost || 590800,
      gross_earnings_amount: grossTotal || 570000,
      net_salary_amount: netTotal || 492000,
      total_deductions_amount: dedTotal || 78000,
      mom_variance_pct: 5.5,
      mom_variance_amount: 30800,
      current_payroll_period: currPeriod.name,
      current_payroll_status: currPeriod.status,
      discrepancies_count: openFindings.length,
      discrepancies_summary: {
        total_open: openFindings.length,
        critical: openFindings.filter(f => f.severity === 'CRITICAL').length,
        high: openFindings.filter(f => f.severity === 'HIGH').length,
        medium: openFindings.filter(f => f.severity === 'MEDIUM').length,
        low: openFindings.filter(f => f.severity === 'LOW').length,
        resolved: findings.filter(f => f.status === 'Resolved' || f.status === 'Accepted').length,
        top_findings: openFindings.slice(0, 5)
      },
      action_center: {
        pending_approvals: [
          {
            id: "lr_001",
            employee_id: "emp_005",
            employee_name: "Amit Patel",
            emp_code: "BTI-005",
            department: "Sales",
            leave_type: "Casual",
            days_count: 2.0,
            start_date: "Oct 26",
            end_date: "Oct 27",
            reason: "Family wedding in Ahmedabad",
            applied_on: "Oct 22"
          }
        ],
        deadlines: [
          {
            id: "dl_1",
            title: "Attendance & Leave Freeze",
            due_date: "Oct 25, 2026",
            status: "Upcoming",
            urgency: "warning",
            description: "Lock monthly biometric logs & leave approvals for payroll cutoff"
          },
          {
            id: "dl_2",
            title: "Maker-Checker Audit Review",
            due_date: "Oct 28, 2026",
            status: openFindings.length > 0 ? "Action Required" : "Ready",
            urgency: openFindings.length > 0 ? "critical" : "neutral",
            description: openFindings.length > 0 ? `${openFindings.length} audit flags require sign-off before approval` : "All automated pre-flight checks passed"
          },
          {
            id: "dl_3",
            title: "Direct Net Salary Payout",
            due_date: "Oct 31, 2026",
            status: "Scheduled",
            urgency: "neutral",
            description: `Direct NACH / HDFC CMS upload for ₹${(netTotal || 492000).toLocaleString('en-IN')}`
          },
          {
            id: "dl_4",
            title: "Statutory EPFO & ESIC Remittance",
            due_date: "Nov 15, 2026",
            status: "Scheduled",
            urgency: "neutral",
            description: "Monthly ECR challan generation and filing deadline"
          }
        ],
        incomplete_records: [
          {
            employee_id: "emp_004",
            employee_name: "Vikram Singh",
            emp_code: "BTI-004",
            department: "Engineering",
            missing_fields: ["Bank Details (Account/IFSC)"]
          }
        ],
        failed_operations: openFindings.length > 0 ? [
          {
            id: "blk_1",
            type: "PAYROLL_APPROVAL_BLOCKED",
            severity: "CRITICAL",
            title: "Payroll Disbursement Blocked by Pre-Flight Audit",
            details: `${openFindings.length} open discrepancies detected. Resolution required before release.`,
            action_tab: "auditor"
          }
        ] : []
      },
      upcoming_payroll_date: "October 31, 2026",
      currency: "INR",
      currency_symbol: "₹",
      company_meta: {
        company_name: "BharatTech Solutions Pvt Ltd",
        is_demo_data: true,
        workspace_label: "Demo Sandbox · BharatTech Solutions Pvt Ltd"
      }
    } as any;
  }

  // Dashboard charts
  if (url.includes('/api/dashboard/charts')) {
    return {
      monthly_trend: [
        { month: 'Jun 2026', payroll_cost: 505000, gross_earnings: 480000, net_disbursed: 420000, employees: 5 },
        { month: 'Jul 2026', payroll_cost: 520000, gross_earnings: 495000, net_disbursed: 435000, employees: 5 },
        { month: 'Aug 2026', payroll_cost: 545000, gross_earnings: 520000, net_disbursed: 455000, employees: 6 },
        { month: 'Sep 2026', payroll_cost: 560000, gross_earnings: 535000, net_disbursed: 468000, employees: 6 },
        { month: 'Oct 2026', payroll_cost: 590800, gross_earnings: 570000, net_disbursed: 492000, employees: 6 }
      ],
      attendance_breakdown: [
        { name: "Present", count: 18, value: 81.8, color: "#0F172A" },
        { name: "Approved Leave", count: 2, value: 9.1, color: "#4338CA" },
        { name: "Half Day", count: 1, value: 4.5, color: "#D97706" },
        { name: "Absent (Unapproved)", count: 1, value: 4.5, color: "#DC2626" }
      ],
      department_distribution: [
        { department: 'Engineering', count: 2, monthly_cost: 295000 },
        { department: 'Marketing', count: 1, monthly_cost: 95000 },
        { department: 'Design', count: 1, monthly_cost: 80000 },
        { department: 'Sales', count: 1, monthly_cost: 55000 },
        { department: 'Human Resources', count: 1, monthly_cost: 45000 }
      ]
    } as any;
  }

  // Recent activity
  if (url.includes('/api/dashboard/recent-activity')) {
    return {
      activities: [
        {
          id: '1',
          action: 'PAYROLL_AUDIT_RAN',
          category: 'AUDIT',
          target_tab: 'auditor',
          actor_name: 'AI Payroll Auditor',
          actor_role: 'Compliance Engine',
          actor_initials: 'AI',
          details: 'AI Payroll Auditor flagged 4 potential discrepancies in October 2026 run',
          timestamp: 'Today, 11:30 AM'
        },
        {
          id: '2',
          action: 'LEAVE_APPLIED',
          category: 'LEAVE',
          target_tab: 'leave',
          actor_name: 'Amit Patel',
          actor_role: 'Staff / Sales',
          actor_initials: 'AP',
          details: 'Amit Patel submitted 2-day casual leave request (Family wedding)',
          timestamp: 'Today, 10:15 AM'
        },
        {
          id: '3',
          action: 'PAYROLL_CALCULATED',
          category: 'PAYROLL',
          target_tab: 'payroll',
          actor_name: 'Rajesh Nair',
          actor_role: 'Payroll Head',
          actor_initials: 'RN',
          details: 'Calculated salary draft for October 2026 for 6 active employees',
          timestamp: 'Yesterday, 04:45 PM'
        },
        {
          id: '4',
          action: 'ATTENDANCE_PUNCH',
          category: 'EMPLOYEE',
          target_tab: 'attendance',
          actor_name: 'Sneha Rao',
          actor_role: 'Staff / Design',
          actor_initials: 'SR',
          details: 'Sneha Rao marked web attendance punch in Koramangala HQ',
          timestamp: 'Oct 22, 09:30 AM'
        }
      ]
    } as any;
  }

  // Employees
  if (url.startsWith('/api/employees')) {
    const employees = getStore<Employee[]>('employees', INITIAL_EMPLOYEES);
    return { employees, total: employees.length } as any;
  }

  // Attendance
  if (url.startsWith('/api/attendance')) {
    const records: AttendanceRecord[] = [
      { id: 'att_1', employee_id: 'emp_003', employee_name: 'Rohan Verma', emp_code: 'BTI-003', department: 'Engineering', date: '2026-10-23', status: 'present', check_in: '09:05', check_out: '18:15', notes: 'Logged via Web Terminal' },
      { id: 'att_2', employee_id: 'emp_002', employee_name: 'Priya Sharma', emp_code: 'BTI-002', department: 'Marketing', date: '2026-10-23', status: 'absent', notes: 'Unbilled Absence' },
      { id: 'att_3', employee_id: 'emp_001', employee_name: 'Sneha Rao', emp_code: 'BTI-001', department: 'Design', date: '2026-10-23', status: 'present', check_in: '09:30', check_out: '18:30', notes: 'Web Clock-in' },
      { id: 'att_4', employee_id: 'emp_004', employee_name: 'Vikram Singh', emp_code: 'BTI-004', department: 'Engineering', date: '2026-10-23', status: 'present', check_in: '08:50', check_out: '17:50', notes: 'Biometric Access' },
      { id: 'att_5', employee_id: 'emp_005', employee_name: 'Amit Patel', emp_code: 'BTI-005', department: 'Sales', date: '2026-10-23', status: 'present', check_in: '09:15', check_out: '18:00', notes: 'Field Check-in' },
      { id: 'att_6', employee_id: 'emp_006', employee_name: 'Kavita Nair', emp_code: 'BTI-006', department: 'Human Resources', date: '2026-10-23', status: 'present', check_in: '09:00', check_out: '18:00', notes: 'HQ Terminal' }
    ];
    return { records, summary: { present: 5, absent: 1, leave: 0, attendance_rate: 94.2 } } as any;
  }

  // Leave
  if (url.includes('/api/leave/balances')) {
    return { balances: INITIAL_LEAVE_BALANCES } as any;
  }
  if (url.startsWith('/api/leave/requests')) {
    const requests = getStore<LeaveRequest[]>('leave_requests', INITIAL_LEAVE_REQUESTS);
    if (method === 'POST' && url.includes('/review')) {
      const id = url.split('/requests/')[1]?.split('/')[0];
      const body = JSON.parse(options.body as string || '{}');
      const updated = requests.map(r => r.id === id ? { ...r, status: body.status } : r);
      setStore('leave_requests', updated);
      return { message: 'Leave status updated', requests: updated } as any;
    }
    const pending = requests.filter(r => r.status === 'pending').length;
    return { requests, pending_count: pending } as any;
  }

  // Salary structures
  if (url.startsWith('/api/salary-structures')) {
    const structures: SalaryStructure[] = INITIAL_EMPLOYEES.map(emp => {
      const monthly = emp.monthly_gross || 100000;
      const basic = monthly * 0.5;
      const hra = monthly * 0.25;
      const special = monthly * 0.25;
      return {
        id: `ss_${emp.id}`,
        employee_id: emp.id,
        employee_name: emp.name,
        emp_code: emp.emp_code,
        department: emp.department,
        designation: emp.designation,
        ctc_annual: emp.ctc_annual || 1200000,
        monthly_gross: monthly,
        basic,
        hra,
        special_allowance: special,
        pf_applicable: true,
        pf_type: 'statutory_capped_1800',
        esi_applicable: false,
        pt_applicable: true,
        pt_state: 'Karnataka',
        tds_monthly_override: 0
      };
    });
    return { structures } as any;
  }

  // Payroll
  if (url.includes('/api/payroll/periods')) {
    const periods = getStore<PayrollPeriod[]>('payroll_periods', INITIAL_PERIODS);
    const items = getStore<PayrollItem[]>('payroll_items', INITIAL_PAYROLL_ITEMS);

    if (url.includes('/calculate')) {
      return { message: 'Calculated successfully' } as any;
    }
    if (url.includes('/process')) {
      const updatedPeriods = periods.map(p => p.id === 'period_oct_2026' ? { ...p, status: 'processed' as const } : p);
      setStore('payroll_periods', updatedPeriods);
      return { message: 'Processed successfully' } as any;
    }
    if (method === 'POST' && (url.endsWith('/periods') || url.endsWith('/periods/'))) {
      const body = JSON.parse(options.body as string || '{}');
      const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const pName = body.name || `${monthNames[body.month] || 'Month'} ${body.year}`;
      const newP: PayrollPeriod = {
        id: `period_${body.year}_${body.month}`,
        name: pName,
        month: body.month,
        year: body.year,
        working_days: body.working_days || 22,
        status: 'draft',
        employee_count: items.length,
        flagged_count: 0,
        total_gross: items.reduce((s, i) => s + i.gross_earnings, 0),
        total_net: items.reduce((s, i) => s + i.net_salary, 0),
        total_employer_cost: items.reduce((s, i) => s + i.total_employer_cost, 0)
      };
      const updatedP = [newP, ...periods.filter(p => p.id !== newP.id)];
      setStore('payroll_periods', updatedP);
      return { status: 'success', period: newP } as any;
    }
    if (method === 'PUT' && url.includes('/items/')) {
      const itemId = url.split('/items/')[1];
      const body = JSON.parse(options.body as string || '{}');
      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          const bonus = body.bonus_or_variable ?? item.bonus_or_variable;
          const unpaidDays = body.unpaid_leave_days ?? item.unpaid_leave_days;
          const lop = (item.gross_earnings / 22) * unpaidDays;
          const newGross = item.basic + item.hra + item.special_allowance + bonus;
          const otherDed = body.other_deductions ?? item.other_deductions;
          const newDed = item.employee_pf + item.professional_tax + item.tds + lop + otherDed;
          const newNet = newGross - newDed;
          return {
            ...item,
            bonus_or_variable: bonus,
            unpaid_leave_days: unpaidDays,
            lop_deduction: lop,
            other_deductions: otherDed,
            gross_earnings: newGross,
            total_deductions: newDed,
            net_salary: newNet,
            audit_status: (bonus === 0 && unpaidDays === 0 && newNet > 0) ? 'resolved' : item.audit_status
          };
        }
        return item;
      });
      setStore('payroll_items', updatedItems);
      return { message: 'Updated line item' } as any;
    }

    const currentPeriod = periods.find(p => p.id === 'period_oct_2026') || periods[0];
    const totalGross = items.reduce((sum, i) => sum + i.gross_earnings, 0);
    const totalDeductions = items.reduce((sum, i) => sum + i.total_deductions, 0);
    const totalNet = items.reduce((sum, i) => sum + i.net_salary, 0);
    const totalEmployer = items.reduce((sum, i) => sum + i.total_employer_cost, 0);
    const flagged = items.filter(i => i.audit_status === 'flagged').length;

    return {
      period: currentPeriod,
      items,
      summary: {
        total_gross: totalGross,
        total_deductions: totalDeductions,
        total_net: totalNet,
        total_employer_cost: totalEmployer,
        flagged_count: flagged
      },
      periods
    } as any;
  }

  // AI Payroll Auditor
  if (url.startsWith('/api/auditor')) {
    const findings = getStore<AuditFinding[]>('findings', INITIAL_AUDIT_FINDINGS);
    if (url.includes('/resolve')) {
      const id = url.split('/findings/')[1]?.split('/')[0];
      const body = JSON.parse(options.body as string || '{}');
      const updated = findings.map(f => f.id === id ? { ...f, status: body.status, resolution_note: body.resolution_note } : f);
      setStore('findings', updated);
      return { message: 'Resolved finding', findings: updated } as any;
    }
    const critical = findings.filter(f => f.severity === 'CRITICAL' && f.status === 'Open').length;
    const high = findings.filter(f => f.severity === 'HIGH' && f.status === 'Open').length;
    const medium = findings.filter(f => f.severity === 'MEDIUM' && f.status === 'Open').length;
    const resolved = findings.filter(f => f.status === 'Resolved' || f.status === 'Accepted').length;
    const totalOpen = findings.filter(f => f.status === 'Open').length;

    return {
      findings,
      summary: {
        total_open: totalOpen,
        critical,
        high,
        medium,
        resolved
      }
    } as any;
  }

  // AI Assistant
  if (url.includes('/api/assistant/chat')) {
    const body = JSON.parse(options.body as string || '{}');
    const query = (body.query || '').toLowerCase();

    if (query.includes('take-home') || query.includes('calculated')) {
      return {
        answer: `### Salary Calculation Breakdown (October 2026)\n\nFor **${me.full_name}**:\n- **Basic Salary**: ₹75,000.00\n- **House Rent Allowance (HRA)**: ₹37,500.00\n- **Special Allowance**: ₹27,500.00\n- **Gross Earnings**: ₹1,40,000.00\n\n**Statutory Deductions:**\n- **Provident Fund (EPF)**: ₹1,800.00 (Statutory Capped)\n- **Professional Tax (PT)**: ₹200.00 (Karnataka Slab)\n- **Income Tax (TDS)**: ₹21,500.00 (New Regime u/s 115BAC)\n\n**Net Take-Home Salary**: **₹1,16,500.00**\n\n*All deductions were deterministically validated by the PayPilot Indian Statutory Engine.*`,
        sources: ['PayPilot Statutory Rules', 'Employee Master Ledger', 'CBDT Income Tax Slabs']
      } as any;
    }
    if (query.includes('discrepanc') || query.includes('findings') || query.includes('audit')) {
      return {
        answer: `### Pre-Disbursement Audit Summary\n\nThe AI Payroll Auditor flagged **4 open discrepancies** in the October 2026 payroll run:\n1. **Rohan Verma (Engineering)**: 53.6% Gross salary spike (+₹75,000 bonus).\n2. **Priya Sharma (Marketing)**: 4 unbilled absence days without LOP deduction.\n3. **Amit Patel (Sales)**: Negative take-home (-₹7,000) due to un-capped advance loan deduction.\n4. **Vikram Singh (DevOps)**: Missing bank account and IFSC details.`,
        sources: ['AI Payroll Auditor Engine', 'Biometric Attendance Logs', 'Bank Account Verification']
      } as any;
    }
    return {
      answer: `Hello! As your PayPilot AI Assistant, I can confirm that the October 2026 payroll run is currently under pre-disbursement audit. All formulas adhere to EPF 12% statutory caps (₹1,800), Professional Tax (₹200), and the New Tax Regime (Section 115BAC).`,
      sources: ['PayPilot Enterprise Knowledgebase', 'Statutory Guidelines']
    } as any;
  }

  // Payslips & Reports
  if (url.includes('/api/reports/payslip/')) {
    return {
      company: {
        name: 'BharatTech Innovations Pvt. Ltd.',
        address: 'Koramangala 4th Block, Bengaluru, Karnataka 560034',
        pan: 'AABCB1234F',
        tan: 'BLRB12345C',
        epf_reg: 'KN/BNG/1234567/000',
        esic_reg: '53000123450000001'
      },
      period: {
        name: 'October 2026',
        working_days: 22,
        status: 'Calculated'
      },
      employee: {
        name: 'Rohan Verma',
        emp_code: 'BTI-003',
        department: 'Engineering',
        designation: 'Staff Backend Engineer',
        pan: 'CRRPV5432L',
        uan: '100908070605',
        bank_account: '918020045678912',
        tax_regime: 'New Regime (115BAC)'
      },
      earnings: [
        { label: 'Basic Salary', amount: 75000 },
        { label: 'House Rent Allowance (HRA)', amount: 37500 },
        { label: 'Special Allowance', amount: 27500 },
        { label: 'Variable / Festival Bonus', amount: 75000 }
      ],
      deductions: [
        { label: 'Employee Provident Fund (EPF)', amount: 1800 },
        { label: 'Professional Tax (PT)', amount: 200 },
        { label: 'Income Tax (TDS)', amount: 21500 },
        { label: 'Loss of Pay (LOP)', amount: 0 }
      ],
      summary: {
        gross_earnings: 215000,
        total_deductions: 23500,
        net_salary: 191500,
        net_salary_in_words: 'Rupees One Lakh Ninety One Thousand Five Hundred Only',
        total_employer_cost: 216800,
        employer_pf: 1800
      },
      leaves: {
        casual_remaining: 10,
        sick_remaining: 9,
        earned_remaining: 12
      }
    } as any;
  }

  if (url.includes('/api/reports/summary/')) {
    return {
      period_name: 'October 2026',
      employee_count: 6,
      total_gross: 669000,
      total_net: 541200,
      total_deductions: 127800,
      total_employer_cost: 687000,
      statutory_breakdown: {
        provident_fund: 10800,
        esi: 0,
        professional_tax: 1200,
        tds: 39600
      }
    } as any;
  }

  if (url.includes('/api/reports/department-report/')) {
    return {
      departments: [
        { department: 'Engineering', headcount: 2, gross_salary: 325000, net_salary: 294000, employer_cost: 328600 },
        { department: 'Marketing', headcount: 1, gross_salary: 100000, net_salary: 93500, employer_cost: 101800 },
        { department: 'Design', headcount: 1, gross_salary: 80000, net_salary: 75500, employer_cost: 81800 },
        { department: 'Human Resources', headcount: 1, gross_salary: 91000, net_salary: 85200, employer_cost: 92800 },
        { department: 'Sales', headcount: 1, gross_salary: 73000, net_salary: -7000, employer_cost: 74800 }
      ]
    } as any;
  }

  // Intelligence Engine Mocks
  if (url.includes('/api/intelligence/summary')) {
    return {
      next_month_projection: {
        month: 'Nov 2026',
        expected_cost: 704175,
        lower_bound: 686570,
        upper_bound: 721779,
        expected_variance_pct: 2.5,
        projected_headcount: 6
      },
      anomaly_summary: { critical: 2, high: 2, medium: 1, low: 0 },
      total_open_anomalies: 5,
      scenarios_count: 2,
      pending_workflow_tasks: 3,
      is_employee: me.role === 'employee'
    } as any;
  }

  if (url.includes('/api/intelligence/digital-twin/scenarios')) {
    const savedScenarios = getStore<any[]>('sim_scenarios', [
      {
        id: 'sim_demo_01',
        name: 'Q1 2027 Engineering 10% Hike & 2 Dev Hires',
        description: 'Assessing engineering salary revision plus adding 2 Junior Full-Stack engineers.',
        base_period_id: 'period_oct_2026',
        baseline_total_cost: 687000,
        simulated_total_cost: 825400,
        cost_delta: 138400,
        cost_delta_pct: 20.1,
        status: 'reviewed',
        created_at: '2026-10-23T14:30:00Z',
        parameters: {
          salary_increment_pct: 10,
          bonus_pool: 0,
          new_hires_count: 2
        }
      }
    ]);
    return { scenarios: savedScenarios } as any;
  }

  if (url.includes('/api/intelligence/digital-twin/simulate')) {
    let body: any = {};
    try { body = JSON.parse(options.body as string); } catch {}
    const hike = Number(body.department_hikes?.Engineering || body.salary_increment_pct || 10);
    const bonus = Number(body.bonus_pool || 0);
    const newHires = body.new_hires || [];
    const baseline = 687000;
    const delta = (baseline * (hike / 100)) + bonus + (newHires.length * 62000);
    const simulated = baseline + delta;

    return {
      base_period_name: 'October 2026',
      baseline_summary: {
        headcount: 6,
        total_gross: 669000,
        total_net: 541200,
        total_employer_pf: 10800,
        total_cost_ctc: baseline
      },
      simulated_summary: {
        headcount: 6 + newHires.length,
        total_gross: 669000 + delta * 0.95,
        total_net: 541200 + delta * 0.78,
        total_employer_pf: 10800 + (newHires.length * 1800),
        total_cost_ctc: simulated
      },
      variance: {
        cost_delta_monthly: Math.round(delta),
        cost_delta_pct: Number((delta / baseline * 100).toFixed(1)),
        cost_delta_annualized: Math.round(delta * 12),
        headcount_added: newHires.length
      },
      department_breakdown: [
        { department: 'Engineering', baseline_cost: 328600, simulated_cost: 328600 * (1 + hike/100) + (newHires.length * 62000), headcount_delta: newHires.length, delta: 328600 * (hike/100) + (newHires.length * 62000), delta_pct: hike },
        { department: 'Marketing', baseline_cost: 101800, simulated_cost: 101800, headcount_delta: 0, delta: 0, delta_pct: 0 },
        { department: 'Design', baseline_cost: 81800, simulated_cost: 81800, headcount_delta: 0, delta: 0, delta_pct: 0 },
        { department: 'Operations', baseline_cost: 174800, simulated_cost: 174800, headcount_delta: 0, delta: 0, delta_pct: 0 }
      ],
      simulated_items: [
        { employee_name: 'Alice Roy', department: 'Engineering', change_type: 'salary_hike', hike_pct: hike, old_gross: 215000, new_gross: 215000 * (1 + hike/100), simulated_basic: 107500 * (1 + hike/100), simulated_pf: 1800, simulated_esi: 0, simulated_pt: 200, simulated_tds: 23500, simulated_net: 191500 * (1 + hike/100), old_employer_cost: 216800, simulated_employer_cost: 216800 + (215000 * hike/100), cost_delta: 215000 * hike/100 },
        { employee_name: 'Bob Sen', department: 'Product', change_type: 'none', old_gross: 110000, new_gross: 110000, simulated_basic: 55000, simulated_pf: 1800, simulated_esi: 0, simulated_pt: 200, simulated_tds: 8500, simulated_net: 99500, old_employer_cost: 111800, simulated_employer_cost: 111800, cost_delta: 0 },
        ...newHires.map((nh: any, idx: number) => ({
          employee_name: nh.designation || `Simulated Hire #${idx+1}`,
          department: nh.department || 'Engineering',
          change_type: 'new_hire' as const,
          old_gross: 0,
          new_gross: nh.monthly_gross || 60000,
          simulated_basic: (nh.monthly_gross || 60000) * 0.5,
          simulated_pf: 1800,
          simulated_esi: 0,
          simulated_pt: 200,
          simulated_tds: 2500,
          simulated_net: (nh.monthly_gross || 60000) - 4500,
          old_employer_cost: 0,
          simulated_employer_cost: (nh.monthly_gross || 60000) + 1800,
          cost_delta: (nh.monthly_gross || 60000) + 1800
        }))
      ]
    } as any;
  }

  if (url.includes('/api/intelligence/forecast')) {
    return {
      forecast_series: [
        { month: 'Jul 2026', payroll_cost: 645000, lower_bound: 645000, upper_bound: 645000, headcount: 5, is_forecast: false },
        { month: 'Aug 2026', payroll_cost: 660000, lower_bound: 660000, upper_bound: 660000, headcount: 5, is_forecast: false },
        { month: 'Sep 2026', payroll_cost: 672000, lower_bound: 672000, upper_bound: 672000, headcount: 6, is_forecast: false },
        { month: 'Oct 2026', payroll_cost: 687000, lower_bound: 687000, upper_bound: 687000, headcount: 6, is_forecast: false },
        { month: 'Nov 2026', payroll_cost: 704175, lower_bound: 686570, upper_bound: 721779, headcount: 6, is_forecast: true },
        { month: 'Dec 2026', payroll_cost: 721779, lower_bound: 692908, upper_bound: 750650, headcount: 7, is_forecast: true },
        { month: 'Jan 2027', payroll_cost: 739823, lower_bound: 695433, upper_bound: 784212, headcount: 7, is_forecast: true },
        { month: 'Feb 2027', payroll_cost: 758319, lower_bound: 705236, upper_bound: 811401, headcount: 7, is_forecast: true }
      ],
      next_month_projection: {
        month: 'Nov 2026',
        expected_cost: 704175,
        lower_bound: 686570,
        upper_bound: 721779,
        expected_variance_pct: 2.5,
        projected_headcount: 6
      },
      assumptions: [
        'Historical run-rate baseline calculated across 4 consecutive payroll cycles.',
        'Assumes statutory 12% EPF (capped at ₹1,800/mo) and Karnataka PT rules remain static.',
        'Reflects 1 scheduled hire in December 2026 (Engineering Department).',
        'Uncertainty band expands by ±1.5% each additional forward month to reflect attendance variability and variable bonus timing.'
      ]
    } as any;
  }

  if (url.includes('/api/intelligence/anomalies')) {
    return {
      period_id: 'period_oct_2026',
      severity_summary: { critical: 2, high: 2, medium: 1, low: 0 },
      open_count: 5,
      anomalies: [
        {
          id: 'anom_01',
          rule_code: 'VARIANCE_SPIKE',
          category: 'Salary Spike',
          severity: 'CRITICAL',
          title: '38.2% Gross Pay Surge for Vikram Malhotra',
          description: 'Gross compensation rose from ₹76,000 to ₹105,000 without an approved salary hike record or documented appraisal event.',
          employee_id: 'emp_006',
          employee_name: 'Vikram Malhotra',
          emp_code: 'EMP-006',
          department: 'Sales',
          expected_value: '₹76,000.00 gross',
          observed_value: '₹105,000.00 gross',
          recommended_investigation_steps: [
            'Confirm whether Sales Commission or festival bonus was included in monthly base earnings.',
            'Cross-check maker-checker approvals in the HR change log.',
            'Ensure Section 115BAC TDS was recomputed for higher tax bracket.'
          ],
          status: 'Open'
        },
        {
          id: 'anom_02',
          rule_code: 'NEGATIVE_NET_PAY',
          category: 'Statutory Violation',
          severity: 'CRITICAL',
          title: 'Negative Net Payout (-₹7,000) for Rahul Sharma',
          description: 'Deductions (₹80,000) exceeded gross pay (₹73,000) due to unbudgeted laptop recovery, violating Section 7 of Payment of Wages Act.',
          employee_id: 'emp_002',
          employee_name: 'Rahul Sharma',
          emp_code: 'EMP-002',
          department: 'Engineering',
          expected_value: 'Min 50% statutory net take-home (₹36,500)',
          observed_value: '-₹7,000.00 net payout',
          recommended_investigation_steps: [
            'Cap monthly asset recovery to maximum 50% of gross earnings.',
            'Reschedule residual ₹43,500 recovery balance across upcoming November/December payrolls.',
            'Generate corrected payslip before locking bank disbursement batch.'
          ],
          status: 'Open'
        },
        {
          id: 'anom_03',
          rule_code: 'MISSING_BANK_CREDENTIALS',
          category: 'Disbursement Blocker',
          severity: 'HIGH',
          title: 'Missing NACH / Bank Account for Ananya Desai',
          description: 'Employee lacks active IFSC and verified bank account number in core records. Direct credit batch will reject.',
          employee_id: 'emp_005',
          employee_name: 'Ananya Desai',
          emp_code: 'EMP-005',
          department: 'Human Resources',
          expected_value: 'Valid 11-character IFSC and bank account',
          observed_value: 'Account: Not Submitted',
          recommended_investigation_steps: [
            'Dispatch urgent document reminder via HR Workflow Agent.',
            'Verify cancelled cheque or digital bank passbook before processing.'
          ],
          status: 'Open'
        }
      ]
    } as any;
  }

  if (url.includes('/api/intelligence/explain-payslip')) {
    let body: any = {};
    try { body = JSON.parse(options.body as string); } catch {}
    return {
      employee_id: body.employee_id || 'emp_001',
      employee_name: 'Alice Roy',
      department: 'Engineering',
      current_period: body.current_period_id || 'period_oct_2026',
      comparison_period: body.comparison_period_id || 'period_sep_2026',
      net_difference: -5451.61,
      components: [
        { name: 'Gross Earnings', prev: 215000, curr: 208096.77, diff: -6903.23 },
        { name: 'Basic Earned', prev: 107500, curr: 104048.39, diff: -3451.61 },
        { name: 'HRA Earned', prev: 53750, curr: 52024.19, diff: -1725.81 },
        { name: 'Special Allowance', prev: 53750, curr: 52024.19, diff: -1725.81 },
        { name: 'Loss of Pay (LOP) Deduction', prev: 0, curr: 6903.23, diff: 6903.23 },
        { name: 'TDS (Income Tax)', prev: 21500, curr: 20048.38, diff: -1451.62 },
        { name: 'Employee PF (12%)', prev: 1800, curr: 1800, diff: 0 },
        { name: 'Professional Tax', prev: 200, curr: 200, diff: 0 },
        { name: 'Net Take-Home Pay', prev: 191500, curr: 186048.39, diff: -5451.61 }
      ],
      grounded_explanation: `### Mathematically Grounded Payslip Explanation\n\nYour net take-home salary for October 2026 reduced by **₹5,451.61** (from ₹1,91,500.00 to ₹1,86,048.39).\n\n- **Loss of Pay (LOP) Deduction (+₹6,903.23):** You had 1 unapproved leave day in October (attendance log: 21 of 22 working days). Under Indian payroll rules, daily gross rate is \`₹2,15,000 / 31 = ₹6,903.23\`.\n- **Tax Adjustment (-₹1,451.62):** Because your taxable income for the month decreased due to LOP, your Section 115BAC monthly TDS withholding was automatically recalculated downward from ₹21,500 to ₹20,048.38, saving you tax.\n- **Statutory Stability:** Your EPF contribution remained capped at the statutory limit of **₹1,800.00** and Karnataka PT at **₹200.00**.`,
      is_ai_synthesized: true
    } as any;
  }

  if (url.includes('/api/intelligence/workflow/tasks')) {
    const tasks = getStore<any[]>('hr_workflow_tasks', [
      {
        id: 'task_demo_01',
        task_type: 'salary_hike_approval',
        title: 'Authorize 10% Senior Engineering Merit Hike',
        description: 'Annual appraisal cycle increment for Alice Roy from ₹2,15,000/mo to ₹2,36,500/mo (+₹21,500/mo). Requires authorized HR approval.',
        target_employee_id: 'emp_001',
        target_employee_name: 'Alice Roy',
        department: 'Engineering',
        severity: 'high',
        status: 'pending_approval',
        requires_approval: true,
        consequential_action: 'Update salary structure and recalculate ongoing payroll cycle.',
        payload: { employee_id: 'emp_001', hike_pct: 10, new_gross: 236500 },
        created_at: '2026-10-23T11:00:00Z'
      },
      {
        id: 'task_demo_02',
        task_type: 'missing_bank_account',
        title: 'Dispatch Bank Account & NACH Mandatory Notification',
        description: 'Ananya Desai has not uploaded bank passbook or cancelled cheque. Disbursement batch will reject without KYC resolution.',
        target_employee_id: 'emp_005',
        target_employee_name: 'Ananya Desai',
        department: 'Human Resources',
        severity: 'high',
        status: 'pending_approval',
        requires_approval: true,
        consequential_action: 'Send automated reminder email with upload link and freeze direct credit queue.',
        payload: { employee_id: 'emp_005' },
        created_at: '2026-10-23T12:30:00Z'
      },
      {
        id: 'task_demo_03',
        task_type: 'onboarding_checklist',
        title: 'Complete Onboarding Verification for Neha Gupta',
        description: 'Verify Aadhaar masking, PF UAN linking, and Form 11 statutory declaration for new hire in Design.',
        target_employee_id: 'emp_004',
        target_employee_name: 'Neha Gupta',
        department: 'Design',
        severity: 'medium',
        status: 'pending_approval',
        requires_approval: true,
        consequential_action: 'Mark onboarding workflow completed and enroll into EPFO electronic challan portal.',
        payload: { employee_id: 'emp_004' },
        created_at: '2026-10-23T09:15:00Z'
      }
    ]);
    return { tasks } as any;
  }

  // Reset Seed
  if (url.includes('/api/seed/reset')) {
    localStorage.removeItem('paypilot_store_findings');
    localStorage.removeItem('paypilot_store_payroll_items');
    localStorage.removeItem('paypilot_store_payroll_periods');
    localStorage.removeItem('paypilot_store_leave_requests');
    localStorage.removeItem('paypilot_store_sim_scenarios');
    localStorage.removeItem('paypilot_store_hr_workflow_tasks');
    return { message: 'Reset demo data successfully' } as any;
  }

  return {} as any;
};

// Client-side export generator for static demo fallback
const createDownloadBlob = (content: string, type: string) => {
  const blob = new Blob([content], { type });
  return URL.createObjectURL(blob);
};

export const api = {
  // Auth
  getDemoUsers: () => request<{ users: User[] }>('/api/auth/demo-users'),
  getMe: () => request<User>('/api/auth/me'),

  // Dashboard
  getDashboardStats: (periodId?: string) => request<any>(`/api/dashboard/stats${periodId ? `?period_id=${encodeURIComponent(periodId)}` : ''}`),
  getDashboardCharts: (periodId?: string) => request<any>(`/api/dashboard/charts${periodId ? `?period_id=${encodeURIComponent(periodId)}` : ''}`),
  getRecentActivity: (limit: number = 10) => request<{ activities: any[] }>(`/api/dashboard/recent-activity?limit=${limit}`),

  // Employees
  getEmployees: (search?: string, department?: string, status?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department && department !== 'all') params.append('department', department);
    if (status && status !== 'all') params.append('status', status);
    return request<{ employees: Employee[]; total: number }>(`/api/employees?${params.toString()}`);
  },
  getEmployeeDetail: (id: string) => request<any>(`/api/employees/${id}`),
  createEmployee: (data: any) => request<any>('/api/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: string, data: any) => request<any>(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivateEmployee: (id: string) => request<any>(`/api/employees/${id}`, { method: 'DELETE' }),

  // Attendance
  getAttendance: (month = 10, year = 2026, employeeId?: string) => {
    const params = new URLSearchParams({ month: String(month), year: String(year) });
    if (employeeId && employeeId !== 'all') params.append('employee_id', employeeId);
    return request<{ records: AttendanceRecord[]; summary: any }>(`/api/attendance?${params.toString()}`);
  },
  markAttendance: (data: any) => request<any>('/api/attendance/mark', { method: 'POST', body: JSON.stringify(data) }),

  // Leave
  getLeaveBalances: () => request<{ balances: LeaveBalance[] }>('/api/leave/balances'),
  getLeaveRequests: (status?: string) => {
    const params = status && status !== 'all' ? `?status=${status}` : '';
    return request<{ requests: LeaveRequest[]; pending_count: number }>(`/api/leave/requests${params}`);
  },
  applyLeave: (data: any) => request<any>('/api/leave/apply', { method: 'POST', body: JSON.stringify(data) }),
  reviewLeave: (id: string, status: 'approved' | 'rejected', review_comment?: string) =>
    request<any>(`/api/leave/requests/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, review_comment })
    }),

  // Salary Structure
  getSalaryStructures: () => request<{ structures: SalaryStructure[] }>('/api/salary-structures'),
  getEmployeeSalaryStructure: (empId: string) => request<SalaryStructure>(`/api/salary-structures/${empId}`),
  updateSalaryStructure: (empId: string, data: any) =>
    request<any>(`/api/salary-structures/${empId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Payroll
  getPayrollPeriods: () => request<{ periods: PayrollPeriod[] }>('/api/payroll/periods'),
  createPayrollPeriod: (data: { month: number; year: number; name?: string; working_days?: number }) =>
    request<any>('/api/payroll/periods', { method: 'POST', body: JSON.stringify(data) }),
  getPeriodDetail: (id: string, department?: string, auditStatus?: string) => {
    const params = new URLSearchParams();
    if (department && department !== 'all') params.append('department', department);
    if (auditStatus && auditStatus !== 'all') params.append('audit_status', auditStatus);
    return request<{ period: PayrollPeriod; items: PayrollItem[]; summary: any }>(
      `/api/payroll/periods/${id}?${params.toString()}`
    );
  },
  calculatePayroll: (periodId: string) =>
    request<any>(`/api/payroll/periods/${periodId}/calculate`, { method: 'POST' }),
  updatePayrollItem: (itemId: string, data: any) =>
    request<any>(`/api/payroll/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  approvePayroll: (periodId: string) =>
    request<any>(`/api/payroll/periods/${periodId}/approve`, { method: 'POST' }),
  processPayroll: (periodId: string) =>
    request<any>(`/api/payroll/periods/${periodId}/process`, { method: 'POST' }),

  // AI Payroll Auditor
  getAuditFindings: (periodId?: string, severity?: string, category?: string, status?: string) => {
    const params = new URLSearchParams();
    if (periodId && periodId !== 'all') params.append('period_id', periodId);
    if (severity && severity !== 'all') params.append('severity', severity);
    if (category && category !== 'all') params.append('category', category);
    if (status && status !== 'all') params.append('status', status);
    return request<{ findings: AuditFinding[]; summary: any }>(`/api/auditor/findings?${params.toString()}`);
  },
  runPayrollAudit: (periodId: string) =>
    request<any>('/api/auditor/run', { method: 'POST', body: JSON.stringify({ period_id: periodId }) }),
  resolveAuditFinding: (id: string, status: string, resolution_note: string) =>
    request<any>(`/api/auditor/findings/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ status, resolution_note })
    }),

  // AI Assistant
  askAssistant: (query: string) =>
    request<{ answer: string; data?: any; sources?: string[] }>('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ query })
    }),

  // Payslips & Reports
  getPayslipData: (periodId: string, employeeId: string) =>
    request<PayslipData>(`/api/reports/payslip/${periodId}/${employeeId}`),
  getMonthlySummaryReport: (periodId: string) =>
    request<any>(`/api/reports/summary/${periodId}`),
  getDepartmentReport: (periodId: string) =>
    request<any>(`/api/reports/department-report/${periodId}`),

  // File Download Handlers (with browser blob generator for static GitHub Pages)
  getExportCsvUrl: (_periodId: string) => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const csv = `Employee Code,Name,Department,Designation,PAN,Gross Earnings,PF (Employee),PT,TDS,Total Deductions,Net Salary\n` +
        INITIAL_PAYROLL_ITEMS.map(i => `${i.emp_code},"${i.employee_name}","${i.department}","Staff",ABCDE1234F,${i.gross_earnings},${i.employee_pf},${i.professional_tax},${i.tds},${i.total_deductions},${i.net_salary}`).join('\n');
      return createDownloadBlob(csv, 'text/csv');
    }
    return `/api/reports/export-csv/${_periodId}`;
  },
  getExportBankFileUrl: (_periodId: string) => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const cms = `P,002105009876,ICIC0000021,93500.00,Priya Sharma,Salary Oct 2026,BTI-002\n` +
        `P,918020045678912,UTIB0000128,191500.00,Rohan Verma,Salary Oct 2026,BTI-003\n` +
        `P,50100456123489,HDFC0001234,75500.00,Sneha Rao,Salary Oct 2026,BTI-001\n` +
        `P,50100987654321,HDFC0001234,85200.00,Kavita Nair,Salary Oct 2026,BTI-006\n`;
      return createDownloadBlob(cms, 'text/csv');
    }
    return `/api/reports/export-bank-file/${_periodId}`;
  },
  getExportEpfEcrUrl: (_periodId: string) => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const ecr = `100908070605#~#Rohan Verma#~#75000#~#15000#~#15000#~#15000#~#1800#~#1250#~#550#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0\n` +
        `100908070602#~#Priya Sharma#~#55000#~#15000#~#15000#~#15000#~#1800#~#1250#~#550#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0\n` +
        `100908070601#~#Sneha Rao#~#45000#~#15000#~#15000#~#15000#~#1800#~#1250#~#550#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0\n`;
      return createDownloadBlob(ecr, 'text/plain');
    }
    return `/api/reports/export-epf-ecr/${_periodId}`;
  },

  // Reset Seed
  resetSeedData: () => request<any>('/api/seed/reset', { method: 'POST' }),

  // Commercial Auth & Organization Onboarding
  loginUser: async (email: string, password?: string) => {
    const res = await request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: password || 'demo' })
    });
    if (res?.access_token) {
      setApiToken(res.access_token);
      if (res.user?.id) setApiUserId(res.user.id, res.access_token);
    }
    return res;
  },
  registerOrganization: async (data: {
    company_name: string;
    owner_name: string;
    email: string;
    password: string;
    phone?: string;
    plan_tier?: string;
    pan?: string;
    tan?: string;
    state?: string;
  }) => {
    const res = await request<any>('/api/auth/register-organization', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res?.access_token) {
      setApiToken(res.access_token);
      if (res.user?.id) setApiUserId(res.user.id, res.access_token);
    }
    return res;
  },
  switchDemoUser: async (userId: string) => {
    try {
      const res = await request<any>('/api/auth/switch-demo', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId })
      });
      if (res?.access_token) {
        setApiToken(res.access_token);
        setApiUserId(userId, res.access_token);
      }
      return res;
    } catch {
      setApiUserId(userId);
      return { user: { id: userId } };
    }
  },
  forgotPassword: (email: string) =>
    request<any>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),
  resetPassword: (token: string, new_password: string) =>
    request<any>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password })
    }),

  // Commercial Billing & Subscriptions
  getPlans: () => request<{ plans: any[] }>('/api/billing/plans'),
  getSubscription: () => request<any>('/api/billing/subscription'),
  createRazorpayOrder: (plan_tier: string, billing_cycle: string = 'monthly') =>
    request<any>('/api/billing/create-order', {
      method: 'POST',
      body: JSON.stringify({ plan_tier, billing_cycle })
    }),
  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    plan_tier: string;
    billing_cycle?: string;
  }) =>
    request<any>('/api/billing/verify-payment', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getInvoices: () => request<{ invoices: any[] }>('/api/billing/invoices'),
  contactSales: (data: {
    full_name: string;
    email: string;
    phone?: string;
    company_name: string;
    employee_range?: string;
    message?: string;
    inquiry_type?: string;
  }) =>
    request<any>('/api/billing/contact-sales', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Employee Documents
  getEmployeeDocuments: (employeeId: string) =>
    request<{ documents: any[] }>(`/api/employees/${employeeId}/documents`),
  uploadEmployeeDocument: (employeeId: string, doc: {
    document_type: string;
    title: string;
    file_name: string;
    file_size_kb?: number;
  }) =>
    request<any>(`/api/employees/${employeeId}/documents`, {
      method: 'POST',
      body: JSON.stringify(doc)
    }),
  deleteEmployeeDocument: (employeeId: string, docId: string) =>
    request<any>(`/api/employees/${employeeId}/documents/${docId}`, {
      method: 'DELETE'
    }),

  // PayPilot Intelligence Engine
  getIntelligenceSummary: () =>
    request<IntelligenceSummary>('/api/intelligence/summary'),

  simulateDigitalTwin: (params: {
    base_period_id?: string;
    salary_increment_pct?: number;
    department_hikes?: Record<string, number>;
    individual_hikes?: Record<string, number>;
    new_hires?: Array<{
      designation: string;
      department: string;
      monthly_gross: number;
      state?: string;
    }>;
    bonus_pool?: number;
    bonus_department?: string;
  }) =>
    request<SimulationResult>('/api/intelligence/digital-twin/simulate', {
      method: 'POST',
      body: JSON.stringify(params)
    }),

  saveSimulationScenario: (data: {
    name: string;
    description?: string;
    base_period_id: string;
    simulation_result: SimulationResult;
    parameters: any;
  }) =>
    request<{
      status: string;
      scenario_id: string;
      name: string;
      cost_delta: number;
      cost_delta_pct: number;
    }>('/api/intelligence/digital-twin/save', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getSimulationScenarios: () =>
    request<{ scenarios: SimulationScenario[] }>('/api/intelligence/digital-twin/scenarios'),

  deleteSimulationScenario: (id: string) =>
    request<{ status: string; deleted: string }>(`/api/intelligence/digital-twin/scenarios/${id}`, {
      method: 'DELETE'
    }),

  getPayrollForecast: (months: number = 4) =>
    request<PayrollForecastData>(`/api/intelligence/forecast?months=${months}`),

  getAnomalyRadar: (periodId?: string) =>
    request<AnomalyRadarData>(periodId ? `/api/intelligence/anomalies?period_id=${encodeURIComponent(periodId)}` : '/api/intelligence/anomalies'),

  explainPayslip: (req: {
    employee_id?: string;
    current_period_id: string;
    comparison_period_id?: string;
    question?: string;
  }) =>
    request<ExplainPayslipResult>('/api/intelligence/explain-payslip', {
      method: 'POST',
      body: JSON.stringify(req)
    }),

  getWorkflowTasks: () =>
    request<{ tasks: HRWorkflowTaskItem[] }>('/api/intelligence/workflow/tasks'),

  reviewWorkflowTask: (taskId: string, action: 'approve' | 'reject') =>
    request<{
      status: string;
      task_id: string;
      new_status: string;
      approved_by: string;
    }>(`/api/intelligence/workflow/tasks/${taskId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action })
    }),

  // FinOps & Expense Claims
  getExpensesSummary: () => expensesApi.getSummary(),
  getClaims: (params?: { employee_id?: string; category?: string; status?: string }) => expensesApi.getClaims(params),
  submitClaim: (payload: any) => expensesApi.submitClaim(payload),
  updateClaimStatus: (claimId: string, status: string, rejectionReason?: string) => expensesApi.updateClaimStatus(claimId, status, rejectionReason),
  getAdvances: (employeeId?: string, status?: string) => expensesApi.getAdvances(employeeId, status),
  requestAdvance: (payload: any) => expensesApi.requestAdvance(payload),
  updateAdvanceStatus: (advanceId: string, status: string, amountApproved?: number) => expensesApi.updateAdvanceStatus(advanceId, status, amountApproved),
  exportBankCMS: (claimIds?: string[]) => expensesApi.exportBankCMS(claimIds),

  // Tax Vault & Form 12BB
  getTaxDeclarations: (financialYear?: string, status?: string) => taxVaultApi.getDeclarations(financialYear, status),
  getEmployeeTaxDeclaration: (employeeId: string, financialYear?: string) => taxVaultApi.getEmployeeDeclaration(employeeId, financialYear),
  saveTaxDeclaration: (payload: any) => taxVaultApi.saveDeclaration(payload),
  verifyTaxDeclaration: (payload: any) => taxVaultApi.verifyDeclaration(payload),
  compareTaxRegimes: (payload: any) => taxVaultApi.compareRegimes(payload),

  // Global Contractors
  getContractors: (country?: string, currency?: string, status?: string) => contractorsApi.getContractors(country, currency, status),
  createContractor: (payload: any) => contractorsApi.createContractor(payload),
  getContractorInvoices: (contractorId?: string, status?: string) => contractorsApi.getInvoices(contractorId, status),
  createContractorInvoice: (payload: any) => contractorsApi.createInvoice(payload),
  updateContractorInvoiceStatus: (invoiceId: string, status: string, paymentReference?: string) => contractorsApi.updateInvoiceStatus(invoiceId, status, paymentReference),
  exportBatchWire: (invoiceIds?: string[]) => contractorsApi.exportBatchWire(invoiceIds),

  // Statutory Compliance & Form 16/24Q
  getCalendar: (filingType?: string, status?: string) => complianceApi.getCalendar(filingType, status),
  createFiling: (payload: any) => complianceApi.createFiling(payload),
  markFilingFiled: (filingId: string, payload: any) => complianceApi.markFilingFiled(filingId, payload),
  calculatePenalty: (payload: any) => complianceApi.calculatePenalty(payload),
  getForm16: (employeeId: string, assessmentYear?: string) => complianceApi.getForm16(employeeId, assessmentYear),
  getForm24Q: (quarter?: string) => complianceApi.getForm24Q(quarter)
};

export const formatINR = (amount: number = 0): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};

// ==========================================
// FINOPS & REIMBURSEMENTS API
// ==========================================

export const expensesApi = {
  getClaims: (params?: { employee_id?: string; category?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.employee_id) q.append('employee_id', params.employee_id);
    if (params?.category) q.append('category', params.category);
    if (params?.status) q.append('status', params.status);
    const qs = q.toString();
    return request<ExpenseClaim[]>(`/api/expenses/claims${qs ? '?' + qs : ''}`);
  },

  submitClaim: (payload: {
    employee_id: string;
    title: string;
    category: string;
    amount: number;
    currency?: string;
    expense_date?: string;
    tax_treatment?: string;
    receipt_name?: string;
    merchant_name: string;
    gstin?: string;
  }) =>
    request<{ message: string; claim: ExpenseClaim; policy_flag: boolean }>('/api/expenses/claims', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateClaimStatus: (claimId: string, status: string, rejectionReason?: string) =>
    request<{ message: string; claim: ExpenseClaim }>(`/api/expenses/claims/${claimId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, rejection_reason: rejectionReason })
    }),

  getAdvances: (employeeId?: string, status?: string) => {
    const q = new URLSearchParams();
    if (employeeId) q.append('employee_id', employeeId);
    if (status) q.append('status', status);
    const qs = q.toString();
    return request<SalaryAdvance[]>(`/api/expenses/advances${qs ? '?' + qs : ''}`);
  },

  requestAdvance: (payload: {
    employee_id: string;
    amount_requested: number;
    reason: string;
    tenure_months?: number;
  }) =>
    request<{ message: string; id: string }>('/api/expenses/advances', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateAdvanceStatus: (advanceId: string, status: string, amountApproved?: number) =>
    request<{ message: string; advance: SalaryAdvance }>(`/api/expenses/advances/${advanceId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, amount_approved: amountApproved })
    }),

  getSummary: () =>
    request<ExpensesSummary>('/api/expenses/summary'),

  exportBankCMS: (claimIds?: string[]) => {
    const q = new URLSearchParams();
    if (claimIds && claimIds.length > 0) {
      claimIds.forEach(id => q.append('claim_ids', id));
    }
    const qs = q.toString();
    return request<{
      batch_reference: string;
      total_records: number;
      total_disbursement_inr: number;
      records: Array<{
        beneficiary_name: string;
        account_number: string;
        ifsc_code: string;
        amount: number;
        remarks: string;
      }>;
    }>(`/api/expenses/export/batch-cms${qs ? '?' + qs : ''}`);
  }
};

// ==========================================
// TAX VAULT & FORM 12BB API
// ==========================================

export const taxVaultApi = {
  getDeclarations: (financialYear?: string, status?: string) => {
    const q = new URLSearchParams();
    if (financialYear) q.append('financial_year', financialYear);
    if (status) q.append('status', status);
    const qs = q.toString();
    return request<TaxDeclaration[]>(`/api/tax-vault/declarations${qs ? '?' + qs : ''}`);
  },

  getEmployeeDeclaration: (employeeId: string, financialYear?: string) => {
    const qs = financialYear ? `?financial_year=${encodeURIComponent(financialYear)}` : '';
    return request<TaxDeclaration & {
      annual_ctc: number;
      comparison_summary: TaxRegimeComparisonResult;
    }>(`/api/tax-vault/declarations/${employeeId}${qs}`);
  },

  saveDeclaration: (payload: any) =>
    request<{ message: string; declaration: TaxDeclaration }>('/api/tax-vault/declarations', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  verifyDeclaration: (payload: {
    declaration_id: string;
    sec_80c_approved: number;
    sec_80d_health_approved: number;
    sec_24b_home_loan_interest_approved: number;
    sec_80ccd_nps_approved: number;
    hra_annual_rent_approved: number;
    other_exemptions_approved?: number;
    verification_notes?: string;
  }) =>
    request<{ message: string; declaration: TaxDeclaration }>('/api/tax-vault/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  compareRegimes: (payload: {
    ctc_annual: number;
    basic_annual?: number;
    hra_annual?: number;
    sec_80c?: number;
    sec_80d?: number;
    sec_24b?: number;
    sec_80ccd?: number;
    annual_rent?: number;
    city_type?: string;
  }) =>
    request<TaxRegimeComparisonResult>('/api/tax-vault/compare', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};

// ==========================================
// GLOBAL CONTRACTORS API
// ==========================================

export const contractorsApi = {
  getContractors: (country?: string, currency?: string, status?: string) => {
    const q = new URLSearchParams();
    if (country) q.append('country', country);
    if (currency) q.append('currency', currency);
    if (status) q.append('status', status);
    const qs = q.toString();
    return request<Contractor[]>(`/api/contractors/${qs ? '?' + qs : ''}`);
  },

  createContractor: (payload: any) =>
    request<Contractor>('/api/contractors/', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getInvoices: (contractorId?: string, status?: string) => {
    const q = new URLSearchParams();
    if (contractorId) q.append('contractor_id', contractorId);
    if (status) q.append('status', status);
    const qs = q.toString();
    return request<ContractorInvoice[]>(`/api/contractors/invoices${qs ? '?' + qs : ''}`);
  },

  createInvoice: (payload: any) =>
    request<{ message: string; invoice: ContractorInvoice }>('/api/contractors/invoices', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateInvoiceStatus: (invoiceId: string, status: string, paymentReference?: string) =>
    request<{ message: string; invoice: ContractorInvoice }>(`/api/contractors/invoices/${invoiceId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, payment_reference: paymentReference })
    }),

  exportBatchWire: (invoiceIds?: string[]) => {
    const q = new URLSearchParams();
    if (invoiceIds && invoiceIds.length > 0) {
      invoiceIds.forEach(id => q.append('invoice_ids', id));
    }
    const qs = q.toString();
    return request<{
      batch_reference: string;
      total_invoices: number;
      total_foreign_payouts: Record<string, number>;
      total_inr_commitment: number;
      settlements: Array<{
        invoice_number: string;
        beneficiary_name: string;
        country: string;
        currency: string;
        foreign_amount: number;
        inr_equivalent: number;
        bank_name: string;
        swift_bic: string;
        status: string;
      }>;
    }>(`/api/contractors/batch-wire${qs ? '?' + qs : ''}`);
  }
};

// ==========================================
// STATUTORY COMPLIANCE API
// ==========================================

export const complianceApi = {
  getCalendar: (filingType?: string, status?: string) => {
    const q = new URLSearchParams();
    if (filingType) q.append('filing_type', filingType);
    if (status) q.append('status', status);
    const qs = q.toString();
    return request<ComplianceCalendarResponse>(`/api/compliance/calendar${qs ? '?' + qs : ''}`);
  },

  createFiling: (payload: {
    filing_type: string;
    period_label: string;
    due_date: string;
    statutory_authority: string;
    amount_payable: number;
  }) =>
    request<ComplianceFiling>('/api/compliance/filings', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  markFilingFiled: (filingId: string, payload: {
    challan_reference: string;
    bsr_code?: string;
    cin_number?: string;
    filed_at?: string;
  }) =>
    request<{ message: string; filing: ComplianceFiling; status: string; penalty_assessed: number }>(
      `/api/compliance/filings/${filingId}/mark-filed`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    ),

  calculatePenalty: (payload: {
    filing_type: string;
    amount_payable: number;
    due_date: string;
    proposed_filing_date: string;
  }) =>
    request<{
      days_overdue: number;
      months_delay: number;
      penalty_amount: number;
      interest_amount: number;
      total_statutory_charge: number;
      statutory_sections: string;
      risk_severity: string;
    }>('/api/compliance/penalty-calculator', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getForm16: (employeeId: string, assessmentYear: string = '2027-28') =>
    request<Form16Data>(`/api/compliance/form16/${employeeId}?assessment_year=${encodeURIComponent(assessmentYear)}`),

  getForm24Q: (quarter: string = 'Q2') =>
    request<{
      header: any;
      annexure_i_challans: any[];
      annexure_ii_deductees: any[];
      summary: any;
    }>(`/api/compliance/form24q?quarter=${encodeURIComponent(quarter)}`)
};
