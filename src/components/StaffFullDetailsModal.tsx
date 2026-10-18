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
          <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3.5">
              <StaffAvatar name={staff.name} photo={staff.photo} size="lg" className="border-2 border-white/20" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-white">{staff.name}</h2>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-emerald-400">
                    {staff.id}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Active Staff
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
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
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    title="Call Staff"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors"
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
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                title="Edit Staff Member"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                title="Print Full Record"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleDeleteStaff}
                className="p-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-white rounded-lg transition-colors"
                title="Delete Staff Member"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-header Controls Bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Month:</span>
              <button
                type="button"
                onClick={() => handleShiftMonth(-1)}
                className="p-1 rounded text-slate-800 hover:text-slate-950 hover:bg-slate-200"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-lg text-slate-900 bg-white"
              />
              <button
                type="button"
                onClick={() => handleShiftMonth(1)}
                className="p-1 rounded text-slate-800 hover:text-slate-950 hover:bg-slate-200"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-900 ml-1">
                {formatMonthName(selectedMonth)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setIsAdvanceModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                title="Record salary advance for this staff member"
              >
                <Wallet className="w-3.5 h-3.5 text-purple-600" />
                <span>+ Add Advance</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoanModalType('loan_issue');
                  setIsLoanModalOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                title="Issue loan for this staff member"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                <span>+ Add Loan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSalary(staff.id);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                title="Open Interactive Salary Studio"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Salary Studio</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPayslipModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                title="Generate & Print Payslip"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>View Payslip</span>
              </button>
            </div>
          </div>

          {/* ALL DETAILS IN ONE SINGLE PAGE (No separated tabs) */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
            {/* SECTION 1: PROFILE & BANKING DETAILS */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Profile, Contact & Banking Details</span>
                </h3>
                <span className="text-xs font-semibold text-slate-700">Complete staff record</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* Staff ID */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-900 block font-bold uppercase">Staff ID</span>
                  <span className="font-mono font-bold text-slate-900 block bg-slate-50 px-2 py-0.5 rounded border border-slate-200 inline-block">
                    {staff.id}
                  </span>
                </div>

                {/* Contact */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-900 block font-bold uppercase">Phone Number</span>
                  <span className="font-mono font-semibold text-slate-900 block">
                    {staff.phone || '—'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-900 block font-bold uppercase">Employment Status</span>
                  <span className="font-semibold text-emerald-700 block capitalize">
                    {staff.status || 'Active'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-900 block font-bold uppercase">Daily Wage Rate</span>
                  <span className="font-mono font-bold text-slate-900 block">
                    {formatCurrency(staff.wage)} / day
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-900 block font-bold uppercase">Overtime Rate</span>
                  <span className="font-mono font-bold text-slate-900 block">
                    {staff.otRate > 0 ? `${formatCurrency(staff.otRate)} / hr` : '—'}
                  </span>
                </div>

                {/* Bank details */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-900 block font-bold uppercase">Bank Name</span>
                  <span className="font-bold text-slate-900 block">
                    {staff.bankName || 'Cash / Direct'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-900 block font-bold uppercase">Account Holder</span>
                  <span className="font-bold text-slate-900 block">
                    {staff.accountHolder || staff.name}
                  </span>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-900 font-bold uppercase">Bank Account Number</span>
                    {staff.accountNumber && (
                      <button
                        type="button"
                        onClick={copyAccountNumber}
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 font-semibold"
                      >
                        {copiedAccount ? (
                          <>
                            <Check className="w-3 h-3" />
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
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {staff.accountNumber || 'Not configured'}
                    </span>
                    {staff.ifsc && (
                      <span className="text-[11px] font-mono text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        IFSC: {staff.ifsc}
                      </span>
                    )}
                  </div>
                </div>

                {staff.notes && (
                  <div className="sm:col-span-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                    <span className="text-[10px] text-slate-900 font-bold uppercase block">Remarks / Notes</span>
                    <p className="text-slate-900 italic text-xs mt-0.5 font-medium">{staff.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: MONTHLY SALARY CALCULATION & ATTENDANCE SUMMARY */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span>Salary Calculation Summary — {formatMonthName(selectedMonth)}</span>
                </h3>
                <span className="text-xs font-bold text-slate-800">
                  {payrollCalc.effectiveDays} Effective Days Logged
                </span>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-900 font-bold uppercase block">Days Present</span>
                  <span className="text-base font-bold font-mono text-slate-900 mt-1 block">
                    {payrollCalc.daysCount}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-900 font-bold uppercase block">Half Days</span>
                  <span className="text-base font-bold font-mono text-slate-900 mt-1 block">
                    {payrollCalc.halfDaysCount}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-900 font-bold uppercase block">Overtime (h)</span>
                  <span className="text-base font-bold font-mono text-slate-900 mt-1 block">
                    {payrollCalc.otHours} hrs
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-900 font-bold uppercase block">Gross Wages</span>
                  <span className="text-base font-bold font-mono text-slate-900 mt-1 block">
                    {formatCurrency(payrollCalc.gross)}
                  </span>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-blue-950 font-bold uppercase block">Month Advance</span>
                    
                    </div>
                    <span className="text-base font-bold font-mono text-blue-900 mt-1 block">
                      {formatCurrency(currentMonthAdvances)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-amber-950 font-bold uppercase block">Active Loan</span>
                      <div className="flex items-center gap-1">
                        
                        {loanBal > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setLoanModalType('loan_repay');
                              setIsLoanModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                            title="Repay loan"
                          >
                            Repay
                          </button>
                        )}
                      </div>
                    </div>
                    <span className="text-base font-bold font-mono text-amber-900 mt-1 block">
                      {formatCurrency(loanBal)}
                    </span>
                    {loanBal > 0 && (
                      <span className="text-[10px] text-amber-950 font-semibold block mt-0.5">
                        {staff.autoLoanDeduct !== false
                          ? `Auto Repay: ₹${(staff.monthlyLoanDeduction && staff.monthlyLoanDeduction > 0 ? staff.monthlyLoanDeduction : loanBal).toLocaleString('en-IN')}/mo`
                          : 'Manual Repay Only'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Net Payable Highlight Box */}
                <div className="p-3 bg-emerald-600 text-white rounded-xl col-span-2 sm:col-span-4 lg:col-span-1 shadow-sm">
                  <span className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider block">Total Net Salary</span>
                  <span className="text-base font-extrabold font-mono mt-1 block">
                    {formatCurrency(payrollCalc.netPayable)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-900 bg-slate-50/70 p-3 rounded-lg border border-slate-200/80">
                <div className="flex items-center gap-4">
                  <span>Basic: <strong>{formatCurrency(payrollCalc.wageEarnings)}</strong></span>
                  <span>OT Pay: <strong>{formatCurrency(payrollCalc.otEarnings)}</strong></span>
                  <span>Advance: <strong className="text-rose-600">-{formatCurrency(currentMonthAdvances)}</strong></span>
                  {payrollCalc.currentLoanDeduction > 0 && (
                    <span>Loan Repay: <strong className="text-amber-700">-{formatCurrency(payrollCalc.currentLoanDeduction)}</strong></span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSalary(staff.id);
                  }}
                  className="text-xs font-bold text-blue-700 hover:text-blue-800 underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Settle & record disbursement in Salary Studio &rarr;</span>
                </button>
              </div>
            </div>

            {/* SECTION 3: COMPLETE MONTHLY ATTENDANCE & DAILY WAGE REGISTER */}
            <StaffLedgerSheet staff={staff} month={selectedMonth} />

            {/* SECTION 4: LOAN & FINANCIAL TRANSACTION LEDGER */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-600" />
                  <span>Loans & Advances Ledger ({loanAdvanceHistory.length} records)</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-800 mr-1">
                    Loan Balance: {formatCurrency(loanBal)}
                  </span>
                  {loanBal > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setLoanModalType('loan_repay');
                        setIsLoanModalOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                      title="Record loan repayment"
                    >
                      <HandCoins className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Repay Loan</span>
                    </button>
                  )}
                </div>
              </div>

              {loanBal > 0 && (
                <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200/80 rounded-lg px-3 py-2 text-xs text-amber-900">
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
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                  >
                    Edit Collection Plan
                  </button>
                </div>
              )}

              {loanAdvanceHistory.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-800 font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  No advance or loan transactions recorded for this staff member.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {loanAdvanceHistory.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.type === 'advance'
                                ? 'bg-blue-100 text-blue-800'
                                : item.type === 'loan_issue'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.type === 'advance'
                              ? 'Advance'
                              : item.type === 'loan_issue'
                              ? 'Loan Issued'
                              : 'Loan Repaid'}
                          </span>
                          <span>{formatDatePretty(item.date)}</span>
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-slate-800 font-medium mt-0.5">{item.notes}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {formatCurrency(item.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            const label =
                              item.type === 'advance'
                                ? 'advance'
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
                          className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
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

            {/* SECTION 5: FINALIZED PAYMENT DISBURSEMENT HISTORY */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Salary Payment Receipts ({staffPayments.length} records)</span>
                </h3>
                <span className="text-xs font-semibold text-slate-700">Past salary disbursements</span>
              </div>

              {staffPayments.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-800 font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  No finalized salary payments recorded yet for this staff member.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {staffPayments.map((p) => (
                    <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {formatMonthName(p.month)} · Disbursed on {formatDatePretty(p.date)}
                        </div>
                        <div className="text-[11px] text-slate-800 font-medium mt-0.5">
                          Method: {p.paymentMethod} {p.notes ? `(${p.notes})` : ''} · Gross: {formatCurrency(p.gross)}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-emerald-900 block">
                          {formatCurrency(p.net)}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
          defaultType="advance"
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
