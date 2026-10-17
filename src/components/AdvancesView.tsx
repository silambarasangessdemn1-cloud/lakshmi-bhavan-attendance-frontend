import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  AlertCircle,
  FileText,
  UserCheck,
  TrendingDown,
  Filter,
} from 'lucide-react';
import { useStaff } from '../context/StaffContext';
import { StaffMember, LoanAdvanceEntry } from '../types';
import { StaffAvatar } from './StaffAvatar';
import {
  formatCurrency,
  formatCompactCurrency,
  formatDatePretty,
  formatMonthName,
  getCurrentMonth,
} from '../utils/formatters';

interface AdvancesViewProps {
  onOpenRecordAdvance: (staff?: StaffMember) => void;
  onViewStaffDetails: (staff: StaffMember) => void;
}

export const AdvancesView: React.FC<AdvancesViewProps> = ({
  onOpenRecordAdvance,
  onViewStaffDetails,
}) => {
  const {
    staff,
    loanAdvances,
    payments,
    selectedMonth,
    setSelectedMonth,
    deleteLoanAdvance,
    showToast,
  } = useStaff();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'deducted'>('all');

  // Month navigation helpers
  const handleShiftMonth = (delta: number) => {
    const [yr, mo] = selectedMonth.split('-').map(Number);
    const d = new Date(yr, mo - 1 + delta, 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newY}-${newM}`);
  };

  // Filter only 'advance' entries
  const allAdvances = useMemo(() => {
    return loanAdvances.filter((l) => l.type === 'advance');
  }, [loanAdvances]);

  const monthAdvances = useMemo(() => {
    return allAdvances.filter((l) => l.month === selectedMonth);
  }, [allAdvances, selectedMonth]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalMonth = monthAdvances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const totalAllTime = allAdvances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

    const uniqueStaffIdsInMonth = new Set(monthAdvances.map((a) => a.staffId));
    const staffCount = uniqueStaffIdsInMonth.size;

    // Check which advances are already deducted from finalized salary payments
    let pendingDeductions = 0;
    let deductedAmount = 0;

    monthAdvances.forEach((adv) => {
      const isPaid = payments.some((p) => p.staffId === adv.staffId && p.month === adv.month);
      if (isPaid) {
        deductedAmount += Number(adv.amount) || 0;
      } else {
        pendingDeductions += Number(adv.amount) || 0;
      }
    });

    return {
      totalMonth,
      totalAllTime,
      staffCount,
      pendingDeductions,
      deductedAmount,
      totalEntriesCount: monthAdvances.length,
    };
  }, [monthAdvances, allAdvances, payments]);

  // Enriched and filtered list of advances
  const enrichedAdvances = useMemo(() => {
    return monthAdvances.map((entry) => {
      const member = staff.find((s) => s.id === entry.staffId);
      const isDeducted = payments.some(
        (p) => p.staffId === entry.staffId && p.month === entry.month
      );

      return {
        ...entry,
        staff: member,
        isDeducted,
      };
    });
  }, [monthAdvances, staff, payments]);

  const filteredAdvances = useMemo(() => {
    return enrichedAdvances.filter((item) => {
      if (statusFilter === 'pending' && item.isDeducted) return false;
      if (statusFilter === 'deducted' && !item.isDeducted) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = item.staff?.name.toLowerCase().includes(q) || false;
        const idMatch = item.staffId.toLowerCase().includes(q);
        const notesMatch = (item.notes || '').toLowerCase().includes(q);
        const roleMatch = item.staff?.designation.toLowerCase().includes(q) || false;
        return nameMatch || idMatch || notesMatch || roleMatch;
      }

      return true;
    });
  }, [enrichedAdvances, statusFilter, searchQuery]);

  // Grouped summary per staff member for this month
  const staffAdvanceSummaries = useMemo(() => {
    const map = new Map<string, { staff: StaffMember; totalAmount: number; count: number }>();

    monthAdvances.forEach((adv) => {
      const member = staff.find((s) => s.id === adv.staffId);
      if (!member) return;

      const existing = map.get(member.id);
      if (existing) {
        existing.totalAmount += Number(adv.amount) || 0;
        existing.count += 1;
      } else {
        map.set(member.id, {
          staff: member,
          totalAmount: Number(adv.amount) || 0,
          count: 1,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [monthAdvances, staff]);

  const handleDeleteAdvance = async (entry: LoanAdvanceEntry) => {
    const member = staff.find((s) => s.id === entry.staffId);
    const confirmed = window.confirm(
      `Delete advance record of ${formatCurrency(entry.amount)} for ${
        member?.name || entry.staffId
      } (${formatDatePretty(entry.date)})?`
    );

    if (confirmed) {
      await deleteLoanAdvance(entry.id);
      showToast(
        `Deleted advance of ${formatCurrency(entry.amount)} for ${member?.name || entry.staffId}.`,
        'info'
      );
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER & MONTH SWITCHER
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Salary Advances Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track and reconcile mid-month cash advances disbursed to employees before monthly payroll
          </p>
        </div>

        {/* Month Selector & New Advance CTA */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleShiftMonth(-1)}
              className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-xs font-bold font-mono text-slate-800">
              {formatMonthName(selectedMonth)}
            </div>
            <button
              type="button"
              onClick={() => handleShiftMonth(1)}
              className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenRecordAdvance()}
            className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Salary Advance</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          HERO KPI CARDS ROW
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Month Advances */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Advances ({formatMonthName(selectedMonth)})
            </span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-950 font-mono">
              {formatCurrency(stats.totalMonth)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {stats.totalEntriesCount} advance transactions this cycle
          </p>
        </div>

        {/* KPI 2: Staff Beneficiaries */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Staff With Advances
            </span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-950 font-mono">
              {stats.staffCount}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              of {staff.length} staff
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Employees who took mid-month cash
          </p>
        </div>

        {/* KPI 3: Pending Salary Deductions */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Deductions
            </span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-950 font-mono">
              {formatCurrency(stats.pendingDeductions)}
            </span>
          </div>
          <p className="mt-2 text-xs text-amber-700 font-medium">
            To be deducted on salary release
          </p>
        </div>

        {/* KPI 4: All-Time Total Advances */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              All-Time Advances
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
              {formatCompactCurrency(stats.totalAllTime)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Cumulative total across all months
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          STAFF ADVANCE BENEFICIARIES SUMMARY
      ───────────────────────────────────────────────────────────── */}
      {staffAdvanceSummaries.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Employee Advance Balances for {formatMonthName(selectedMonth)}
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {staffAdvanceSummaries.length} active recipients
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {staffAdvanceSummaries.map(({ staff: member, totalAmount, count }) => (
              <div
                key={member.id}
                className="p-3.5 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl border border-slate-200/60 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <StaffAvatar name={member.name} photo={member.photo} size="sm" />
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onViewStaffDetails(member)}
                      className="font-bold text-xs text-slate-900 hover:text-purple-700 truncate block text-left cursor-pointer"
                    >
                      {member.name}
                    </button>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      {member.id} · {count} {count === 1 ? 'time' : 'times'}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-xs text-purple-900">
                    {formatCurrency(totalAmount)}
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenRecordAdvance(member)}
                    className="text-[10px] font-bold text-purple-700 hover:text-purple-900 mt-0.5 block"
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DETAILED ADVANCES TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Table Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              All Records ({enrichedAdvances.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              Pending Month-End ({enrichedAdvances.filter((a) => !a.isDeducted).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('deducted')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                statusFilter === 'deducted'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Deducted in Salary ({enrichedAdvances.filter((a) => a.isDeducted).length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by staff name, ID, notes..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:bg-white focus:border-purple-600"
            />
          </div>
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-3">Advance Amount</th>
                <th className="py-3 px-3">Disbursal Date</th>
                <th className="py-3 px-3">Payroll Month</th>
                <th className="py-3 px-3">Purpose / Remarks</th>
                <th className="py-3 px-3">Reconciliation Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Wallet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold">No advance records found for this period.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "+ Record Salary Advance" to disburse a new cash advance.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <StaffAvatar
                          name={entry.staff?.name || entry.staffId}
                          photo={entry.staff?.photo}
                          size="sm"
                        />
                        <div>
                          {entry.staff ? (
                            <button
                              type="button"
                              onClick={() => onViewStaffDetails(entry.staff!)}
                              className="font-bold text-slate-900 hover:text-purple-700 text-left transition-colors cursor-pointer"
                            >
                              {entry.staff.name}
                            </button>
                          ) : (
                            <span className="font-bold text-slate-900">{entry.staffId}</span>
                          )}
                          <div className="text-[10px] font-mono text-slate-400">
                            ID: {entry.staffId} · {entry.staff?.designation || 'Staff'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-mono font-bold text-sm text-purple-900">
                        {formatCurrency(entry.amount)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-700 font-medium">
                      {formatDatePretty(entry.date)}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 font-mono">
                      {entry.month}
                    </td>

                    <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate">
                      {entry.notes || <span className="text-slate-300 italic">Salary Advance</span>}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          entry.isDeducted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {entry.isDeducted ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Deducted in Salary</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Month-End</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteAdvance(entry)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Advance Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{filteredAdvances.length}</strong> of{' '}
            <strong className="text-slate-800">{enrichedAdvances.length}</strong> records in{' '}
            <strong className="text-slate-800">{formatMonthName(selectedMonth)}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span>Cycle Total:</span>
            <span className="font-mono font-bold text-sm text-purple-900">
              {formatCurrency(stats.totalMonth)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
