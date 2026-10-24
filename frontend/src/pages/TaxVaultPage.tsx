import React, { useState, useEffect } from 'react';
import { api, formatINR } from '../services/api';
import { User, TaxDeclaration, TaxRegimeComparisonResult } from '../types';
import {
  Percent, ShieldCheck, Calculator, Sparkles, CheckCircle2, AlertTriangle,
  ArrowRight, FileCheck, Info, RefreshCw, Save, Building, UserCheck,
  TrendingUp, HelpCircle, Lock, ShieldAlert, Check, X
} from 'lucide-react';
import { toast } from '../components/Toast';

interface TaxVaultPageProps {
  currentUser: User | null;
  onNavigateTab?: (tab: string) => void;
}

export const TaxVaultPage: React.FC<TaxVaultPageProps> = ({
  currentUser
}) => {
  const isEmployee = currentUser?.role === 'employee';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'payroll_admin' || currentUser?.role === 'owner';

  const [activeTab, setActiveTab] = useState<'simulator' | 'declaration' | 'verification'>(
    isAdmin ? 'verification' : 'simulator'
  );
  const [loading, setLoading] = useState(false);

  // Declarations
  const [declarations, setDeclarations] = useState<TaxDeclaration[]>([]);
  const [currentDecl, setCurrentDecl] = useState<TaxDeclaration | null>(null);

  // Verification Review Drawer State
  const [selectedDeclForReview, setSelectedDeclForReview] = useState<TaxDeclaration | null>(null);
  const [rev80C, setRev80C] = useState<number>(0);
  const [rev80D, setRev80D] = useState<number>(0);
  const [rev24B, setRev24B] = useState<number>(0);
  const [revNps, setRevNps] = useState<number>(0);
  const [revHra, setRevHra] = useState<number>(0);
  const [revNotes, setRevNotes] = useState<string>('');

  // Simulator State
  const [simCtc, setSimCtc] = useState<number>(1800000);
  const [simBasic, setSimBasic] = useState<number>(900000);
  const [simHra, setSimHra] = useState<number>(450000);
  const [sim80c, setSim80c] = useState<number>(150000);
  const [sim80d, setSim80d] = useState<number>(25000);
  const [sim24b, setSim24b] = useState<number>(180000);
  const [simNps, setSimNps] = useState<number>(50000);
  const [simRent, setSimRent] = useState<number>(300000);
  const [simCity, setSimCity] = useState<string>('metro');
  const [comparisonResult, setComparisonResult] = useState<TaxRegimeComparisonResult | null>(null);

  // Employee Form 12BB State
  const [formRegime, setFormRegime] = useState<'new' | 'old'>('new');
  const [form80c, setForm80c] = useState<number>(150000);
  const [form80d, setForm80d] = useState<number>(25000);
  const [form24b, setForm24b] = useState<number>(0);
  const [formNps, setFormNps] = useState<number>(0);
  const [formRent, setFormRent] = useState<number>(0);
  const [formLandlordPan, setFormLandlordPan] = useState<string>('');
  const [formLandlordName, setFormLandlordName] = useState<string>('');
  const [formCityType, setFormCityType] = useState<'metro' | 'non_metro'>('metro');
  const [savingDecl, setSavingDecl] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        const decls = await api.getTaxDeclarations('2026-27');
        setDeclarations(decls);
      }
      
      const empId = currentUser?.id || 'emp_001';
      const myDeclRes = await api.getEmployeeTaxDeclaration(empId, '2026-27');
      setCurrentDecl(myDeclRes);
      
      if (myDeclRes) {
        setFormRegime(myDeclRes.regime_selected || 'new');
        setForm80c(myDeclRes.sec_80c_declared || 0);
        setForm80d(myDeclRes.sec_80d_health_declared || 0);
        setForm24b(myDeclRes.sec_24b_home_loan_interest_declared || 0);
        setFormNps(myDeclRes.sec_80ccd_nps_declared || 0);
        setFormRent(myDeclRes.hra_annual_rent_declared || 0);
        setFormLandlordPan(myDeclRes.landlord_pan || '');
        setFormLandlordName(myDeclRes.landlord_name || '');
        setFormCityType(myDeclRes.rental_city_type || 'metro');
      }

      runSimulator(simCtc, sim80c, sim80d, sim24b, simNps, simRent);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load tax vault', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const runSimulator = async (
    ctc: number, c: number, d: number, b: number, nps: number, rent: number
  ) => {
    try {
      const res = await api.compareTaxRegimes({
        ctc_annual: ctc,
        basic_annual: ctc * 0.50,
        hra_annual: ctc * 0.25,
        sec_80c: c,
        sec_80d: d,
        sec_24b: b,
        sec_80ccd: nps,
        annual_rent: rent,
        city_type: simCity
      });
      setComparisonResult(res);
    } catch (err) {
      console.error('Simulator error', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    runSimulator(simCtc, sim80c, sim80d, sim24b, simNps, simRent);
  };

  const handleSaveDeclaration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formRent > 100000 && !formLandlordPan) {
      toast.error('Landlord PAN is statutorily mandatory for annual rent exceeding ₹1,00,000 u/s 10(13A).', 'Statutory Requirement');
      return;
    }
    try {
      setSavingDecl(true);
      await api.saveTaxDeclaration({
        employee_id: currentUser?.id || 'emp_001',
        financial_year: '2026-27',
        regime_selected: formRegime,
        sec_80c_declared: form80c,
        sec_80d_health_declared: form80d,
        sec_24b_home_loan_interest_declared: form24b,
        sec_80ccd_nps_declared: formNps,
        hra_annual_rent_declared: formRent,
        landlord_pan: formLandlordPan || undefined,
        landlord_name: formLandlordName || undefined,
        rental_city_type: formCityType
      });
      toast.success('Form 12BB Tax Declaration submitted to HR for proof verification.', 'Declaration Saved');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save declaration', 'Error');
    } finally {
      setSavingDecl(false);
    }
  };

  const handleOpenReview = (decl: TaxDeclaration) => {
    setSelectedDeclForReview(decl);
    setRev80C(decl.sec_80c_declared);
    setRev80D(decl.sec_80d_health_declared);
    setRev24B(decl.sec_24b_home_loan_interest_declared);
    setRevNps(decl.sec_80ccd_nps_declared);
    setRevHra(decl.hra_annual_rent_declared);
    setRevNotes(decl.verification_notes || 'Verified against submitted investment receipts and rent agreement.');
  };

  const handleApproveVerification = async () => {
    if (!selectedDeclForReview) return;
    try {
      await api.verifyTaxDeclaration({
        declaration_id: selectedDeclForReview.id,
        sec_80c_approved: rev80C,
        sec_80d_health_approved: rev80D,
        sec_24b_home_loan_interest_approved: rev24B,
        sec_80ccd_nps_approved: revNps,
        hra_annual_rent_approved: revHra,
        verification_notes: revNotes
      });
      toast.success(`Verified Form 12BB for ${selectedDeclForReview.employee_name}`, 'Proofs Verified');
      setSelectedDeclForReview(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Verification failed', 'Error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Percent className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Tax Optimization Vault & Form 12BB</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
              FY 2026-27 (AY 2027-28)
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Section 115BAC enhanced dual-regime AI comparator, Form 12BB investment proofs vault, and automated monthly TDS calibration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentDecl && (
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="text-slate-500">Selected Regime: </span>
              <span className="font-bold text-slate-900 uppercase">
                {currentDecl.regime_selected === 'new' ? 'New (Sec 115BAC)' : 'Old Regime'}
              </span>
            </div>
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'simulator'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Dual-Regime AI Simulator
        </button>

        <button
          onClick={() => setActiveTab('declaration')}
          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'declaration'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Form 12BB Declaration
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('verification')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'verification'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            HR Proof Verification Desk ({declarations.length})
          </button>
        )}
      </div>

      {/* TAB 1: DUAL-REGIME SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          {/* AI Recommendation Banner */}
          {comparisonResult && (
            <div className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              comparisonResult.recommendation === 'new'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}>
              <div className="flex items-start gap-3">
                <span className="p-2 bg-white rounded-lg shadow-xs mt-0.5">
                  <Sparkles className={`w-5 h-5 ${
                    comparisonResult.recommendation === 'new' ? 'text-emerald-600' : 'text-indigo-600'
                  }`} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white font-mono">
                      Antigravity AI Engine
                    </span>
                    <h3 className="text-base font-bold">
                      Recommended: {comparisonResult.recommendation === 'new' ? 'New Tax Regime (Section 115BAC)' : 'Old Tax Regime'}
                    </h3>
                  </div>
                  <p className="text-sm mt-1 text-slate-700">
                    {comparisonResult.recommendation_reason}
                  </p>
                </div>
              </div>

              <div className="bg-white px-5 py-3 rounded-xl border border-slate-200/80 shadow-xs text-right shrink-0">
                <div className="text-xs text-slate-500">Estimated Annual Tax Savings</div>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatINR(comparisonResult.annual_tax_savings)}
                </div>
              </div>
            </div>
          )}

          {/* Simulator Inputs & Side-by-Side Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Input Form (5 cols) */}
            <div className="lg:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-600" />
                Annual Salary & Investment Parameters
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Annual CTC (₹)</label>
                  <input
                    type="number"
                    value={simCtc}
                    step={25000}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setSimCtc(v);
                      runSimulator(v, sim80c, sim80d, sim24b, simNps, simRent);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Sec 80C (Max ₹1.5L)</label>
                    <input
                      type="number"
                      value={sim80c}
                      step={5000}
                      onChange={e => {
                        const v = Number(e.target.value);
                        setSim80c(v);
                        runSimulator(simCtc, v, sim80d, sim24b, simNps, simRent);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Sec 80D Health</label>
                    <input
                      type="number"
                      value={sim80d}
                      step={5000}
                      onChange={e => {
                        const v = Number(e.target.value);
                        setSim80d(v);
                        runSimulator(simCtc, sim80c, v, sim24b, simNps, simRent);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Sec 24(b) Home Loan</label>
                    <input
                      type="number"
                      value={sim24b}
                      step={10000}
                      onChange={e => {
                        const v = Number(e.target.value);
                        setSim24b(v);
                        runSimulator(simCtc, sim80c, sim80d, v, simNps, simRent);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Sec 80CCD NPS (50k)</label>
                    <input
                      type="number"
                      value={simNps}
                      step={5000}
                      onChange={e => {
                        const v = Number(e.target.value);
                        setSimNps(v);
                        runSimulator(simCtc, sim80c, sim80d, sim24b, v, simRent);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Annual Rent Paid (HRA)</label>
                  <input
                    type="number"
                    value={simRent}
                    step={10000}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setSimRent(v);
                      runSimulator(simCtc, sim80c, sim80d, sim24b, simNps, v);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Right: Side-by-Side Cards (7 cols) */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* New Regime Card */}
              <div className={`p-5 rounded-xl border transition ${
                comparisonResult?.recommendation === 'new'
                  ? 'border-emerald-400 bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900">New Tax Regime</h4>
                    <span className="text-[10px] text-slate-500 font-mono">Sec 115BAC (Default)</span>
                  </div>
                  {comparisonResult?.recommendation === 'new' && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                      OPTIMAL
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs border-y border-slate-100 py-3">
                  <div className="flex justify-between text-slate-500">
                    <span>Gross CTC:</span>
                    <span className="font-semibold text-slate-800">{formatINR(comparisonResult?.new_regime.gross_income || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Standard Deduction:</span>
                    <span className="font-semibold text-emerald-600">-₹75,000</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Other Deductions:</span>
                    <span className="font-semibold text-slate-400">₹0 (Disallowed)</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-medium pt-1 border-t border-slate-100">
                    <span>Taxable Income:</span>
                    <span className="font-bold text-slate-900">{formatINR(comparisonResult?.new_regime.taxable_income || 0)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-1">
                  <div className="text-xs text-slate-500">Annual Tax Liability (incl. 4% Cess)</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">
                    {formatINR(comparisonResult?.new_regime.annual_tax || 0)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Monthly TDS: <span className="font-semibold text-indigo-700">{formatINR(comparisonResult?.new_regime.monthly_tds || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Old Regime Card */}
              <div className={`p-5 rounded-xl border transition ${
                comparisonResult?.recommendation === 'old'
                  ? 'border-indigo-400 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900">Old Tax Regime</h4>
                    <span className="text-[10px] text-slate-500 font-mono">With Exemptions</span>
                  </div>
                  {comparisonResult?.recommendation === 'old' && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded-full">
                      OPTIMAL
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs border-y border-slate-100 py-3">
                  <div className="flex justify-between text-slate-500">
                    <span>Gross CTC:</span>
                    <span className="font-semibold text-slate-800">{formatINR(comparisonResult?.old_regime.gross_income || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Standard Deduction:</span>
                    <span className="font-semibold text-slate-600">-₹50,000</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Total Exemptions:</span>
                    <span className="font-semibold text-emerald-600">-{formatINR(comparisonResult?.old_regime.total_deductions || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-medium pt-1 border-t border-slate-100">
                    <span>Taxable Income:</span>
                    <span className="font-bold text-slate-900">{formatINR(comparisonResult?.old_regime.taxable_income || 0)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-1">
                  <div className="text-xs text-slate-500">Annual Tax Liability (incl. 4% Cess)</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">
                    {formatINR(comparisonResult?.old_regime.annual_tax || 0)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Monthly TDS: <span className="font-semibold text-indigo-700">{formatINR(comparisonResult?.old_regime.monthly_tds || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FORM 12BB DECLARATION */}
      {activeTab === 'declaration' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Form 12BB Investment Declaration (Rule 26C)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Furnish verified particulars of claims for deduction of tax under Chapter VI-A and Section 10(13A).
              </p>
            </div>
            {currentDecl && (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                currentDecl.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                currentDecl.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                'bg-slate-100 text-slate-700'
              }`}>
                Proof Status: {currentDecl.status}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveDeclaration} className="space-y-6">
            {/* Regime Choice */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase">1. Chosen Tax Regime for FY 2026-27</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="regime"
                    checked={formRegime === 'new'}
                    onChange={() => setFormRegime('new')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Section 115BAC New Regime (₹75k Standard Deduction, Nil Paperwork)</span>
                </label>

                <label className="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="regime"
                    checked={formRegime === 'old'}
                    onChange={() => setFormRegime('old')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Old Regime (Claim 80C, 80D, HRA, Home Loan Interest)</span>
                </label>
              </div>
            </div>

            {formRegime === 'old' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chapter VI-A */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                    2. Chapter VI-A Deductions
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Section 80C (PPF, ELSS, EPF, Life Insurance - Max ₹1,50,000)
                    </label>
                    <input
                      type="number"
                      max={150000}
                      value={form80c}
                      onChange={e => setForm80c(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Section 80D (Mediclaim Health Insurance - Self ₹25k, Parents ₹50k)
                    </label>
                    <input
                      type="number"
                      max={75000}
                      value={form80d}
                      onChange={e => setForm80d(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Section 80CCD(1B) (Additional NPS Contribution - Max ₹50,000)
                    </label>
                    <input
                      type="number"
                      max={50000}
                      value={formNps}
                      onChange={e => setFormNps(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Section 24(b) (Interest on Housing Loan Self-Occupied - Max ₹2,00,000)
                    </label>
                    <input
                      type="number"
                      max={200000}
                      value={form24b}
                      onChange={e => setForm24b(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                {/* HRA Declaration */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                    3. House Rent Allowance (Section 10(13A))
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Total Annual Rent Paid (₹)
                    </label>
                    <input
                      type="number"
                      value={formRent}
                      onChange={e => setFormRent(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Landlord PAN {formRent > 100000 && <span className="text-rose-600 font-bold">*Mandatory</span>}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ABCDE1234F"
                      value={formLandlordPan}
                      onChange={e => setFormLandlordPan(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Landlord Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Suresh Kulkarni"
                      value={formLandlordName}
                      onChange={e => setFormLandlordName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      City Classification
                    </label>
                    <select
                      value={formCityType}
                      onChange={e => setFormCityType(e.target.value as 'metro' | 'non_metro')}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    >
                      <option value="metro">Metro (50% of Basic - Delhi, Mumbai, Kolkata, Chennai)</option>
                      <option value="non_metro">Non-Metro (40% of Basic - Bengaluru, Hyderabad, Pune, etc.)</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-900">Section 115BAC Simplified Declaration Selected</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You have opted for the New Tax Regime. No proof submission is necessary for 80C/80D or HRA rent receipts. Enhanced standard deduction of ₹75,000 will be automatically factored into your monthly payroll TDS.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={savingDecl}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingDecl ? 'Saving Declaration...' : 'Save & Submit Form 12BB'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: HR VERIFICATION REVIEW DESK */}
      {activeTab === 'verification' && isAdmin && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">HR Investment Verification Desk</h3>
              <p className="text-xs text-slate-500">
                Audit submitted investment proofs against employee Form 12BB declarations before committing monthly payroll TDS.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Regime</th>
                  <th className="py-3 px-4 text-right">Sec 80C</th>
                  <th className="py-3 px-4 text-right">Sec 80D</th>
                  <th className="py-3 px-4 text-right">Sec 24(b)</th>
                  <th className="py-3 px-4 text-right">Annual Rent</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {declarations.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{d.employee_name}</div>
                      <div className="text-xs text-slate-400 font-mono">{d.employee_id}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        d.regime_selected === 'new' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {d.regime_selected}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right tabular-nums font-medium text-slate-800">
                      {formatINR(d.sec_80c_declared)}
                    </td>

                    <td className="py-3.5 px-4 text-right tabular-nums font-medium text-slate-800">
                      {formatINR(d.sec_80d_health_declared)}
                    </td>

                    <td className="py-3.5 px-4 text-right tabular-nums font-medium text-slate-800">
                      {formatINR(d.sec_24b_home_loan_interest_declared)}
                    </td>

                    <td className="py-3.5 px-4 text-right tabular-nums font-medium text-slate-800">
                      {formatINR(d.hra_annual_rent_declared)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                        d.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                        d.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {d.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenReview(d)}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded transition"
                      >
                        Audit Proofs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HR AUDIT PROOFS MODAL */}
      {selectedDeclForReview && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Audit Proofs: {selectedDeclForReview.employee_name}</h3>
                <p className="text-xs text-slate-500">Form 12BB Verification for FY 2026-27</p>
              </div>
              <button onClick={() => setSelectedDeclForReview(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Approved 80C (Max ₹1.5L)</label>
                  <input
                    type="number"
                    value={rev80C}
                    onChange={e => setRev80C(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Approved 80D Health</label>
                  <input
                    type="number"
                    value={rev80D}
                    onChange={e => setRev80D(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Approved Sec 24(b) Home Loan</label>
                  <input
                    type="number"
                    value={rev24B}
                    onChange={e => setRev24B(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Approved Sec 80CCD NPS</label>
                  <input
                    type="number"
                    value={revNps}
                    onChange={e => setRevNps(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Approved HRA Rent Amount</label>
                <input
                  type="number"
                  value={revHra}
                  onChange={e => setRevHra(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Verification Audit Notes</label>
                <textarea
                  rows={2}
                  value={revNotes}
                  onChange={e => setRevNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedDeclForReview(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveVerification}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Verify & Lock Proofs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
