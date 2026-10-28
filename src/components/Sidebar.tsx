import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  Wallet,
  CreditCard,
  Plus,
  Sliders,
  X,
  ArrowUpRight,
  ChevronRight,
  HandCoins,
} from 'lucide-react';
import { useStaff } from '../context/StaffContext';
import logoImg from '../assets/logo.jpg';

export type ActiveTab = 'dashboard' | 'staff' | 'attendance' | 'advances' | 'loans';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAddStaff: () => void;
  onOpenAdvance: () => void;
  onOpenLoan: () => void;
  onOpenSettings: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddStaff,
  onOpenAdvance,
  onOpenLoan,
  onOpenSettings,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { staff, settings, isBackendConnected, loanAdvances, selectedMonth } = useStaff();

  // Calculate dynamic badges
  const activeStaffCount = staff.filter((s) => s.status !== 'inactive').length;
  const monthAdvancesCount = loanAdvances.filter(
    (l) => l.type === 'advance' && l.month === selectedMonth
  ).length;
  const activeLoansCount = staff.filter(
    (s) => Number(s.loanStart) > 0 || loanAdvances.some((l) => l.staffId === s.id && l.type === 'loan_issue')
  ).length;

  const navGroups = [
    {
      title: 'OVERVIEW',
      items: [
        {
          id: 'dashboard' as ActiveTab,
          label: 'Dashboard',
          subtitle: 'Live Roll-Call & Portfolios',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        {
          id: 'staff' as ActiveTab,
          label: 'Staff Directory',
          subtitle: 'Profiles, Wages & Salary',
          icon: Users,
          badge: activeStaffCount > 0 ? String(activeStaffCount) : undefined,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        },
        {
          id: 'attendance' as ActiveTab,
          label: 'Daily Attendance',
          subtitle: 'Roll-Call & OT Hours',
          icon: CalendarCheck2,
        },
      ],
    },
    {
      title: 'FINANCE & PAYROLL',
      items: [
        {
          id: 'advances' as ActiveTab,
          label: 'Salary Advances',
          subtitle: 'Mid-Month Payouts',
          icon: Wallet,
          badge: monthAdvancesCount > 0 ? `${monthAdvancesCount} this mo` : undefined,
          badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        },
        {
          id: 'loans' as ActiveTab,
          label: 'Loans & EMI',
          subtitle: 'Principal & Collections',
          icon: CreditCard,
          badge: activeLoansCount > 0 ? `${activeLoansCount} active` : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        },
      ],
    },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    onTabChange(tab);
    onCloseMobile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 selection:bg-emerald-500 selection:text-white">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={logoImg}
            alt="MSS Shree Lakshmi Bhavan Logo"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/40 shadow-lg shrink-0 bg-slate-950"
          />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white tracking-tight truncate flex items-center gap-1.5">
              <span>
                {settings.companyName
                  ? settings.companyName.includes('MSS')
                    ? settings.companyName
                    : `MSS ${settings.companyName}`
                  : 'MSS Shree Lakshmi Bhavan'}
              </span>
            </h1>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Close Navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <div className="text-[10px] font-bold tracking-wider text-slate-500 px-3 py-1 uppercase">
              {group.title}
            </div>

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer relative ${
                    isActive
                      ? 'bg-emerald-500/15 text-white font-semibold border border-emerald-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 font-medium'
                  }`}
                >
                  {/* Active left indicator pill */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-r-full" />
                  )}

                  <div className="flex items-center gap-3 min-w-0 pl-1">
                    <div
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-slate-800/80 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs tracking-tight truncate leading-tight">
                        {item.label}
                      </div>
                      <div
                        className={`text-[10px] truncate leading-tight mt-0.5 ${
                          isActive ? 'text-emerald-300/80' : 'text-slate-500'
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono tracking-tight shrink-0 ${
                        item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Quick Actions Section */}
        <div className="space-y-2 pt-2">
          <div className="text-[10px] font-bold tracking-wider text-slate-500 px-3 uppercase">
            QUICK DISBURSEMENTS
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                onCloseMobile();
                onOpenAddStaff();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 bg-emerald-500/20 rounded-md text-emerald-400">
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>Add Staff Member</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-500/50 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => {
                onCloseMobile();
                onOpenAdvance();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-purple-300 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 bg-purple-500/20 rounded-md text-purple-400">
                  <Wallet className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>Record Advance</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-purple-500/50 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => {
                onCloseMobile();
                onOpenLoan();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-500/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 bg-amber-500/20 rounded-md text-amber-400">
                  <CreditCard className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>Manage Staff Loan</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-amber-500/50 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 space-y-2">
        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            onOpenSettings();
          }}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-400" />
            <span>Settings &amp; System</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
        </button>

        <div className="px-3 pt-1 text-center text-[10px] text-slate-500 font-mono">
          <span>v2.2 Pro Edition</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="no-print hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 z-30 shadow-xl shadow-slate-950/20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Slide-in Sidebar */}
      {isMobileOpen && (
        <div
          className="no-print fixed inset-0 z-50 lg:hidden bg-slate-950/80 backdrop-blur-xs transition-opacity duration-200"
          onClick={onCloseMobile}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 shadow-2xl z-50 flex flex-col animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
