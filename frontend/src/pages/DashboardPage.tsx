import React, { useEffect, useState, useId } from 'react';
import { api, formatINR } from '../services/api';
import { User, AuditFinding } from '../types';
import {
  Users, CalendarCheck, Clock, ShieldAlert,
  AlertCircle, CheckCircle2,
  Calendar, CreditCard, ChevronRight,
  Filter, RefreshCw, AlertTriangle, Info, Check, ShieldCheck,
  ExternalLink, HelpCircle, X, ChevronDown, ChevronUp, UserCheck,
  Sparkles, TrendingUp, Sliders, ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

interface DashboardPageProps {
  currentUser: User | null;
  onNavigateTab: (tab: string) => void;
  onTriggerAudit: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentUser,
  onNavigateTab,
  onTriggerAudit,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Period filter
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('period_oct_2026');

  // Chart filters
  const [trendMetric, setTrendMetric] = useState<'payroll_cost' | 'gross_earnings' | 'net_disbursed'>('payroll_cost');
  const [trendRange, setTrendRange] = useState<number>(6);

  // HR Action Center tab
  const [actionTab, setActionTab] = useState<'approvals' | 'deadlines' | 'incomplete' | 'failed'>('approvals');

  // Discrepancy alert section collapsible
  const [discrepancyExpanded, setDiscrepancyExpanded] = useState(true);

  // Resolution modal state
  const [resolvingFinding, setResolvingFinding] = useState<AuditFinding | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<string>('Resolved');
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);

  // Inline leave review state
  const [processingLeaveId, setProcessingLeaveId] = useState<string | null>(null);

  // Feedback notifications
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Recent activity filter
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<string>('ALL');

  // Active tooltip hover state
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const isEmployee = currentUser?.role === 'employee';
  const canManagePayroll = currentUser?.role === 'admin' || currentUser?.role === 'payroll_admin' || currentUser?.role === 'owner';

  const periodSelectId = useId();

  useEffect(() => {
    fetchDashboardData(selectedPeriodId);
  }, [currentUser, selectedPeriodId]);

  const fetchDashboardData = async (periodId?: string) => {
    try {
      setError(null);
      if (!stats) setLoading(true);
      else setRefreshing(true);

      const [sData, cData, aData] = await Promise.all([
        api.getDashboardStats(periodId),
        api.getDashboardCharts(periodId),
        api.getRecentActivity(10),
      ]);
      setStats(sData);
      setCharts(cData);
      setActivities(aData.activities || []);
      if (sData.period_id && sData.period_id !== selectedPeriodId) {
        setSelectedPeriodId(sData.period_id);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data', err);
      setError(err?.message || 'Failed to load live dashboard metrics from backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchDashboardData(selectedPeriodId);
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value;
    setSelectedPeriodId(newPeriod);
  };

  const handleResolveFindingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingFinding) return;

    if (!canManagePayroll) {
      setFeedbackMessage({ type: 'error', text: 'Permission denied: Only HR or Payroll Administrators can resolve audit findings.' });
      return;
    }

    if (!resolutionNote.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Please provide an audit justification note.' });
      return;
    }

    try {
      setIsSubmittingResolution(true);
      await api.resolveAuditFinding(resolvingFinding.id, resolutionStatus, resolutionNote.trim());
      setFeedbackMessage({
        type: 'success',
        text: `Audit finding for ${resolvingFinding.employee_name} successfully marked as ${resolutionStatus}.`
      });
      setResolvingFinding(null);
      setResolutionNote('');
      // Refresh live stats
      await fetchDashboardData(selectedPeriodId);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Failed to resolve audit finding.' });
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  const handleInlineLeaveReview = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!canManagePayroll) {
      setFeedbackMessage({ type: 'error', text: 'Permission denied: Only Administrators can review leave requests.' });
      return;
    }

    try {
      setProcessingLeaveId(requestId);
      await api.reviewLeave(requestId, status, `Reviewed and ${status} via HR Action Center`);
      setFeedbackMessage({
        type: 'success',
        text: `Leave request ${status === 'approved' ? 'approved' : 'rejected'} successfully.`
      });
      await fetchDashboardData(selectedPeriodId);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || `Failed to ${status} leave request.` });
    } finally {
      setProcessingLeaveId(null);
    }
  };

  // SKELETON LOADING STATE
  if (loading && !stats) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-56 bg-slate-200 rounded" />
            <div className="h-3.5 w-80 bg-slate-100 rounded" />
          </div>
          <div className="h-9 w-48 bg-slate-200 rounded-md" />
        </div>

        {/* KPI Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-7 w-20 bg-slate-300 rounded" />
              <div className="h-3 w-32 bg-slate-100 rounded" />
            </div>
          ))}
        </div>

        {/* Main Chart Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-72 bg-white border border-slate-200 rounded-lg p-5" />
          <div className="h-72 bg-white border border-slate-200 rounded-lg p-5" />
        </div>
      </div>
    );
  }

  // ERROR STATE WITH RETRY ACTION
  if (error && !stats) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-white border border-red-200 rounded-lg shadow-xs text-center space-y-4">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Unable to Load HCM Dashboard</h2>
        <p className="text-xs text-slate-600">{error}</p>
        <button
          onClick={handleManualRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
        </button>
      </div>
    );
  }

  // EMPLOYEE PERSONAL DASHBOARD VIEW
  if (isEmployee) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Simple Welcome Bar */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Welcome back, {currentUser?.full_name}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Employee Self-Service
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              BharatTech Solutions &bull; {currentUser?.department || 'Engineering'} &bull; {currentUser?.designation}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('assistant')}
              className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Ask AI Assistant
            </button>
            <button
              onClick={() => onNavigateTab('reports')}
              className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              View Latest Payslip
            </button>
          </div>
        </div>

        {/* Compact Employee KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Estimated Net Pay (Oct 2026)</span>
              <CreditCard className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">₹1,18,650.00</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Disbursement: Oct 31, 2026 &bull; Direct NACH</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Available Leave Quota</span>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">22.0 Days</p>
            <p className="text-[11px] text-slate-400 mt-0.5">10 Casual &bull; 9 Sick &bull; 3 Earned</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Monthly Attendance</span>
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">100%</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">18 Present &bull; 0 Absent &bull; 0 LOP</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Tax Regime Active</span>
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">New Regime</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Standard Deduction ₹75k Applied</p>
          </div>
        </div>

        {/* Quick Links Card */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigateTab('leave')}
              className="cursor-pointer p-3.5 rounded-md border border-slate-200 hover:bg-slate-50 text-left transition-colors"
            >
              <p className="text-xs font-semibold text-slate-900 flex items-center justify-between">
                Apply for Time Off <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Request casual, sick, or earned leave with instant quota preview</p>
            </button>
            <button
              onClick={() => onNavigateTab('reports')}
              className="cursor-pointer p-3.5 rounded-md border border-slate-200 hover:bg-slate-50 text-left transition-colors"
            >
              <p className="text-xs font-semibold text-slate-900 flex items-center justify-between">
                Download Tax Slip <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Verified Indian Form 16 & monthly payslip with statutory breakdown</p>
            </button>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="cursor-pointer p-3.5 rounded-md border border-slate-200 hover:bg-slate-50 text-left transition-colors"
            >
              <p className="text-xs font-semibold text-slate-900 flex items-center justify-between">
                Punch Attendance <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Log daily in/out timestamp via verified office geofence</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD ENTERPRISE HCM DASHBOARD (HR/Admin & Payroll Admin)
  const openFindingsList: AuditFinding[] = stats?.discrepancies_summary?.top_findings || [];
  const actionCenterData = stats?.action_center || {
    pending_approvals: [],
    deadlines: [],
    incomplete_records: [],
    failed_operations: []
  };

  const filteredActivities = (activities || []).filter(act => {
    if (activityCategoryFilter === 'ALL') return true;
    if (activityCategoryFilter === 'PAYROLL_AUDIT') return act.category === 'PAYROLL' || act.category === 'AUDIT';
    if (activityCategoryFilter === 'LEAVE') return act.category === 'LEAVE';
    if (activityCategoryFilter === 'SYSTEM') return act.category === 'SYSTEM' || act.category === 'SECURITY' || act.category === 'EMPLOYEE';
    return true;
  });

  const todayDate = new Date();
  const daysInMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();
  const daysRemainingInMonth = Math.max(0, daysInMonth - todayDate.getDate());
  const formattedToday = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(todayDate);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Feedback Banner */}
      {feedbackMessage && (
        <div
          role="alert"
          className={`p-3.5 rounded-lg border flex items-center justify-between text-xs transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
              : 'bg-red-50/80 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Clean Enterprise Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
              Payroll & HR Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              FY 2026-27 Active
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
            <span>{formattedToday}</span>
            <span>&bull;</span>
            <span>Cycle: <strong className="text-slate-800">{stats?.current_payroll_period || 'October 2026'}</strong> ({stats?.current_payroll_status || 'Draft'})</span>
            <span>&bull;</span>
            <span>Payday in <strong className="text-indigo-600 font-semibold">{daysRemainingInMonth} days</strong> ({stats?.upcoming_payroll_date || 'Oct 31, 2026'})</span>
          </p>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-white border border-black/[0.06] rounded-full px-3.5 py-1.5 text-xs shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <label htmlFor={periodSelectId} className="sr-only">Select Payroll Period</label>
            <select
              id={periodSelectId}
              value={selectedPeriodId}
              onChange={handlePeriodChange}
              className="bg-transparent text-xs font-medium text-slate-800 outline-none cursor-pointer pr-1"
            >
              {(stats?.available_periods || [
                { id: 'period_oct_2026', name: 'October 2026' },
                { id: 'period_sep_2026', name: 'September 2026' }
              ]).map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Action */}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="cursor-pointer p-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
            title="Refresh live metrics"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Module Action Navigation */}
          <button
            onClick={() => onNavigateTab('auditor')}
            className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Audit Run
          </button>
          <button
            onClick={() => onNavigateTab('payroll')}
            className="cursor-pointer px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-2xs"
          >
            Process Payroll &rarr;
          </button>
        </div>
      </div>

      {/* PAYROLL-READINESS STATUS COMMAND CENTER & INTELLIGENCE SPOTLIGHT */}
      {(() => {
        const discrepanciesCount = stats?.discrepancies_count || 0;
        const pendingApprovalsCount = actionCenterData.pending_approvals?.length || 0;
        const incompleteCount = actionCenterData.incomplete_records?.length || 0;
        const totalBlockers = discrepanciesCount + (incompleteCount > 0 ? 1 : 0) + (pendingApprovalsCount > 0 ? 1 : 0);
        const isReady = totalBlockers === 0;
        const readinessScore = isReady ? 100 : Math.max(48, Math.round(100 - (discrepanciesCount * 14) - (incompleteCount * 10) - (pendingApprovalsCount * 8)));

        return (
          <section aria-label="Payroll Readiness Command Center" className="space-y-3">
            <div className={`rounded-3xl border p-6 transition-all shadow-[0_12px_40px_rgba(0,0,0,0.12)] ${
              isReady
                ? 'bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white border-emerald-800'
                : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-slate-800'
            }`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left: Status Meter & Blockers */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                      isReady
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                      <span>{isReady ? 'PRE-FLIGHT CLEARED · 100% READY' : 'PRE-FLIGHT STATUS: ACTION REQUIRED'}</span>
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Cycle: {stats?.current_payroll_period || 'October 2026'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                      <span>Payroll Readiness:</span>
                      <span className={isReady ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
                        {readinessScore}%
                      </span>
                    </h2>
                    <span className="text-xs text-slate-300">
                      {isReady
                        ? 'All statutory checks, biometric attendance, and banking records verified.'
                        : `${totalBlockers} outstanding blocker${totalBlockers > 1 ? 's' : ''} withhold direct disbursement.`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/60">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isReady ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-indigo-500'
                      }`}
                      style={{ width: `${readinessScore}%` }}
                    />
                  </div>

                  {/* Blockers Pills */}
                  {!isReady && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      {discrepanciesCount > 0 && (
                        <button
                          onClick={() => onNavigateTab('auditor')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/20 text-red-200 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                          <span><strong>{discrepanciesCount}</strong> Compliance Gate Violations</span>
                        </button>
                      )}

                      {incompleteCount > 0 && (
                        <button
                          onClick={() => onNavigateTab('employees')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-200 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span><strong>{incompleteCount}</strong> Missing Bank KYC</span>
                        </button>
                      )}

                      {pendingApprovalsCount > 0 && (
                        <button
                          onClick={() => setActionTab('approvals')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span><strong>{pendingApprovalsCount}</strong> Pending Leave Request</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Next Recommended Action */}
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 lg:max-w-md w-full shrink-0 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                      NEXT RECOMMENDED ACTION
                    </span>
                    <p className="text-xs text-white font-medium leading-relaxed">
                      {isReady
                        ? 'Pre-flight verified with zero calculation anomalies. Finalize maker-checker signoff and release October 2026 salary disbursement.'
                        : discrepanciesCount > 0
                        ? 'Remediate negative net payout (-₹7,000) for Rahul Sharma under Payment of Wages Act Section 7 to clear statutory block.'
                        : incompleteCount > 0
                        ? 'Request verified bank account and IFSC details for Ananya Desai to prevent direct credit bounce.'
                        : 'Review pending leave requests to ensure accurate Loss of Pay (LOP) deduction.'}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-slate-300 font-mono">
                      Target: {stats?.upcoming_payroll_date || 'October 31, 2026'}
                    </span>
                    <button
                      onClick={() => {
                        if (isReady) onNavigateTab('payroll');
                        else if (discrepanciesCount > 0) onNavigateTab('auditor');
                        else if (incompleteCount > 0) onNavigateTab('employees');
                        else setActionTab('approvals');
                      }}
                      className="cursor-pointer inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow-sm"
                    >
                      <span>{isReady ? 'Process Payout' : 'Resolve Blocker'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Intelligence Engine Banner */}
            <div className="bg-white rounded-xl border border-indigo-100 shadow-2xs p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-white via-indigo-50/20 to-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">PayPilot Intelligence Engine</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">PRO FEATURE</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Next Cycle (Nov 2026): Projected <strong className="text-slate-800">₹6,15,850.97</strong> (±4.2% expected variance) &bull; Run what-if salary hike & new hire simulations.
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('intelligence')}
                className="cursor-pointer shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
              >
                <span>Launch Digital Twin & Simulator</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        );
      })()}

      {/* 1. REFINED ENTERPRISE KPI CARDS (Clear metric labels, contextual comparisons, tooltips, and functional navigation) */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Active Headcount */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('employees')}
          onKeyDown={(e) => e.key === 'Enter' && onNavigateTab('employees')}
          className="cursor-pointer apple-card p-4 border border-black/[0.06] hover:border-black/[0.12] hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)] transition-all duration-300 text-left group relative focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
          aria-label="View Employee Master"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Active Headcount</span>
            <div
              className="relative cursor-help"
              onMouseEnter={() => setActiveTooltip('kpi_emp')}
              onMouseLeave={() => setActiveTooltip(null)}
              onClick={(e) => e.stopPropagation()}
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
              {activeTooltip === 'kpi_emp' && (
                <div className="absolute right-0 top-5 z-20 w-52 p-2 bg-slate-900 text-white text-[10px] rounded shadow-lg pointer-events-none">
                  Total full-time and contracted employees currently active on company roster.
                </div>
              )}
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
            {stats?.total_employees ?? 6}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
            <span>{stats?.employee_change_text || '100% Active Roster'}</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* KPI 2: Workforce Present Today */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('attendance')}
          onKeyDown={(e) => e.key === 'Enter' && onNavigateTab('attendance')}
          className="cursor-pointer apple-card p-4 border border-black/[0.06] hover:border-black/[0.12] hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)] transition-all duration-300 text-left group relative focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
          aria-label="View Daily Attendance Terminal"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Present Today</span>
            <div
              className="relative cursor-help"
              onMouseEnter={() => setActiveTooltip('kpi_att')}
              onMouseLeave={() => setActiveTooltip(null)}
              onClick={(e) => e.stopPropagation()}
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
              {activeTooltip === 'kpi_att' && (
                <div className="absolute right-0 top-5 z-20 w-52 p-2 bg-slate-900 text-white text-[10px] rounded shadow-lg pointer-events-none">
                  Derived from biometric access & web clock-in logs for {stats?.attendance_date_str || 'today'}.
                </div>
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {stats?.present_today ?? 5}
            </p>
            <span className="text-xs font-semibold text-emerald-600">
              ({stats?.attendance_pct ?? 83.3}%)
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
            <span>{stats?.absent_today ? `${stats.absent_today} absent` : 'Full attendance'}</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* KPI 3: Pending Approvals */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('leave')}
          onKeyDown={(e) => e.key === 'Enter' && onNavigateTab('leave')}
          className="cursor-pointer apple-card p-4 border border-black/[0.06] hover:border-black/[0.12] hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)] transition-all duration-300 text-left group relative focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
          aria-label="View Pending Leave Approvals"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Pending Approvals</span>
            <div
              className="relative cursor-help"
              onMouseEnter={() => setActiveTooltip('kpi_leave')}
              onMouseLeave={() => setActiveTooltip(null)}
              onClick={(e) => e.stopPropagation()}
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
              {activeTooltip === 'kpi_leave' && (
                <div className="absolute right-0 top-5 z-20 w-52 p-2 bg-slate-900 text-white text-[10px] rounded shadow-lg pointer-events-none">
                  Unreviewed leave requests and attendance adjustments awaiting supervisory action.
                </div>
              )}
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
            {stats?.pending_leaves ?? 1}
          </p>
          <div className="flex items-center justify-between text-[10px] text-indigo-600 font-medium mt-1">
            <span>{stats?.pending_leaves > 0 ? 'Requires HR action' : 'All clear'}</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* KPI 4: Current Payroll Amount (Total Employer Cost) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('payroll')}
          onKeyDown={(e) => e.key === 'Enter' && onNavigateTab('payroll')}
          className="cursor-pointer apple-card p-4 border border-black/[0.06] hover:border-black/[0.12] hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)] transition-all duration-300 text-left group relative focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
          aria-label="View Payroll Run"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Payroll CTC</span>
            <div
              className="relative cursor-help"
              onMouseEnter={() => setActiveTooltip('kpi_pay')}
              onMouseLeave={() => setActiveTooltip(null)}
              onClick={(e) => e.stopPropagation()}
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
              {activeTooltip === 'kpi_pay' && (
                <div className="absolute right-0 top-5 z-20 w-56 p-2 bg-slate-900 text-white text-[10px] rounded shadow-lg pointer-events-none">
                  Total monthly employer cost including Gross salaries, employer EPF (12%), and statutory levies.
                </div>
              )}
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
            {formatINR(stats?.current_payroll_amount || 590800)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
            <span>+{stats?.mom_variance_pct || 5.5}% vs last cycle</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* KPI 5: Audit & Compliance Gate */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('auditor')}
          onKeyDown={(e) => e.key === 'Enter' && onNavigateTab('auditor')}
          className={`cursor-pointer p-3.5 rounded-lg border transition-all text-left group relative focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none ${
            (stats?.discrepancies_count || 0) > 0
              ? 'bg-red-50/40 border-red-200 hover:border-red-300'
              : 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
          }`}
          aria-label="View AI Payroll Auditor"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Audit Gate</span>
            <div
              className="relative cursor-help"
              onMouseEnter={() => setActiveTooltip('kpi_audit')}
              onMouseLeave={() => setActiveTooltip(null)}
              onClick={(e) => e.stopPropagation()}
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
              {activeTooltip === 'kpi_audit' && (
                <div className="absolute right-0 top-5 z-20 w-56 p-2 bg-slate-900 text-white text-[10px] rounded shadow-lg pointer-events-none">
                  Automated statutory rule audit covering salary spikes, negative pay, LOP deductions, and bank completeness.
                </div>
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <p className={`text-2xl font-bold font-mono tracking-tight ${
              (stats?.discrepancies_count || 0) > 0 ? 'text-red-700' : 'text-emerald-700'
            }`}>
              {stats?.discrepancies_count > 0 ? `${stats.discrepancies_count} Open` : 'Passed'}
            </p>
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1">
            <span className={stats?.discrepancies_count > 0 ? 'text-red-600 font-medium' : 'text-emerald-600 font-medium'}>
              {stats?.discrepancies_count > 0 ? 'Disbursement Blocked' : 'Pre-flight Cleared'}
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE DISCREPANCY ALERTS & RESOLUTION SECTION */}
      {stats?.discrepancies_count > 0 ? (
        <section aria-labelledby="discrepancy-heading" className="bg-white border border-amber-200/90 rounded-lg overflow-hidden shadow-2xs">
          {/* Collapsible Alert Header */}
          <div className="p-4 bg-amber-50/70 border-b border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h2 id="discrepancy-heading" className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {stats.discrepancies_count} Pre-Flight Discrepancies Requiring Administrative Review
                </h2>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Automated payroll auditor flagged potential statutory anomalies. Direct salary release is withheld until findings are resolved or accepted.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setDiscrepancyExpanded(!discrepancyExpanded)}
                className="cursor-pointer text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded bg-white/80 border border-amber-200 hover:bg-white transition-colors"
                aria-expanded={discrepancyExpanded}
              >
                {discrepancyExpanded ? (
                  <>Collapse List <ChevronUp className="w-3.5 h-3.5" /></>
                ) : (
                  <>Show {openFindingsList.length} Details <ChevronDown className="w-3.5 h-3.5" /></>
                )}
              </button>
              <button
                onClick={() => onNavigateTab('auditor')}
                className="cursor-pointer text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1 rounded transition-colors"
              >
                Full Audit Suite &rarr;
              </button>
            </div>
          </div>

          {/* Interactive Discrepancies List */}
          {discrepancyExpanded && (
            <div className="divide-y divide-slate-100">
              {openFindingsList.map((f: AuditFinding) => (
                <div key={f.id} className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        f.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : f.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {f.severity}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{f.title}</span>
                      <span className="text-[11px] text-slate-500">
                        &bull; {f.employee_name} ({f.emp_code} &bull; {f.department})
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{f.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] pt-1">
                      <span className="text-slate-500">
                        Expected: <strong className="text-slate-700">{f.expected_value}</strong>
                      </span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-500">
                        Observed: <strong className="text-red-700">{f.observed_value}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Controlled Inline Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {canManagePayroll ? (
                      <button
                        onClick={() => {
                          setResolvingFinding(f);
                          setResolutionStatus('Resolved');
                          setResolutionNote('');
                        }}
                        className="cursor-pointer px-3 py-1.5 rounded text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs"
                      >
                        Resolve / Adjust
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Admin Approval Required</span>
                    )}
                    <button
                      onClick={() => onNavigateTab('auditor')}
                      className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1 transition-colors"
                      title="Inspect calculation trace in auditor"
                    >
                      Inspect &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">All Pre-Disbursement Compliance Checks Passed</span>
            <span className="text-emerald-700 text-[11px]">&bull; Zero active calculation anomalies detected for {stats?.current_payroll_period || 'October 2026'}.</span>
          </div>
          <button
            onClick={() => onNavigateTab('auditor')}
            className="cursor-pointer text-[11px] font-semibold text-emerald-800 hover:underline"
          >
            View Audit Log &rarr;
          </button>
        </div>
      )}

      {/* 3. CHARTS GRID (Improved payroll and attendance charts with date filters, accurate data, tooltips, clear units) */}
      <section aria-label="Payroll Analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Payroll Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Payroll Trend (INR)</h2>
                <p className="text-[11px] text-slate-400">Employer Cost CTC vs Net Disbursed Salary</p>
              </div>

              {/* Chart Date & Metric Filter Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 p-0.5 rounded text-[10px] font-medium text-slate-600">
                  <button
                    onClick={() => setTrendMetric('payroll_cost')}
                    className={`cursor-pointer px-2 py-1 rounded transition-colors ${
                      trendMetric === 'payroll_cost' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Employer Cost
                  </button>
                  <button
                    onClick={() => setTrendMetric('gross_earnings')}
                    className={`cursor-pointer px-2 py-1 rounded transition-colors ${
                      trendMetric === 'gross_earnings' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Gross
                  </button>
                  <button
                    onClick={() => setTrendMetric('net_disbursed')}
                    className={`cursor-pointer px-2 py-1 rounded transition-colors ${
                      trendMetric === 'net_disbursed' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Net Pay
                  </button>
                </div>

                <select
                  value={trendRange}
                  onChange={(e) => setTrendRange(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-700 px-2 py-1 outline-none cursor-pointer"
                  aria-label="Filter Trend Range"
                >
                  <option value={6}>Last 6 Months</option>
                  <option value={3}>Last 3 Months</option>
                </select>
              </div>
            </div>

            {/* Recharts Area Container */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={(charts?.monthly_trend || []).slice(-trendRange)}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="month"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => {
                      const label = name === 'payroll_cost'
                        ? 'Total Employer Cost'
                        : name === 'gross_earnings'
                        ? 'Gross Earnings'
                        : 'Net Disbursed';
                      return [formatINR(Number(val)), label];
                    }}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      color: '#FFFFFF',
                      borderRadius: '6px',
                      fontSize: '11px',
                      border: 'none',
                      padding: '8px 12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={trendMetric}
                    stroke="#4338CA"
                    strokeWidth={2}
                    fill="#EEF2FF"
                    name={trendMetric}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100 mt-2">
            <span>Showing verified statutory calculations for active periods</span>
            <span className="font-medium text-slate-700">Currency: Indian Rupee (₹ INR)</span>
          </div>
        </div>

        {/* Attendance Breakdown Donut */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Attendance Distribution</h2>
                <p className="text-[11px] text-slate-400">Monthly working days ratio ({stats?.current_payroll_period || 'October 2026'})</p>
              </div>
              <button
                onClick={() => onNavigateTab('attendance')}
                className="cursor-pointer text-[10px] font-semibold text-indigo-600 hover:underline"
              >
                Log Terminal &rarr;
              </button>
            </div>

            <div className="h-44 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts?.attendance_breakdown || []}
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(charts?.attendance_breakdown || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || (index === 0 ? '#0F172A' : index === 1 ? '#4338CA' : index === 2 ? '#D97706' : '#DC2626')} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, _name: any, item: any) => [`${item?.payload?.count || 0} recorded (${val}%)`, item?.payload?.name]}
                    contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '6px', fontSize: '11px', border: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-100">
            {(charts?.attendance_breakdown || []).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}: <strong>{item.value}%</strong></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. COMPACT HR ACTION CENTER (Pending approvals, payroll deadlines, incomplete records, failed operations) */}
      <section aria-labelledby="action-center-heading" className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 id="action-center-heading" className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              HR Action Center
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                {(actionCenterData.pending_approvals?.length || 0) + (actionCenterData.incomplete_records?.length || 0)} items
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Operational queue for regulatory cutoff & payroll clearance</p>
          </div>

          {/* Action Center Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-xs">
            <button
              onClick={() => setActionTab('approvals')}
              className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                actionTab === 'approvals' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Approvals ({actionCenterData.pending_approvals?.length || 0})
            </button>
            <button
              onClick={() => setActionTab('deadlines')}
              className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                actionTab === 'deadlines' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Payroll Deadlines ({actionCenterData.deadlines?.length || 0})
            </button>
            <button
              onClick={() => setActionTab('incomplete')}
              className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                actionTab === 'incomplete' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Incomplete KYC ({actionCenterData.incomplete_records?.length || 0})
            </button>
            <button
              onClick={() => setActionTab('failed')}
              className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                actionTab === 'failed' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Blocked Ops ({actionCenterData.failed_operations?.length || 0})
            </button>
          </div>
        </div>

        {/* Action Center Tab Content */}
        {actionTab === 'approvals' && (
          <div className="space-y-2">
            {actionCenterData.pending_approvals?.length > 0 ? (
              actionCenterData.pending_approvals.map((req: any) => (
                <div key={req.id} className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{req.employee_name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">({req.emp_code} &bull; {req.department})</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {req.leave_type} Leave &bull; {req.days_count} day(s)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Dates: <strong>{req.start_date} &ndash; {req.end_date}</strong> &bull; Reason: &ldquo;{req.reason}&rdquo;
                    </p>
                  </div>

                  {canManagePayroll ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleInlineLeaveReview(req.id, 'approved')}
                        disabled={processingLeaveId === req.id}
                        className="cursor-pointer px-2.5 py-1 rounded bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {processingLeaveId === req.id ? 'Saving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleInlineLeaveReview(req.id, 'rejected')}
                        disabled={processingLeaveId === req.id}
                        className="cursor-pointer px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Requires Admin signoff</span>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                Inbox Zero: All employee leave requests have been reviewed and resolved.
              </div>
            )}
          </div>
        )}

        {actionTab === 'deadlines' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {actionCenterData.deadlines?.map((dl: any) => (
              <div key={dl.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{dl.due_date}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    dl.urgency === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : dl.urgency === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {dl.status}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900">{dl.title}</p>
                <p className="text-[11px] text-slate-500 line-clamp-2">{dl.description}</p>
              </div>
            ))}
          </div>
        )}

        {actionTab === 'incomplete' && (
          <div className="space-y-2">
            {actionCenterData.incomplete_records?.length > 0 ? (
              actionCenterData.incomplete_records.map((rec: any, i: number) => (
                <div key={i} className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-md flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{rec.employee_name}</span>
                    <span className="text-[11px] text-slate-500 font-mono ml-1.5">({rec.emp_code} &bull; {rec.department})</span>
                    <p className="text-[11px] text-amber-900 mt-0.5">
                      Missing: <strong>{rec.missing_fields.join(', ')}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateTab('employees')}
                    className="cursor-pointer text-xs font-semibold text-amber-900 hover:underline"
                  >
                    Update in Master &rarr;
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                All employee statutory KYC records (PAN, Bank, Tax Regime) are 100% complete.
              </div>
            )}
          </div>
        )}

        {actionTab === 'failed' && (
          <div className="space-y-2">
            {actionCenterData.failed_operations?.length > 0 ? (
              actionCenterData.failed_operations.map((fo: any) => (
                <div key={fo.id} className="p-3 bg-red-50/70 border border-red-200 rounded-md flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                        {fo.severity}
                      </span>
                      <span className="font-bold text-slate-900">{fo.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">{fo.details}</p>
                  </div>
                  <button
                    onClick={() => onNavigateTab(fo.action_tab)}
                    className="cursor-pointer px-3 py-1 bg-red-700 text-white rounded text-xs font-semibold hover:bg-red-800 transition-colors"
                  >
                    Resolve Blocker
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                <ShieldCheck className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                Zero blocked operations. The statutory release gateway is operational.
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. BOTTOM SECTION: RECENT AUDIT TRAIL & KEY MODULE NAVIGATION */}
      <section aria-label="Recent Audit Trail and Modules" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Activity Section */}
        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Payroll & HR Audit Trail</h2>
                <p className="text-[11px] text-slate-400">Chronological ledger of compliance checks, approvals, and calculations</p>
              </div>

              {/* Activity Category Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-[10px] font-medium text-slate-600">
                <button
                  onClick={() => setActivityCategoryFilter('ALL')}
                  className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${
                    activityCategoryFilter === 'ALL' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActivityCategoryFilter('PAYROLL_AUDIT')}
                  className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${
                    activityCategoryFilter === 'PAYROLL_AUDIT' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                  }`}
                >
                  Payroll & Audit
                </button>
                <button
                  onClick={() => setActivityCategoryFilter('LEAVE')}
                  className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${
                    activityCategoryFilter === 'LEAVE' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                  }`}
                >
                  Leaves
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 mt-1">
              {filteredActivities.slice(0, 5).map((act: any) => (
                <div key={act.id} className="py-2.5 flex items-start justify-between gap-4 text-xs group">
                  <div className="flex items-start gap-3">
                    {/* Actor Avatar */}
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {act.actor_initials || 'SY'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{act.actor_name || 'System'}</span>
                        <span className="text-[10px] text-slate-400">&bull; {act.actor_role || 'Daemon'}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider ${
                          act.category === 'AUDIT'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : act.category === 'PAYROLL'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : act.category === 'LEAVE'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {act.category}
                        </span>
                      </div>
                      <p className="text-slate-700 text-xs mt-0.5">{act.details}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{act.timestamp}</p>
                    </div>
                  </div>

                  {act.target_tab && (
                    <button
                      onClick={() => onNavigateTab(act.target_tab)}
                      className="cursor-pointer text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 flex items-center gap-0.5"
                    >
                      View record &rarr;
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-right">
            <button
              onClick={() => onNavigateTab('auditor')}
              className="cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
            >
              Export Complete Audit Log <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Quick Module Navigation Cards */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Enterprise Modules</h2>
            <div className="space-y-2">
              <button
                onClick={() => onNavigateTab('employees')}
                className="cursor-pointer w-full p-2.5 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left transition-colors group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Employee Directory</p>
                  <p className="text-[11px] text-slate-500">{stats?.total_employees || 6} active personnel profiles</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onNavigateTab('salary_structures')}
                className="cursor-pointer w-full p-2.5 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left transition-colors group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Salary Structures & CTC</p>
                  <p className="text-[11px] text-slate-500">EPF, ESI, Professional Tax, TDS</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onNavigateTab('payroll')}
                className="cursor-pointer w-full p-2.5 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left transition-colors group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Maker-Checker Payroll Engine</p>
                  <p className="text-[11px] text-slate-500">Calculate, validate & bank export</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onNavigateTab('reports')}
                className="cursor-pointer w-full p-2.5 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left transition-colors group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Statutory Reports & Form 16</p>
                  <p className="text-[11px] text-slate-500">HDFC CMS, EPF ECR, Payslips</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Tenant Isolation: <strong>AES-256 Active</strong></span>
            <span className="font-semibold text-emerald-700">Audit Grade</span>
          </div>
        </div>
      </section>

      {/* DISCREPANCY RESOLUTION WORKFLOW MODAL */}
      {resolvingFinding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Audit Finding Resolution
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Record official HR / Payroll determination for compliance log
                </p>
              </div>
              <button
                onClick={() => setResolvingFinding(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResolveFindingSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    resolvingFinding.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {resolvingFinding.severity}
                  </span>
                  <span className="font-bold text-slate-900">{resolvingFinding.title}</span>
                </div>
                <p className="text-slate-600 text-[11px]">{resolvingFinding.description}</p>
                <p className="text-[10px] text-slate-500">
                  Target: <strong>{resolvingFinding.employee_name}</strong> ({resolvingFinding.emp_code} &bull; {resolvingFinding.department})
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Resolution Decision Status
                </label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-600 outline-none cursor-pointer"
                >
                  <option value="Resolved">Resolved &mdash; Correction applied in calculation</option>
                  <option value="Accepted">Accepted &mdash; Approved business exception / override</option>
                  <option value="Investigating">Investigating &mdash; Formal inquiry initiated</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Audit Justification & Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Explain why this finding is being resolved or accepted. This note is cryptographically logged into the audit trail..."
                  className="w-full text-xs p-2.5 rounded border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolvingFinding(null)}
                  className="cursor-pointer px-3 py-1.5 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResolution || !resolutionNote.trim()}
                  className="cursor-pointer px-4 py-1.5 rounded text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {isSubmittingResolution ? 'Submitting...' : 'Commit Determination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
