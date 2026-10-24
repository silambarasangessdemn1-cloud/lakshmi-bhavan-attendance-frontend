import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  HandCoins,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Trash2,
  Filter,
  Receipt,
  Users,
  History,
  AlertCircle,
  PiggyBank,
  Check,
} from 'lucide-react';
import { useStaff } from '../context/StaffContext';
import { StaffMember, LoanAdvanceEntry, PaymentRecord } from '../types';
import { StaffAvatar } from './StaffAvatar';
import {
  formatCurrency,
  formatCompactCurrency,
  formatDatePretty,
} from '../utils/formatters';

interface LoansViewProps {
  onOpenIssueLoan: (staff?: StaffMember) => void;
  onOpenRepayLoan: (staff?: StaffMember) => void;
  onViewStaffDetails: (staff: StaffMember) => void;
}

export const LoansView: React.FC<LoansViewProps> = ({
  onOpenIssueLoan,
  onOpenRepayLoan,
  onViewStaffDetails,
}) => {
  const {
    staff,
    loanAdvances,
    payments,
    getStaffLoanBalance,
    deleteLoanAdvance,
    showToast,
    updateStaff,
  } = useStaff();

  const [activeSubTab, setActiveSubTab] = useState<'borrowers' | 'history'>('borrowers');
  const [searchQuery, setSearchQuery] = useState('');
  const [borrowerStatusFilter, setBorrowerStatusFilter] = useState<'all' | 'active' | 'cleared'>('all');

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return;
      const cleanQ = q.replace(/[^a-z0-9]/g, '');
      const matched =
        staff.find((s) => s.id.trim().toLowerCase() === q) ||
        (cleanQ ? staff.find((s) => s.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanQ) : undefined) ||
        staff.find((s) => s.name.trim().toLowerCase() === q) ||
        staff.find((s) => s.id.toLowerCase().includes(q)) ||
        staff.find((s) => s.name.toLowerCase().includes(q));

      if (matched) {
        onViewStaffDetails(matched);
      } else {
        showToast(`No borrower found matching "${searchQuery.trim()}"`, 'error');
      }
    }
  };

  // Compute full loan portfolio per staff member
  const borrowersData = useMemo(() => {
    let totalProvidedAll = 0;
    let totalCollectedAll = 0;
    let totalOutstandingAll = 0;

    const list: Array<{
      staff: StaffMember;
      initialLoan: number;
      additionalLoans: number;
      totalProvided: number;
      directRepaid: number;
      salaryDeducted: number;
      totalCollected: number;
      outstandingBalance: number;
      recoveryPercentage: number;
      status: 'active' | 'cleared';
    }> = [];

    staff.forEach((member) => {
      const initialLoan = Number(member.loanStart) || 0;

      // Direct loan issues
      const staffEntries = loanAdvances.filter((l) => l.staffId === member.id);
      const additionalLoans = staffEntries
        .filter((l) => l.type === 'loan_issue')
        .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

      // Direct repayments
      const directRepaid = staffEntries
        .filter((l) => l.type === 'loan_repay')
        .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

      // Deductions from salary disbursements
      const memberPayments = payments.filter((p) => p.staffId === member.id);
      const salaryDeducted = memberPayments.reduce(
        (sum, p) => sum + (Number(p.loanDeduct) || 0),
        0
      );
      const paymentLoanAdded = memberPayments.reduce(
        (sum, p) => sum + (Number(p.loanAdded) || 0),
        0
      );

      const totalProvided = initialLoan + additionalLoans + paymentLoanAdded;
      const totalCollected = directRepaid + salaryDeducted;
      const outstandingBalance = getStaffLoanBalance(member.id);

      totalProvidedAll += totalProvided;
      totalCollectedAll += totalCollected;
      totalOutstandingAll += outstandingBalance;

      if (totalProvided > 0 || outstandingBalance > 0) {
        const recoveryPercentage =
          totalProvided > 0
            ? Math.min(100, Math.round((totalCollected / totalProvided) * 100))
            : 0;

        list.push({
          staff: member,
          initialLoan,
          additionalLoans,
          totalProvided,
          directRepaid,
          salaryDeducted,
          totalCollected,
          outstandingBalance,
          recoveryPercentage,
          status: outstandingBalance > 0 ? 'active' : 'cleared',
        });
      }
    });

    list.sort((a, b) => b.outstandingBalance - a.outstandingBalance);

    const overallRecoveryRate =
      totalProvidedAll > 0
        ? Math.round((totalCollectedAll / totalProvidedAll) * 100)
        : 0;

    return {
      borrowers: list,
      totalProvidedAll,
      totalCollectedAll,
      totalOutstandingAll,
      overallRecoveryRate,
      activeBorrowersCount: list.filter((b) => b.status === 'active').length,
      clearedBorrowersCount: list.filter((b) => b.status === 'cleared').length,
    };
  }, [staff, loanAdvances, payments, getStaffLoanBalance]);

  // Filtered borrowers
  const filteredBorrowers = useMemo(() => {
    return borrowersData.borrowers.filter((b) => {
      if (borrowerStatusFilter === 'active' && b.status !== 'active') return false;
      if (borrowerStatusFilter === 'cleared' && b.status !== 'cleared') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = b.staff.name.toLowerCase().includes(q);
        const idMatch = b.staff.id.toLowerCase().includes(q);
        const roleMatch = b.staff.designation.toLowerCase().includes(q);
        return nameMatch || idMatch || roleMatch;
      }

      return true;
    });
  }, [borrowersData.borrowers, borrowerStatusFilter, searchQuery]);

  // Unified loan transaction history
  const loanTransactions = useMemo(() => {
    const list: Array<{
      id: string;
      staffId: string;
      staff?: StaffMember;
      type: 'loan_issue' | 'loan_repay' | 'salary_deduct';
      amount: number;
      date: string;
      timestamp: number;
      notes: string;
      isDeletable: boolean;
    }> = [];

    // Direct loan entries
    loanAdvances
      .filter((l) => l.type === 'loan_issue' || l.type === 'loan_repay')
      .forEach((item) => {
        const member = staff.find((s) => s.id === item.staffId);
        list.push({
          id: item.id,
          staffId: item.staffId,
          staff: member,
          type: item.type as 'loan_issue' | 'loan_repay',
          amount: Number(item.amount) || 0,
          date: item.date,
          timestamp: item.timestamp || 0,
          notes: item.notes || '',
          isDeletable: true,
        });
      });

    // Salary loan deductions
    payments
      .filter((p) => (Number(p.loanDeduct) || 0) > 0)
      .forEach((p) => {
        const member = staff.find((s) => s.id === p.staffId);
        list.push({
          id: `pay-deduct-${p.id}`,
          staffId: p.staffId,
          staff: member,
          type: 'salary_deduct',
          amount: Number(p.loanDeduct) || 0,
          date: p.date,
          timestamp: p.timestamp || 0,
          notes: `Payroll Salary Deduction (${p.month})`,
          isDeletable: false,
        });
      });

    list.sort((a, b) => b.timestamp - a.timestamp);
    return list;
  }, [loanAdvances, payments, staff]);

  const handleDeleteLoanEntry = async (entry: (typeof loanTransactions)[0]) => {
    if (!entry.isDeletable) return;
    const label = entry.type === 'loan_issue' ? 'loan issue' : 'loan repayment';
    const confirmed = window.confirm(
      `Delete this ${label} of ${formatCurrency(entry.amount)} for ${
        entry.staff?.name || entry.staffId
      }?`
    );

    if (confirmed) {
      await deleteLoanAdvance(entry.id);
      showToast(`Deleted ${label} record of ${formatCurrency(entry.amount)}.`, 'info');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER & ACTIONS
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Loans &amp; Repayments Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track loans provided to staff, direct cash repayments, salary recoveries, and active balances
          </p>
        </div>

        {/* Dual Actions: Issue Loan & Record Repayment */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenIssueLoan()}
            className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Issue New Loan</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenRepayLoan()}
            className="px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <HandCoins className="w-4 h-4 text-emerald-700" />
            <span>+ Record Cash Repayment</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          HERO KPI CARDS ROW
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Loans Provided */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Loans Provided
            </span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-950 font-mono">
              {formatCompactCurrency(borrowersData.totalProvidedAll)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Total principal granted to {borrowersData.borrowers.length} employees
          </p>
        </div>

        {/* KPI 2: Total Collected / Repaid */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Repaid / Collected
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
              {formatCompactCurrency(borrowersData.totalCollectedAll)}
            </span>
          </div>
          <p className="mt-2 text-xs text-emerald-700 font-semibold">
            {borrowersData.overallRecoveryRate}% overall portfolio recovery
          </p>
        </div>

        {/* KPI 3: Net Outstanding Balance */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Balance Due
            </span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-700 font-mono">
              {formatCurrency(borrowersData.totalOutstandingAll)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Owed across {borrowersData.activeBorrowersCount} active borrower staff
          </p>
        </div>

        {/* KPI 4: Portfolio Status */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recovery Performance
            </span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-950 font-mono">
              {borrowersData.overallRecoveryRate}%
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {borrowersData.clearedBorrowersCount} accounts fully cleared
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB NAVIGATION: BORROWERS PORTFOLIO vs TRANSACTION HISTORY
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Sub-tab pills */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveSubTab('borrowers')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'borrowers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Borrowers Portfolio ({borrowersData.borrowers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('history')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transaction Ledger ({loanTransactions.length})
            </button>
          </div>

          {/* Search bar & Status filter */}
          {activeSubTab === 'borrowers' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setBorrowerStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    borrowerStatusFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All ({borrowersData.borrowers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBorrowerStatusFilter('active')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    borrowerStatusFilter === 'active'
                      ? 'bg-rose-600 text-white'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  Active Due ({borrowersData.activeBorrowersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setBorrowerStatusFilter('cleared')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    borrowerStatusFilter === 'cleared'
                      ? 'bg-emerald-600 text-white'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  Cleared ({borrowersData.clearedBorrowersCount})
                </button>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search borrower... (Enter to open)"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:bg-white focus:border-amber-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* SUB-VIEW 1: BORROWERS PORTFOLIO */}
        {activeSubTab === 'borrowers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-3">Loan Provided</th>
                  <th className="py-3 px-3">Collected / Repaid</th>
                  <th className="py-3 px-3">Balance Due</th>
                  <th className="py-3 px-4">Recovery Progress</th>
                  <th className="py-3 px-3">Auto Salary Collection</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBorrowers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold">No borrower accounts found.</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Click "+ Issue New Loan" to record a loan for a staff member.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredBorrowers.map((item) => (
                    <tr key={item.staff.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <StaffAvatar name={item.staff.name} photo={item.staff.photo} size="sm" />
                          <div>
                            <button
                              type="button"
                              onClick={() => onViewStaffDetails(item.staff)}
                              className="font-bold text-slate-900 hover:text-amber-700 text-left transition-colors cursor-pointer"
                            >
                              {item.staff.name}
                            </button>
                            <div className="text-[10px] font-mono text-slate-400">
                              ID: {item.staff.id} · {item.staff.designation || 'Staff'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {formatCurrency(item.totalProvided)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-sm text-emerald-700">
                          {formatCurrency(item.totalCollected)}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Direct: {formatCompactCurrency(item.directRepaid)} · Salary:{' '}
                          {formatCompactCurrency(item.salaryDeducted)}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`font-mono font-bold text-sm ${
                            item.outstandingBalance > 0 ? 'text-rose-700' : 'text-slate-400'
                          }`}
                        >
                          {formatCurrency(item.outstandingBalance)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>{item.recoveryPercentage}%</span>
                          <span>{formatCompactCurrency(item.totalCollected)} / {formatCompactCurrency(item.totalProvided)}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              item.recoveryPercentage === 100 ? 'bg-emerald-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${item.recoveryPercentage}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {item.outstandingBalance > 0 ? (
                          <button
                            type="button"
                            onClick={async () => {
                              const newAuto = item.staff.autoLoanDeduct === false;
                              await updateStaff(item.staff.id, { autoLoanDeduct: newAuto });
                              showToast(
                                `${newAuto ? 'Enabled' : 'Disabled'} auto salary collection for ${item.staff.name}.`,
                                'info'
                              );
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                              item.staff.autoLoanDeduct !== false
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Click to toggle automatic salary deduction"
                          >
                            {item.staff.autoLoanDeduct !== false ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>
                                  {item.staff.monthlyLoanDeduction && item.staff.monthlyLoanDeduction > 0
                                    ? `Auto: ₹${item.staff.monthlyLoanDeduction.toLocaleString('en-IN')}/mo`
                                    : 'Auto: Full Balance'}
                                </span>
                              </>
                            ) : (
                              <span>Manual Only</span>
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400">Paid Off</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.status === 'active'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {item.status === 'active' ? (
                            <>
                              <Clock className="w-3 h-3 text-rose-600" />
                              <span>Balance Due</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Cleared</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenIssueLoan(item.staff)}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                            title="Add / Top-up loan"
                          >
                            + Loan
                          </button>
                          {item.outstandingBalance > 0 && (
                            <button
                              type="button"
                              onClick={() => onOpenRepayLoan(item.staff)}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                              title="Record cash repayment"
                            >
                              Repay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB-VIEW 2: TRANSACTION LEDGER */}
        {activeSubTab === 'history' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-3">Transaction Type</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Notes / Purpose</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loanTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold">No loan transactions logged yet.</p>
                    </td>
                  </tr>
                ) : (
                  loanTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <StaffAvatar
                            name={tx.staff?.name || tx.staffId}
                            photo={tx.staff?.photo}
                            size="sm"
                          />
                          <div>
                            <div className="font-bold text-slate-900">
                              {tx.staff?.name || tx.staffId}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              ID: {tx.staffId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            tx.type === 'loan_issue'
                              ? 'bg-amber-100 text-amber-800'
                              : tx.type === 'loan_repay'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {tx.type === 'loan_issue'
                            ? 'Loan Granted'
                            : tx.type === 'loan_repay'
                            ? 'Cash Repayment'
                            : 'Salary Recovery'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`font-mono font-bold text-sm ${
                            tx.type === 'loan_issue' ? 'text-amber-900' : 'text-emerald-700'
                          }`}
                        >
                          {tx.type === 'loan_issue' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-700 font-medium">
                        {formatDatePretty(tx.date)}
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate">
                        {tx.notes || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {tx.isDeletable ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteLoanEntry(tx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Payroll Synced</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Portfolio: <strong className="text-slate-800">{borrowersData.borrowers.length}</strong> borrower accounts ·{' '}
            <strong className="text-rose-700">{borrowersData.activeBorrowersCount} active due</strong>
          </div>
          <div className="flex items-center gap-3">
            <span>Net Balance Due:</span>
            <span className="font-mono font-bold text-sm text-rose-700">
              {formatCurrency(borrowersData.totalOutstandingAll)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
