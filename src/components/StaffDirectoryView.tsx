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

  return (
    <div className="space-y-6">

      {/* 2. Controls & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input with Clear Button */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, role, ID, or phone number..."
              className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Month Selector, Status Switcher, View Toggle, Add Staff */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Active Month Selector */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => handleShiftMonth(-1)}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-semibold px-2 py-0.5 border-0 focus:outline-hidden text-slate-900 bg-transparent cursor-pointer font-mono"
              />
              <button
                type="button"
                onClick={() => handleShiftMonth(1)}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedStatus('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedStatus === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('active')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedStatus === 'active'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('inactive')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedStatus === 'inactive'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Inactive
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Dense Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onOpenAddStaff}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-sm shadow-emerald-700/20 ring-1 ring-emerald-500/30 transition-all btn-press"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Staff</span>
            </button>
          </div>
        </div>

        {/* Role Pills Filter Bar */}
        {roles.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar border-t border-slate-100 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Role:
            </span>
            {roles.map((r) => {
              const isSelected = selectedRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Results count & Hint */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing <strong>{filteredStaff.length}</strong> of {staff.length} staff members
          {searchTerm && <span> matching "{searchTerm}"</span>}
        </div>
        <div className="text-[11px] text-slate-400 hidden sm:block">
          💡 Click anywhere on a row or card to view full profile &amp; monthly ledger
        </div>
      </div>

      {/* 4. Content: Dense Table View or Modern Card Grid */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Building className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No matching staff members found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedRole !== 'All'
              ? 'Try adjusting your search keyword or selected role filters.'
              : 'Get started by creating your first employee profile.'}
          </p>
          <button
            onClick={onOpenAddStaff}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs btn-press"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New Staff</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Staff Profile</th>
                  <th className="py-3.5 px-4">Compensation</th>
                  <th className="py-3.5 px-4">Advances ({formatMonthName(selectedMonth).slice(0, 3)})</th>
                  <th className="py-3.5 px-4">Loan Balance</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStaff.map((member) => {
                  const cleanPhone = member.phone?.replace(/[^0-9]/g, '');
                  const loanBal = getStaffLoanBalance(member.id);
                  const monthAdv = getStaffAdvancesForMonth(member.id, selectedMonth);

                  return (
                    <tr
                      key={member.id}
                      onClick={() => setSelectedStaffForDetails(member)}
                      className="hover:bg-emerald-50/30 transition-all group cursor-pointer"
                      title="Click row to open complete details & ledger"
                    >
                      {/* Column 1: Staff Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <StaffAvatar name={member.name} photo={member.photo} size="sm" />
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                                member.status !== 'inactive' ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                              <span>{member.name}</span>
                              <span className="text-[10px] text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity font-semibold inline-flex items-center gap-0.5">
                                <span>Details</span>
                                <ArrowUpRight className="w-2.5 h-2.5" />
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                onClick={(e) => handleCopyId(e, member.id)}
                                className="font-mono text-[10px] text-slate-400 hover:text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded transition-colors inline-flex items-center gap-0.5"
                                title="Click to copy ID"
                              >
                                {member.id}
                                {copiedId === member.id ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5 opacity-60" />
                                )}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {member.designation}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Compensation */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-900">
                          {formatCurrency(member.wage || 0)}
                          <span className="text-[10px] text-slate-400 font-sans font-normal">/day</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          OT: {formatCurrency(member.otRate || 0)}/hr
                        </div>
                      </td>

                      {/* Column 3: Month Advances */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {monthAdv > 0 ? (
                          <span className="font-mono font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg text-xs">
                            {formatCurrency(monthAdv)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Column 4: Loan Balance */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {loanBal > 0 ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <div className="inline-flex items-center gap-1 font-mono font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-lg text-xs">
                              <span>{formatCurrency(loanBal)}</span>
                              <span className="text-[10px] font-sans font-bold text-rose-500">due</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {member.autoLoanDeduct !== false
                                ? `Auto: ₹${(member.monthlyLoanDeduction && member.monthlyLoanDeduction > 0 ? member.monthlyLoanDeduction : loanBal).toLocaleString('en-IN')}/mo`
                                : 'Manual only'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">None</span>
                        )}
                      </td>

                      {/* Column 5: Contact */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                        {member.phone ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">{member.phone}</span>
                            {cleanPhone && (
                              <div className="inline-flex items-center gap-1">
                                <a
                                  href={`tel:${cleanPhone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Voice Call"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={`https://wa.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="WhatsApp Chat"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Column 6: Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            member.status !== 'inactive'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {member.status !== 'inactive' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Column 7: Quick Actions (Advance, Loan, Salary, Edit, Delete) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Advance Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStaffForAdvance(member);
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 active:bg-purple-200 border border-purple-200 rounded-xl transition-all inline-flex items-center gap-1 shadow-2xs btn-press cursor-pointer"
                            title="Record salary advance for this staff member"
                          >
                            <Wallet className="w-3.5 h-3.5 text-purple-600" />
                            <span>+ Advance</span>
                          </button>

                          {/* 2. Loan Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStaffForLoan({ staff: member, defaultType: 'loan_issue' });
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-200 rounded-xl transition-all inline-flex items-center gap-1 shadow-2xs btn-press cursor-pointer"
                            title="Issue staff loan or manage EMI"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                            <span>+ Loan</span>
                          </button>

                          {/* 3. Salary Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStaffForSalary(member);
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 rounded-xl transition-all inline-flex items-center gap-1 shadow-2xs btn-press cursor-pointer"
                            title="Open Salary Studio for salary settlement"
                          >
                            <Calculator className="w-3.5 h-3.5 text-blue-700" />
                            <span>Salary</span>
                          </button>

                          {/* 4. Edit Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditStaff(member);
                            }}
                            className="p-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all inline-flex items-center justify-center btn-press shadow-2xs cursor-pointer"
                            title="Edit Staff Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* 5. Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteStaff(e, member)}
                            className="p-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-all inline-flex items-center justify-center btn-press shadow-2xs cursor-pointer"
                            title="Delete Staff Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      ) : (
        /* Modern Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStaff.map((member) => {
            const cleanPhone = member.phone?.replace(/[^0-9]/g, '');
            const loanBal = getStaffLoanBalance(member.id);
            const monthAdv = getStaffAdvancesForMonth(member.id, selectedMonth);

            return (
              <div
                key={member.id}
                onClick={() => setSelectedStaffForDetails(member)}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-md p-4 shadow-2xs transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
                title="Click card to view complete profile"
              >
                <div>
                  {/* Card Header: Avatar, Name, Role, Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <StaffAvatar name={member.name} photo={member.photo} size="md" />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            member.status !== 'inactive' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                          <span>{member.name}</span>
                          <ArrowUpRight className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-xs text-slate-500">{member.designation}</div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        member.status !== 'inactive'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {member.status !== 'inactive' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* 2x2 Mini Metrics Grid: Wage, OT, Advances, Loan */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-medium">Daily Wage</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(member.wage || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-medium">OT Rate</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(member.otRate || 0)}/h
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-medium">Month Advance</span>
                      <span
                        className={`font-mono font-bold ${
                          monthAdv > 0 ? 'text-amber-700' : 'text-slate-400'
                        }`}
                      >
                        {monthAdv > 0 ? formatCurrency(monthAdv) : '₹0'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-medium">Loan Due</span>
                      <span
                        className={`font-mono font-bold ${
                          loanBal > 0 ? 'text-rose-700' : 'text-slate-400'
                        }`}
                      >
                        {loanBal > 0 ? formatCurrency(loanBal) : '₹0'}
                      </span>
                      {loanBal > 0 && member.autoLoanDeduct !== false && (
                        <span className="text-[9px] text-emerald-600 font-semibold block leading-tight">Auto-repay</span>
                      )}
                    </div>
                  </div>

                  {/* Phone & WhatsApp Bar */}
                  {member.phone && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span className="font-mono text-xs">{member.phone}</span>
                      {cleanPhone && (
                        <div className="flex items-center gap-1">
                          <a
                            href={`tel:${cleanPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Call"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons: Advance, Loan, Salary, Edit, Delete */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  {/* 1. Advance Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStaffForAdvance(member);
                    }}
                    className="flex-1 py-1.5 px-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all flex items-center justify-center gap-1 shadow-2xs btn-press cursor-pointer"
                    title="Record salary advance for this staff member"
                  >
                    <Wallet className="w-3.5 h-3.5 text-purple-600" />
                    <span>Advance</span>
                  </button>

                  {/* 2. Loan Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStaffForLoan({ staff: member, defaultType: 'loan_issue' });
                    }}
                    className="flex-1 py-1.5 px-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all flex items-center justify-center gap-1 shadow-2xs btn-press cursor-pointer"
                    title="Issue staff loan or manage EMI"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                    <span>Loan</span>
                  </button>

                  {/* 3. Salary Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStaffForSalary(member);
                    }}
                    className="flex-1 py-1.5 px-2 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all flex items-center justify-center gap-1 shadow-2xs btn-press cursor-pointer"
                    title="Salary calculation & settlement"
                  >
                    <Calculator className="w-3.5 h-3.5 text-blue-700" />
                    <span>Salary</span>
                  </button>

                  {/* 4. Edit Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditStaff(member);
                    }}
                    className="p-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all btn-press shadow-2xs cursor-pointer"
                    title="Edit profile"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* 5. Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteStaff(e, member)}
                    className="p-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-all btn-press shadow-2xs cursor-pointer"
                    title="Delete staff member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
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
