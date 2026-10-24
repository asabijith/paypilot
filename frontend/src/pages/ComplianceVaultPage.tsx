import React, { useState, useEffect } from 'react';
import { api, formatINR } from '../services/api';
import { User, ComplianceFiling, ComplianceCalendarResponse, Form16Data, Employee } from '../types';
import {
  FileCheck2, Calendar, Clock, AlertTriangle, ShieldCheck, Printer,
  Download, RefreshCw, CheckCircle2, ChevronRight, ShieldAlert,
  Building, DollarSign, Calculator, Search, ExternalLink, Check, X
} from 'lucide-react';
import { toast } from '../components/Toast';

interface ComplianceVaultPageProps {
  currentUser: User | null;
  onNavigateTab?: (tab: string) => void;
}

export const ComplianceVaultPage: React.FC<ComplianceVaultPageProps> = ({
  currentUser
}) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'payroll_admin' || currentUser?.role === 'owner';

  const [activeTab, setActiveTab] = useState<'calendar' | 'form16' | 'form24q' | 'penalty_calc'>('calendar');
  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState<ComplianceCalendarResponse | null>(null);

  // Form 16 state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('emp_001');
  const [form16Data, setForm16Data] = useState<Form16Data | null>(null);
  const [loadingF16, setLoadingF16] = useState<boolean>(false);

  // Form 24Q state
  const [form24qData, setForm24qData] = useState<any>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q2');

  // Mark Filed Modal State
  const [selectedFilingForMark, setSelectedFilingForMark] = useState<ComplianceFiling | null>(null);
  const [challanRef, setChallanRef] = useState<string>('');
  const [bsrCode, setBsrCode] = useState<string>('0510304');
  const [cinNumber, setCinNumber] = useState<string>('05103042410202600123');

  // Penalty Calculator State
  const [calcFilingType, setCalcFilingType] = useState<string>('form_24q');
  const [calcAmount, setCalcAmount] = useState<number>(185000);
  const [calcDaysOverdue, setCalcDaysOverdue] = useState<number>(20);
  const [penaltyResult, setPenaltyResult] = useState<any>(null);

  const loadCalendar = async () => {
    try {
      setLoading(true);
      const res = await api.getCalendar();
      setCalendarData(res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load statutory calendar', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const loadForm16 = async (empId: string) => {
    try {
      setLoadingF16(true);
      const f16 = await api.getForm16(empId, '2027-28');
      setForm16Data(f16);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate Form 16', 'Error');
    } finally {
      setLoadingF16(false);
    }
  };

  const loadForm24q = async (q: string) => {
    try {
      const res = await api.getForm24Q(q);
      setForm24qData(res);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadInitialData = async () => {
    await loadCalendar();
    try {
      const empRes = await api.getEmployees();
      setEmployees(empRes.employees);
      if (empRes.employees.length > 0) {
        setSelectedEmpId(empRes.employees[0].id);
        loadForm16(empRes.employees[0].id);
      }
      loadForm24q(selectedQuarter);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [currentUser]);

  const handleMarkFiled = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFilingForMark) return;
    try {
      const res = await api.markFilingFiled(selectedFilingForMark.id, {
        challan_reference: challanRef || `CHALLAN-${Date.now().toString().slice(-6)}`,
        bsr_code: bsrCode,
        cin_number: cinNumber
      });
      toast.success(
        `Filing marked as filed. Status: ${res.status}${res.penalty_assessed > 0 ? ` (Penalty: ${formatINR(res.penalty_assessed)})` : ''}`,
        'Filing Recorded'
      );
      setSelectedFilingForMark(null);
      loadCalendar();
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark filed', 'Error');
    }
  };

  const runPenaltyCalculator = async () => {
    try {
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - calcDaysOverdue);

      const res = await api.calculatePenalty({
        filing_type: calcFilingType,
        amount_payable: calcAmount,
        due_date: pastDate.toISOString().split('T')[0],
        proposed_filing_date: today.toISOString().split('T')[0]
      });
      setPenaltyResult(res);
    } catch (err: any) {
      toast.error(err.message || 'Calculator error', 'Error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <FileCheck2 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Statutory Returns & Compliance Vault</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              EPFO • ESIC • TRACES • PT
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Automated statutory deadlines calendar, Section 234E late fee simulator, instant Form 16 Part A & B generation, and Form 24Q e-TDS summary.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-500">Compliance Health: </span>
            <span className="font-bold text-emerald-700">
              {calendarData?.metrics.compliance_score_pct || 98.4}%
            </span>
          </div>

          <button
            onClick={loadCalendar}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'calendar'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Statutory Deadlines Calendar ({calendarData?.filings.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('form16')}
          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'form16'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Form 16 Certificate Vault
        </button>

        <button
          onClick={() => setActiveTab('form24q')}
          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'form24q'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          Quarterly Form 24Q e-TDS
        </button>

        <button
          onClick={() => {
            setActiveTab('penalty_calc');
            runPenaltyCalculator();
          }}
          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'penalty_calc'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Section 234E / 7Q Penalty Radar
        </button>
      </div>

      {/* TAB 1: CALENDAR & FILINGS */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          {/* Statutory Filings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {calendarData?.filings.map(f => {
              const isOverdue = f.status === 'overdue';
              const isFiled = f.status === 'filed_on_time' || f.status === 'delayed_filed';

              return (
                <div
                  key={f.id}
                  className={`p-5 rounded-xl border transition space-y-3 ${
                    isOverdue
                      ? 'border-rose-300 bg-rose-50/20 shadow-xs'
                      : isFiled
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {f.statutory_authority}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isFiled ? 'bg-emerald-100 text-emerald-800' :
                      isOverdue ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {f.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-base uppercase font-mono">
                      {f.filing_type.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-xs text-slate-500">Period: {f.period_label}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Statutory Due Date:</span>
                      <span className="font-semibold text-slate-900 font-mono">{f.due_date}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Amount Remitted:</span>
                      <span className="font-bold text-slate-900">{formatINR(f.amount_payable)}</span>
                    </div>

                    {!isFiled && (
                      <div className="flex justify-between pt-1 border-t border-slate-200/60 font-semibold">
                        <span>Countdown:</span>
                        <span className={f.days_remaining < 0 ? 'text-rose-600' : 'text-indigo-600'}>
                          {f.days_remaining < 0
                            ? `Overdue by ${Math.abs(f.days_remaining)} days`
                            : `Due in ${f.days_remaining} days`}
                        </span>
                      </div>
                    )}

                    {isFiled && f.challan_reference && (
                      <div className="flex justify-between pt-1 border-t border-slate-200/60 text-emerald-700 font-mono text-[11px]">
                        <span>Challan Ref:</span>
                        <span className="truncate max-w-[150px]">{f.challan_reference}</span>
                      </div>
                    )}
                  </div>

                  {/* Overdue Penalty Notice */}
                  {isOverdue && f.penalty_info.total_statutory_charge > 0 && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        Accrued Penalty: {formatINR(f.penalty_info.total_statutory_charge)}
                      </div>
                      <div className="text-[10px] text-rose-700">
                        {f.penalty_info.statutory_sections}
                      </div>
                    </div>
                  )}

                  {isAdmin && !isFiled && (
                    <button
                      onClick={() => {
                        setSelectedFilingForMark(f);
                        setChallanRef(`ITNS281/${Date.now().toString().slice(-6)}`);
                      }}
                      className="w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Record Challan / Mark Filed
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FORM 16 CERTIFICATE */}
      {activeTab === 'form16' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          {/* Employee Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase">Select Employee:</span>
              <select
                value={selectedEmpId}
                onChange={e => {
                  setSelectedEmpId(e.target.value);
                  loadForm16(e.target.value);
                }}
                className="text-sm font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-900"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || `${emp.first_name} ${emp.last_name}`} ({emp.emp_code}) - {emp.designation}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              Print Official Certificate
            </button>
          </div>

          {/* Form 16 Printable Sheet */}
          {form16Data && (
            <div className="p-8 border-2 border-slate-300 rounded-xl bg-white shadow-sm space-y-6 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
              {/* Header Box */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h2 className="text-lg font-black uppercase tracking-wider text-slate-900">
                  FORM NO. 16
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  [See rule 31(1)(a)]
                </p>
                <p className="text-xs font-bold text-slate-800">
                  Certificate under section 203 of the Income-tax Act, 1961 for tax deducted at source on salary
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Certificate No: {form16Data.certificate_id} • AY: {form16Data.assessment_year} • FY: {form16Data.financial_year}
                </p>
              </div>

              {/* Employer / Employee Details Grid */}
              <div className="grid grid-cols-2 gap-4 border border-slate-200 p-4 rounded-lg bg-slate-50/50 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 uppercase tracking-wider">Employer Details</h4>
                  <div className="font-semibold text-slate-800">{form16Data.employer.name}</div>
                  <div className="text-slate-600">{form16Data.employer.address}</div>
                  <div className="mt-2 font-mono text-[11px] text-slate-700">
                    <span>PAN: <strong>{form16Data.employer.pan}</strong></span> • <span>TAN: <strong>{form16Data.employer.tan}</strong></span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-1 uppercase tracking-wider">Employee Details</h4>
                  <div className="font-semibold text-slate-800">{form16Data.employee.name} ({form16Data.employee.employee_code})</div>
                  <div className="text-slate-600">{form16Data.employee.designation} • {form16Data.employee.department}</div>
                  <div className="mt-2 font-mono text-[11px] text-slate-700">
                    <span>PAN: <strong>{form16Data.employee.pan}</strong></span>
                  </div>
                  <div className="text-emerald-700 font-semibold mt-1">
                    Regime: {form16Data.employee.tax_regime.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* PART A: Quarterly TDS Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-1">
                  PART A: Summary of Tax Deducted and Deposited with Central Government
                </h4>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Quarter</th>
                        <th className="p-2.5">Receipt #</th>
                        <th className="p-2.5 text-right">Gross Paid</th>
                        <th className="p-2.5 text-right">TDS Deducted</th>
                        <th className="p-2.5 text-right">TDS Deposited</th>
                        <th className="p-2.5">BSR / Challan CIN</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {form16Data.part_a.summary_of_tax_deducted_at_source.map((q, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-sans font-medium text-slate-900">{q.quarter}</td>
                          <td className="p-2.5 text-slate-600">{q.receipt_number}</td>
                          <td className="p-2.5 text-right font-sans text-slate-700">{formatINR(q.amount_paid_credited)}</td>
                          <td className="p-2.5 text-right font-sans text-slate-700">{formatINR(q.tax_deducted)}</td>
                          <td className="p-2.5 text-right font-sans font-bold text-emerald-700">{formatINR(q.tax_deposited)}</td>
                          <td className="p-2.5 text-[10px] text-slate-500">{q.challan_cin}</td>
                          <td className="p-2.5 font-sans text-emerald-600 font-semibold">{q.status}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-sans font-bold text-xs border-t border-slate-200">
                        <td colSpan={3} className="p-2.5 text-slate-900">Total Tax Deposited</td>
                        <td className="p-2.5 text-right text-slate-900">{formatINR(form16Data.part_a.total_tds_deducted)}</td>
                        <td className="p-2.5 text-right text-emerald-700">{formatINR(form16Data.part_a.total_tds_deposited)}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PART B: Computation of Taxable Salary */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-1">
                  PART B: Details of Salary Paid and Computation of Taxable Income
                </h4>

                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/30 text-xs space-y-2 font-mono">
                  <div className="flex justify-between text-slate-700 font-sans">
                    <span>1. Gross Salary under section 17(1):</span>
                    <span className="font-bold">{formatINR(form16Data.part_b.gross_salary_sec17_1)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-sans">
                    <span>2. Allowances exempt under section 10:</span>
                    <span>-{formatINR(form16Data.part_b.allowances_exempt_sec10)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-sans">
                    <span>3. Standard Deduction under section 16(ia):</span>
                    <span>-{formatINR(form16Data.part_b.standard_deduction_sec16_ia)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-sans">
                    <span>4. Professional Tax under section 16(iii):</span>
                    <span>-{formatINR(form16Data.part_b.tax_on_employment_sec16_iii)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-sans">
                    <span>5. Chapter VI-A Total Deductions (80C, 80D, NPS):</span>
                    <span>-{formatINR(form16Data.part_b.chapter_via_deductions.total_chapter_via)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold font-sans text-sm pt-2 border-t border-slate-200">
                    <span>6. Total Taxable Income:</span>
                    <span>{formatINR(form16Data.part_b.total_taxable_income)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold font-sans text-sm">
                    <span>7. Total Tax & Cess Payable:</span>
                    <span>{formatINR(form16Data.part_b.total_tax_payable)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FORM 24Q e-TDS */}
      {activeTab === 'form24q' && form24qData && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">Quarterly e-TDS Return Form 24Q (Salary)</h3>
              <p className="text-xs text-slate-500 font-mono">
                TAN: {form24qData.header.tan} • FVU Status: {form24qData.summary.fvu_validation_status}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Quarter:</span>
              <select
                value={selectedQuarter}
                onChange={e => {
                  setSelectedQuarter(e.target.value);
                  loadForm24q(e.target.value);
                }}
                className="text-xs font-semibold border border-slate-200 rounded px-2 py-1 bg-slate-50 text-slate-900"
              >
                <option value="Q1">Q1 (Apr - Jun)</option>
                <option value="Q2">Q2 (Jul - Sep)</option>
                <option value="Q3">Q3 (Oct - Dec)</option>
                <option value="Q4">Q4 (Jan - Mar)</option>
              </select>
            </div>
          </div>

          {/* Annexure I Challans */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Annexure I: Challan Details of Tax Deposited (ITNS 281)
            </h4>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Challan No</th>
                    <th className="p-2.5">BSR Code</th>
                    <th className="p-2.5">Deposit Date</th>
                    <th className="p-2.5 text-right">Tax Amount</th>
                    <th className="p-2.5 text-right">Cess (4%)</th>
                    <th className="p-2.5 text-right">Total Remitted</th>
                    <th className="p-2.5">OLTAS Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {form24qData.annexure_i_challans.map((ch: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2.5 text-slate-900 font-bold">{ch.challan_no}</td>
                      <td className="p-2.5 text-slate-600">{ch.bsr_code}</td>
                      <td className="p-2.5 text-slate-600">{ch.tender_date}</td>
                      <td className="p-2.5 text-right font-sans text-slate-700">{formatINR(ch.tax_amount)}</td>
                      <td className="p-2.5 text-right font-sans text-slate-700">{formatINR(ch.cess)}</td>
                      <td className="p-2.5 text-right font-sans font-bold text-emerald-700">{formatINR(ch.total_challan_amount)}</td>
                      <td className="p-2.5 font-sans font-semibold text-emerald-600">{ch.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Annexure II Deductees */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Annexure II: Deductee Wise Breakdown (Employees)
            </h4>

            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-80 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-2.5">Employee</th>
                    <th className="p-2.5">PAN</th>
                    <th className="p-2.5">Section</th>
                    <th className="p-2.5 text-right">Quarter Gross</th>
                    <th className="p-2.5 text-right">TDS Deducted</th>
                    <th className="p-2.5 text-right">Total Deposited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {form24qData.annexure_ii_deductees.map((d: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-sans font-medium text-slate-900">{d.name}</td>
                      <td className="p-2.5 text-slate-600">{d.pan}</td>
                      <td className="p-2.5 text-slate-600">{d.section_code}</td>
                      <td className="p-2.5 text-right font-sans text-slate-700">{formatINR(d.amount_paid)}</td>
                      <td className="p-2.5 text-right font-sans font-semibold text-slate-900">{formatINR(d.tds_deducted)}</td>
                      <td className="p-2.5 text-right font-sans font-bold text-emerald-700">{formatINR(d.total_tds_deposited)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PENALTY CALCULATOR */}
      {activeTab === 'penalty_calc' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Interactive Statutory Penalty Calculator</h3>
            <p className="text-xs text-slate-500 mt-1">
              Test real-world financial liability under Income Tax Section 234E / Section 201(1A), and EPFO Section 7Q / Section 14B.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 p-5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-900 text-sm">Filing Parameters</h4>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Filing Type</label>
                <select
                  value={calcFilingType}
                  onChange={e => setCalcFilingType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="form_24q">Form 24Q e-TDS Return (Sec 234E late fee ₹200/day)</option>
                  <option value="tds_challan_281">TDS Challan 281 Deposit (Sec 201(1A) 1.5%/month)</option>
                  <option value="epf_ecr">EPFO ECR Monthly Remittance (Sec 7Q 12% p.a. + Sec 14B)</option>
                  <option value="esic_challan">ESIC Monthly Contribution (Reg 31-A 12% p.a.)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Statutory Amount Payable (₹)</label>
                <input
                  type="number"
                  value={calcAmount}
                  step={5000}
                  onChange={e => setCalcAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Days Overdue</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={calcDaysOverdue}
                  onChange={e => setCalcDaysOverdue(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-bold"
                />
              </div>

              <button
                onClick={runPenaltyCalculator}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
              >
                Compute Real Penalty
              </button>
            </div>

            {/* Results Display */}
            {penaltyResult && (
              <div className="p-6 bg-slate-900 text-white rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">Assessment Breakdown</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    penaltyResult.risk_severity === 'critical' ? 'bg-rose-900 text-rose-200' :
                    penaltyResult.risk_severity === 'high' ? 'bg-amber-900 text-amber-200' :
                    'bg-blue-900 text-blue-200'
                  }`}>
                    Risk: {penaltyResult.risk_severity}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Days Overdue:</span>
                    <span className="font-mono text-white">{penaltyResult.days_overdue} days</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Late Filing Fee:</span>
                    <span className="font-mono text-white">{formatINR(penaltyResult.penalty_amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Statutory Interest:</span>
                    <span className="font-mono text-white">{formatINR(penaltyResult.interest_amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 font-bold text-sm pt-2 border-t border-slate-800">
                    <span>Total Remittance Penalty:</span>
                    <span className="text-rose-400 font-mono">{formatINR(penaltyResult.total_statutory_charge)}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-800 rounded-lg text-xs text-slate-300">
                  <span className="font-bold text-white block mb-0.5">Applicable Legal Provisions:</span>
                  {penaltyResult.statutory_sections}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECORD CHALLAN MODAL */}
      {selectedFilingForMark && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Record Challan Remittance</h3>
                <p className="text-xs text-slate-500 uppercase">{selectedFilingForMark.filing_type.replace(/_/g, ' ')}</p>
              </div>
              <button onClick={() => setSelectedFilingForMark(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMarkFiled} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Challan Reference / CRN</label>
                <input
                  type="text"
                  required
                  value={challanRef}
                  onChange={e => setChallanRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">7-Digit BSR Code</label>
                <input
                  type="text"
                  maxLength={7}
                  value={bsrCode}
                  onChange={e => setBsrCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Challan Identification Number (CIN)</label>
                <input
                  type="text"
                  value={cinNumber}
                  onChange={e => setCinNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedFilingForMark(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Commit Filing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
