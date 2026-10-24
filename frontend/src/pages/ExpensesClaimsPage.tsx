import React, { useState, useEffect } from 'react';
import { api, formatINR } from '../services/api';
import { User, ExpenseClaim, SalaryAdvance, ExpensesSummary } from '../types';
import {
  Receipt, Wallet, Plus, Download, CheckCircle2, XCircle, AlertTriangle,
  Building, Calendar, Clock, DollarSign, Filter, RefreshCw, FileText,
  ShieldCheck, ShieldAlert, Sparkles, UserCheck, ArrowRight, Info, Check, X
} from 'lucide-react';
import { toast } from '../components/Toast';

interface ExpensesClaimsPageProps {
  currentUser: User | null;
  onNavigateTab?: (tab: string) => void;
}

export const ExpensesClaimsPage: React.FC<ExpensesClaimsPageProps> = ({
  currentUser
}) => {
  const isEmployee = currentUser?.role === 'employee';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'payroll_admin' || currentUser?.role === 'owner';

  const [activeTab, setActiveTab] = useState<'claims' | 'advances' | 'policy'>('claims');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ExpensesSummary | null>(null);
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isCmsExportModalOpen, setIsCmsExportModalOpen] = useState(false);
  const [cmsBatchData, setCmsBatchData] = useState<any>(null);

  // Submit Claim Form State
  const [claimTitle, setClaimTitle] = useState('');
  const [claimCategory, setClaimCategory] = useState<string>('travel');
  const [claimAmount, setClaimAmount] = useState<number>(3500);
  const [claimMerchant, setClaimMerchant] = useState('');
  const [claimGstin, setClaimGstin] = useState('');
  const [claimTaxTreatment, setClaimTaxTreatment] = useState<string>('tax_free_sec10');
  const [submitting, setSubmitting] = useState(false);

  // Advance Form State
  const [advAmount, setAdvAmount] = useState<number>(30000);
  const [advTenure, setAdvTenure] = useState<number>(3);
  const [advReason, setAdvReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, claimsRes, advRes] = await Promise.all([
        api.getExpensesSummary(),
        api.getClaims(isEmployee && currentUser?.id ? { employee_id: currentUser.id } : undefined),
        api.getAdvances(isEmployee ? currentUser?.id : undefined)
      ]);
      setSummary(sumRes);
      setClaims(claimsRes);
      setAdvances(advRes);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load FinOps data', 'Loading Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Policy Limit Pre-check
  const getPolicyWarning = () => {
    if (claimCategory === 'travel' && claimAmount > 5000) {
      return 'Policy Alert: Travel vouchers exceeding ₹5,000 require VP pre-approval.';
    }
    if (claimCategory === 'remote_work_internet' && claimAmount > 2000) {
      return 'Policy Alert: Maximum monthly broadband limit is ₹2,000.';
    }
    if (claimCategory === 'client_entertainment' && claimAmount > 4000) {
      return 'Policy Alert: Client dining cap is ₹4,000 per session.';
    }
    if (claimCategory === 'client_entertainment' && claimAmount > 2500 && !claimGstin) {
      return 'Statutory Warning: Vendor GSTIN required for tax exemption u/s 10 for entertainment > ₹2,500.';
    }
    if (claimCategory === 'learning_certifications' && claimAmount > 15000) {
      return 'Policy Alert: Technical certification reimbursement is capped at ₹15,000/year.';
    }
    return null;
  };

  const handleClaimStatusUpdate = async (claimId: string, status: string, reason?: string) => {
    try {
      await api.updateClaimStatus(claimId, status, reason);
      toast.success(`Claim ${status === 'approved' ? 'approved' : 'rejected'} successfully`, 'Status Updated');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update claim', 'Error');
    }
  };

  const handleAdvanceStatusUpdate = async (advanceId: string, status: string) => {
    try {
      await api.updateAdvanceStatus(advanceId, status);
      toast.success(`Salary advance request ${status} successfully`, 'Advance Updated');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update advance', 'Error');
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimTitle || !claimMerchant || claimAmount <= 0) {
      toast.error('Please complete all required fields', 'Validation Failed');
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.submitClaim({
        employee_id: currentUser?.id || 'emp_001',
        title: claimTitle,
        category: claimCategory,
        amount: claimAmount,
        currency: 'INR',
        merchant_name: claimMerchant,
        gstin: claimGstin || undefined,
        tax_treatment: claimTaxTreatment,
        receipt_name: `${claimCategory}_receipt.pdf`
      });

      if (res.policy_flag) {
        toast.warning('Claim submitted with policy flag. Dual review required.', 'Policy Warning');
      } else {
        toast.success('Expense claim submitted for FinOps reimbursement.', 'Claim Submitted');
      }

      setIsSubmitModalOpen(false);
      setClaimTitle('');
      setClaimMerchant('');
      setClaimGstin('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Submission failed', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advReason || advAmount <= 0) {
      toast.error('Please specify a valid reason and amount', 'Validation Failed');
      return;
    }
    try {
      setSubmitting(true);
      await api.requestAdvance({
        employee_id: currentUser?.id || 'emp_001',
        amount_requested: advAmount,
        reason: advReason,
        tenure_months: advTenure
      });
      toast.success('Salary advance requested successfully.', 'Advance Requested');
      setIsAdvanceModalOpen(false);
      setAdvReason('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit advance request', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportBankCms = async () => {
    try {
      const data = await api.exportBankCMS();
      setCmsBatchData(data);
      setIsCmsExportModalOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Export failed', 'Error');
    }
  };

  const filteredClaims = claims.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Receipt className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900">FinOps & Expense Claims</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              Automated Policy Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Section 10 tax-exempt employee reimbursements, automated policy compliance, and salary advances with payroll EMI recovery.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Submit Expense
          </button>

          <button
            onClick={() => setIsAdvanceModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
          >
            <Wallet className="w-4 h-4" />
            Request Advance
          </button>

          {isAdmin && (
            <button
              onClick={handleExportBankCms}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition"
            >
              <Download className="w-4 h-4" />
              Bank CMS NEFT
            </button>
          )}

          <button
            onClick={loadData}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Claims Processed</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatINR(summary?.total_claimed_amount || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-slate-700">{summary?.total_claims_count || 0}</span> claims in FY 2026-27
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Approved for Reimbursement</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {formatINR(summary?.approved_pending_reimbursement || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Ready for next active payroll cycle
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Salary Advances</span>
            <Wallet className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatINR(summary?.total_advance_outstanding || 0)}
          </div>
          <div className="text-xs text-amber-600 mt-1 flex items-center gap-1 font-medium">
            <span>{summary?.active_salary_advances_count || 0} active loans</span> undergoing EMI recovery
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Policy Audit Radar</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {summary?.policy_violations_count || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Flagged claims requiring VP sign-off
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl">
        <button
          onClick={() => setActiveTab('claims')}
          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'claims'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Expense Claims Ledger ({claims.length})
        </button>

        <button
          onClick={() => setActiveTab('advances')}
          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'advances'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Salary Advances & EMI Desk ({advances.length})
        </button>

        <button
          onClick={() => setActiveTab('policy')}
          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'policy'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          FinOps Statutory Rules & Limits
        </button>
      </div>

      {/* TAB 1: CLAIMS LEDGER */}
      {activeTab === 'claims' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter by:
              </span>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="reimbursed">Reimbursed</option>
              </select>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
              >
                <option value="all">All Categories</option>
                <option value="travel">Travel & Lodging</option>
                <option value="remote_work_internet">Remote Work Internet</option>
                <option value="client_entertainment">Client Entertainment</option>
                <option value="learning_certifications">Certifications & L&D</option>
                <option value="medical_wellness">Medical & Health</option>
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{filteredClaims.length}</span> claims
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Claim Title & Merchant</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Tax Treatment</th>
                  <th className="py-3 px-4">Policy Status</th>
                  <th className="py-3 px-4">Status</th>
                  {isAdmin && <th className="py-3 px-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No expense claims match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map(claim => (
                    <tr key={claim.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{claim.employee_name}</div>
                        <div className="text-xs text-slate-400">{claim.employee_id}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{claim.title}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{claim.merchant_name}</span>
                          {claim.gstin && (
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 font-mono">
                              GST: {claim.gstin}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs capitalize font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {claim.category.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900 tabular-nums">
                        {formatINR(claim.amount)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          claim.tax_treatment === 'tax_free_sec10'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {claim.tax_treatment === 'tax_free_sec10' ? 'Section 10 Exempt' : 'Taxable Perquisite'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {claim.policy_violation_flag ? (
                          <div className="flex items-center gap-1 text-rose-600 text-xs font-medium" title={claim.policy_violation_notes}>
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Limit Exceeded</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>Compliant</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                          claim.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          claim.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                          claim.status === 'reimbursed' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {claim.status}
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="py-3.5 px-4 text-center">
                          {claim.status === 'submitted' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleClaimStatusUpdate(claim.id, 'approved')}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                                title="Approve Claim"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleClaimStatusUpdate(claim.id, 'rejected', 'Exceeds budget limit')}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition"
                                title="Reject Claim"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SALARY ADVANCES */}
      {activeTab === 'advances' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Salary Advances & EMI Amortization</h3>
              <p className="text-xs text-slate-500">
                Advances are disbursed upfront and systematically recovered in equal monthly installments (EMI) across payroll runs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {advances.map(adv => (
              <div key={adv.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900">{adv.employee_name}</div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    adv.status === 'approved' || adv.status === 'active_deduction' ? 'bg-emerald-100 text-emerald-800' :
                    adv.status === 'fully_recovered' ? 'bg-blue-100 text-blue-800' :
                    adv.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {adv.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="text-xs text-slate-600 italic">"{adv.reason}"</div>

                <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Approved Principal:</span>
                    <span className="font-semibold text-slate-900">{formatINR(adv.amount_approved || adv.amount_requested)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Tenure / Monthly EMI:</span>
                    <span className="font-semibold text-indigo-700">{adv.tenure_months} mo @ {formatINR(adv.monthly_emi)}/mo</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Amount Recovered:</span>
                    <span className="font-semibold text-emerald-600">{formatINR(adv.amount_recovered)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-bold border-t border-slate-100 pt-1.5">
                    <span>Balance Remaining:</span>
                    <span className="text-rose-600">{formatINR((adv.amount_approved || adv.amount_requested) - adv.amount_recovered)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((adv.amount_recovered / Math.max(1, adv.amount_approved || adv.amount_requested)) * 100))}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0%</span>
                    <span>{Math.round((adv.amount_recovered / Math.max(1, adv.amount_approved || adv.amount_requested)) * 100)}% Recovered</span>
                    <span>100%</span>
                  </div>
                </div>

                {isAdmin && adv.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => handleAdvanceStatusUpdate(adv.id, 'approved')}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                    >
                      Approve Advance
                    </button>
                    <button
                      onClick={() => handleAdvanceStatusUpdate(adv.id, 'rejected')}
                      className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: POLICY LIMITS & STATUTORY CODE */}
      {activeTab === 'policy' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Statutory Tax Code & Company FinOps Policies</h3>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic threshold checks under Indian Income Tax Act 1961 Section 10 vs Section 17 perquisites.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                <h4 className="font-bold text-slate-900 text-sm">Travel & Lodging (Sec 10(14))</h4>
              </div>
              <p className="text-xs text-slate-600">
                Single domestic flight/hotel voucher capped at ₹5,000 without VP pre-clearance. Entire approved amount is 100% non-taxable in employee hands when supported by commercial boarding pass & invoice.
              </p>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                <h4 className="font-bold text-slate-900 text-sm">Remote Work Gigabit Internet</h4>
              </div>
              <p className="text-xs text-slate-600">
                Fixed monthly reimbursement capped at ₹2,000 for verified fiber broadband connections. Validated monthly receipt required. Fully exempt under Rule 3.
              </p>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                <h4 className="font-bold text-slate-900 text-sm">Client Dining & Entertainment</h4>
              </div>
              <p className="text-xs text-slate-600">
                Capped at ₹4,000 per dining session. Vendor GSTIN is mandatory for claims above ₹2,500. Unverified or policy-exceeded amounts are categorized under Section 17(2) taxable perquisites.
              </p>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                <h4 className="font-bold text-slate-900 text-sm">L&D Technical Certifications</h4>
              </div>
              <p className="text-xs text-slate-600">
                Annual limit ₹15,000 for recognized cloud and engineering certifications (AWS, GCP, CKA, PMP). Directly reimbursed against verified exam scorecards and tax invoice.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT CLAIM MODAL */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Submit New Expense Claim</h3>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Claim Title</label>
                <input
                  type="text"
                  required
                  value={claimTitle}
                  onChange={e => setClaimTitle(e.target.value)}
                  placeholder="e.g. Mumbai Client Discovery Flight & Hotel"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={claimCategory}
                    onChange={e => setClaimCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="travel">Travel & Lodging</option>
                    <option value="remote_work_internet">Remote Work Internet</option>
                    <option value="client_entertainment">Client Entertainment</option>
                    <option value="learning_certifications">L&D Certifications</option>
                    <option value="medical_wellness">Medical & Wellness</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={claimAmount}
                    onChange={e => setClaimAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Merchant / Vendor</label>
                  <input
                    type="text"
                    required
                    value={claimMerchant}
                    onChange={e => setClaimMerchant(e.target.value)}
                    placeholder="e.g. IndiGo / Airtel / Leela"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vendor GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={claimGstin}
                    onChange={e => setClaimGstin(e.target.value)}
                    placeholder="e.g. 29AABCM1234F1Z1"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Dynamic Policy Alert Box */}
              {getPolicyWarning() && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Live Policy Radar:</span> {getPolicyWarning()}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST ADVANCE MODAL */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Request Salary Advance</h3>
              <button onClick={() => setIsAdvanceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdvance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Advance Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={5000}
                  step={1000}
                  value={advAmount}
                  onChange={e => setAdvAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">EMI Repayment Tenure</label>
                <select
                  value={advTenure}
                  onChange={e => setAdvTenure(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>1 Month (Full deduction next cycle)</option>
                  <option value={2}>2 Months</option>
                  <option value={3}>3 Months</option>
                  <option value={4}>4 Months</option>
                  <option value={5}>5 Months</option>
                  <option value={6}>6 Months (Maximum standard tenure)</option>
                </select>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs space-y-1">
                <div className="flex justify-between text-indigo-900">
                  <span>Calculated Monthly Payroll EMI:</span>
                  <span className="font-bold text-indigo-700">{formatINR(Math.round(advAmount / advTenure))} / month</span>
                </div>
                <div className="text-[11px] text-indigo-600">
                  Deductions will be automatically scheduled in active payroll cycles.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason for Request</label>
                <textarea
                  required
                  rows={3}
                  value={advReason}
                  onChange={e => setAdvReason(e.target.value)}
                  placeholder="e.g. Medical emergency or domestic relocation expenses"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {submitting ? 'Submitting...' : 'Request Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BANK CMS NEFT EXPORT MODAL */}
      {isCmsExportModalOpen && cmsBatchData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Corporate Bank CMS Batch File</h3>
                <p className="text-xs text-slate-500">Ref: {cmsBatchData.batch_reference}</p>
              </div>
              <button onClick={() => setIsCmsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Total Disbursements:</span>
                <span className="font-bold text-slate-900 ml-1.5">{cmsBatchData.total_records} Beneficiaries</span>
              </div>
              <div>
                <span className="text-slate-500">Total Remittance:</span>
                <span className="font-bold text-emerald-600 ml-1.5">{formatINR(cmsBatchData.total_disbursement_inr)}</span>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Beneficiary</th>
                    <th className="p-2.5">Account No</th>
                    <th className="p-2.5">IFSC</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {cmsBatchData.records.map((r: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-sans font-medium text-slate-800">{r.beneficiary_name}</td>
                      <td className="p-2.5 text-slate-600">{r.account_number}</td>
                      <td className="p-2.5 text-slate-600">{r.ifsc_code}</td>
                      <td className="p-2.5 text-right font-sans font-semibold text-slate-900">{formatINR(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(cmsBatchData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${cmsBatchData.batch_reference}_NEFT.json`;
                  a.click();
                  toast.success('NEFT batch file exported for corporate bank portal upload', 'Export Complete');
                  setIsCmsExportModalOpen(false);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                Download Bank Batch File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
