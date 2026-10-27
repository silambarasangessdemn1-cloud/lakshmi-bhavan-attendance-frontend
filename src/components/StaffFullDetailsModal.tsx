import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  CreditCard,
  Receipt,
  Edit2,
  Copy,
  Check,
  Printer,
  TableProperties,
  User,
  History,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Building,
  CheckCircle2,
  Clock,
  Wallet,
  Trash2,
  HandCoins,
  Plus,
} from 'lucide-react';
import { StaffMember, PayrollCalculation } from '../types';
import { useStaff } from '../context/StaffContext';
import { StaffAvatar } from './StaffAvatar';
import { StaffLedgerSheet } from './StaffLedgerSheet';
import { PayslipPrintModal } from './PayslipPrintModal';
import { AdvanceLoanModal } from './AdvanceLoanModal';
import {
  formatCurrency,
  formatDatePretty,
  formatMonthName,
} from '../utils/formatters';

interface StaffFullDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  onEditStaff: (staff: StaffMember) => void;
  onOpenSalary: (staffId: string) => void;
  onOpenAdvance?: (staff: StaffMember) => void;
  onOpenLoan?: (staff: StaffMember, defaultType?: 'loan_issue' | 'loan_repay') => void;
}

export const StaffFullDetailsModal: React.FC<StaffFullDetailsModalProps> = ({
  isOpen,
  onClose,
  staff,
  onEditStaff,
  onOpenSalary,
  onOpenAdvance,
  onOpenLoan,
}) => {
  const {
    getStaffLoanBalance,
    getStaffAdvancesForMonth,
    calculateStaffPayroll,
    getStaffLoanAdvanceEntries,
    deleteLoanAdvance,
    payments,
    selectedMonth,
    setSelectedMonth,
    settings,
    deleteStaff,
    showToast,
  } = useStaff();

  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceModalType, setAdvanceModalType] = useState<'advance' | 'advance_repay'>('advance');
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [loanModalType, setLoanModalType] = useState<'loan_issue' | 'loan_repay'>('loan_issue');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !staff) return null;

  const loanBal = getStaffLoanBalance(staff.id);
  const currentMonthAdvances = getStaffAdvancesForMonth(staff.id, selectedMonth);
  const calculatedPayroll = calculateStaffPayroll(staff.id, selectedMonth);
  const payrollCalc: PayrollCalculation = calculatedPayroll || {
    staff,
    month: selectedMonth,
    daysCount: 0,
    halfDaysCount: 0,
    effectiveDays: 0,
    otHours: 0,
    otRate: staff.otRate,
    otEarnings: 0,
    wageEarnings: 0,
    gross: 0,
    advanceMonth: currentMonthAdvances,
    outstandingLoan: loanBal,
    currentLoanDeduction: 0,
    netPayable: 0,
    attendanceRecords: [],
  };
  const loanAdvanceHistory = getStaffLoanAdvanceEntries(staff.id);
  const staffPayments = payments.filter((p) => p.staffId === staff.id);

  const cleanPhone = (staff.phone || '').replace(/\D/g, '');

  const copyAccountNumber = () => {
    if (staff.accountNumber) {
      navigator.clipboard.writeText(staff.accountNumber);
      setCopiedAccount(true);
      showToast('Account number copied to clipboard', 'info');
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handleShiftMonth = (delta: number) => {
    const [yr, mo] = selectedMonth.split('-').map(Number);
    const d = new Date(yr, mo - 1 + delta, 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newY}-${newM}`);
  };

  const handleDeleteStaff = async () => {
    if (!staff) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete staff member "${staff.name}" (${staff.id})?\n\nThis will permanently remove their profile, attendance logs, and loan records.`
    );
    if (confirmed) {
      await deleteStaff(staff.id);
      showToast(`Staff member "${staff.name}" (${staff.id}) deleted.`, 'info');
      onClose();
    }
  };

  return (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Modal Top Bar */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <StaffAvatar name={staff.name} photo={staff.photo} size="lg" className="border-2 border-emerald-400/30 shadow-md" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold tracking-tight text-white">{staff.name}</h2>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-white/10 text-emerald-300 border border-emerald-500/20">
                    {staff.id}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Staff</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 font-medium">
                  {staff.designation}
                </p>
                {staff.joiningDate && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Joined: {formatDatePretty(staff.joiningDate)}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {cleanPhone && (
                <>
                  <a
                    href={`tel:${cleanPhone}`}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all shadow-xs"
                    title="Call Staff"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white transition-all shadow-xs"
                    title="WhatsApp Chat"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditStaff(staff);
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all shadow-xs cursor-pointer"
                title="Edit Staff Member"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all shadow-xs cursor-pointer"
                title="Print Full Record"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleDeleteStaff}
                className="p-2 bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 hover:text-white rounded-xl transition-all shadow-xs cursor-pointer"
                title="Delete Staff Member"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-all shadow-xs cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-header Controls Bar */}
          <div className="px-4 sm:px-6 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Month:</span>
              <div className="inline-flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleShiftMonth(-1)}
                  className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-2xs transition-all cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-1.5 py-0.5 text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => handleShiftMonth(1)}
                  className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-2xs transition-all cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs font-bold text-indigo-950 ml-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200/60 rounded-lg">
                {formatMonthName(selectedMonth)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => {
                  setAdvanceModalType('advance');
                  setIsAdvanceModalOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-bold text-violet-800 bg-violet-50 hover:bg-violet-100/80 border border-violet-200 rounded-xl shadow-2xs transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                title={`Record salary advance (Month Advance: ${formatCurrency(currentMonthAdvances)})`}
              >
                <Wallet className="w-3.5 h-3.5 text-violet-600" />
                <span>+Advance</span>
                <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-violet-200/70 text-violet-950">
                  {formatCurrency(currentMonthAdvances)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoanModalType('loan_issue');
                  setIsLoanModalOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-xl shadow-2xs transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                title={`Issue loan (Active Loan: ${formatCurrency(loanBal)})`}
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                <span>+ Loan</span>
                <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-amber-200/70 text-amber-950">
                  {formatCurrency(loanBal)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSalary(staff.id);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-xs shadow-indigo-600/20 transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                title="Open Interactive Salary Studio"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Salary Studio</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPayslipModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-xs shadow-emerald-600/20 transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                title="Generate & Print Payslip"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>View Payslip</span>
              </button>
            </div>
          </div>

          {/* ALL DETAILS IN ONE SINGLE PAGE (No separated tabs) */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-100/60">
            {/* SECTION 1: PROFILE & BANKING DETAILS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <User className="w-4 h-4" />
                  </div>
                  <span>Profile, Contact & Banking Details</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                  Complete staff record
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Staff ID */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 space-y-1">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Staff ID</span>
                  <span className="font-mono font-bold text-slate-900 block text-xs">
                    {staff.id}
                  </span>
                </div>

                {/* Contact */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 space-y-1">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Phone Number</span>
                  <span className="font-mono font-semibold text-slate-900 block text-xs">
                    {staff.phone || '—'}
                  </span>
                </div>

                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 space-y-1">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Employment Status</span>
                  <span className="font-bold text-emerald-700 block capitalize text-xs">
                    {staff.status || 'Active'}
                  </span>
                </div>

                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 space-y-1">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Daily Wage Rate</span>
                  <span className="font-mono font-bold text-slate-900 block text-xs">
                    {formatCurrency(staff.wage)} <span className="font-normal text-slate-400">/ day</span>
                  </span>
                </div>

                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 space-y-1">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Overtime Rate</span>
                  <span className="font-mono font-bold text-slate-900 block text-xs">
                    {staff.otRate > 0 ? `${formatCurrency(staff.otRate)} / hr` : '—'}
                  </span>
                </div>

                {/* Bank details */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 space-y-1">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Bank Name</span>
                  <span className="font-bold text-slate-900 block text-xs">
                    {staff.bankName || 'Cash / Direct'}
                  </span>
                </div>

                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 space-y-1">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Account Holder</span>
                  <span className="font-bold text-slate-900 block text-xs">
                    {staff.accountHolder || staff.name}
                  </span>
                </div>

                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Bank Account Number</span>
                    {staff.accountNumber && (
                      <button
                        type="button"
                        onClick={copyAccountNumber}
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 font-bold cursor-pointer"
                      >
                        {copiedAccount ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy A/C</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {staff.accountNumber || 'Not configured'}
                    </span>
                    {staff.ifsc && (
                      <span className="text-[10px] font-mono text-slate-700 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                        IFSC: {staff.ifsc}
                      </span>
                    )}
                  </div>
                </div>

                {staff.notes && (
                  <div className="sm:col-span-4 bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Remarks / Notes</span>
                    <p className="text-slate-800 italic text-xs mt-0.5 font-medium">{staff.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: MONTHLY SALARY CALCULATION & ATTENDANCE SUMMARY */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <span>Salary Calculation Summary — {formatMonthName(selectedMonth)}</span>
                </h3>
                <span className="text-xs font-bold font-mono text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
                  {payrollCalc.effectiveDays} Effective Days Logged
                </span>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Days Present</span>
                  <span className="text-base font-extrabold font-mono text-slate-900 mt-1 block">
                    {payrollCalc.daysCount}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Half Days</span>
                  <span className="text-base font-extrabold font-mono text-slate-900 mt-1 block">
                    {payrollCalc.halfDaysCount}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Overtime (h)</span>
                  <span className="text-base font-extrabold font-mono text-slate-900 mt-1 block">
                    {payrollCalc.otHours} hrs
                  </span>
                </div>

                <div className="p-3 bg-gradient-to-br from-emerald-50/90 to-teal-50/30 rounded-xl border border-emerald-200/80">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Gross Wages</span>
                  <span className="text-base font-extrabold font-mono text-emerald-950 mt-1 block">
                    {formatCurrency(payrollCalc.gross)}
                  </span>
                </div>

                <div className="p-3 bg-gradient-to-br from-rose-50/90 to-red-50/30 rounded-xl border border-rose-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-rose-900 font-bold uppercase tracking-wider block">Month Advance (Debit)</span>
                      {currentMonthAdvances > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setAdvanceModalType('advance_repay');
                            setIsAdvanceModalOpen(true);
                          }}
                          className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                          title="Repay advance amount"
                        >
                          Repay
                        </button>
                      )}
                    </div>
                    <span className="text-base font-extrabold font-mono text-rose-950 mt-1 block">
                      -{formatCurrency(currentMonthAdvances)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-gradient-to-br from-amber-50/90 to-orange-50/30 rounded-xl border border-amber-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-amber-900 font-bold uppercase tracking-wider block">Active Loan</span>
                      {loanBal > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setLoanModalType('loan_repay');
                            setIsLoanModalOpen(true);
                          }}
                          className="text-[10px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                          title="Repay loan"
                        >
                          Repay
                        </button>
                      )}
                    </div>
                    <span className="text-base font-extrabold font-mono text-amber-950 mt-1 block">
                      {formatCurrency(loanBal)}
                    </span>
                    {loanBal > 0 && (
                      <span className="text-[10px] text-amber-800 font-semibold block mt-0.5">
                        {staff.autoLoanDeduct !== false
                          ? `₹${(staff.monthlyLoanDeduction && staff.monthlyLoanDeduction > 0 ? staff.monthlyLoanDeduction : loanBal).toLocaleString('en-IN')}/mo`
                          : 'Manual only'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Net Payable Highlight Box */}
                <div className="p-3 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-xl col-span-2 sm:col-span-4 lg:col-span-1 shadow-md shadow-emerald-900/15 flex flex-col justify-between">
                  <span className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider block">Total Net Salary</span>
                  <span className="text-base font-black font-mono mt-1 block tracking-tight">
                    {formatCurrency(payrollCalc.netPayable)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-800 bg-slate-50/90 p-3 rounded-xl border border-slate-200/80 font-medium">
                <div className="flex items-center gap-4 flex-wrap">
                  <span>Basic: <strong className="text-slate-900">{formatCurrency(payrollCalc.wageEarnings)}</strong></span>
                  <span>OT Pay: <strong className="text-purple-700">+{formatCurrency(payrollCalc.otEarnings)}</strong></span>
                  <span>Advance (Debit): <strong className="text-rose-600 font-mono">-{formatCurrency(currentMonthAdvances)}</strong></span>
                  {payrollCalc.currentLoanDeduction > 0 && (
                    <span>Loan Repay (Debit): <strong className="text-amber-700 font-mono">-{formatCurrency(payrollCalc.currentLoanDeduction)}</strong></span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: COMPLETE MONTHLY ATTENDANCE, LOANS LEDGER & SALARY SETTLEMENT */}
            <StaffLedgerSheet
              staff={staff}
              month={selectedMonth}
              loanAdvanceCard={
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/70">
                        <History className="w-4 h-4" />
                      </div>
                      <span>Loans &amp; Advances Ledger ({loanAdvanceHistory.length} records)</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80 mr-1">
                        Loan Balance: {formatCurrency(loanBal)}
                      </span>
                      {loanBal > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setLoanModalType('loan_repay');
                            setIsLoanModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.98]"
                          title="Record loan repayment"
                        >
                          <HandCoins className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Repay Loan</span>
                        </button>
                      )}
                      {currentMonthAdvances > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setAdvanceModalType('advance_repay');
                            setIsAdvanceModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.98]"
                          title="Record advance repayment"
                        >
                          <HandCoins className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Repay Advance</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {loanBal > 0 && (
                    <div className="flex items-center justify-between bg-gradient-to-r from-amber-50/90 to-orange-50/40 border border-amber-200/80 rounded-xl px-3.5 py-2.5 text-xs text-amber-950 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">Auto Salary Collection:</span>
                        <span>
                          {staff.autoLoanDeduct !== false
                            ? `Active (${staff.monthlyLoanDeduction && staff.monthlyLoanDeduction > 0 ? `₹${staff.monthlyLoanDeduction.toLocaleString('en-IN')}/mo installment` : 'Full outstanding balance'})`
                            : 'Disabled (Manual cash/bank repayment only)'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onEditStaff(staff);
                        }}
                        className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                      >
                        Edit Collection Plan
                      </button>
                    </div>
                  )}

                  {loanAdvanceHistory.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 font-medium bg-slate-50/80 rounded-xl border border-dashed border-slate-200">
                      No advance or loan transactions recorded for this staff member.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden text-xs bg-white">
                      {loanAdvanceHistory.map((item) => (
                        <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  item.type === 'advance'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                                    : item.type === 'loan_issue'
                                    ? 'bg-rose-50 text-rose-800 border border-rose-200/80'
                                    : item.type === 'advance_repay'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                                }`}
                              >
                                {item.type === 'advance'
                                  ? 'Advance · Debit'
                                  : item.type === 'loan_issue'
                                  ? 'Loan Issued · Debit'
                                  : item.type === 'advance_repay'
                                  ? 'Advance Repaid · Paid'
                                  : 'Loan Repaid · Paid'}
                              </span>
                              <span className="font-medium text-slate-700">{formatDatePretty(item.date)}</span>
                            </div>
                            {item.notes && (
                              <div className="text-[11px] text-slate-500 font-medium mt-1 pl-1">{item.notes}</div>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {item.type === 'advance' || item.type === 'loan_issue' ? (
                              <span className="font-mono font-bold text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/80 inline-flex items-center gap-1.5 shadow-2xs">
                                <span className="text-[10px] font-extrabold uppercase text-rose-500 tracking-wider">Debit</span>
                                <span className="text-sm font-black">-{formatCurrency(item.amount)}</span>
                              </span>
                            ) : (
                              <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 inline-flex items-center gap-1.5 shadow-2xs">
                                <span className="text-[10px] font-extrabold uppercase text-emerald-600 tracking-wider">Paid</span>
                                <span className="text-sm font-black">+{formatCurrency(item.amount)}</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={async () => {
                                const label =
                                  item.type === 'advance'
                                    ? 'advance'
                                    : item.type === 'advance_repay'
                                    ? 'advance repayment'
                                    : item.type === 'loan_issue'
                                    ? 'loan issue'
                                    : 'loan repay';
                                if (
                                  window.confirm(
                                    `Delete this ${label} of ${formatCurrency(item.amount)} from ${formatDatePretty(
                                      item.date
                                    )}?`
                                  )
                                ) {
                                  await deleteLoanAdvance(item.id);
                                  showToast(`Deleted ${label} record of ${formatCurrency(item.amount)}.`, 'info');
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              }
            />

            {/* SECTION 4: FINALIZED PAYMENT DISBURSEMENT HISTORY */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <span>Salary Payment Receipts ({staffPayments.length} records)</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                  Past salary disbursements
                </span>
              </div>

              {staffPayments.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 font-medium bg-slate-50/80 rounded-xl border border-dashed border-slate-200">
                  No finalized salary payments recorded yet for this staff member.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden text-xs bg-white">
                  {staffPayments.map((p) => (
                    <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {formatMonthName(p.month)} · Disbursed on {formatDatePretty(p.date)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Method: <strong className="text-slate-700">{p.paymentMethod}</strong> {p.notes ? `(${p.notes})` : ''} · Gross: {formatCurrency(p.gross)}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-emerald-950 block">
                          {formatCurrency(p.net)}
                        </span>
                        <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                          Paid
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Payslip Print Modal */}
      <PayslipPrintModal
        isOpen={isPayslipModalOpen}
        onClose={() => setIsPayslipModalOpen(false)}
        calc={payrollCalc}
        settings={settings}
        advanceDeduct={currentMonthAdvances}
        loanDeduct={0}
        paymentMethod="Bank Transfer"
        paymentNotes=""
      />

      {/* Direct Embedded Advance Modal */}
      {isAdvanceModalOpen && (
        <AdvanceLoanModal
          isOpen={isAdvanceModalOpen}
          onClose={() => setIsAdvanceModalOpen(false)}
          staff={staff}
          defaultType={advanceModalType}
          mode="advance"
        />
      )}

      {/* Direct Embedded Loan Modal */}
      {isLoanModalOpen && (
        <AdvanceLoanModal
          isOpen={isLoanModalOpen}
          onClose={() => setIsLoanModalOpen(false)}
          staff={staff}
          defaultType={loanModalType}
          mode="loan"
        />
      )}
    </>
  );
};
