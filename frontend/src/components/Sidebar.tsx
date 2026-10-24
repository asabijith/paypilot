import React from 'react';
import {
  LayoutDashboard, Users, CalendarCheck, CalendarDays,
  Calculator, ShieldAlert, BotMessageSquare,
  Receipt, Settings, FileBarChart, Sparkles,
  Wallet, Percent, Globe, FileCheck2, Camera
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  openDiscrepanciesCount?: number;
  userRole?: UserRole;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavSection {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
    roles: string[];
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  openDiscrepanciesCount = 4,
  userRole = 'admin',
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const isEmployee = userRole === 'employee';

  const sections: NavSection[] = [
    {
      title: isEmployee ? 'Self-Service' : 'Workspace',
      items: [
        {
          id: 'dashboard',
          label: 'Overview',
          icon: LayoutDashboard,
          roles: ['admin', 'payroll_admin', 'employee', 'owner'],
        },
        {
          id: 'intelligence',
          label: 'AI Intelligence',
          icon: Sparkles,
          badge: 'PRO',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
          roles: ['admin', 'payroll_admin', 'employee', 'owner'],
        },
        {
          id: 'employees',
          label: isEmployee ? 'My Profile' : 'Employees',
          icon: Users,
          roles: ['admin', 'payroll_admin', 'employee', 'owner'],
        },
        {
          id: 'attendance',
          label: 'Attendance & Face ID',
          icon: CalendarCheck,
          roles: ['admin', 'payroll_admin', 'employee', 'owner'],
        },
        {
          id: 'leave',
          label: 'Leave Management',
          icon: CalendarDays,
          roles: ['admin', 'payroll_admin', 'employee', 'owner'],
        },
      ],
    },
    {
      title: 'Finance & Payroll',
      items: [
        {
          id: 'payroll',
          label: 'Payroll Operations',
          icon: Calculator,
          roles: ['admin', 'payroll_admin', 'owner'],
        },
        {
          id: 'payslips',
          label: 'Payslips & Tax Form',
          icon: Receipt,
          roles: ['admin', 'payroll_admin', 'employee', 'owner'],
        },
        {
          id: 'expenses',
          label: 'Expenses & Claims',
          icon: Wallet,
          roles: ['admin', 'payroll_admin', 'employee', 'owner'],
        },
        {
          id: 'tax_vault',
          label: 'Tax Vault & 12BB',
          icon: Percent,
          roles: ['admin', 'payroll_admin', 'employee', 'owner'],
        },
      ],
    },
    {
      title: 'Compliance & Audit',
      items: [
        {
          id: 'auditor',
          label: 'AI Payroll Auditor',
          icon: ShieldAlert,
          badge: openDiscrepanciesCount > 0 ? openDiscrepanciesCount : undefined,
          badgeColor: 'bg-rose-500/10 text-rose-600 border border-rose-500/20 font-bold',
          roles: ['admin', 'payroll_admin', 'owner'],
        },
        {
          id: 'contractors',
          label: 'Global Contractors',
          icon: Globe,
          roles: ['admin', 'payroll_admin', 'owner'],
        },
        {
          id: 'compliance',
          label: 'Statutory Compliance',
          icon: FileCheck2,
          roles: ['admin', 'payroll_admin', 'owner'],
        },
        {
          id: 'reports',
          label: 'Reports & ECR Batch',
          icon: FileBarChart,
          roles: ['admin', 'payroll_admin', 'owner'],
        },
      ],
    },
    {
      title: 'Assistant & Tools',
      items: [
        {
          id: 'assistant',
          label: 'AI Salary Copilot',
          icon: BotMessageSquare,
          roles: ['admin', 'payroll_admin', 'employee', 'owner'],
        },
        {
          id: 'settings',
          label: 'Settings & Security',
          icon: Settings,
          roles: ['admin', 'payroll_admin', 'owner'],
        },
      ],
    },
  ];

  const renderNavContent = () => (
    <div className="py-4 px-3 flex-1 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-5">
        {sections.map((section, sIdx) => {
          const visibleItems = section.items.filter((item) =>
            item.roles.includes(userRole || 'admin')
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
                {section.title}
              </div>

              <nav className="space-y-0.5" aria-label={section.title}>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile?.();
                      }}
                      className={`cursor-pointer w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all duration-150 group ${
                        isActive
                          ? 'bg-white text-slate-900 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-black/[0.05]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            isActive
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-900'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-2 py-0.2 rounded-full font-bold ml-1 shrink-0 ${
                            item.badgeColor || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Apple-style subtle enterprise footer */}
      <div className="pt-4 mt-6 border-t border-black/[0.05] px-2 space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>PayPilot OS 2.0</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
        <p className="text-[10px] text-slate-400">Section 115BAC & EPFO ECR Ready</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (macOS style) */}
      <aside className="hidden lg:flex w-64 bg-slate-50/70 border-r border-black/[0.06] flex-col justify-between select-none no-print shrink-0 min-h-[calc(100vh-53px)]">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] apple-glass h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="p-3.5 border-b border-black/[0.06] flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 tracking-tight">Navigation Menu</span>
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Close navigation menu"
              >
                ✕
              </button>
            </div>
            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
};
