import React, { useState, useEffect } from 'react';
import {
  X,
  HandCoins,
  CreditCard,
  Check,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Minus,
  Plus,
  User,
} from 'lucide-react';
import { StaffMember, LoanAdvanceType } from '../types';
import { useStaff } from '../context/StaffContext';
import { getTodayDateString, getCurrentMonth, formatCurrency } from '../utils/formatters';
import { StaffAvatar } from './StaffAvatar';

export type ModalMode = 'advance' | 'loan' | 'all';

interface AdvanceLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  defaultType?: LoanAdvanceType;
  mode?: ModalMode;
}

export const AdvanceLoanModal: React.FC<AdvanceLoanModalProps> = ({
  isOpen,
  onClose,
  staff,
  defaultType,
  mode = 'all',
}) => {
  const {
    staff: allStaff,
    addLoanAdvance,
    getStaffLoanBalance,
    getStaffAdvancesForMonth,
    selectedMonth,
    showToast,
    updateStaff,
  } = useStaff();

  // Active staff list
  const activeStaffList = allStaff.filter((s) => s.status !== 'inactive');

  // Selected staff state (supports modal opening with or without pre-selected staff)
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    staff?.id || activeStaffList[0]?.id || ''
  );

  useEffect(() => {
    if (staff) {
      setSelectedStaffId(staff.id);
    } else if (activeStaffList.length > 0 && !selectedStaffId) {
      setSelectedStaffId(activeStaffList[0].id);
    }
  }, [staff, activeStaffList]);

  // Determine initial transaction type based on mode and defaultType
  const initialType: LoanAdvanceType =
    defaultType ||
    (mode === 'advance' ? 'advance' : mode === 'loan' ? 'loan_issue' : 'advance');

  const [type, setType] = useState<LoanAdvanceType>(initialType);
  const [amount, setAmount] = useState<number>(1000);
  const [date, setDate] = useState<string>(getTodayDateString());
  const [notes, setNotes] = useState<string>('');
  const [autoLoanDeduct, setAutoLoanDeduct] = useState<boolean>(true);
  const [monthlyEmi, setMonthlyEmi] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultType) {
      setType(defaultType);
    } else if (mode === 'advance') {
      setType('advance');
    } else if (mode === 'loan') {
      setType('loan_issue');
    }
    setError(null);
  }, [defaultType, mode, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Resolved staff member
  const currentStaff = staff || allStaff.find((s) => s.id === selectedStaffId);

  const currentLoanBal = currentStaff ? getStaffLoanBalance(currentStaff.id) : 0;
  const currentMonthAdvances = currentStaff
    ? getStaffAdvancesForMonth(currentStaff.id, selectedMonth)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentStaff) {
      setError('Please select a staff member.');
      return;
    }

    if (amount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    if (type === 'loan_repay' && amount > currentLoanBal) {
      setError(`Repayment cannot exceed active loan balance (${formatCurrency(currentLoanBal)}).`);
      return;
    }

    if (type === 'advance_repay' && amount > currentMonthAdvances) {
      setError(`Repayment cannot exceed month advance balance (${formatCurrency(currentMonthAdvances)}).`);
      return;
    }

    const monthStr = date.slice(0, 7) || getCurrentMonth();

    await addLoanAdvance({
      staffId: currentStaff.id,
      type,
      amount,
      date,
      month: monthStr,
      notes:
        notes.trim() ||
        `${
          type === 'advance'
            ? 'Salary Advance'
            : type === 'advance_repay'
            ? 'Advance Repayment'
            : type === 'loan_issue'
            ? 'Loan Granted'
            : 'Loan Repayment'
        }`,
    });

    if (type === 'loan_issue') {
      await updateStaff(currentStaff.id, {
        autoLoanDeduct,
        monthlyLoanDeduction: autoLoanDeduct ? (monthlyEmi > 0 ? monthlyEmi : amount) : 0,
      });
    }

    const actionLabel =
      type === 'advance'
        ? `Advance of ${formatCurrency(amount)} recorded`
        : type === 'advance_repay'
        ? `Advance repayment of ${formatCurrency(amount)} recorded`
        : type === 'loan_issue'
        ? `Loan of ${formatCurrency(amount)} issued (Auto-Deduct: ${autoLoanDeduct ? 'Enabled' : 'Disabled'})`
        : `Loan repayment of ${formatCurrency(amount)} recorded`;

    showToast(`${actionLabel} for ${currentStaff.name}`, 'success');
    onClose();
  };

  const addPreset = (delta: number) => {
    setAmount((prev) => Math.max(100, (prev || 0) + delta));
  };

  const isAdvanceMode = mode === 'advance' || type === 'advance' || type === 'advance_repay';
  const isLoanMode = mode === 'loan' || type === 'loan_issue' || type === 'loan_repay';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header (Pinned) */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg text-white ${
                mode === 'advance'
                  ? 'bg-purple-600'
                  : mode === 'loan'
                  ? 'bg-amber-600'
                  : 'bg-emerald-600'
              }`}
            >
              {mode === 'advance' ? (
                <Wallet className="w-4 h-4" />
              ) : mode === 'loan' ? (
                <CreditCard className="w-4 h-4" />
              ) : (
                <HandCoins className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {mode === 'advance'
                  ? 'Record Salary Advance'
                  : mode === 'loan'
                  ? 'Manage Staff Loan'
                  : 'Record Advance / Loan'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {mode === 'advance'
                  ? 'Disburse cash advance to be deducted from monthly payroll'
                  : mode === 'loan'
                  ? 'Issue loan principal or record direct cash repayment'
                  : 'Update staff financial ledger directly'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Staff Selection / Summary Banner */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col gap-2.5">
          {staff ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StaffAvatar name={currentStaff?.name || ''} photo={currentStaff?.photo} size="sm" />
                <div>
                  <div className="text-xs font-bold text-slate-900">{currentStaff?.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    ID: {currentStaff?.id} · {currentStaff?.designation}
                  </div>
                </div>
              </div>

              <div className="text-right text-[11px]">
                {isLoanMode && (
                  <div className="text-slate-500">
                    Loan Bal:{' '}
                    <span className="font-mono font-semibold text-rose-700">
                      {formatCurrency(currentLoanBal)}
                    </span>
                  </div>
                )}
                {isAdvanceMode && (
                  <div className="text-slate-500">
                    Month Adv:{' '}
                    <span className="font-mono font-semibold text-purple-700">
                      {formatCurrency(currentMonthAdvances)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Staff Member <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:border-emerald-600"
              >
                {activeStaffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id}) · {s.designation} · Wage: ₹{s.wage}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switcher if mode is 'all', 'advance', or 'loan' */}
          {mode === 'all' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Transaction Type
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setType('advance')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    type === 'advance'
                      ? 'bg-white text-purple-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Advance
                </button>
                <button
                  type="button"
                  onClick={() => setType('advance_repay')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    type === 'advance_repay'
                      ? 'bg-white text-emerald-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Repay Adv
                </button>
                <button
                  type="button"
                  onClick={() => setType('loan_issue')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    type === 'loan_issue'
                      ? 'bg-white text-amber-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Issue Loan
                </button>
                <button
                  type="button"
                  onClick={() => setType('loan_repay')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    type === 'loan_repay'
                      ? 'bg-white text-emerald-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Repay Loan
                </button>
              </div>
            </div>
          )}

          {mode === 'advance' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Advance Action
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setType('advance')}
                  title="Give Advance (-)"
                  aria-label="Give Advance"
                  className={`py-2 text-xs font-semibold rounded-md transition-colors flex items-center justify-center ${
                    type === 'advance'
                      ? 'bg-white text-purple-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setType('advance_repay')}
                  title="Repay Advance (+)"
                  aria-label="Repay Advance"
                  className={`py-2 text-xs font-semibold rounded-md transition-colors flex items-center justify-center ${
                    type === 'advance_repay'
                      ? 'bg-white text-emerald-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {mode === 'loan' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Loan Action
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setType('loan_issue')}
                  title="Issue Loan (-)"
                  aria-label="Issue Loan"
                  className={`py-2 text-xs font-semibold rounded-md transition-colors flex items-center justify-center ${
                    type === 'loan_issue'
                      ? 'bg-white text-amber-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setType('loan_repay')}
                  title="Record Payment (+)"
                  aria-label="Record Payment"
                  className={`py-2 text-xs font-semibold rounded-md transition-colors flex items-center justify-center ${
                    type === 'loan_repay'
                      ? 'bg-white text-emerald-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Amount with quick presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2 text-sm font-mono font-bold border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Quick add:</span>
              {[500, 1000, 2000, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => addPreset(val)}
                  className="px-2 py-0.5 text-xs font-mono font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:border-emerald-600"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks / Purpose
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                type === 'advance'
                  ? 'e.g. Festival advance, emergency cash'
                  : type === 'advance_repay'
                  ? 'e.g. Returned advance cash, salary offset'
                  : type === 'loan_issue'
                  ? 'e.g. Medical assistance, personal loan'
                  : 'e.g. Handed over cash repayment, UPI transfer'
              }
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:border-emerald-600"
            />
          </div>

          {/* Automatic Salary Repayment Collection Option (Only for loan_issue) */}
          {type === 'loan_issue' && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 space-y-2.5">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoLoanDeduct}
                  onChange={(e) => setAutoLoanDeduct(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-amber-950 block">
                    Automatically collect repayment from monthly salary
                  </span>
                  <span className="text-[11px] text-amber-800/80 block mt-0.5">
                    Deducts monthly installments automatically from gross salary when processing payroll.
                  </span>
                </div>
              </label>

              {autoLoanDeduct && (
                <div className="pl-6 space-y-1.5 pt-1 border-t border-amber-200/50">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Monthly Installment / EMI (₹):
                    </label>
                    <button
                      type="button"
                      onClick={() => setMonthlyEmi(amount)}
                      className="text-[10px] font-bold text-amber-800 hover:underline cursor-pointer"
                    >
                      Deduct Full Amount
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={monthlyEmi || ''}
                      onChange={(e) => setMonthlyEmi(Number(e.target.value))}
                      placeholder={amount > 0 ? `Full amount (₹${amount})` : 'e.g. 2000'}
                      className="w-full pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-slate-900 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-amber-600"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {type === 'loan_repay' && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 text-xs text-emerald-900 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                This loan repayment of <strong>{amount > 0 ? formatCurrency(amount) : 'amount'}</strong> will reduce <strong>{currentStaff?.name || 'staff'}’s</strong> monthly net salary for <strong>{date.slice(0, 7) || 'this cycle'}</strong>.
              </span>
            </div>
          )}

          {/* Pinned Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                type === 'advance'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : type === 'loan_issue'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {type === 'advance'
                  ? 'Record Salary Advance'
                  : type === 'advance_repay'
                  ? 'Record Advance Repayment'
                  : type === 'loan_issue'
                  ? 'Issue Loan'
                  : 'Record Repayment'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
