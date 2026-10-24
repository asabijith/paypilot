import React, { useState } from 'react';
import { api, formatINR } from '../services/api';
import {
  ShieldCheck, CheckCircle2, ArrowRight, Play,
  Lock, FileText, Check, HelpCircle,
  Building2, ChevronDown, ChevronUp, AlertTriangle,
  Download, Calculator, Scale, Database, FileSpreadsheet,
  CheckCircle, ArrowUpRight, Shield
} from 'lucide-react';
import { LegalCenterModal, LegalTab } from '../components/LegalCenterModal';
import { CookieBanner } from '../components/CookieBanner';
import { toast } from '../components/Toast';
import { calculateSalaryBreakdown } from '../services/salaryCalculator';

interface MarketingLandingPageProps {
  onEnterApp: () => void;
  onOpenLogin: () => void;
  onOpenRegister: (plan?: string) => void;
}

export const MarketingLandingPage: React.FC<MarketingLandingPageProps> = ({
  onEnterApp,
  onOpenLogin,
  onOpenRegister
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [showcaseTab, setShowcaseTab] = useState<'auditor' | 'ledger' | 'banking' | 'payslip'>('auditor');

  // Interactive CTC Take-Home Calculator state
  const [calcAnnualCtc, setCalcAnnualCtc] = useState<number>(1200000);
  const [calcRegime, setCalcRegime] = useState<'new' | 'old'>('new');
  const [calcState, setCalcState] = useState<string>('Karnataka');
  const [calcPfCapped, setCalcPfCapped] = useState<boolean>(true);

  // Legal Modal & Compliance States
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy');

  // Contact form
  const [contactForm, setContactForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    employee_range: '10-50',
    message: ''
  });
  const [submittingContact, setSubmittingContact] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Compute 100% reconciled statutory breakdown from calculation engine
  const breakdown = calculateSalaryBreakdown({
    annualCtc: calcAnnualCtc,
    regime: calcRegime,
    state: calcState,
    pfCapped: calcPfCapped,
    basicPercentage: 0.50,
    hraPercentage: 0.25
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingContact(true);
      await api.contactSales({
        ...contactForm,
        inquiry_type: 'demo_request'
      });
      setContactSubmitted(true);
    } catch (err) {
      console.error(err);
      setContactSubmitted(true);
    } finally {
      setSubmittingContact(false);
    }
  };

  const faqs = [
    {
      q: 'How does the AI Payroll Auditor prevent statutory penalties?',
      a: 'Unlike generative AI or LLMs that output approximations, PayPilot AI uses a deterministic statutory mathematical engine. Prior to payment release, it verifies that attendance matches LOP deductions, checks the 50% wage ceiling under the Payment of Wages Act, enforces EPF statutory caps, and flags anomalous gross salary spikes (>30%) before banking disbursement files can be downloaded.'
    },
    {
      q: 'Is PayPilot AI updated for the FY 2026-27 Union Budget tax slabs?',
      a: 'Yes. PayPilot AI incorporates the revised Section 115BAC slabs, Section 87A rebate adjustments up to ₹7,00,000 taxable income, the increased standard deduction of ₹75,000, and 4% Health & Education Cess for accurate monthly Section 192 TDS estimates.'
    },
    {
      q: 'Can we upload salary files directly to Indian corporate banking portals?',
      a: 'Yes. PayPilot AI produces one-click, verified CMS batch files formatted specifically for HDFC Enet, ICICI Corporate Internet Banking (CIB), and SBI CMP portals, as well as the standard #~# delimited ECR text file for the EPFO Unified Portal.'
    },
    {
      q: 'How is tenant data security and employee privacy enforced?',
      a: 'Every database query and background process is strictly partitioned by Organization ID (multi-tenant isolation). Employee records, bank accounts, and PANs are encrypted at rest with AES-256. Role-based access control (RBAC) ensures employees only see their own payslips, while administrators manage company-wide approvals.'
    },
    {
      q: 'Can we migrate our existing employee roster from spreadsheets?',
      a: 'Yes. PayPilot AI supports direct CSV and Excel roster imports with automatic statutory data validation for PAN, UAN, Bank Account number, and IFSC code formatting.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="apple-glass sticky top-0 z-40 border-b border-black/[0.06] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center font-bold text-white text-sm shadow-[0_2px_8px_rgba(0,0,0,0.15)] ring-1 ring-white/20">
              P
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900">PayPilot</span>
              <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.2 rounded-md bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                HCM
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#showcase" className="hover:text-slate-900 transition-colors">Platform</a>
            <a href="#calculator" className="hover:text-slate-900 transition-colors">Take-Home Calculator</a>
            <a href="#statutory" className="hover:text-slate-900 transition-colors">Statutory Engine</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onEnterApp}
              className="cursor-pointer hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100/80 hover:bg-slate-200/70 text-slate-800 border border-black/[0.05] transition-all shadow-2xs active:scale-[0.98]"
              title="Launch the live pre-seeded evaluation sandbox"
            >
              <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
              <span>Live Sandbox</span>
            </button>

            <button
              onClick={onOpenLogin}
              className="cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5"
            >
              Sign In
            </button>

            <button
              onClick={() => onOpenRegister('free_trial')}
              className="cursor-pointer px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.1)] active:scale-[0.98]"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-20 pb-24 bg-gradient-to-b from-slate-50/70 via-white to-slate-50 border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/[0.06] text-slate-700 text-xs font-medium shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Updated for FY 2026-27 Union Budget &bull; Section 115BAC &bull; EPFO ECR Direct Export</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.08] font-sans">
            Payroll Clarity. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-600 bg-clip-text text-transparent">
              Compliance Confidence.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Automate payroll operations, identify salary discrepancies, manage employee requests, and simplify statutory compliance — all from one intelligent platform built for Indian businesses.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onEnterApp}
              className="cursor-pointer w-full sm:w-auto px-7 py-3.5 rounded-full font-semibold text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Explore Interactive Demo</span>
            </button>

            <button
              onClick={() => onOpenRegister('free_trial')}
              className="cursor-pointer w-full sm:w-auto px-7 py-3.5 rounded-full font-semibold text-sm bg-white hover:bg-slate-50 text-slate-800 border border-black/[0.1] shadow-[0_2px_8px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Pre-seeded with Indian startup roster
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Codified statutory compliance
            </span>
          </div>
        </div>

        {/* 3. PRODUCT DEMO SHOWCASE (Realistic Enterprise UI) */}
        <div id="showcase" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="bg-white border border-black/[0.08] rounded-3xl shadow-[0_24px_70px_-15px_rgba(0,0,0,0.08)] overflow-hidden ring-1 ring-black/[0.03]">
            {/* Window Topbar & Metrics Ribbon */}
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-2xs" />
                  <span className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-2xs" />
                  <span className="w-3 h-3 rounded-full bg-[#27C93F] shadow-2xs" />
                </div>
                <span className="font-bold text-slate-900 ml-1">
                  PayPilot AI HCM Workspace &bull; October 2026 Cycle
                </span>
                <span className="hidden lg:inline text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                  Total Disbursed: ₹5,41,200 &bull; 6 Staff
                </span>
              </div>

              {/* Showcase Navigation Tabs */}
              <div className="apple-segmented-track">
                <button
                  onClick={() => setShowcaseTab('auditor')}
                  className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                    showcaseTab === 'auditor' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pre-Flight Auditor (4 Flags)
                </button>
                <button
                  onClick={() => setShowcaseTab('ledger')}
                  className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                    showcaseTab === 'ledger' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Salary Ledger
                </button>
                <button
                  onClick={() => setShowcaseTab('banking')}
                  className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                    showcaseTab === 'banking' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bank & EPFO Exports
                </button>
                <button
                  onClick={() => setShowcaseTab('payslip')}
                  className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                    showcaseTab === 'payslip' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Employee Payslip
                </button>
              </div>
            </div>

            {/* Showcase Tab 1: AI Pre-Flight Auditor */}
            {showcaseTab === 'auditor' && (
              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Automated Pre-Flight Gate: 3 Calculation Discrepancies Intercepted
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Money cannot leave the corporate account until these compliance flags are resolved or approved by an authorized administrator.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onEnterApp}
                    className="cursor-pointer shrink-0 text-xs font-semibold px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                  >
                    Test Resolution in App &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">HIGH</span>
                      <span className="font-mono text-[10px] text-slate-400">Rohan Verma (BTI-003)</span>
                    </div>
                    <p className="font-bold text-slate-900">Salary Spike (+53.6%)</p>
                    <p className="text-[11px] text-slate-600">
                      Gross salary jumped from ₹1,40,000 to ₹2,15,000 due to unapproved duplicate bonus entry.
                    </p>
                    <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-500">
                      Status: <strong>Withheld from bank file</strong>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">CRITICAL</span>
                      <span className="font-mono text-[10px] text-slate-400">Amit Patel (BTI-005)</span>
                    </div>
                    <p className="font-bold text-slate-900">Negative Net Salary (-₹7,000)</p>
                    <p className="text-[11px] text-slate-600">
                      Loan recovery deductions exceeded 50% statutory ceiling under the Payment of Wages Act.
                    </p>
                    <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-500">
                      Recommended: <strong>Cap monthly EMI to ₹15,000</strong>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">HIGH</span>
                      <span className="font-mono text-[10px] text-slate-400">Priya Sharma (BTI-002)</span>
                    </div>
                    <p className="font-bold text-slate-900">Attendance Mismatch (4 Days LOP)</p>
                    <p className="text-[11px] text-slate-600">
                      4 unapproved absent days logged in biometrics but 0 Loss of Pay applied in salary batch.
                    </p>
                    <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-500">
                      Impact: <strong>₹18,181.82 unbilled leakage</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Showcase Tab 2: Payroll Ledger */}
            {showcaseTab === 'ledger' && (
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Gross Earnings</th>
                      <th className="py-2.5 px-3">EPF (12%)</th>
                      <th className="py-2.5 px-3">PT</th>
                      <th className="py-2.5 px-3">TDS (192)</th>
                      <th className="py-2.5 px-3 font-bold text-slate-900">Net Salary</th>
                      <th className="py-2.5 px-3">Audit State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">Sneha Rao</p>
                        <p className="text-[10px] text-slate-400">BTI-001 &bull; Design Lead</p>
                      </td>
                      <td className="py-2.5 px-3 font-mono">₹80,000.00</td>
                      <td className="py-2.5 px-3 font-mono">₹1,800.00</td>
                      <td className="py-2.5 px-3 font-mono">₹200.00</td>
                      <td className="py-2.5 px-3 font-mono">₹2,500.00</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">₹75,500.00</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Check className="w-3 h-3" /> Clean
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">Rohan Verma</p>
                        <p className="text-[10px] text-slate-400">BTI-003 &bull; Lead Architect</p>
                      </td>
                      <td className="py-2.5 px-3 font-mono">₹1,40,000.00</td>
                      <td className="py-2.5 px-3 font-mono">₹1,800.00</td>
                      <td className="py-2.5 px-3 font-mono">₹200.00</td>
                      <td className="py-2.5 px-3 font-mono">₹19,350.00</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">₹1,18,650.00</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Flagged
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">Kavita Nair</p>
                        <p className="text-[10px] text-slate-400">BTI-006 &bull; HR Manager</p>
                      </td>
                      <td className="py-2.5 px-3 font-mono">₹91,000.00</td>
                      <td className="py-2.5 px-3 font-mono">₹1,800.00</td>
                      <td className="py-2.5 px-3 font-mono">₹200.00</td>
                      <td className="py-2.5 px-3 font-mono">₹3,800.00</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">₹85,200.00</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Check className="w-3 h-3" /> Clean
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Showcase Tab 3: Banking & EPFO Exports */}
            {showcaseTab === 'banking' && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">HDFC Enet CMS Batch</span>
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Direct NEFT/RTGS batch upload format for HDFC corporate internet banking with beneficiary IFSC validation.
                  </p>
                  <pre className="p-2 bg-white rounded border border-slate-200 text-[10px] font-mono text-slate-700 overflow-x-auto">
                    P,50100456123489,HDFC0001234,75500.00,Sneha Rao...
                  </pre>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">EPFO Unified Portal ECR</span>
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Standard #~# delimited text file ready for monthly Electronic Challan cum Return portal filing.
                  </p>
                  <pre className="p-2 bg-white rounded border border-slate-200 text-[10px] font-mono text-slate-700 overflow-x-auto">
                    100908070601#~#Sneha Rao#~#45000#~#15000#~#1800#~#1250#~#550
                  </pre>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">ICICI Corporate CIB</span>
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Multi-account salary disbursement format compatible with ICICI Bank Corporate Internet Banking.
                  </p>
                  <pre className="p-2 bg-white rounded border border-slate-200 text-[10px] font-mono text-slate-700 overflow-x-auto">
                    C,002105009876,ICIC0000021,93500.00,Priya Sharma...
                  </pre>
                </div>
              </div>
            )}

            {/* Showcase Tab 4: Employee Payslip Preview */}
            {showcaseTab === 'payslip' && (
              <div className="p-6 bg-slate-50 flex justify-center">
                <div className="bg-white border border-slate-200 rounded-lg p-5 max-w-xl w-full shadow-xs space-y-4 text-xs">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">BharatTech Innovations Pvt. Ltd.</h4>
                      <p className="text-[10px] text-slate-400">Koramangala, Bengaluru, Karnataka &bull; TAN: BLRB12345C</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600">Payslip &bull; October 2026</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px] bg-slate-50 p-2.5 rounded border border-slate-100">
                    <div>Employee: <strong>Rohan Verma</strong></div>
                    <div>Employee Code: <strong>BTI-003</strong></div>
                    <div>Department: <strong>Engineering</strong></div>
                    <div>Designation: <strong>Lead Architect</strong></div>
                    <div>PAN: <strong>ABCDE1234F</strong></div>
                    <div>Bank Account: <strong>UTIB0000128 &bull; ****8912</strong></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">Earnings</p>
                      <div className="space-y-1 text-slate-600">
                        <div className="flex justify-between"><span>Basic Salary</span><span className="font-mono">₹70,000.00</span></div>
                        <div className="flex justify-between"><span>House Rent Allowance</span><span className="font-mono">₹35,000.00</span></div>
                        <div className="flex justify-between"><span>Special Allowance</span><span className="font-mono">₹35,000.00</span></div>
                        <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                          <span>Total Gross</span><span className="font-mono">₹1,40,000.00</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">Deductions</p>
                      <div className="space-y-1 text-slate-600">
                        <div className="flex justify-between"><span>Provident Fund (EPF)</span><span className="font-mono">₹1,800.00</span></div>
                        <div className="flex justify-between"><span>Professional Tax (PT)</span><span className="font-mono">₹200.00</span></div>
                        <div className="flex justify-between"><span>Income Tax (TDS 192)</span><span className="font-mono">₹19,350.00</span></div>
                        <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                          <span>Net Disbursed</span><span className="font-mono text-indigo-700">₹1,18,650.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE TAKE-HOME SALARY CALCULATOR */}
      <section id="calculator" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Statutory Calculation Engine</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Indian CTC to Net Take-Home Calculator
            </p>
            <p className="text-xs text-slate-500">
              Deterministic, 100% reconciled compensation breakdown codified for Union Budget FY 2026-27 Section 115BAC.
            </p>
          </div>

          <div className="apple-card p-6 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.05)] border border-black/[0.06] grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Controls */}
            <div className="lg:col-span-6 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-900">Annual Cost to Company (CTC)</label>
                  <span className="text-base font-bold text-slate-900 font-mono">{formatINR(calcAnnualCtc)}</span>
                </div>
                <input
                  type="range"
                  min={300000}
                  max={5000000}
                  step={50000}
                  value={calcAnnualCtc}
                  onChange={(e) => setCalcAnnualCtc(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span>₹3.0L</span>
                  <div className="flex gap-1.5">
                    {[600000, 1200000, 2500000, 5000000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCalcAnnualCtc(preset)}
                        className={`cursor-pointer px-1.5 py-0.5 rounded border text-[9px] font-mono transition-colors ${
                          calcAnnualCtc === preset
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {preset >= 10000000 ? `${preset / 10000000}Cr` : `${preset / 100000}L`}
                      </button>
                    ))}
                  </div>
                  <span>₹50.0L</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-900 block mb-1.5">Tax Regime</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setCalcRegime('new')}
                    className={`cursor-pointer p-2.5 rounded-lg border text-left transition-colors ${
                      calcRegime === 'new'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold">New Tax Regime</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Section 115BAC &bull; ₹75k Standard Deduction</p>
                  </button>

                  <button
                    onClick={() => setCalcRegime('old')}
                    className={`cursor-pointer p-2.5 rounded-lg border text-left transition-colors ${
                      calcRegime === 'old'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold">Old Tax Regime</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">80C, 80D, HRA & Interest Deductions</p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-900 block mb-1.5">Employment State (PT)</label>
                  <select
                    value={calcState}
                    onChange={(e) => setCalcState(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white outline-none cursor-pointer"
                  >
                    <option value="Karnataka">Karnataka (₹200/mo)</option>
                    <option value="Maharashtra">Maharashtra (₹200 / ₹300 Feb)</option>
                    <option value="Telangana">Telangana (₹200/mo)</option>
                    <option value="Gujarat">Gujarat (₹200/mo)</option>
                    <option value="West Bengal">West Bengal (₹200/mo)</option>
                    <option value="Delhi">Delhi (Zero PT State)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-900 block mb-1.5">Provident Fund (EPF)</label>
                  <select
                    value={calcPfCapped ? 'capped' : 'actual'}
                    onChange={(e) => setCalcPfCapped(e.target.value === 'capped')}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white outline-none cursor-pointer"
                  >
                    <option value="capped">Statutory Capped (₹1,800/mo)</option>
                    <option value="actual">Actual Basic (12% Uncapped)</option>
                  </select>
                </div>
              </div>

              {/* Assumptions & Compliance Transparency */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Fiscal Assessment Year:</span>
                  <span className="font-mono text-slate-900">{breakdown.metadata.financialYear}</span>
                </div>
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Standard Deduction:</span>
                  <span className="font-mono text-slate-900">₹{breakdown.metadata.standardDeductionAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-medium text-slate-700">
                  <span>EPF Wage Ceiling:</span>
                  <span className="font-mono text-slate-900">₹{breakdown.metadata.epfWageCeiling.toLocaleString('en-IN')}/mo (12% = ₹1,800)</span>
                </div>
                <div className="flex justify-between font-medium text-slate-700">
                  <span>ESIC Wage Threshold:</span>
                  <span className="font-mono text-slate-900">&le; ₹{breakdown.metadata.esicThresholdMonthly.toLocaleString('en-IN')}/mo</span>
                </div>
              </div>
            </div>

            {/* Right Computed Breakdown */}
            <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Monthly Take-Home</span>
                <p className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
                  {formatINR(breakdown.monthlyTakeHome)}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                  <span>Gross: <strong className="text-slate-800 font-mono">{formatINR(breakdown.monthlyGross)}/mo</strong></span>
                  <span>&bull;</span>
                  <span>Annual In-Hand: <strong className="text-indigo-700 font-mono">{formatINR(breakdown.annualTakeHome)}</strong></span>
                  <span>&bull;</span>
                  <span>CTC Reconciled: <strong className="text-slate-800 font-mono">{formatINR(breakdown.reconciledAnnualEmployerCost)}</strong></span>
                </div>
              </div>

              {/* Itemized Deductions & Employer Contributions */}
              <div className="space-y-2 text-xs border-t border-slate-200 pt-3">
                <div className="flex justify-between text-slate-600">
                  <span>Basic Wage (50% of Gross)</span>
                  <span className="font-mono font-medium text-slate-800">{formatINR(breakdown.basicSalary)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>House Rent Allowance (HRA, 25%)</span>
                  <span className="font-mono font-medium text-slate-800">{formatINR(breakdown.hra)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Special Allowance</span>
                  <span className="font-mono font-medium text-slate-800">{formatINR(breakdown.specialAllowance)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200/80">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Monthly Withholdings</p>
                    <span className="text-[10px] font-mono font-bold text-red-600">-{formatINR(breakdown.totalMonthlyDeductions)}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Employee PF (12%{calcPfCapped ? ' capped at ₹1,800' : ' uncapped'})</span>
                      <span className="font-mono font-medium text-red-600">-{formatINR(breakdown.employeePf)}</span>
                    </div>
                    {breakdown.employeeEsi > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Employee ESI (0.75% for Gross &le; ₹21k)</span>
                        <span className="font-mono font-medium text-red-600">-{formatINR(breakdown.employeeEsi)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Professional Tax ({calcState})</span>
                      <span className="font-mono font-medium text-red-600">-{formatINR(breakdown.professionalTax)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Monthly TDS (Section 192 Income Tax)</span>
                      <span className="font-mono font-medium text-red-600">-{formatINR(breakdown.monthlyTds)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employer Contributions (Reconciled in CTC)</p>
                    <span className="text-[10px] font-mono font-bold text-slate-700">+{formatINR(breakdown.totalMonthlyEmployerContribution)}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Employer PF ({breakdown.employerPfEps > 0 ? `EPS ₹${breakdown.employerPfEps} + EPF ₹${breakdown.employerPfEpf}` : '12%'})</span>
                      <span className="font-mono font-medium text-slate-800">+{formatINR(breakdown.employerPf)}</span>
                    </div>
                    {breakdown.employerEsi > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Employer ESI (3.25%)</span>
                        <span className="font-mono font-medium text-slate-800">+{formatINR(breakdown.employerEsi)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-700 font-semibold pt-1 border-t border-slate-200">
                      <span>Total Reconciled Monthly Cost (Gross + Co-Contrib)</span>
                      <span className="font-mono text-slate-900">{formatINR(breakdown.reconciledMonthlyEmployerCost)}</span>
                    </div>
                  </div>
                </div>

                {/* Annual Itemized Tax Summary */}
                <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Annual Taxable Income (after ₹{breakdown.metadata.standardDeductionAmount / 1000}k std ded):</span>
                    <span className="font-mono font-medium text-slate-800">{formatINR(breakdown.taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Annual Tax Liability (with 4% cess):</span>
                    <span className="font-mono font-medium text-slate-800">{formatINR(breakdown.totalAnnualTax)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <button
                  onClick={onEnterApp}
                  className="cursor-pointer w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors text-center shadow-2xs"
                >
                  Configure Salary Structures in PayPilot AI &rarr;
                </button>
                <p className="text-[10px] text-slate-400 text-center leading-tight">
                  {breakdown.metadata.disclaimer} Effective: {breakdown.metadata.effectiveDate}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INDIAN STATUTORY COMPLIANCE ARCHITECTURE */}
      <section id="statutory" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-14">
            <h2 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Statutory Foundations</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Pre-Configured for Complete Central & State Compliance
            </p>
            <p className="text-slate-600 text-xs max-w-xl mx-auto">
              Never worry about compliance audits or notice letters. Every statutory calculation follows codified Indian labor and tax law.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
            <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-2.5">
              <div className="w-8 h-8 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
                EPF
              </div>
              <h3 className="text-sm font-bold text-slate-900">Employees&apos; Provident Fund</h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Enforces the statutory 12% contribution with a ₹1,800 monthly cap (based on the ₹15,000 wage ceiling) or actual basic salary. Splits employer contribution into 3.67% EPF and 8.33% EPS.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-2.5">
              <div className="w-8 h-8 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
                ESI
              </div>
              <h3 className="text-sm font-bold text-slate-900">ESIC Medical Insurance</h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Applies automatically to employees whose monthly gross wages are ₹21,000 or below (0.75% employee contribution, 3.25% employer contribution). Automatically disengages above the threshold.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-2.5">
              <div className="w-8 h-8 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
                PT
              </div>
              <h3 className="text-sm font-bold text-slate-900">Multi-State Professional Tax</h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Built-in state schedules for Karnataka (₹200/mo above ₹15,000), Maharashtra (₹200/mo and ₹300 in February), Telangana, West Bengal, Tamil Nadu, and zero-PT jurisdictions.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-2.5">
              <div className="w-8 h-8 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
                TDS
              </div>
              <h3 className="text-sm font-bold text-slate-900">Section 192 Income Tax</h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Computes monthly TDS withholding for FY 2026-27 under the default Section 115BAC New Tax Regime with ₹75,000 standard deduction, Section 87A rebate, and 4% Health & Education cess.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRANSPARENT COMMERCIAL PRICING MATRIX */}
      <section id="pricing" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Predictable Subscriptions</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Transparent, Per-Organization Pricing
            </p>
            <p className="text-xs text-slate-500">
              No hidden setup fees. Scale your workforce up or down anytime.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="pt-4 flex items-center justify-center">
              <div className="apple-segmented-track">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`cursor-pointer px-4 py-1.5 rounded transition-colors ${
                    billingCycle === 'monthly' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`cursor-pointer px-4 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                    billingCycle === 'annual' ? 'bg-indigo-700 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Annual Billing</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                    Save 17%
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 text-xs">
            {/* Free Trial */}
            <div className="p-6 rounded-lg bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
              <div>
                <h3 className="font-bold text-base text-slate-900">14-Day Trial</h3>
                <p className="text-slate-500 text-xs mt-1">Full evaluation for Indian startups.</p>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">₹0</span>
                </div>
                <ul className="mt-5 space-y-2.5 text-slate-600">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Up to 10 Employees</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Complete Statutory Engine</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> 3 AI Auditor Runs</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Form 16 & Payslip PDF</li>
                </ul>
              </div>
              <button
                onClick={() => onOpenRegister('free_trial')}
                className="cursor-pointer w-full mt-8 py-2 rounded-md font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors"
              >
                Start Free Trial
              </button>
            </div>

            {/* Starter */}
            <div className="p-6 rounded-lg bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
              <div>
                <h3 className="font-bold text-base text-slate-900">Starter</h3>
                <p className="text-slate-500 text-xs mt-1">For growing teams up to 25.</p>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">
                    {billingCycle === 'annual' ? '₹1,666' : '₹1,999'}
                  </span>
                  <span className="text-slate-500 text-xs">/month</span>
                </div>
                <ul className="mt-5 space-y-2.5 text-slate-600">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Up to 25 Employees</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Unlimited AI Auditor Runs</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> HDFC / ICICI Bank CMS CSV</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Attendance & Leave Workflow</li>
                </ul>
              </div>
              <button
                onClick={() => onOpenRegister('starter')}
                className="cursor-pointer w-full mt-8 py-2 rounded-md font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors"
              >
                Choose Starter
              </button>
            </div>

            {/* Growth (Recommended) */}
            <div className="p-6 rounded-lg bg-white border-2 border-indigo-600 flex flex-col justify-between relative shadow-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Recommended
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Growth</h3>
                <p className="text-slate-500 text-xs mt-1">Scale-ups with up to 100 headcount.</p>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">
                    {billingCycle === 'annual' ? '₹4,166' : '₹4,999'}
                  </span>
                  <span className="text-slate-500 text-xs">/month</span>
                </div>
                <ul className="mt-5 space-y-2.5 text-slate-600">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Up to 100 Employees</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Maker-Checker Dual Approvals</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> EPFO ECR #~# Text Export</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Multi-State PT Customization</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> AI Employee Assistant</li>
                </ul>
              </div>
              <button
                onClick={() => onOpenRegister('growth')}
                className="cursor-pointer w-full mt-8 py-2 rounded-md font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs"
              >
                Choose Growth
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-lg bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
              <div>
                <h3 className="font-bold text-base text-slate-900">Enterprise</h3>
                <p className="text-slate-500 text-xs mt-1">Custom multi-entity enterprises.</p>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">
                    {billingCycle === 'annual' ? '₹12,499' : '₹14,999'}
                  </span>
                  <span className="text-slate-500 text-xs">/month</span>
                </div>
                <ul className="mt-5 space-y-2.5 text-slate-600">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Unlimited Employees</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Dedicated Payroll Specialist</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Custom ERP & HRMS Connectors</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Custom Multi-Tenant Isolation</li>
                </ul>
              </div>
              <a
                href="#contact"
                className="w-full mt-8 py-2 rounded-md font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors text-center block"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CONTACT SALES / DEMO WALKTHROUGH */}
      <section id="contact" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-xs">
            <div className="text-center max-w-lg mx-auto mb-8 space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Request an Enterprise Walkthrough</h2>
              <p className="text-slate-500">
                Experience how PayPilot AI protects your organization from statutory penalties and unbilled salary leakages.
              </p>
            </div>

            {contactSubmitted ? (
              <div className="p-6 rounded-lg bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900">Demonstration Request Received</h3>
                <p className="text-slate-600 max-w-md mx-auto text-xs">
                  A certified payroll specialist will reach out within two business hours to coordinate your custom walkthrough.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikramaditya Sharma"
                      value={contactForm.full_name}
                      onChange={(e) => setContactForm({ ...contactForm, full_name: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 bg-white placeholder-slate-400 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">Corporate Work Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="vikram@yourcompany.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 bg-white placeholder-slate-400 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">Company Legal Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Acme Tech India Pvt Ltd"
                      value={contactForm.company_name}
                      onChange={(e) => setContactForm({ ...contactForm, company_name: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 bg-white placeholder-slate-400 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 bg-white placeholder-slate-400 font-mono outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">Current Headcount</label>
                    <select
                      value={contactForm.employee_range}
                      onChange={(e) => setContactForm({ ...contactForm, employee_range: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 bg-white outline-none cursor-pointer focus:border-indigo-600"
                    >
                      <option value="1-10">1 - 10 employees</option>
                      <option value="10-50">10 - 50 employees</option>
                      <option value="50-200">50 - 200 employees</option>
                      <option value="200+">200+ employees</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Current Payroll Challenge / Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about your current challenges (e.g. unbilled leaves, EPF ECR generation, multi-state PT schedules)..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 bg-white placeholder-slate-400 outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingContact}
                    className="cursor-pointer px-5 py-2.5 rounded-lg font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-2 shadow-2xs"
                  >
                    <span>{submittingContact ? 'Submitting...' : 'Schedule Technical Walkthrough'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 8. ENTERPRISE FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-1">
            <h2 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Technical Documentation & FAQ</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="cursor-pointer w-full p-4 text-left flex items-center justify-between text-xs font-bold text-slate-900 hover:text-indigo-700 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. ENTERPRISE FOOTER */}
      <footer className="bg-white py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center font-bold text-white text-xs">
                P
              </div>
              <span className="font-bold text-sm text-slate-900">PayPilot AI Technologies Pvt. Ltd.</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 font-medium">
              <button
                type="button"
                className="hover:text-slate-900 cursor-pointer bg-transparent border-none p-0 text-xs font-medium text-slate-600"
                onClick={() => {
                  setLegalTab('terms');
                  setIsLegalModalOpen(true);
                }}
              >
                Terms of Service
              </button>
              <button
                type="button"
                className="hover:text-slate-900 cursor-pointer bg-transparent border-none p-0 text-xs font-medium text-slate-600"
                onClick={() => {
                  setLegalTab('privacy');
                  setIsLegalModalOpen(true);
                }}
              >
                Privacy Policy (DPDP)
              </button>
              <button
                type="button"
                className="hover:text-slate-900 cursor-pointer bg-transparent border-none p-0 text-xs font-medium text-slate-600"
                onClick={() => {
                  setLegalTab('refund');
                  setIsLegalModalOpen(true);
                }}
              >
                Refund Policy
              </button>
              <button
                type="button"
                className="hover:text-slate-900 cursor-pointer bg-transparent border-none p-0 text-xs font-medium text-slate-600"
                onClick={() => {
                  setLegalTab('security');
                  setIsLegalModalOpen(true);
                }}
              >
                Security & VDP
              </button>
              <span className="hover:text-slate-900 cursor-pointer" onClick={onEnterApp}>Interactive Sandbox</span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>&copy; {new Date().getFullYear()} PayPilot AI Technologies Pvt. Ltd. All rights reserved.</p>
            <p className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>DPDP Act 2023 Compliant &bull; 256-bit AES Tenant Encryption &bull; ISO-Ready Architecture</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Trust & Legal Compliance Modal */}
      <LegalCenterModal
        isOpen={isLegalModalOpen}
        initialTab={legalTab}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* Floating Cookie Consent Banner */}
      <CookieBanner
        onOpenLegalPrivacy={() => {
          setLegalTab('privacy');
          setIsLegalModalOpen(true);
        }}
      />
    </div>
  );
};
