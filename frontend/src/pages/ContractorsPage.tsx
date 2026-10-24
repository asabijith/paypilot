import React, { useState, useEffect } from 'react';
import { api, formatINR } from '../services/api';
import { User, Contractor, ContractorInvoice } from '../types';
import {
  Globe, Plus, Download, CheckCircle2, AlertTriangle, Building,
  DollarSign, FileText, ArrowRight, ShieldCheck, RefreshCw, Send,
  UserCheck, ExternalLink, Calendar, Check, X
} from 'lucide-react';
import { toast } from '../components/Toast';

interface ContractorsPageProps {
  currentUser: User | null;
  onNavigateTab?: (tab: string) => void;
}

export const ContractorsPage: React.FC<ContractorsPageProps> = ({
  currentUser
}) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'payroll_admin' || currentUser?.role === 'owner';

  const [activeTab, setActiveTab] = useState<'contractors' | 'invoices'>('contractors');
  const [loading, setLoading] = useState(false);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [invoices, setInvoices] = useState<ContractorInvoice[]>([]);

  // Filters
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isNewContractorModalOpen, setIsNewContractorModalOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isWireModalOpen, setIsWireModalOpen] = useState(false);
  const [wireBatchData, setWireBatchData] = useState<any>(null);

  // New Contractor Form
  const [cntCode, setCntCode] = useState('');
  const [cntName, setCntName] = useState('');
  const [cntEmail, setCntEmail] = useState('');
  const [cntCountry, setCntCountry] = useState('United States');
  const [cntCurrency, setCntCurrency] = useState('USD');
  const [cntType, setCntType] = useState<'individual' | 'company'>('individual');
  const [cntService, setCntService] = useState('cloud_devops');
  const [cntTaxId, setCntTaxId] = useState('');
  const [cntBank, setCntBank] = useState('JPMorgan Chase Bank');
  const [cntAccount, setCntAccount] = useState('');
  const [cntSwift, setCntSwift] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Invoice Form
  const [invContractorId, setInvContractorId] = useState('');
  const [invNumber, setInvNumber] = useState('');
  const [invSubtotal, setInvSubtotal] = useState<number>(4000);
  const [invGstRate, setInvGstRate] = useState<number>(0);
  const [invDesc, setInvDesc] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [cnts, invs] = await Promise.all([
        api.getContractors(),
        api.getContractorInvoices()
      ]);
      setContractors(cnts);
      setInvoices(invs);
      if (cnts.length > 0 && !invContractorId) {
        setInvContractorId(cnts[0].id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load contractors', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleInvoiceStatusUpdate = async (invoiceId: string, status: string) => {
    try {
      await api.updateContractorInvoiceStatus(invoiceId, status, `WIRE-${Date.now().toString().slice(-6)}`);
      toast.success(`Invoice marked as ${status}`, 'Invoice Updated');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update invoice', 'Error');
    }
  };

  const handleCreateContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createContractor({
        contractor_code: cntCode || `CON-${Date.now().toString().slice(-4)}`,
        name: cntName,
        email: cntEmail,
        country: cntCountry,
        currency: cntCurrency,
        contractor_type: cntType,
        service_type: cntService,
        pan_or_tax_id: cntTaxId || 'TAX-ID-PENDING',
        bank_name: cntBank,
        bank_account: cntAccount || '987654321',
        ifsc_or_swift: cntSwift || 'CHASUS33XXX'
      });
      toast.success('Contractor onboarded with tax withholding terms.', 'Contractor Added');
      setIsNewContractorModalOpen(false);
      setCntName('');
      setCntEmail('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create contractor', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createContractorInvoice({
        contractor_id: invContractorId,
        invoice_number: invNumber || `INV-${Date.now().toString().slice(-4)}`,
        subtotal_amount: invSubtotal,
        gst_rate_pct: invGstRate,
        description: invDesc || 'Consulting services'
      });
      toast.success('Contractor invoice generated with automated TDS/GST withholding.', 'Invoice Created');
      setIsNewInvoiceModalOpen(false);
      setInvNumber('');
      setInvDesc('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create invoice', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateWireBatch = async () => {
    try {
      const data = await api.exportBatchWire();
      setWireBatchData(data);
      setIsWireModalOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Wire export failed', 'Error');
    }
  };

  const totalInvoicedInr = invoices.reduce((acc, i) => acc + (i.net_inr_equivalent || 0), 0);
  const totalTdsInr = invoices.reduce((acc, i) => acc + (i.tds_withheld_amount || 0), 0);

  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (currencyFilter !== 'all' && inv.currency !== currencyFilter) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Globe className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Global Contractor & Cross-Border Hub</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              Multi-Currency FX & 194J TDS
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Hire, manage, and settle domestic and international talent across USD, EUR, GBP, AED, SGD, and INR with automated Section 194J/194C withholding.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <>
              <button
                onClick={() => setIsNewContractorModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Contractor
              </button>

              <button
                onClick={() => setIsNewInvoiceModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
              >
                <FileText className="w-4 h-4" />
                Create Invoice
              </button>

              <button
                onClick={handleGenerateWireBatch}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition"
              >
                <Send className="w-4 h-4" />
                SWIFT Wire Batch
              </button>
            </>
          )}

          <button
            onClick={loadData}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Talent Roster</span>
            <Globe className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {contractors.length} Contractors
          </div>
          <div className="text-xs text-slate-500 mt-1">
            US, Germany, India & Cross-border
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Invoiced Commitment</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatINR(totalInvoicedInr)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Converted at benchmark daily FX spot
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Section 194J/194C TDS Withheld</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">
            {formatINR(totalTdsInr)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Auto-linked to Form 26Q return
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">W-8BEN Compliance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            100%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Zero foreign withholding penalty risk
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl">
        <button
          onClick={() => setActiveTab('contractors')}
          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'contractors'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Contractor Roster ({contractors.length})
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'invoices'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Invoices & Multi-Currency Ledger ({invoices.length})
        </button>
      </div>

      {/* TAB 1: CONTRACTORS ROSTER */}
      {activeTab === 'contractors' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {contractors.map(c => (
              <div key={c.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {c.contractor_code}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    c.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-base">{c.name}</h4>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{c.email}</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Country & Currency:</span>
                    <span className="font-semibold text-slate-900">{c.country} ({c.currency})</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Role / Service:</span>
                    <span className="font-medium text-slate-700 capitalize">{c.service_type.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Withholding Section:</span>
                    <span className="font-semibold text-indigo-700">
                      {c.withholding_section} ({c.withholding_rate_pct}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>W-8BEN Status:</span>
                    <span className={`font-semibold capitalize ${
                      c.w8ben_status === 'verified' ? 'text-emerald-600' : 'text-slate-600'
                    }`}>
                      {c.w8ben_status}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-100">
                    <span>Bank & SWIFT:</span>
                    <span className="font-mono text-[11px] text-slate-600">{c.ifsc_or_swift}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: INVOICES LEDGER */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Currency:</span>
              <select
                value={currencyFilter}
                onChange={e => setCurrencyFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
              >
                <option value="all">All Currencies</option>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>

              <span className="text-xs font-semibold text-slate-500 ml-2">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Contractor</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">TDS Withheld</th>
                  <th className="py-3 px-4 text-right">Net Payable</th>
                  <th className="py-3 px-4 text-right">INR Equivalent</th>
                  <th className="py-3 px-4">Status</th>
                  {isAdmin && <th className="py-3 px-4 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                      {inv.invoice_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{inv.contractor_name || inv.contractor_id}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {inv.description}
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-700 tabular-nums">
                      {inv.currency} {inv.subtotal_amount.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-rose-600 tabular-nums">
                      {inv.tds_withheld_amount > 0 ? `${inv.currency} ${inv.tds_withheld_amount.toLocaleString()}` : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                      {inv.currency} {inv.net_payable_amount.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-indigo-700 tabular-nums">
                      {formatINR(inv.net_inr_equivalent)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                        inv.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        inv.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {isAdmin && (
                      <td className="py-3.5 px-4 text-center">
                        {inv.status === 'pending_approval' && (
                          <button
                            onClick={() => handleInvoiceStatusUpdate(inv.id, 'approved')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition"
                          >
                            Approve
                          </button>
                        )}
                        {inv.status === 'approved' && (
                          <button
                            onClick={() => handleInvoiceStatusUpdate(inv.id, 'paid')}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition"
                          >
                            Mark Paid
                          </button>
                        )}
                        {inv.status === 'paid' && (
                          <span className="text-xs text-slate-400 font-mono">Settled</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW CONTRACTOR MODAL */}
      {isNewContractorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Onboard Global Contractor</h3>
              <button onClick={() => setIsNewContractorModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContractor} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contractor Code</label>
                  <input
                    type="text"
                    value={cntCode}
                    onChange={e => setCntCode(e.target.value)}
                    placeholder="e.g. CON-US-004"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={cntName}
                    onChange={e => setCntName(e.target.value)}
                    placeholder="e.g. David Lin"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={cntEmail}
                    onChange={e => setCntEmail(e.target.value)}
                    placeholder="david@linconsulting.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Country</label>
                  <select
                    value={cntCountry}
                    onChange={e => {
                      setCntCountry(e.target.value);
                      if (e.target.value === 'United States') setCntCurrency('USD');
                      if (e.target.value === 'Germany') setCntCurrency('EUR');
                      if (e.target.value === 'India') setCntCurrency('INR');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="United States">United States</option>
                    <option value="Germany">Germany</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Singapore">Singapore</option>
                    <option value="India">India</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payout Currency</label>
                  <select
                    value={cntCurrency}
                    onChange={e => setCntCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Service Type</label>
                  <select
                    value={cntService}
                    onChange={e => setCntService(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="cloud_devops">Cloud & DevOps Engineering</option>
                    <option value="software_engineering">Full-Stack Software Engineering</option>
                    <option value="ui_ux_design">UI/UX Product Design</option>
                    <option value="legal_advisory">Corporate Legal Retainer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={cntBank}
                    onChange={e => setCntBank(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">SWIFT / BIC Code</label>
                  <input
                    type="text"
                    value={cntSwift}
                    onChange={e => setCntSwift(e.target.value.toUpperCase())}
                    placeholder="CHASUS33XXX"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewContractorModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  {submitting ? 'Onboarding...' : 'Onboard Contractor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Create Contractor Invoice</h3>
              <button onClick={() => setIsNewInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Contractor</label>
                <select
                  value={invContractorId}
                  onChange={e => setInvContractorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  {contractors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.country} - {c.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Invoice Number</label>
                <input
                  type="text"
                  required
                  value={invNumber}
                  onChange={e => setInvNumber(e.target.value)}
                  placeholder="INV-2026-US-091"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Subtotal Amount</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={invSubtotal}
                  onChange={e => setInvSubtotal(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description of Deliverables</label>
                <textarea
                  rows={2}
                  required
                  value={invDesc}
                  onChange={e => setInvDesc(e.target.value)}
                  placeholder="e.g. October sprint backend architecture deliverables"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  {submitting ? 'Creating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SWIFT WIRE BATCH MODAL */}
      {isWireModalOpen && wireBatchData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">SWIFT MT103 Cross-Border Wire Batch</h3>
                <p className="text-xs text-slate-500 font-mono">Batch Ref: {wireBatchData.batch_reference}</p>
              </div>
              <button onClick={() => setIsWireModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Foreign Invoices:</span>
                <span className="font-bold text-slate-900 ml-1.5">{wireBatchData.total_invoices} Wires</span>
              </div>
              <div>
                <span className="text-slate-500">Total Commitment:</span>
                <span className="font-bold text-indigo-700 ml-1.5">{formatINR(wireBatchData.total_inr_commitment)}</span>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Beneficiary</th>
                    <th className="p-2.5">SWIFT BIC</th>
                    <th className="p-2.5">Foreign Payout</th>
                    <th className="p-2.5 text-right">INR Equivalent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wireBatchData.settlements.map((s: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium text-slate-900">{s.beneficiary_name} ({s.country})</td>
                      <td className="p-2.5 font-mono text-slate-600">{s.swift_bic}</td>
                      <td className="p-2.5 font-semibold text-slate-800">{s.currency} {s.foreign_amount.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-bold text-indigo-700">{formatINR(s.inr_equivalent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(wireBatchData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${wireBatchData.batch_reference}_SWIFT_MT103.json`;
                  a.click();
                  toast.success('SWIFT MT103 wire batch exported', 'Export Complete');
                  setIsWireModalOpen(false);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                Download MT103 File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
