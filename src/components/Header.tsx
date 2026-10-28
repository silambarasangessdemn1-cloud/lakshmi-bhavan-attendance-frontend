import React from 'react';
import {
  Users,
  CalendarCheck2,
  Sliders,
  Plus,
  Calendar,
  Building2,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useStaff } from '../context/StaffContext';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.jpg';

export type ActiveTab = 'staff' | 'attendance' | 'advances' | 'loans';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAddStaff: () => void;
  onOpenSettings: () => void;
  onOpenBranchManagement?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenAddStaff,
  onOpenSettings,
  onOpenBranchManagement,
}) => {
  const {
    staff,
    settings,
    isBackendConnected,
  } = useStaff();

  const {
    user,
    logout,
    branches,
    activeBranchId,
    setActiveBranchId,
    isSuperAdmin,
    isBranchAdmin,
  } = useAuth();

  // Dynamic counts for tab badges
  const activeStaffCount = staff.filter((s) => s.status !== 'inactive').length;

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

  const userBranch = branches.find((b) => b.id === user?.branchId);

  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top Tier: Brand, Desktop Branch Selector, and Action Tools */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 h-14 sm:h-16">
          {/* Brand & Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={logoImg}
                alt="MSS Shree Lakshmi Bhavan Logo"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-emerald-600/40 shadow-md shadow-emerald-950/20 bg-slate-950"
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                {isBackendConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white ${
                    isBackendConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 tracking-tight truncate max-w-[140px] xs:max-w-[200px] sm:max-w-[280px] md:max-w-none">
                  {settings.companyName
                    ? settings.companyName.includes('MSS')
                      ? settings.companyName
                      : `MSS ${settings.companyName}`
                    : 'MSS Shree Lakshmi Bhavan'}
                </h1>
                {/* Cloud Sync Status Indicator */}
                <span
                  className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors shrink-0 ${
                    isBackendConnected
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                  title={isBackendConnected ? 'Real-time Cloud Sync active' : 'Operating in Offline Mode'}
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
              <p className="text-xs text-slate-500 font-medium truncate hidden sm:block">
                Staff Attendance, Advances &amp; Multi-Branch Payroll
              </p>
            </div>
          </div>

          {/* Desktop Branch Controls (hidden on mobile, cleanly visible md and up) */}
          <div className="hidden md:flex items-center gap-2 lg:gap-2.5">
            {/* SUPER ADMIN: Branch Switcher */}
            {isSuperAdmin && branches.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs transition-colors">
                <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <select
                  value={activeBranchId}
                  onChange={(e) => setActiveBranchId(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[140px] lg:max-w-[180px] truncate"
                  title="Switch Active Branch Filter"
                >
                  <option value="all">🌐 All Branches ({branches.length})</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      🏢 {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* SUPER ADMIN: Manage Branches & Admins Button */}
            {isSuperAdmin && onOpenBranchManagement && (
              <button
                type="button"
                onClick={onOpenBranchManagement}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer shrink-0 ${
                  branches.length === 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                    : 'text-slate-800 bg-white hover:bg-slate-100 border border-slate-300'
                }`}
                title="Manage Branches & Branch Admins"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${branches.length === 0 ? 'text-white' : 'text-emerald-600'}`} />
                <span>{branches.length === 0 ? '+ Add Branch' : 'Branches & Admins'}</span>
              </button>
            )}

            {/* BRANCH ADMIN: Dedicated Branch Tag */}
            {isBranchAdmin && userBranch && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 shrink-0">
                <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate max-w-[140px]">{userBranch.name}</span>
              </div>
            )}
          </div>

          {/* Right Action Tools: Add Staff, Settings, Profile & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Today Badge (Desktop Only) */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-900 border border-slate-300 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-700" />
              <span>{todayFormatted}</span>
            </div>

            {/* Add Staff primary button */}
            <button
              type="button"
              onClick={onOpenAddStaff}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer shrink-0"
              title="Add New Staff Member"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Staff</span>
              <span className="sm:hidden">Staff</span>
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

            {/* User Profile & Sign Out */}
            {user && (
              <div className="flex items-center gap-1 sm:gap-1.5 pl-1 sm:pl-1.5 border-l border-slate-200">
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 cursor-default"
                  title={`Logged in as ${user.name} (${user.role === 'superadmin' ? 'Super Admin' : 'Branch Admin'})`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 sm:p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Dedicated Branch Bar (Shown only on screens < md) */}
        {(isSuperAdmin || (isBranchAdmin && userBranch)) && (
          <div className="md:hidden py-2 border-t border-slate-100 flex items-center gap-2">
            {/* SUPER ADMIN: Mobile Branch Switcher */}
            {isSuperAdmin && branches.length > 0 && (
              <div className="flex-1 min-w-0 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs transition-colors">
                <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <select
                  value={activeBranchId}
                  onChange={(e) => setActiveBranchId(e.target.value)}
                  className="w-full bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs truncate"
                  title="Switch Active Branch Filter"
                >
                  <option value="all">🌐 All Branches ({branches.length})</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      🏢 {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* SUPER ADMIN: Mobile Manage Branches & Admins Button */}
            {isSuperAdmin && onOpenBranchManagement && (
              <button
                type="button"
                onClick={onOpenBranchManagement}
                className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer ${
                  branches.length === 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                    : 'text-slate-800 bg-white hover:bg-slate-100 border border-slate-300'
                }`}
                title="Manage Branches & Branch Admins"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${branches.length === 0 ? 'text-white' : 'text-emerald-600'}`} />
                <span>{branches.length === 0 ? '+ Add Branch' : 'Branches'}</span>
              </button>
            )}

            {/* BRANCH ADMIN: Mobile Dedicated Branch Badge */}
            {isBranchAdmin && userBranch && (
              <div className="flex-1 flex items-center justify-between px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{userBranch.name}</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                  {userBranch.code}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Bottom Tier: Top-Level Single-Page Navigation Tabs with edge-to-edge mobile scrolling */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2 sm:py-2.5 border-t border-slate-100 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 touch-pan-x scroll-smooth">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer relative min-h-[36px] ${
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
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold font-mono tracking-tight shrink-0 ${
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
