import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import {
  Shield, UserCheck, Users, RotateCcw,
  ChevronDown, Check, Play, Building2, Menu, X as CloseIcon, Lock, Calendar, Search, Sparkles
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface NavbarProps {
  currentUser: User | null;
  demoUsers: User[];
  onSwitchUser: (userId: string) => void;
  onOpenGuidedDemo: () => void;
  onResetData: () => void;
  onOpenSubscription?: () => void;
  onNavigateLanding?: () => void;
  onOpenAuth?: () => void;
  onLockSession?: () => void;
  onOpenCommandPalette?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  demoUsers,
  onSwitchUser,
  onOpenGuidedDemo,
  onResetData,
  onOpenSubscription,
  onNavigateLanding,
  onOpenAuth,
  onLockSession,
  onOpenCommandPalette,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConfirmReset = async () => {
    setShowResetConfirm(false);
    setResetting(true);
    await onResetData();
    setResetting(false);
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner':
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900 text-white shadow-xs">
            <Shield className="w-2.5 h-2.5" /> {role === 'owner' ? 'Owner' : 'Admin'}
          </span>
        );
      case 'payroll_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <UserCheck className="w-2.5 h-2.5 text-indigo-600" /> Payroll Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
            <Users className="w-2.5 h-2.5 text-slate-500" /> Employee
          </span>
        );
    }
  };

  return (
    <header className="apple-glass sticky top-0 z-30 px-4 sm:px-6 py-2.5 flex items-center justify-between no-print transition-all duration-200">
      {/* Brand & Organization */}
      <div className="flex items-center gap-3 sm:gap-5">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors focus-visible:outline-none"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen ? (
              <CloseIcon className="w-5 h-5 text-slate-700" />
            ) : (
              <Menu className="w-5 h-5 text-slate-700" />
            )}
          </button>
        )}

        {/* Apple-style Logo & Wordmark */}
        <div
          onClick={onNavigateLanding}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
          title="Go to Public Marketing Website"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center text-white font-extrabold text-sm shadow-[0_2px_8px_rgba(0,0,0,0.15)] ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-200">
            P
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              PayPilot
            </span>
            <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.2 rounded-md bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              AI
            </span>
          </div>
        </div>

        {/* Company Context Pill */}
        <div className="hidden md:flex items-center gap-2 pl-4 border-l border-black/[0.06] text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/70 border border-black/[0.04]">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[200px]">{currentUser?.company?.name || 'BharatTech Innovations Pvt. Ltd.'}</span>
          </div>
        </div>

        {/* Live Real-Time Date & Statutory Fiscal Year */}
        <div className="hidden xl:flex items-center gap-2 pl-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-black/[0.06] text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              {new Intl.DateTimeFormat('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }).format(new Date())}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono font-medium border border-black/[0.06] px-2.5 py-1 rounded-full bg-white/60">
            FY 2026-27 Active
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Spotlight Command Palette Trigger */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="cursor-pointer hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-black/[0.06] bg-slate-100/80 hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 transition-all text-xs shadow-[0_1px_2px_rgba(0,0,0,0.02)] group"
            title="Press ⌘K or Ctrl+K to jump to commands, employees & reports"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            <span className="font-medium text-slate-600">Spotlight search...</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-white border border-black/[0.08] text-[10px] font-mono text-slate-500 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Subscription Plan Pill */}
        {onOpenSubscription && (
          <button
            onClick={onOpenSubscription}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200/60 shadow-2xs transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span className="capitalize">{currentUser?.company?.plan_tier || 'Growth'} Plan</span>
          </button>
        )}

        {/* Lock Financial Session */}
        {onLockSession && (
          <button
            onClick={onLockSession}
            title="Lock financial session (idle protection)"
            className="cursor-pointer p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            <Lock className="w-4 h-4 text-slate-600" />
          </button>
        )}

        {/* User Profile & Enterprise Context Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="cursor-pointer flex items-center gap-2 p-1 sm:pr-2.5 rounded-full border border-black/[0.06] hover:border-black/[0.12] bg-white hover:bg-slate-50 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-b from-slate-900 to-slate-700 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {currentUser?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                <span className="max-w-[120px] truncate">{currentUser?.full_name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </button>

          {/* Apple-styled Glass Dropdown */}
          {roleDropdownOpen && (
            <div className="apple-glass absolute right-0 mt-2 w-80 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.12)] border border-black/[0.08] p-2 z-50 text-xs animate-in zoom-in-95 duration-150">
              {/* Profile Card */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-black/[0.04] mb-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                    {currentUser?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-xs truncate">{currentUser?.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-black/[0.04]">
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {currentUser?.role}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">
                    {currentUser?.company?.name}
                  </span>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="py-1 space-y-0.5 border-b border-black/[0.04]">
                <button
                  onClick={() => {
                    onOpenGuidedDemo();
                    setRoleDropdownOpen(false);
                  }}
                  className="cursor-pointer w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100/80 text-slate-700 flex items-center gap-2.5 font-medium transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                  <span>Launch Guided Product Tour</span>
                </button>

                {onNavigateLanding && (
                  <button
                    onClick={() => {
                      onNavigateLanding();
                      setRoleDropdownOpen(false);
                    }}
                    className="cursor-pointer w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100/80 text-slate-700 flex items-center gap-2.5 font-medium transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Public Marketing Site</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowResetConfirm(true);
                    setRoleDropdownOpen(false);
                  }}
                  disabled={resetting}
                  className="cursor-pointer w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100/80 text-slate-700 flex items-center gap-2.5 font-medium transition-colors"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${resetting ? 'animate-spin' : ''}`} />
                  <span>Restore Demo Seed Anomalies</span>
                </button>
              </div>

              {/* Persona Switcher Section */}
              <div className="pt-2">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Active Persona
                </div>
                <div className="space-y-0.5 mt-1 max-h-56 overflow-y-auto">
                  {demoUsers.map((user) => {
                    const isSelected = user.id === currentUser?.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user.id);
                          setRoleDropdownOpen(false);
                        }}
                        className={`cursor-pointer w-full text-left px-3 py-2 rounded-xl flex items-center justify-between hover:bg-slate-100/80 transition-all ${
                          isSelected ? 'bg-indigo-50/80 text-indigo-950 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-medium flex items-center gap-1.5">
                            {user.full_name}
                            {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {user.designation}
                          </p>
                        </div>
                        <div className="scale-90 origin-right">{getRoleBadge(user.role)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Presentation Environment?"
        message="Restore demo company records with 4 pre-seeded compliance anomalies (salary spike, unbilled absence, negative pay, missing bank IFSC)?"
        confirmLabel="Reset State"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </header>
  );
};
