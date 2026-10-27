import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Receipt,
  Printer,
  Share2,
  CheckCircle,
  CreditCard,
  UserCheck,
  Eye,
  Calculator,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Landmark,
  Banknote,
  QrCode,
  FileText,
  Copy,
  Check,
  Sparkles,
  Wallet,
  PiggyBank,
  ShieldCheck,
  Clock,
  ArrowRight,
  TrendingDown,
  Building2,
  Users,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { useStaff } from '../context/StaffContext';
import { PaymentMethod } from '../types';
import { StaffAvatar } from './StaffAvatar';
import { NumberStepper } from './NumberStepper';
import { PayslipPrintModal } from './PayslipPrintModal';
import {
  formatCurrency,
  formatMonthName,
  getTodayDateString,
  buildWhatsAppSlipUrl,
} from '../utils/formatters';

interface SalaryStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
}

export const SalaryStudioModal: React.FC<SalaryStudioModalProps> = ({
  isOpen,
  onClose,
  staffId,
}) => {
  const {
    staff,
    selectedMonth,
    setSelectedMonth,
    calculateStaffPayroll,
    getStaffLoanBalance,
    getStaffAdvancesForMonth,
    recordPayment,
    payments,
    settings,
    showToast,
    updateStaff,
  } = useStaff();

  const [activeStaffId, setActiveStaffId] = useState<string>(staffId);
  const [advanceDeduct, setAdvanceDeduct] = useState<number>(0);
  const [loanDeduct, setLoanDeduct] = useState<number>(0);
  const [saveAsMonthlyEmi, setSaveAsMonthlyEmi] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState<boolean>(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);

  useEffect(() => {
    if (staffId) {
      setActiveStaffId(staffId);
    }
  }, [staffId]);

  useEffect(() => {
    if (!activeStaffId) return;
    const existing = payments.find(
      (p) => p.staffId === activeStaffId && p.month === selectedMonth
    );
    if (existing) {
      setAdvanceDeduct(existing.advance || 0);
      setLoanDeduct(existing.loanDeduct || 0);
      setPaymentMethod(existing.paymentMethod || 'Bank Transfer');
      setPaymentNotes(existing.notes || '');
    } else {
      const monthAdv = getStaffAdvancesForMonth(activeStaffId, selectedMonth);
      setAdvanceDeduct(monthAdv);

      // Collect loan repayment calculated for this month
      const calc = calculateStaffPayroll(activeStaffId, selectedMonth);
      setLoanDeduct(calc ? calc.currentLoanDeduction : 0);
      setPaymentNotes('');
    }
    setPaymentSuccessMsg(null);
  }, [
    activeStaffId,
    selectedMonth,
    payments,
    getStaffAdvancesForMonth,
    staff,
    getStaffLoanBalance,
    calculateStaffPayroll,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const currentStaff = useMemo(
    () => staff.find((s) => s.id === activeStaffId),
    [staff, activeStaffId]
  );

  const currentCalc = useMemo(
    () => (activeStaffId ? calculateStaffPayroll(activeStaffId, selectedMonth) : null),
    [activeStaffId, selectedMonth, calculateStaffPayroll]
  );

  const currentLoanBal = useMemo(
    () => (activeStaffId ? getStaffLoanBalance(activeStaffId) : 0),
    [activeStaffId, getStaffLoanBalance]
  );

  const recordedMonthAdvances = useMemo(
    () => (activeStaffId ? getStaffAdvancesForMonth(activeStaffId, selectedMonth) : 0),
    [activeStaffId, selectedMonth, getStaffAdvancesForMonth]
  );

  const existingPayment = useMemo(
    () =>
      payments.find(
        (p) => p.staffId === activeStaffId && p.month === selectedMonth
      ),
    [payments, activeStaffId, selectedMonth]
  );

  if (!isOpen || !currentStaff) return null;

  const totalDeductions = advanceDeduct + loanDeduct;
  const currentGross = currentCalc ? currentCalc.gross : 0;
  const netPayable = Math.max(0, currentGross - totalDeductions);
  const remainingLoan = Math.max(0, currentLoanBal - loanDeduct);

  // Absent days calculation
  const absentDays = (currentCalc?.attendanceRecords || []).filter(
    (r) => r.status === 'absent'
  ).length;

  const handleShiftMonth = (delta: number) => {
    const [yr, mo] = selectedMonth.split('-').map(Number);
    const d = new Date(yr, mo - 1 + delta, 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newY}-${newM}`);
  };

  const copyAccountNumber = (accNum: string) => {
    navigator.clipboard.writeText(accNum);
    setCopiedAccount(true);
    showToast('Account number copied to clipboard', 'info');
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleRecordPayment = async () => {
    if (!currentCalc) return;

    if (loanDeduct > currentLoanBal) {
      showToast(
        `Loan deduction (${formatCurrency(loanDeduct)}) cannot exceed active loan balance (${formatCurrency(currentLoanBal)}).`,
        'error',
        'Invalid Deduction'
      );
      return;
    }

    await recordPayment({
      date: getTodayDateString(),
      month: selectedMonth,
      staffId: currentCalc.staff.id,
      staffName: currentCalc.staff.name,
      dailyWage: currentCalc.staff.wage,
      daysPresent: currentCalc.effectiveDays,
      otHours: currentCalc.otHours,
      otRate: currentCalc.otRate,
      otEarnings: currentCalc.otEarnings,
      gross: currentGross,
      advance: advanceDeduct,
      loanDeduct: loanDeduct,
      net: netPayable,
      status: 'Paid',
      paymentMethod,
      notes: paymentNotes || `${paymentMethod} disbursement`,
    });

    if (saveAsMonthlyEmi && currentCalc) {
      await updateStaff(currentCalc.staff.id, {
        monthlyLoanDeduction: loanDeduct,
        autoLoanDeduct: loanDeduct > 0,
      });
    }

    const isUpdate = !!existingPayment;
    const msg = isUpdate
      ? `Disbursement for ${currentCalc.staff.name} updated to ${formatCurrency(netPayable)}!`
      : `Payment of ${formatCurrency(netPayable)} recorded for ${currentCalc.staff.name}!`;

    setPaymentSuccessMsg(msg);
    showToast(msg, 'success', isUpdate ? 'Payment Updated' : 'Salary Disbursed');
  };

  const handleWhatsApp = () => {
    if (!currentCalc) return;
    const url = buildWhatsAppSlipUrl(
      currentCalc.staff.phone,
      currentCalc.staff.name,
      currentCalc.staff.id,
      selectedMonth,
      currentCalc.staff.wage,
      currentCalc.effectiveDays,
      currentCalc.otHours,
      currentGross,
      advanceDeduct,
      loanDeduct,
      netPayable,
      settings.companyName
    );
    const w = window.open(url, '_blank');
    if (!w) {
      showToast('Popup was blocked by browser. Please allow popups.', 'info');
    }
  };

  const paymentMethodsList: Array<{
    id: PaymentMethod;
    label: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    { id: 'Bank Transfer', label: 'Bank Transfer', icon: Landmark },
    { id: 'Cash', label: 'Cash in Hand', icon: Banknote },
    { id: 'UPI', label: 'UPI / QR', icon: QrCode },
    { id: 'Cheque', label: 'Cheque', icon: FileText },
  ];

  return (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        >
          {/* ─────────────────────────────────────────────────────────────
              1. EXECUTIVE HEADER BANNER (POLISHED GRADIENT & STAFF BAR)
          ───────────────────────────────────────────────────────────── */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3.5 min-w-0">
              <StaffAvatar
                name={currentStaff.name}
                photo={currentStaff.photo}
                size="md"
                className="ring-2 ring-emerald-500/40 shadow-sm shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                    {currentStaff.name}
                  </h2>
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ID: {currentStaff.id}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                    {currentStaff.designation || 'Staff'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
                  <span>
                    Daily Wage:{' '}
                    <strong className="text-white font-mono">
                      {formatCurrency(currentStaff.wage)}
                    </strong>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span>
                    OT Rate:{' '}
                    <strong className="text-white font-mono">
                      {formatCurrency(currentStaff.otRate)}/hr
                    </strong>
                  </span>
                  {currentStaff.phone && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        📞 {currentStaff.phone}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Switcher & Actions */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {/* Switch Staff Dropdown */}
              <div className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-xl border border-white/10 transition-colors">
                <Users className="w-3.5 h-3.5 text-slate-300" />
                <select
                  value={activeStaffId}
                  onChange={(e) => setActiveStaffId(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-white focus:outline-hidden cursor-pointer"
                  title="Switch Staff Member"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id} className="text-slate-900 bg-white">
                      {s.name} ({s.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* View Payslip CTA */}
              <button
                type="button"
                onClick={() => setIsPayslipModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="View & Print Official Payslip"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Payslip</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              2. SUB-HEADER: PAY CYCLE & SETTLEMENT STATUS
          ───────────────────────────────────────────────────────────── */}
          <div className="px-5 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            {/* Month Navigator */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                Salary Period:
              </span>
              <div className="inline-flex items-center bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleShiftMonth(-1)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2 py-1 text-xs font-bold text-slate-900 bg-white border-0 focus:outline-hidden cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => handleShiftMonth(1)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Settlement Status Pill */}
            <div>
              {existingPayment ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Settled on {existingPayment.date} via {existingPayment.paymentMethod} (
                    {formatCurrency(existingPayment.net)})
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pending Disbursement for {formatMonthName(selectedMonth)}</span>
                </div>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              3. STUDIO MAIN BODY: BALANCED 2-PANEL LAYOUT
          ───────────────────────────────────────────────────────────── */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
            {/* Success Toast Banner */}
            {paymentSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold shadow-2xs animate-in fade-in duration-200">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{paymentSuccessMsg}</span>
              </div>
            )}

            {currentCalc && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* ═══════════════════════════════════════════════════════
                    LEFT COLUMN (7 cols): FINANCIAL CALCULATOR & LEDGER
                ═══════════════════════════════════════════════════════ */}
                <div className="lg:col-span-7 space-y-4">
                  {/* CARD A: GROSS EARNINGS BREAKDOWN */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          1. Gross Earnings Engine
                        </h3>
                      </div>

                      {/* Attendance Pills Strip */}
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ✓ {currentCalc.daysCount} Full
                        </span>
                        {currentCalc.halfDaysCount > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                            ½ {currentCalc.halfDaysCount} Half
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                          ✕ {absentDays} Absent
                        </span>
                        {currentCalc.otHours > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                            ⏱ {currentCalc.otHours}h OT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Wage Calculation Rows */}
                    <div className="space-y-2 text-xs">
                      {/* Row 1: Daily Wage */}
                      <div className="flex items-center justify-between p-3 bg-slate-50/80 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors">
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">
                            Base Daily Wages
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {currentCalc.effectiveDays} effective days ×{' '}
                            {formatCurrency(currentCalc.staff.wage)}/day
                          </span>
                        </div>
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {formatCurrency(currentCalc.wageEarnings)}
                        </span>
                      </div>

                      {/* Row 2: Overtime Pay */}
                      <div className="flex items-center justify-between p-3 bg-slate-50/80 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors">
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">
                            Overtime Wages (OT)
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {currentCalc.otHours} hours ×{' '}
                            {formatCurrency(currentCalc.otRate)}/hr
                          </span>
                        </div>
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {formatCurrency(currentCalc.otEarnings)}
                        </span>
                      </div>
                    </div>

                    {/* Total Gross Strip */}
                    <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                          Total Gross Wages
                        </span>
                      </div>
                      <span className="text-base font-black font-mono text-emerald-400">
                        {formatCurrency(currentGross)}
                      </span>
                    </div>
                  </div>

                  {/* CARD B: AUTHORIZED SALARY DEDUCTIONS */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          2. Authorized Deductions
                        </h3>
                      </div>
                      <span className="text-xs text-rose-700 font-mono font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                        Total Deductions: -{formatCurrency(totalDeductions)}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* DEDUCTION 1: MID-MONTH SALARY ADVANCES */}
                      <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Banknote className="w-3.5 h-3.5 text-purple-600" />
                            <span>Mid-Month Salary Advance</span>
                          </label>
                          {recordedMonthAdvances > 0 && (
                            <span className="text-[11px] text-purple-700 font-semibold font-mono">
                              Logged in ledger: {formatCurrency(recordedMonthAdvances)}
                            </span>
                          )}
                        </div>

                        {/* Fast Presets for Advance */}
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                          {recordedMonthAdvances > 0 && (
                            <button
                              type="button"
                              onClick={() => setAdvanceDeduct(recordedMonthAdvances)}
                              className="px-2 py-0.5 rounded-md font-bold bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
                            >
                              Actual ({formatCurrency(recordedMonthAdvances)})
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setAdvanceDeduct(0)}
                            className="px-2 py-0.5 rounded-md font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            ₹0 (Waive/Defer)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdvanceDeduct((prev) => prev + 500)}
                            className="px-2 py-0.5 rounded-md font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            +₹500
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdvanceDeduct((prev) => prev + 1000)}
                            className="px-2 py-0.5 rounded-md font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            +₹1,000
                          </button>
                        </div>

                        <NumberStepper
                          value={advanceDeduct}
                          onChange={setAdvanceDeduct}
                          step={100}
                          prefix="₹"
                          stepButtons={[
                            { label: '+500', delta: 500 },
                            { label: '+1000', delta: 1000 },
                          ]}
                        />
                      </div>

                      {/* DEDUCTION 2: LOAN REPAYMENT / EMI RECOVERY */}
                      <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <PiggyBank className="w-3.5 h-3.5 text-amber-600" />
                            <span>Loan Repayment Recovery</span>
                            {currentLoanBal > 0 &&
                              currentStaff.autoLoanDeduct !== false &&
                              loanDeduct > 0 && (
                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>Auto-Collected</span>
                                </span>
                              )}
                          </label>

                          <span className="text-[11px] font-bold font-mono text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                            Loan Due: {formatCurrency(currentLoanBal)}
                          </span>
                        </div>

                        {currentLoanBal === 0 ? (
                          <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              <strong>No Active Loan Due.</strong> This staff member has cleared all
                              loans or has zero outstanding balance.
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* Fast Presets for Loan Repayment */}
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                              {currentStaff.monthlyLoanDeduction &&
                              currentStaff.monthlyLoanDeduction > 0 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLoanDeduct(
                                      Math.min(
                                        currentStaff.monthlyLoanDeduction || 0,
                                        currentLoanBal
                                      )
                                    )
                                  }
                                  className="px-2.5 py-1 font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
                                >
                                  Suggested EMI (₹{currentStaff.monthlyLoanDeduction})
                                </button>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => setLoanDeduct(currentLoanBal)}
                                className="px-2 py-1 font-bold rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                Full Due (₹{currentLoanBal})
                              </button>
                              <button
                                type="button"
                                onClick={() => setLoanDeduct(Math.round(currentLoanBal / 2))}
                                className="px-2 py-1 font-bold rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                50% (₹{Math.round(currentLoanBal / 2)})
                              </button>
                              <button
                                type="button"
                                onClick={() => setLoanDeduct(0)}
                                className="px-2 py-1 font-bold rounded-lg bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                Skip Month (₹0)
                              </button>
                            </div>

                            <NumberStepper
                              value={loanDeduct}
                              onChange={(val) => setLoanDeduct(Math.min(val, currentLoanBal))}
                              step={500}
                              max={currentLoanBal}
                              prefix="₹"
                              stepButtons={[
                                { label: '+1000', delta: 1000 },
                                { label: '+2000', delta: 2000 },
                              ]}
                            />

                            <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                              <span>
                                Remaining loan balance after this deduction:{' '}
                                <strong className="font-mono text-slate-800">
                                  {formatCurrency(remainingLoan)}
                                </strong>
                              </span>
                            </div>

                            {/* Option to save default monthly auto-deduction */}
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1 select-none">
                              <input
                                type="checkbox"
                                checked={saveAsMonthlyEmi}
                                onChange={(e) => setSaveAsMonthlyEmi(e.target.checked)}
                                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                              />
                              <span>
                                Save <strong>₹{loanDeduct}</strong> as default monthly auto-deduction
                                preference for future months
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CARD C: TRANSPARENT SETTLEMENT EQUATION RIBBON */}
                  <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                          Gross Wages
                        </span>
                        <span className="font-mono font-bold text-sm text-white">
                          {formatCurrency(currentGross)}
                        </span>
                      </div>
                      <span className="text-slate-500 font-bold text-sm">−</span>
                      <div>
                        <span className="text-[10px] text-purple-300 font-semibold uppercase block">
                          Advances
                        </span>
                        <span className="font-mono font-bold text-sm text-purple-200">
                          {formatCurrency(advanceDeduct)}
                        </span>
                      </div>
                      <span className="text-slate-500 font-bold text-sm">−</span>
                      <div>
                        <span className="text-[10px] text-amber-300 font-semibold uppercase block">
                          Loan Repay
                        </span>
                        <span className="font-mono font-bold text-sm text-amber-200">
                          {formatCurrency(loanDeduct)}
                        </span>
                      </div>
                      <span className="text-slate-500 font-bold text-sm">=</span>
                      <div>
                        <span className="text-[10px] text-emerald-300 font-bold uppercase block">
                          Net Payable
                        </span>
                        <span className="font-mono font-black text-base text-emerald-400">
                          {formatCurrency(netPayable)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════
                    RIGHT COLUMN (5 cols): SETTLEMENT & DISBURSEMENT CONSOLE
                ═══════════════════════════════════════════════════════ */}
                <div className="lg:col-span-5 space-y-4">
                  {/* HERO CARD: NET PAYABLE */}
                  <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-2xl p-5 shadow-lg shadow-emerald-950/15 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Total Net Payable</span>
                      </span>
                      <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white">
                        {formatMonthName(selectedMonth)}
                      </span>
                    </div>

                    <div className="pt-1">
                      <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight block">
                        {formatCurrency(netPayable)}
                      </span>
                      <p className="text-[11px] text-emerald-100 mt-1 leading-snug">
                        Calculated wage minus mid-month advances &amp; loan deductions.
                      </p>
                    </div>
                  </div>

                  {/* STAFF BANK ACCOUNT DETAILS CARD */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Staff Payout Account</span>
                      </h4>
                      {currentStaff.accountNumber && (
                        <button
                          type="button"
                          onClick={() => copyAccountNumber(currentStaff.accountNumber || '')}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                          title="Copy Account Number"
                        >
                          {copiedAccount ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
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

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-400 text-[11px]">Bank:</span>
                        <span className="font-semibold">{currentStaff.bankName || 'Direct Transfer'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-400 text-[11px]">Account No:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {currentStaff.accountNumber || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-400 text-[11px]">IFSC Code:</span>
                        <span className="font-mono font-medium text-slate-800">
                          {currentStaff.ifsc || '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-400 text-[11px]">Beneficiary:</span>
                        <span className="text-slate-800">
                          {currentStaff.accountHolder || currentStaff.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PAYMENT EXECUTION CONSOLE */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Disbursement Details
                    </h4>

                    {/* Payment Method Selector Grid */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {paymentMethodsList.map((m) => {
                          const IconComp = m.icon;
                          const isSelected = paymentMethod === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setPaymentMethod(m.id)}
                              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-400 shadow-2xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <IconComp
                                className={`w-3.5 h-3.5 ${
                                  isSelected ? 'text-emerald-700' : 'text-slate-500'
                                }`}
                              />
                              <span className="truncate">{m.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reference / Transaction Notes */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Transaction Reference / Voucher
                      </label>
                      <input
                        type="text"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="e.g. UTR / IMPS #892147 or Cash receipt"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 transition-all"
                      />
                    </div>

                    {/* Primary Action Button */}
                    <button
                      type="button"
                      onClick={handleRecordPayment}
                      className="w-full py-3 px-4 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 rounded-xl shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                      <span>
                        {existingPayment ? 'Update Disbursement' : 'Record Disbursement'} (
                        {formatCurrency(netPayable)})
                      </span>
                    </button>

                    {/* Secondary Actions: Payslip & WhatsApp */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsPayslipModalOpen(true)}
                        className="py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        title="View & Print Official Payslip"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-600" />
                        <span>Print Payslip</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleWhatsApp}
                        className="py-2 px-3 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Send Payslip on WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Payslip Print Modal */}
      {currentCalc && (
        <PayslipPrintModal
          isOpen={isPayslipModalOpen}
          onClose={() => setIsPayslipModalOpen(false)}
          calc={currentCalc}
          settings={settings}
          advanceDeduct={advanceDeduct}
          loanDeduct={loanDeduct}
          paymentMethod={paymentMethod}
          paymentNotes={paymentNotes}
        />
      )}
    </>
  );
};
