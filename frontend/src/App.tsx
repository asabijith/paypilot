import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { GuidedDemoModal } from './components/GuidedDemoModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AuthModal } from './components/AuthModal';
import { ToastProvider, toast } from './components/Toast';
import { LegalCenterModal, LegalTab } from './components/LegalCenterModal';
import { OnboardingWizardModal } from './components/OnboardingWizardModal';
import { SessionLockModal } from './components/SessionLockModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { MarketingLandingPage } from './pages/MarketingLandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { IntelligenceCenterPage } from './pages/IntelligenceCenterPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { AttendancePage } from './pages/AttendancePage';
import { LeavePage } from './pages/LeavePage';
import { SalaryStructurePage } from './pages/SalaryStructurePage';
import { PayrollProcessingPage } from './pages/PayrollProcessingPage';
import { AIAuditorPage } from './pages/AIAuditorPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { PayslipsReportsPage } from './pages/PayslipsReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ExpensesClaimsPage } from './pages/ExpensesClaimsPage';
import { TaxVaultPage } from './pages/TaxVaultPage';
import { ContractorsPage } from './pages/ContractorsPage';
import { ComplianceVaultPage } from './pages/ComplianceVaultPage';
import { api, setApiUserId } from './services/api';
import { User } from './types';
import { WifiOff } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [currentView, setCurrentView] = useState<'marketing' | 'app'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'marketing' || window.location.hash.includes('marketing')) {
        return 'marketing';
      }
    }
    return 'app';
  });
  const [openDiscrepanciesCount, setOpenDiscrepanciesCount] = useState<number>(4);
  const [isGuidedDemoOpen, setIsGuidedDemoOpen] = useState<boolean>(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authModalPlan, setAuthModalPlan] = useState<string>('free_trial');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Enterprise SaaS Add-ons: Lifecycle, Legal & Resilience States
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy');
  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  useEffect(() => {
    initApp();

    const handleHash = () => {
      if (window.location.hash.includes('marketing')) {
        setCurrentView('marketing');
      } else if (window.location.hash.includes('app')) {
        setCurrentView('app');
      }
    };
    window.addEventListener('hashchange', handleHash);

    // Global Command Palette Shortcut: Cmd+K / Ctrl+K
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);

    // Network resilience listeners
    const handleOnline = () => {
      setIsOnline(true);
      toast.info('Network connection restored. Cloud statutory sync active.', 'Back Online');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Network connection lost. Financial transactions and calculations are paused.', 'Offline Mode');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Financial Session Inactivity Guard (15 minutes idle timeout)
    let idleTimer: any;
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsSessionLocked(true);
      }, 15 * 60 * 1000);
    };

    const userActivityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    userActivityEvents.forEach(evt => window.addEventListener(evt, resetIdleTimer));
    resetIdleTimer();

    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      userActivityEvents.forEach(evt => window.removeEventListener(evt, resetIdleTimer));
      clearTimeout(idleTimer);
    };
  }, []);

  const initApp = async () => {
    try {
      setLoading(true);
      const [uRes, meRes, fRes] = await Promise.all([
        api.getDemoUsers(),
        api.getMe(),
        api.getAuditFindings('period_oct_2026')
      ]);
      setDemoUsers(uRes.users);
      setCurrentUser(meRes);
      setOpenDiscrepanciesCount(fRes.summary?.total_open ?? 4);
    } catch (err) {
      console.error('Failed to initialize app', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = async (userId: string) => {
    try {
      await api.switchDemoUser(userId);
      const me = await api.getMe();
      setCurrentUser(me);
      // If employee, redirect to dashboard or allowed tabs
      if (me.role === 'employee' && ['payroll', 'auditor', 'settings', 'contractors', 'compliance'].includes(currentTab)) {
        setCurrentTab('dashboard');
      }
      // Refresh discrepancies
      const fRes = await api.getAuditFindings('period_oct_2026');
      setOpenDiscrepanciesCount(fRes.summary?.total_open ?? 0);
      toast.info(`Switched persona to ${me.full_name} (${me.role.toUpperCase()})`, 'Persona Switched');
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetData = async () => {
    try {
      await api.resetSeedData();
      await initApp();
      setCurrentTab('dashboard');
      toast.success('Demo environment restored with 4 seeded anomalies for presentation.', 'Demo State Reset');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset demo data', 'Reset Failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold tracking-tight">PayPilot AI</h2>
        <p className="text-xs text-slate-400 mt-1">Starting statutory engines & multi-rule payroll auditor...</p>
      </div>
    );
  }

  // 1. PUBLIC MARKETING WEBSITE VIEW
  if (currentView === 'marketing') {
    return (
      <ToastProvider>
        {!isOnline && (
          <div className="bg-amber-600 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 shrink-0 sticky top-0 z-50">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline Mode: You are currently disconnected from the internet. Financial services will resume when reconnected.</span>
          </div>
        )}

        <MarketingLandingPage
          onEnterApp={() => {
            setCurrentView('app');
            if (window.location.hash.includes('marketing')) {
              window.history.pushState(null, '', window.location.pathname);
            }
          }}
          onOpenLogin={() => {
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          }}
          onOpenRegister={(plan) => {
            setAuthModalMode('register');
            setAuthModalPlan(plan || 'free_trial');
            setIsAuthModalOpen(true);
          }}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          initialPlan={authModalPlan}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            setCurrentView('app');
            // If new registration, launch onboarding wizard
            if (authModalMode === 'register') {
              setIsOnboardingOpen(true);
            }
          }}
          demoUsers={demoUsers}
          onSwitchDemoUser={handleSwitchUser}
        />
      </ToastProvider>
    );
  }

  // 2. CORE SAAS APPLICATION PORTAL VIEW
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-amber-600 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 shrink-0 sticky top-0 z-50">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline Mode: You are disconnected from the network. Changes will sync when reconnected.</span>
          </div>
        )}

        {/* Top Navbar */}
        <Navbar
          currentUser={currentUser}
          demoUsers={demoUsers}
          onSwitchUser={handleSwitchUser}
          onOpenGuidedDemo={() => setIsGuidedDemoOpen(true)}
          onResetData={handleResetData}
          onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
          onNavigateLanding={() => {
            setCurrentView('marketing');
            window.location.hash = 'marketing';
          }}
          onOpenAuth={() => {
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          }}
          onLockSession={() => setIsSessionLocked(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Responsive Sidebar */}
          <Sidebar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            openDiscrepanciesCount={openDiscrepanciesCount}
            userRole={currentUser?.role}
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto min-h-[calc(100vh-61px)] bg-[#F5F5F7]">
            {currentTab === 'dashboard' && (
              <DashboardPage
                currentUser={currentUser}
                onNavigateTab={setCurrentTab}
                onTriggerAudit={() => setCurrentTab('auditor')}
              />
            )}

            {currentTab === 'intelligence' && (
              <IntelligenceCenterPage
                currentUser={currentUser}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'employees' && (
              <EmployeesPage
                currentUser={currentUser}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'attendance' && (
              <AttendancePage currentUser={currentUser} />
            )}

            {currentTab === 'leave' && (
              <LeavePage currentUser={currentUser} />
            )}

            {currentTab === 'salary_structures' && (
              <SalaryStructurePage currentUser={currentUser} />
            )}

            {currentTab === 'payroll' && (
              <PayrollProcessingPage
                currentUser={currentUser}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'auditor' && (
              <AIAuditorPage
                currentUser={currentUser}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'assistant' && (
              <AIAssistantPage
                currentUser={currentUser}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'payslips' && (
              <PayslipsReportsPage currentUser={currentUser} initialView="payslip" />
            )}

            {currentTab === 'expenses' && (
              <ExpensesClaimsPage
                currentUser={currentUser}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'tax_vault' && (
              <TaxVaultPage
                currentUser={currentUser}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'contractors' && (
              <ContractorsPage
                currentUser={currentUser}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'compliance' && (
              <ComplianceVaultPage
                currentUser={currentUser}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'reports' && (
              <PayslipsReportsPage currentUser={currentUser} initialView="summary" />
            )}

            {currentTab === 'settings' && (
              <SettingsPage
                currentUser={currentUser}
                onResetData={handleResetData}
                onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
                onOpenLegal={() => {
                  setLegalTab('privacy');
                  setIsLegalModalOpen(true);
                }}
              />
            )}
          </main>
        </div>

        {/* Guided 10-Step Pitch Tour Modal */}
        <GuidedDemoModal
          isOpen={isGuidedDemoOpen}
          onClose={() => setIsGuidedDemoOpen(false)}
          onNavigateTab={setCurrentTab}
          onSwitchUser={handleSwitchUser}
        />

        {/* SaaS Subscription & Razorpay Modal */}
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          onPlanUpdated={() => initApp()}
        />

        {/* Auth & Registration Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          initialPlan={authModalPlan}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            if (authModalMode === 'register') {
              setIsOnboardingOpen(true);
            }
          }}
          demoUsers={demoUsers}
          onSwitchDemoUser={handleSwitchUser}
        />

        {/* First-Time Organization Onboarding Stepper Wizard */}
        <OnboardingWizardModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          onComplete={() => {
            initApp();
            toast.success('Organization setup completed successfully!', 'Welcome to PayPilot AI');
          }}
        />

        {/* Legal & Compliance Center Modal (DPDP Act, Terms, SLAs) */}
        <LegalCenterModal
          isOpen={isLegalModalOpen}
          initialTab={legalTab}
          onClose={() => setIsLegalModalOpen(false)}
        />

        {/* Inactivity Session Lock Guard */}
        <SessionLockModal
          isLocked={isSessionLocked}
          currentUser={currentUser}
          onUnlock={() => setIsSessionLocked(false)}
          onSwitchUser={() => {
            setIsSessionLocked(false);
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          }}
        />

        {/* Global Command Palette (Cmd+K / Ctrl+K) */}
        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigateTab={setCurrentTab}
          onSwitchUser={handleSwitchUser}
          onLockSession={() => setIsSessionLocked(true)}
          onOpenLegal={() => {
            setLegalTab('privacy');
            setIsLegalModalOpen(true);
          }}
          demoUsers={demoUsers}
          currentUser={currentUser}
        />
      </div>
    </ToastProvider>
  );
};

export default App;
