import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Calculator, Camera, ShieldAlert, Users, CalendarCheck,
  CalendarDays, Receipt, FileBarChart, Settings, Sparkles,
  Play, Lock, Download, RotateCcw, ArrowRight, UserCheck, Scale, Check,
  Wallet, Percent, Globe, FileCheck2
} from 'lucide-react';
import { User } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onSwitchUser?: (userId: string) => void;
  onLockSession?: () => void;
  onOpenLegal?: () => void;
  demoUsers?: User[];
  currentUser?: User | null;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Switch Persona';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  badge?: string;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSwitchUser,
  onLockSession,
  onOpenLegal,
  demoUsers = [],
  currentUser,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const items: CommandItem[] = [
    // 1. Navigation
    {
      id: 'nav_dashboard',
      category: 'Navigation',
      title: 'Go to Overview Dashboard',
      subtitle: 'Workforce KPIs & active payroll cycle',
      icon: Calculator,
      action: () => { onNavigateTab('dashboard'); onClose(); }
    },
    {
      id: 'nav_auditor',
      category: 'Navigation',
      title: 'Go to AI Payroll Auditor',
      subtitle: 'Mathematical discrepancy & statutory gates',
      icon: ShieldAlert,
      badge: 'Auditor',
      action: () => { onNavigateTab('auditor'); onClose(); }
    },
    {
      id: 'nav_payroll',
      category: 'Navigation',
      title: 'Go to Payroll Processing',
      subtitle: 'Calculate salary ledgers & bank batches',
      icon: Calculator,
      action: () => { onNavigateTab('payroll'); onClose(); }
    },
    {
      id: 'nav_attendance',
      category: 'Navigation',
      title: 'Go to Attendance & Muster Roll',
      subtitle: 'Biometric logs, workdays & LOP deduction',
      icon: CalendarCheck,
      action: () => { onNavigateTab('attendance'); onClose(); }
    },
    {
      id: 'nav_leave',
      category: 'Navigation',
      title: 'Go to Leave Management',
      subtitle: 'Casual, Sick, Earned & Duty Leaves (OD)',
      icon: CalendarDays,
      action: () => { onNavigateTab('leave'); onClose(); }
    },
    {
      id: 'nav_employees',
      category: 'Navigation',
      title: 'Go to Employee Directory',
      subtitle: 'Workforce profiles, PAN & bank credentials',
      icon: Users,
      action: () => { onNavigateTab('employees'); onClose(); }
    },
    {
      id: 'nav_intelligence',
      category: 'Navigation',
      title: 'Go to Intelligence Center & Digital Twin',
      subtitle: 'Forecasts, radar & salary hike simulations',
      icon: Sparkles,
      badge: 'PRO',
      action: () => { onNavigateTab('intelligence'); onClose(); }
    },
    {
      id: 'nav_payslips',
      category: 'Navigation',
      title: 'Go to Official Payslips',
      subtitle: 'Form 16 verified printable compensation slips',
      icon: Receipt,
      action: () => { onNavigateTab('payslips'); onClose(); }
    },
    {
      id: 'nav_expenses',
      category: 'Navigation',
      title: 'Go to FinOps & Expense Claims',
      subtitle: 'Section 10 reimbursements, salary advances & bank CMS',
      icon: Wallet,
      action: () => { onNavigateTab('expenses'); onClose(); }
    },
    {
      id: 'nav_tax_vault',
      category: 'Navigation',
      title: 'Go to Tax Optimization & Form 12BB Vault',
      subtitle: 'Section 115BAC dual-regime comparator & proof audit',
      icon: Percent,
      badge: '115BAC',
      action: () => { onNavigateTab('tax_vault'); onClose(); }
    },
    {
      id: 'nav_contractors',
      category: 'Navigation',
      title: 'Go to Global Contractors Hub',
      subtitle: 'Multi-currency FX invoices, 194J TDS & SWIFT wires',
      icon: Globe,
      badge: 'CROSS-BORDER',
      action: () => { onNavigateTab('contractors'); onClose(); }
    },
    {
      id: 'nav_compliance',
      category: 'Navigation',
      title: 'Go to Statutory Returns & Compliance Vault',
      subtitle: 'EPFO, ESIC, Section 234E penalty radar & Form 16 / 24Q',
      icon: FileCheck2,
      badge: 'CALENDAR',
      action: () => { onNavigateTab('compliance'); onClose(); }
    },
    {
      id: 'nav_reports',
      category: 'Navigation',
      title: 'Go to Statutory Reports',
      subtitle: 'Monthly remittance ledgers & bank batches',
      icon: FileBarChart,
      action: () => { onNavigateTab('reports'); onClose(); }
    },
    {
      id: 'nav_settings',
      category: 'Navigation',
      title: 'Go to Company Settings',
      subtitle: 'Corporate registration & statutory policies',
      icon: Settings,
      action: () => { onNavigateTab('settings'); onClose(); }
    },

    // 2. Fast Actions
    {
      id: 'act_face_punch',
      category: 'Actions',
      title: 'Face Recognition Punch-In (AI Biometric)',
      subtitle: 'Google Teachable Machine camera punch-in & instant log',
      icon: Camera,
      badge: 'AI CAMERA',
      action: () => { onNavigateTab('attendance'); onClose(); }
    },
    {
      id: 'act_audit',
      category: 'Actions',
      title: 'Run AI Pre-Flight Audit Scan',
      subtitle: 'Scan active ledger against all 4 statutory gates',
      icon: ShieldAlert,
      action: () => { onNavigateTab('auditor'); onClose(); }
    },
    {
      id: 'act_lock',
      category: 'Actions',
      title: 'Lock Financial Session',
      subtitle: 'Protect salary registers and sensitive PAN/KYC',
      icon: Lock,
      action: () => { onLockSession?.(); onClose(); }
    },
    {
      id: 'act_legal',
      category: 'Actions',
      title: 'Open Trust & Legal Compliance Center',
      subtitle: 'DPDP Act 2023, Terms of Service & SLAs',
      icon: Scale,
      action: () => { onOpenLegal?.(); onClose(); }
    },

    // 3. Switch Persona
    ...demoUsers.map((u) => ({
      id: `user_${u.id}`,
      category: 'Switch Persona' as const,
      title: `Switch to ${u.full_name}`,
      subtitle: `${u.designation} • ${u.role.toUpperCase()}`,
      icon: UserCheck,
      badge: u.role,
      action: () => { onSwitchUser?.(u.id); onClose(); }
    }))
  ];

  const filtered = items.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Group filtered items by category
  const categories = Array.from(new Set(filtered.map((item) => item.category)));

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="apple-glass rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.18)] border border-black/[0.08] w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-black/[0.06] gap-3 bg-white/50">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, page, or persona..."
            className="w-full text-xs text-slate-900 bg-transparent outline-none placeholder-slate-400 font-medium"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 flex-1 text-xs divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center space-y-1 text-slate-400">
              <Search className="w-6 h-6 mx-auto mb-2 text-slate-300" />
              <p className="font-medium text-slate-600">No matching commands</p>
              <p className="text-[11px]">Try searching for &quot;payroll&quot;, &quot;auditor&quot;, or &quot;leave&quot;</p>
            </div>
          ) : (
            categories.map((category) => {
              const categoryItems = filtered.filter((i) => i.category === category);
              return (
                <div key={category} className="py-1.5 first:pt-0 last:pb-0">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {category}
                  </div>
                  <div className="space-y-0.5">
                    {categoryItems.map((item) => {
                      const itemGlobalIndex = filtered.indexOf(item);
                      const isSelected = itemGlobalIndex === selectedIndex;
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.id}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(itemGlobalIndex)}
                          className={`cursor-pointer w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-950 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isSelected ? 'text-indigo-600' : 'text-slate-400'
                              }`}
                            />
                            <div className="truncate">
                              <p className="truncate text-xs">{item.title}</p>
                              {item.subtitle && (
                                <p className="text-[10px] text-slate-400 truncate font-normal">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {item.badge && (
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {item.badge}
                              </span>
                            )}
                            {isSelected && (
                              <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] text-slate-500">↑↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] text-slate-500">↵</kbd> to select
            </span>
          </div>
          <span>PayPilot AI Spotlight</span>
        </div>
      </div>
    </div>
  );
};
