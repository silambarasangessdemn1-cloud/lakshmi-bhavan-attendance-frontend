import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  LayoutGrid,
  List,
  Building,
  Calculator,
  HandCoins,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  Wallet,
  CreditCard,
  CheckCircle2,
  ArrowUpRight,
  X,
  Copy,
  Check,
  Receipt,
  BadgeAlert,
  Trash2,
} from 'lucide-react';
import { useStaff } from '../context/StaffContext';
import { StaffMember } from '../types';
import { StaffAvatar } from './StaffAvatar';
import { formatCurrency, formatMonthName } from '../utils/formatters';
import { StaffFullDetailsModal } from './StaffFullDetailsModal';
import { SalaryStudioModal } from './SalaryStudioModal';
import { AdvanceLoanModal } from './AdvanceLoanModal';

interface StaffDirectoryViewProps {
  onEditStaff: (staff: StaffMember) => void;
  onOpenAddStaff: () => void;
}

export const StaffDirectoryView: React.FC<StaffDirectoryViewProps> = ({
  onEditStaff,
  onOpenAddStaff,
}) => {
  const {
    staff,
    selectedMonth,
    setSelectedMonth,
    getStaffLoanBalance,
    getStaffAdvancesForMonth,
    deleteStaff,
    showToast,
  } = useStaff();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals for individual staff inspection
  const [selectedStaffForDetails, setSelectedStaffForDetails] = useState<StaffMember | null>(null);
  const [selectedStaffForSalary, setSelectedStaffForSalary] = useState<StaffMember | null>(null);
  const [selectedStaffForAdvance, setSelectedStaffForAdvance] = useState<StaffMember | null>(null);
  const [selectedStaffForLoan, setSelectedStaffForLoan] = useState<{
    staff: StaffMember;
    defaultType: 'loan_issue' | 'loan_repay';
  } | null>(null);

  const handleDeleteStaff = async (e: React.MouseEvent, member: StaffMember) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to delete staff member "${member.name}" (${member.id})?\n\nThis will permanently remove their profile, attendance logs, and loan records.`
    );
    if (confirmed) {
      await deleteStaff(member.id);
      showToast(`Staff member "${member.name}" (${member.id}) deleted.`, 'info');
    }
  };

  // Extract unique roles / designations
  const roles = useMemo(() => {
    const set = new Set<string>();
    staff.forEach((s) => {
      if (s.designation) set.add(s.designation.trim());
    });
    return ['All', ...Array.from(set)];
  }, [staff]);


  // Filtered staff list
  const filteredStaff = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return staff.filter((s) => {
      // Role match
      if (selectedRole !== 'All' && s.designation !== selectedRole) {
        return false;
      }
      // Status match
      if (selectedStatus === 'active' && s.status === 'inactive') return false;
      if (selectedStatus === 'inactive' && s.status !== 'inactive') return false;

      // Search query match
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.designation.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q)
      );
    });
  }, [staff, searchTerm, selectedRole, selectedStatus]);

  const handleShiftMonth = (delta: number) => {
    const [yr, mo] = selectedMonth.split('-').map(Number);
    const d = new Date(yr, mo - 1 + delta, 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newY}-${newM}`);
  };

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast(`Copied ${id} to clipboard`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderStaffCard = (member: StaffMember) => {
    const cleanPhone = member.phone?.replace(/[^0-9]/g, '');
    const loanBal = getStaffLoanBalance(member.id);
    const monthAdv = getStaffAdvancesForMonth(member.id, selectedMonth);

    return (
      <div
        key={member.id}
        onClick={() => setSelectedStaffForDetails(member)}
        className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md p-4.5 shadow-2xs transition-all flex flex-col justify-between space-y-3.5 cursor-pointer group active:scale-[0.99]"
        title="Click card to view complete profile"
      >
        <div>
          {/* Card Header: Avatar, Name, Role, Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <StaffAvatar name={member.name} photo={member.photo} size="md" />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    member.status !== 'inactive' ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-base text-slate-950 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                  <span className="truncate">{member.name}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    onClick={(e) => handleCopyId(e, member.id)}
                    className="font-mono text-xs font-bold text-slate-900 hover:text-black bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-0.5 rounded-md transition-colors inline-flex items-center gap-1 shrink-0"
                    title="Click to copy ID"
                  >
                    {member.id}
                    {copiedId === member.id ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-600" />
                    )}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 truncate">{member.designation}</span>
                </div>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border shrink-0 shadow-2xs ${
                member.status !== 'inactive'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${member.status !== 'inactive' ? 'bg-emerald-600' : 'bg-slate-500'}`} />
              <span>{member.status !== 'inactive' ? 'Active' : 'Inactive'}</span>
            </span>
          </div>

          {/* 2x2 Mini Metrics Grid: Wage, OT, Advances, Loan */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 bg-slate-50/90 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-900 block text-[11px] font-bold uppercase tracking-wider">Daily Wage</span>
              <span className="font-mono font-bold text-sm text-slate-950">
                {formatCurrency(member.wage || 0)}
              </span>
            </div>
            <div>
              <span className="text-slate-900 block text-[11px] font-bold uppercase tracking-wider">OT Rate</span>
              <span className="font-mono font-bold text-sm text-slate-950">
                {formatCurrency(member.otRate || 0)}/hr
              </span>
            </div>
            <div>
              <span className="text-slate-900 block text-[11px] font-bold uppercase tracking-wider">Month Advance</span>
              <span
                className={`font-mono font-bold text-sm ${
                  monthAdv > 0 ? 'text-purple-950' : 'text-slate-600'
                }`}
              >
                {monthAdv > 0 ? formatCurrency(monthAdv) : '₹0'}
              </span>
            </div>
            <div>
              <span className="text-slate-900 block text-[11px] font-bold uppercase tracking-wider">Loan Due</span>
              <span
                className={`font-mono font-bold text-sm ${
                  loanBal > 0 ? 'text-amber-950' : 'text-slate-600'
                }`}
              >
                {loanBal > 0 ? formatCurrency(loanBal) : '₹0'}
              </span>
              {loanBal > 0 && member.autoLoanDeduct !== false && (
                <span className="text-[10px] text-amber-900 font-semibold block leading-tight mt-0.5">Auto-repay</span>
              )}
            </div>
          </div>

          {/* Phone & WhatsApp Bar */}
          {member.phone && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-900 font-bold">
              <span className="font-mono text-xs sm:text-sm">{member.phone}</span>
              {cleanPhone && (
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${cleanPhone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200/60"
                    title="Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200/60"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Action Buttons: View Profile, Edit */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-emerald-800 group-hover:text-emerald-950 transition-colors flex items-center gap-1">
            <span>View Full Details</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditStaff(member);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all btn-press shadow-2xs cursor-pointer"
              title="Edit profile"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* 2. Controls & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input with Clear Button */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, role, ID, or phone number..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-slate-800 rounded-full cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Controls: Month Selector, Status Switcher, View Toggle, Add Staff */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Active Month Selector */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => handleShiftMonth(-1)}
                className="p-1.5 text-slate-700 hover:text-slate-950 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs sm:text-sm font-bold px-2 py-0.5 border-0 focus:outline-hidden text-slate-900 bg-transparent cursor-pointer font-mono"
              />
              <button
                type="button"
                onClick={() => handleShiftMonth(1)}
                className="p-1.5 text-slate-700 hover:text-slate-950 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View Mode Toggle (desktop only, mobile is auto card style) */}
            <div className="hidden md:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-300">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
                title="Dense Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onOpenAddStaff}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Staff</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Results count & Hint */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold text-slate-700 px-1 gap-1">
        <div>
          Showing <strong className="text-slate-950 font-bold">{filteredStaff.length}</strong> of{' '}
          <strong className="text-slate-950 font-bold">{staff.length}</strong> staff members
          {searchTerm && <span className="text-emerald-700 font-bold"> matching "{searchTerm}"</span>}
        </div>
      </div>

      {/* 4. Content: Dense Table View or Modern Card Grid */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Building className="w-7 h-7" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-950">No matching staff members found</h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedRole !== 'All'
              ? 'Try adjusting your search keyword or selected role filters.'
              : 'Get started by creating your first employee profile.'}
          </p>
          <button
            onClick={onOpenAddStaff}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Staff</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <>
          {/* Desktop Table View (visible on md screens and up) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    <th className="py-4 px-4.5">Staff Profile</th>
                    <th className="py-4 px-4.5">Compensation</th>
                    <th className="py-4 px-4.5">Advances ({formatMonthName(selectedMonth).slice(0, 3)})</th>
                    <th className="py-4 px-4.5">Loan Balance</th>
                    <th className="py-4 px-4.5">Contact</th>
                    <th className="py-4 px-4.5">Status</th>
                    <th className="py-4 px-4.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredStaff.map((member) => {
                    const cleanPhone = member.phone?.replace(/[^0-9]/g, '');
                    const loanBal = getStaffLoanBalance(member.id);
                    const monthAdv = getStaffAdvancesForMonth(member.id, selectedMonth);

                    return (
                      <tr
                        key={member.id}
                        onClick={() => setSelectedStaffForDetails(member)}
                        className="hover:bg-slate-50/80 transition-all group cursor-pointer"
                        title="Click row to open complete details & ledger"
                      >
                        {/* Column 1: Staff Profile */}
                        <td className="py-4 px-4.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <StaffAvatar name={member.name} photo={member.photo} size="md" />
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
                                  member.status !== 'inactive' ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-sm sm:text-base text-slate-950 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                                <span>{member.name}</span>
                                <span className="text-[11px] text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity font-bold inline-flex items-center gap-0.5">
                                  <span>Details</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  onClick={(e) => handleCopyId(e, member.id)}
                                  className="font-mono text-xs font-bold text-slate-800 hover:text-black bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-0.5 rounded-md transition-colors inline-flex items-center gap-1 shrink-0"
                                  title="Click to copy ID"
                                >
                                  {member.id}
                                  {copiedId === member.id ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-slate-600" />
                                  )}
                                </span>
                                <span className="text-xs font-semibold text-slate-700">
                                  {member.designation}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Compensation */}
                        <td className="py-4 px-4.5 whitespace-nowrap">
                          <div className="font-mono font-bold text-sm sm:text-base text-slate-950">
                            {formatCurrency(member.wage || 0)}
                            <span className="text-xs font-bold text-slate-600 font-sans ml-1">/ day</span>
                          </div>
                          <div className="text-xs font-bold text-slate-800 font-mono mt-0.5">
                            <span className="text-slate-600 font-sans font-medium">OT: </span>
                            {member.otRate > 0 ? (
                              <>
                                <span>{formatCurrency(member.otRate)}</span>
                                <span className="text-slate-600 font-sans font-medium"> / hr</span>
                              </>
                            ) : (
                              <span className="text-slate-500 font-sans font-normal">—</span>
                            )}
                          </div>
                        </td>

                        {/* Column 3: Month Advances */}
                        <td className="py-4 px-4.5 whitespace-nowrap">
                          {monthAdv > 0 ? (
                            <span className="inline-flex items-center gap-1.5 font-mono font-bold text-xs sm:text-sm text-purple-950 bg-purple-50 border border-purple-300 px-2.5 py-1 rounded-lg shadow-2xs">
                              <Wallet className="w-3.5 h-3.5 text-purple-600" />
                              <span>{formatCurrency(monthAdv)}</span>
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500 font-mono">—</span>
                          )}
                        </td>

                        {/* Column 4: Loan Balance */}
                        <td className="py-4 px-4.5 whitespace-nowrap">
                          {loanBal > 0 ? (
                            <div className="flex flex-col items-start gap-0.5">
                              <div className="inline-flex items-center gap-1.5 font-mono font-bold text-xs sm:text-sm text-amber-950 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg shadow-2xs">
                                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                                <span>{formatCurrency(loanBal)}</span>
                                <span className="text-[10px] font-sans font-bold text-amber-800 bg-amber-100 px-1 py-0.2 rounded">
                                  due
                                </span>
                              </div>
                              <span className="text-xs text-slate-700 font-medium mt-0.5">
                                {member.autoLoanDeduct !== false
                                  ? `Auto: ₹${(member.monthlyLoanDeduction && member.monthlyLoanDeduction > 0 ? member.monthlyLoanDeduction : loanBal).toLocaleString('en-IN')}/mo`
                                  : 'Manual only'}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              None
                            </span>
                          )}
                        </td>

                        {/* Column 5: Contact */}
                        <td className="py-4 px-4.5 whitespace-nowrap">
                          {member.phone ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">{member.phone}</span>
                              {cleanPhone && (
                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                  <a
                                    href={`tel:${cleanPhone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors border border-slate-200/60"
                                    title="Call"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                  <a
                                    href={`https://wa.me/${cleanPhone}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors border border-emerald-200/60"
                                    title="WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500">—</span>
                          )}
                        </td>

                        {/* Column 6: Status */}
                        <td className="py-4 px-4.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                              member.status !== 'inactive'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                member.status !== 'inactive' ? 'bg-emerald-600' : 'bg-slate-500'
                              }`}
                            />
                            <span>{member.status !== 'inactive' ? 'Active' : 'Inactive'}</span>
                          </span>
                        </td>

                        {/* Column 7: Actions (View Details & Edit) */}
                        <td className="py-4 px-4.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {/* 1. Quick View Details */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStaffForDetails(member);
                              }}
                              className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="View Full Staff Record & Ledger"
                            >
                              <span>View</span>
                              <ArrowUpRight className="w-3 h-3 text-emerald-700" />
                            </button>

                            {/* 2. Edit Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditStaff(member);
                              }}
                              className="p-2 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all inline-flex items-center justify-center btn-press shadow-2xs cursor-pointer"
                              title="Edit Staff Profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Style View (Automatic card layout on mobile screens) */}
          <div className="md:hidden space-y-3">
            {filteredStaff.map((member) => renderStaffCard(member))}
          </div>
        </>
      ) : (
        /* Modern Card Grid View (desktop & mobile) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStaff.map((member) => renderStaffCard(member))}
        </div>
      )}

      {/* 1. Single-Click Staff All-in-One Details Modal */}
      <StaffFullDetailsModal
        isOpen={!!selectedStaffForDetails}
        onClose={() => setSelectedStaffForDetails(null)}
        staff={selectedStaffForDetails}
        onEditStaff={onEditStaff}
        onOpenSalary={(staffId) => {
          const found = staff.find((s) => s.id === staffId);
          if (found) setSelectedStaffForSalary(found);
        }}
        onOpenAdvance={(member) => setSelectedStaffForAdvance(member)}
        onOpenLoan={(member, defaultType) =>
          setSelectedStaffForLoan({ staff: member, defaultType: defaultType || 'loan_issue' })
        }
      />

      {/* 2. One-by-One Salary Studio Modal */}
      {selectedStaffForSalary && (
        <SalaryStudioModal
          isOpen={!!selectedStaffForSalary}
          onClose={() => setSelectedStaffForSalary(null)}
          staffId={selectedStaffForSalary.id}
        />
      )}

      {/* 3. Direct Advance Modal */}
      {selectedStaffForAdvance && (
        <AdvanceLoanModal
          isOpen={!!selectedStaffForAdvance}
          onClose={() => setSelectedStaffForAdvance(null)}
          staff={selectedStaffForAdvance}
          defaultType="advance"
          mode="advance"
        />
      )}

      {/* 4. Direct Loan Modal */}
      {selectedStaffForLoan && (
        <AdvanceLoanModal
          isOpen={!!selectedStaffForLoan}
          onClose={() => setSelectedStaffForLoan(null)}
          staff={selectedStaffForLoan.staff}
          defaultType={selectedStaffForLoan.defaultType}
          mode="loan"
        />
      )}
    </div>
  );
};
