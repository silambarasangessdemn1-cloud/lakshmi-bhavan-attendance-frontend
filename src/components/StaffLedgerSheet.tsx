import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Wallet,
  TrendingUp,
  Receipt,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Printer,
  Sparkles,
  ArrowDownRight,
  ShieldCheck,
  Check,
  Pencil,
  Trash2,
  QrCode,
  Banknote,
  Landmark,
} from 'lucide-react';
import { StaffMember, AttendanceRecord, PaymentMethod } from '../types';
import { useStaff } from '../context/StaffContext';
import { StaffAvatar } from './StaffAvatar';
import {
  formatCurrency,
  formatMonthName,
  formatDatePretty,
  getTodayDateString,
} from '../utils/formatters';

interface StaffLedgerSheetProps {
  staff: StaffMember;
  month: string; // YYYY-MM
}

export const StaffLedgerSheet: React.FC<StaffLedgerSheetProps> = ({ staff, month }) => {
  const {
    getAttendanceForStaffAndMonth,
    getStaffLoanAdvanceEntries,
    getStaffLoanBalance,
    calculateStaffPayroll,
    payments,
    recordPayment,
    deletePayment,
    showToast,
    settings,
  } = useStaff();

  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const monthNum = Number(monthStr);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthAttendance = getAttendanceForStaffAndMonth(staff.id, month);
  const loanAdvanceEntries = getStaffLoanAdvanceEntries(staff.id).filter(
    (e) => e.month === month
  );

  const advanceEntries = loanAdvanceEntries.filter((e) => e.type === 'advance');
  const advanceRepayEntries = loanAdvanceEntries.filter((e) => e.type === 'advance_repay');
  const totalAdvances = Math.max(
    0,
    advanceEntries.reduce((sum, e) => sum + (e.amount || 0), 0) -
    advanceRepayEntries.reduce((sum, e) => sum + (e.amount || 0), 0)
  );
  const activeLoanBal = getStaffLoanBalance(staff.id);

  const payroll = calculateStaffPayroll(staff.id, month);
  const grossSalary = payroll ? payroll.gross : 0;
  const currentLoanDeduction = payroll ? payroll.currentLoanDeduction : 0;
  const netTotal = payroll ? payroll.netPayable : Math.max(0, grossSalary - totalAdvances - currentLoanDeduction);
  const remainingLoanAfterDeduct = Math.max(0, activeLoanBal - currentLoanDeduction);

  // Settlement Form State
  const existingPayment = payments.find((p) => p.staffId === staff.id && p.month === month);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    existingPayment?.paymentMethod || 'Cash'
  );
  const [paymentDate, setPaymentDate] = useState<string>(
    existingPayment?.date || getTodayDateString()
  );
  const [paymentNotes, setPaymentNotes] = useState<string>(
    existingPayment?.notes || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingPayment) {
      setSelectedMethod(existingPayment.paymentMethod || 'Cash');
      setPaymentDate(existingPayment.date || getTodayDateString());
      setPaymentNotes(existingPayment.notes || '');
      setIsEditing(false);
    } else {
      setSelectedMethod('Cash');
      setPaymentDate(getTodayDateString());
      setPaymentNotes('');
      setIsEditing(false);
    }
  }, [existingPayment?.id, existingPayment?.date, existingPayment?.paymentMethod, month]);

  // Compute attendance summary counts for the month
  let presentDays = 0;
  let halfDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let totalOtHours = 0;

  monthAttendance.forEach((att) => {
    if (att.status === 'present') presentDays += 1;
    else if (att.status === 'half') halfDays += 1;
    else if (att.status === 'absent') absentDays += 1;
    else if (att.status === 'leave') leaveDays += 1;
    totalOtHours += Number(att.ot) || 0;
  });

  const effectiveWorkDays = presentDays + halfDays * 0.5;

  return (
    <div className="bg-white text-slate-800 rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-6 max-w-5xl mx-auto font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. EXECUTIVE DOCUMENT HEADER
      ───────────────────────────────────────────────────────────── */}
     

      {/* ─────────────────────────────────────────────────────────────
          2. STAFF IDENTITY STRIP
      ───────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <StaffAvatar name={staff.name} photo={staff.photo} size="lg" className="border-2 border-white shadow-xs" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-slate-900">{staff.name}</span>
              <span className="text-xs font-mono font-bold bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                {staff.id}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {staff.status === 'inactive' ? 'Inactive' : 'Active Staff'}
              </span>
            </div>
            <div className="text-xs text-slate-600 flex items-center gap-2 mt-1">
              <span className="font-medium">{staff.designation || 'Staff Member'}</span>
              {staff.phone && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="font-mono text-slate-500">{staff.phone}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Wage Structure Badges */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Daily Wage
            </span>
            <span className="font-mono font-bold text-slate-900">
              {formatCurrency(staff.wage)} <span className="text-slate-400 font-normal text-[11px]">/ day</span>
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Overtime Rate
            </span>
            <span className="font-mono font-bold text-purple-900">
              {formatCurrency(staff.otRate || 0)} <span className="text-slate-400 font-normal text-[11px]">/ hr</span>
            </span>
          </div>

          {activeLoanBal > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 shadow-2xs">
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                Outstanding Loan
              </span>
              <span className="font-mono font-bold text-amber-900">
                {formatCurrency(activeLoanBal)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. EXECUTIVE FINANCIAL & ATTENDANCE SUMMARY CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Gross Salary Earned */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border border-emerald-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Gross Wages Earned
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black font-mono text-emerald-950">
              {formatCurrency(grossSalary)}
            </span>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
              {effectiveWorkDays} days worked + {totalOtHours}h OT
            </p>
          </div>
        </div>

        {/* Card 2: Mid-Month Advances */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/80 to-indigo-50/40 border border-purple-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
              Salary Advances
            </span>
            <Wallet className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black font-mono text-purple-950">
              {formatCurrency(totalAdvances)}
            </span>
            <p className="text-[11px] text-purple-700 font-medium mt-0.5">
              {advanceEntries.length} cash payouts deducted
            </p>
          </div>
        </div>

        {/* Card 3: Days Breakdown */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Attendance Breakdown
            </span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              {presentDays} Present
            </span>
            {halfDays > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                {halfDays} Half
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
              {absentDays} Absent
            </span>
          </div>
        </div>

        {/* Card 4: Net Payable */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-md shadow-slate-950/10 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Net Payable Salary
            </span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black font-mono text-white">
              {formatCurrency(netTotal)}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {currentLoanDeduction > 0
                ? 'Gross − Advances − Loan = Net'
                : 'Gross − Advances = Net'}
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. THE MAIN LEDGER SHEET TABLE (PROFESSIONAL & AIRY)
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto max-h-[560px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-600 font-bold text-[11px] uppercase tracking-wider z-10 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 text-center w-12 border-r border-slate-200/80">
                  Day
                </th>
                <th className="py-3 px-4 min-w-[120px] border-r border-slate-200/80">
                  Date &amp; Day
                </th>
                <th className="py-3 px-3 text-center w-20 border-r border-slate-200/80">
                  In Time
                </th>
                <th className="py-3 px-3 text-center w-20 border-r border-slate-200/80">
                  Out Time
                </th>
                <th className="py-3 px-3.5 text-center min-w-[110px] border-r border-slate-200/80">
                  Status
                </th>
                <th className="py-3 px-3 text-center w-20 border-r border-slate-200/80">
                  OT (Hrs)
                </th>
                <th className="py-3 px-4 text-right min-w-[130px] border-r border-slate-200/80">
                  Day Wage
                </th>
                <th className="py-3 px-4 text-right min-w-[120px]">
                  Advance Paid
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {daysArray.map((dayNum) => {
                const dayStr = String(dayNum).padStart(2, '0');
                const dateStr = `${month}-${dayStr}`;
                const att = monthAttendance.find((a) => a.date === dateStr);
                const dayAdvances = advanceEntries.filter((a) => a.date === dateStr);
                const dayAdvanceTotal = dayAdvances.reduce((sum, a) => sum + (a.amount || 0), 0);

                const dateObj = new Date(year, monthNum - 1, dayNum);
                const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];
                const isSunday = dateObj.getDay() === 0;

                // Daily earning calculation
                let dailyEarn = 0;
                if (att?.status === 'present') {
                  dailyEarn = staff.wage + (Number(att.ot) || 0) * (staff.otRate || 0);
                } else if (att?.status === 'half') {
                  dailyEarn = staff.wage * 0.5 + (Number(att.ot) || 0) * (staff.otRate || 0);
                }

                // In and Out displays
                const inDisplay =
                  att?.inTime ||
                  (att?.status === 'present' || att?.status === 'half'
                    ? '09:00'
                    : att?.status === 'leave'
                    ? 'LEAVE'
                    : att?.status === 'absent'
                    ? 'ABS'
                    : '—');

                const outDisplay =
                  att?.outTime ||
                  (att?.status === 'present'
                    ? '18:00'
                    : att?.status === 'half'
                    ? '13:30'
                    : '—');

                const otDisplay = att && Number(att.ot) > 0 ? `+${att.ot}h` : '';

                return (
                  <tr
                    key={dayNum}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isSunday ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* Day number */}
                    <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-700 border-r border-slate-100">
                      {dayStr}
                    </td>

                    {/* Date & Day of week */}
                    <td className="py-2.5 px-4 font-medium text-slate-800 border-r border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-900 font-semibold">{dayStr} {formatMonthName(month).slice(0, 3)}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            isSunday ? 'bg-amber-100 text-amber-900' : 'text-slate-400'
                          }`}
                        >
                          ({dayName})
                        </span>
                      </div>
                    </td>

                    {/* In Time */}
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600 border-r border-slate-100">
                      {inDisplay}
                    </td>

                    {/* Out Time */}
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600 border-r border-slate-100">
                      {outDisplay}
                    </td>

                    {/* Status Pill */}
                    <td className="py-2.5 px-3.5 text-center border-r border-slate-100">
                      {att?.status === 'present' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Present</span>
                        </span>
                      )}
                      {att?.status === 'half' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Half-Day</span>
                        </span>
                      )}
                      {att?.status === 'absent' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Absent</span>
                        </span>
                      )}
                      {att?.status === 'leave' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          <span>Leave</span>
                        </span>
                      )}
                      {!att?.status && (
                        <span className="text-[11px] font-mono text-slate-300">—</span>
                      )}
                    </td>

                    {/* Overtime (OT) */}
                    <td className="py-2.5 px-3 text-center border-r border-slate-100 font-mono">
                      {otDisplay ? (
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-200/60">
                          {otDisplay}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Daily Wage Earned */}
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 border-r border-slate-100">
                      {dailyEarn > 0 ? (
                        <span className="text-emerald-900">{formatCurrency(dailyEarn)}</span>
                      ) : (
                        <span className="text-slate-300 font-normal">₹0</span>
                      )}
                    </td>

                    {/* Advance Deducted */}
                    <td className="py-2.5 px-4 text-right font-mono font-bold">
                      {dayAdvanceTotal > 0 ? (
                        <span className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-200/60 inline-flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3 text-purple-600" />
                          <span>{formatCurrency(dayAdvanceTotal)}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 font-normal">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Subtotal & Summary Footer Row */}
              <tr className="bg-slate-100/90 font-extrabold text-xs text-slate-900 border-t-2 border-slate-300 sticky bottom-0">
                <td colSpan={4} className="py-3 px-4 uppercase tracking-wider text-slate-700 border-r border-slate-200">
                  <div className="flex items-center justify-between">
                    <span>Monthly Totals:</span>
                    <span className="font-mono text-[11px] font-semibold text-slate-600">
                      {effectiveWorkDays} Net Days
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3.5 text-center border-r border-slate-200">
                  <span className="text-emerald-800 font-mono text-[11px]">
                    {presentDays}P · {halfDays}H · {absentDays}A
                  </span>
                </td>
                <td className="py-3 px-3 text-center border-r border-slate-200 font-mono text-purple-900">
                  {totalOtHours > 0 ? `+${totalOtHours}h` : '0h'}
                </td>
                <td className="py-3 px-4 text-right border-r border-slate-200 font-mono text-emerald-950 text-sm">
                  {formatCurrency(grossSalary)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-purple-950 text-sm">
                  {formatCurrency(totalAdvances)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. SETTLEMENT COMPUTATION CARD
      ───────────────────────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-850 text-white shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
            Final Salary Settlement
          </span>
          <div className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
            <span>Gross: <strong>{formatCurrency(grossSalary)}</strong></span>
            {totalAdvances > 0 && (
              <>
                <span>−</span>
                <span>Advances: <strong>{formatCurrency(totalAdvances)}</strong></span>
              </>
            )}
            {currentLoanDeduction > 0 && (
              <>
                <span>−</span>
                <span className="text-amber-300">
                  Loan Repayment: <strong>{formatCurrency(currentLoanDeduction)}</strong>
                </span>
              </>
            )}
          </div>
          {activeLoanBal > 0 && (
            <p className="text-[10px] text-slate-400 mt-1">
              Active loan balance: {formatCurrency(activeLoanBal)}
              {currentLoanDeduction > 0 && ` (Balance after recovery: ${formatCurrency(remainingLoanAfterDeduct)})`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 text-center sm:text-right">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Net Payable
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {formatCurrency(netTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. PROFESSIONAL SALARY DISBURSEMENT & SETTLEMENT ACTION CARD
      ───────────────────────────────────────────────────────────── */}
      {existingPayment && !isEditing ? (
        /* Verified Paid Receipt Card */
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900">
                    Salary Settled &amp; Disbursed
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Paid
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                    {existingPayment.paymentMethod === 'UPI' && <QrCode className="w-3 h-3 text-purple-600" />}
                    {existingPayment.paymentMethod === 'Cash' && <Banknote className="w-3 h-3 text-emerald-600" />}
                    {existingPayment.paymentMethod === 'Bank Transfer' && <Landmark className="w-3 h-3 text-blue-600" />}
                    <span>{existingPayment.paymentMethod}</span>
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                  <span>
                    Disbursed on: <strong className="text-slate-800">{formatDatePretty(existingPayment.date)}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Amount: <strong className="font-mono text-emerald-700 text-sm">{formatCurrency(existingPayment.net)}</strong>
                  </span>
                  {existingPayment.notes && (
                    <>
                      <span>•</span>
                      <span className="italic text-slate-600">"{existingPayment.notes}"</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  const confirmed = window.confirm(
                    `Remove salary payment of ${formatCurrency(existingPayment.net)} for ${staff.name} (${formatMonthName(month)})?\nThis will mark the salary as unpaid.`
                  );
                  if (confirmed) {
                    await deletePayment(existingPayment.id);
                    showToast(`Settlement record removed. Salary marked unpaid.`, 'info');
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Delete payment record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Settlement Input Form Card */
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  {existingPayment ? 'Update Salary Settlement' : 'Salary Settlement & Payout'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Record official disbursement of {formatCurrency(netTotal)} to {staff.name} for {formatMonthName(month)}
                </p>
              </div>
            </div>

            {existingPayment && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              try {
                await recordPayment({
                  date: paymentDate,
                  month: month,
                  staffId: staff.id,
                  staffName: staff.name,
                  dailyWage: staff.wage,
                  daysPresent: payroll ? payroll.effectiveDays : presentDays + halfDays * 0.5,
                  otHours: payroll ? payroll.otHours : totalOtHours,
                  otRate: staff.otRate,
                  otEarnings: payroll ? payroll.otEarnings : totalOtHours * staff.otRate,
                  gross: grossSalary,
                  advance: totalAdvances,
                  loanDeduct: currentLoanDeduction,
                  net: netTotal,
                  status: 'Paid',
                  paymentMethod: selectedMethod,
                  notes: paymentNotes.trim() || `${selectedMethod} salary settlement for ${formatMonthName(month)}`,
                });

                showToast(
                  `Salary of ${formatCurrency(netTotal)} settled via ${selectedMethod} for ${staff.name}`,
                  'success',
                  'Salary Settled'
                );
                setIsEditing(false);
              } catch (err: any) {
                showToast(err.message || 'Failed to record settlement', 'error');
              } finally {
                setIsSubmitting(false);
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Payment Method Selector (UPI / Cash / Bank Transfer) */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('UPI')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedMethod === 'UPI'
                        ? 'bg-white text-purple-900 shadow-xs border border-purple-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 text-purple-600" />
                    <span>UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('Cash')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedMethod === 'Cash'
                        ? 'bg-white text-emerald-900 shadow-xs border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('Bank Transfer')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedMethod === 'Bank Transfer'
                        ? 'bg-white text-blue-900 shadow-xs border border-blue-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5 text-blue-600" />
                    <span>Bank</span>
                  </button>
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Settlement Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Remarks / Reference Notes */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Remarks / Ref ID
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder={
                    selectedMethod === 'UPI'
                      ? 'e.g. GPay / PhonePe Txn ID'
                      : selectedMethod === 'Cash'
                      ? 'e.g. Handed over cash'
                      : 'e.g. NEFT / IMPS ref'
                  }
                  className="w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:border-purple-600"
                />
              </div>
            </div>

            {/* Settle Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Net settlement amount:{' '}
                <span className="font-mono font-black text-sm text-slate-900">
                  {formatCurrency(netTotal)}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] rounded-xl shadow-xs transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>
                  {existingPayment
                    ? `Update Settlement (${formatCurrency(netTotal)})`
                    : `Mark Paid via ${selectedMethod} (${formatCurrency(netTotal)})`}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sign-Off Signature Line (Print / Official Record) */}
      {/* <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs text-slate-500">
        <div className="space-y-1">
          <div className="h-10 border-b border-slate-300 border-dashed" />
          <span className="font-semibold text-slate-700 block">Prepared By</span>
          <span className="text-[10px] text-slate-400">Accounts &amp; HR Department</span>
        </div>

        <div className="space-y-1">
          <div className="h-10 border-b border-slate-300 border-dashed" />
          <span className="font-semibold text-slate-700 block">Employee Signature</span>
          <span className="text-[10px] text-slate-400">{staff.name} ({staff.id})</span>
        </div>

        <div className="space-y-1">
          <div className="h-10 border-b border-slate-300 border-dashed" />
          <span className="font-semibold text-slate-700 block">Authorized Signatory</span>
          <span className="text-[10px] text-slate-400">Shree Lakshmi Bhavan Management</span>
        </div>
      </div> */}
    </div>
  );
};
