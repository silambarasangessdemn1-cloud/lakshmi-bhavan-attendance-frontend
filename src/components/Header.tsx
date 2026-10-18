import React from 'react';
import {
  Users,
  CalendarCheck2,
  Wallet,
  CreditCard,
  Sliders,
  Plus,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import { useStaff } from '../context/StaffContext';

export type ActiveTab = 'staff' | 'attendance' | 'advances' | 'loans';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAddStaff: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenAddStaff,
  onOpenSettings,
}) => {
  const {
    staff,
    settings,
    resetToShreeLakshmiBhavan,
    isBackendConnected,
    loanAdvances,
    selectedMonth,
  } = useStaff();

  // Dynamic counts for tab badges
  const activeStaffCount = staff.filter((s) => s.status !== 'inactive').length;
  const monthAdvancesCount = loanAdvances.filter(
    (l) => l.type === 'advance' && l.month === selectedMonth
  ).length;
  const activeLoansCount = staff.filter(
    (s) =>
      Number(s.loanStart) > 0 ||
      loanAdvances.some((l) => l.staffId === s.id && l.type === 'loan_issue')
  ).length;

  const navItems = [
    {
      id: 'staff' as ActiveTab,
      label: 'Staff Directory',
      shortLabel: 'Staff List',
      icon: Users,
      badge: String(staff.length),
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'attendance' as ActiveTab,
      label: 'Daily Attendance',
      shortLabel: 'Attendance',
      icon: CalendarCheck2,
      badge: activeStaffCount > 0 ? `${activeStaffCount} active` : undefined,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
   
  ];

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top Tier: Brand, Live Sync, Global Actions */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 h-14 sm:h-16">
          {/* Brand & Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/20 shrink-0">
              <span className="tracking-tight">SLB</span>
            </div>

            <div className="min-w-0 flex-1 sm:flex-initial">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 tracking-tight truncate max-w-[130px] xs:max-w-[190px] sm:max-w-none">
                  {settings.companyName || 'Shree Lakshmi Bhavan'}
                </h1>
                {/* Cloud Sync Status Indicator */}
                <span
                  className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors shrink-0 ${
                    isBackendConnected
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
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
                  <span className="hidden xs:inline">{isBackendConnected ? 'Online' : 'Offline'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium truncate hidden sm:block">
                Staff Attendance, Advances &amp; Salary Ledger
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Live Today Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-900 border border-slate-300 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-700" />
              <span>{todayFormatted}</span>
            </div>

            {/* Add Staff primary button */}
            <button
              type="button"
              onClick={onOpenAddStaff}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">Add Staff</span>
              <span className="xs:hidden">Staff</span>
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={onOpenSettings}
              title="System & Company Settings"
              className="p-1.5 sm:p-2 text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

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
              className="p-1.5 sm:p-2 text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Tier: Top-Level Single-Page Navigation Tabs with edge-to-edge mobile scrolling */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 sm:py-2.5 border-t border-slate-100 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 touch-pan-x scroll-smooth">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 hover:text-slate-950 border border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.shortLabel}</span>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono tracking-tight shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {item.badge}
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

