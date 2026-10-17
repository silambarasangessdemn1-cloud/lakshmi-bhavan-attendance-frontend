import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  Wallet,
  CreditCard,
  Sliders,
  Plus,
  RotateCcw,
  Menu,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useStaff } from '../context/StaffContext';

export type ActiveTab = 'dashboard' | 'staff' | 'attendance' | 'advances' | 'loans';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAddStaff: () => void;
  onOpenSettings: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenAddStaff,
  onOpenSettings,
  onToggleSidebar,
}) => {
  const { staff, settings, resetToShreeLakshmiBhavan, isBackendConnected } = useStaff();

  // Page titles and breadcrumbs for current view
  const pageMeta: Record<ActiveTab, { title: string; breadcrumb: string; subtitle: string }> = {
    dashboard: {
      title: 'Executive Dashboard',
      breadcrumb: 'Overview',
      subtitle: 'Real-time attendance roll-call, loans & advance ledger',
    },
    staff: {
      title: 'Staff Directory',
      breadcrumb: 'Workforce',
      subtitle: `${staff.length} registered employees & salary structures`,
    },
    attendance: {
      title: 'Daily Attendance Register',
      breadcrumb: 'Operations',
      subtitle: 'Roll-call presence, overtime tracking & day wages',
    },
    advances: {
      title: 'Salary Advances Ledger',
      breadcrumb: 'Payroll',
      subtitle: 'Mid-month cash advances & salary reconciliation',
    },
    loans: {
      title: 'Staff Loans & EMI Portfolio',
      breadcrumb: 'Finance',
      subtitle: 'Disbursed principal, recovery rates & repayments',
    },
  };

  const currentMeta = pageMeta[activeTab] || pageMeta.dashboard;

  const mobileNavItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'staff' as ActiveTab, label: 'Staff', icon: Users, count: staff.length },
    { id: 'attendance' as ActiveTab, label: 'Attendance', icon: CalendarCheck2 },
    { id: 'advances' as ActiveTab, label: 'Advances', icon: Wallet },
    { id: 'loans' as ActiveTab, label: 'Loans', icon: CreditCard },
  ];

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-16">
          {/* Left: Mobile hamburger & Context breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Open Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 hidden sm:inline">
                  {currentMeta.breadcrumb}
                </span>
                <span className="text-slate-300 hidden sm:inline">/</span>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                  {currentMeta.title}
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Live Date, Sync Badge, Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Live Today Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200/80">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{todayFormatted}</span>
            </div>

            {/* Cloud Sync Status Indicator */}
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                isBackendConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200 shadow-2xs'
              }`}
              title={
                isBackendConnected
                  ? 'Real-time Cloud Sync active'
                  : 'Operating in Offline Mode'
              }
            >
              <span className="relative flex h-1.5 w-1.5">
                {isBackendConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                    isBackendConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </span>
              <span>{isBackendConnected ? 'Online' : 'Offline'}</span>
            </span>

            {/* Reset / Fresh Start button */}
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'Clear all staff, attendance, payment, and loan records and reset company details for Shree Lakshmi Bhavan? This cannot be undone.'
                  )
                ) {
                  resetToShreeLakshmiBhavan();
                }
              }}
              title="Reset fresh start (Shree Lakshmi Bhavan defaults)"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden xl:inline">Fresh Start</span>
            </button>

            {/* System Settings */}
            <button
              onClick={onOpenSettings}
              title="System & Company Settings"
              className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Add Staff primary button */}
            <button
              onClick={onOpenAddStaff}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">Add Staff</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
          {mobileNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
