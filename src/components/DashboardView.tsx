import React, { useState, useMemo } from 'react';
import {
  Users,
  CalendarCheck2,
  HandCoins,
  Wallet,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Calendar,
  Plus,
  Search,
  UserCheck,
  UserX,
  CreditCard,
  History,
  Check,
  Sparkles,
  ArrowRight,
  Receipt,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useStaff } from '../context/StaffContext';
import { StaffMember, AttendanceStatus } from '../types';
import { StaffAvatar } from './StaffAvatar';
import {
  formatCurrency,
  formatCompactCurrency,
  getTodayDateString,
  formatDatePretty,
  formatMonthName,
} from '../utils/formatters';

interface DashboardViewProps {
  onNavigateTab: (tab: 'dashboard' | 'staff' | 'attendance' | 'advances' | 'loans') => void;
  onOpenAddStaff: () => void;
  onOpenAdvance: (staff?: StaffMember) => void;
  onOpenSalary: (staff: StaffMember) => void;
  onViewStaffDetails: (staff: StaffMember) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenAddStaff,
  onOpenAdvance,
  onOpenSalary,
  onViewStaffDetails,
}) => {
  const {
    staff,
    attendance,
    payments,
    loanAdvances,
    selectedMonth,
    setSelectedMonth,
    getAttendanceForDate,
    saveAttendanceRecord,
    markAllPresentForDate,
    getStaffLoanBalance,
    calculateStaffPayroll,
    showToast,
    settings,
  } = useStaff();

  // Active date for today's roll-call & labor cost breakdown
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent' | 'half' | 'not_marked'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isDateToday = selectedDate === getTodayDateString();

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Active staff members
  const activeStaffList = useMemo(() => {
    return staff.filter((s) => s.status !== 'inactive');
  }, [staff]);

  // 1. TODAY'S ATTENDANCE ANALYTICS
  const attendanceForSelectedDate = useMemo(() => {
    return getAttendanceForDate(selectedDate);
  }, [getAttendanceForDate, selectedDate, attendance]);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, { status: AttendanceStatus | 'not_marked'; ot: number }>();
    attendanceForSelectedDate.forEach((rec) => {
      map.set(rec.staffId, { status: rec.status, ot: Number(rec.ot) || 0 });
    });
    return map;
  }, [attendanceForSelectedDate]);

  const attendanceSummary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let half = 0;
    let notMarked = 0;
    let totalOtHours = 0;
    let totalEstimatedDayWage = 0;

    activeStaffList.forEach((member) => {
      const record = attendanceMap.get(member.id);
      const status = record ? record.status : 'not_marked';
      const ot = record ? record.ot : 0;
      totalOtHours += ot;

      const dailyWage = Number(member.wage) || 0;
      const otRate = Number(member.otRate) || 0;

      if (status === 'present') {
        present += 1;
        totalEstimatedDayWage += dailyWage + ot * otRate;
      } else if (status === 'half') {
        half += 1;
        totalEstimatedDayWage += dailyWage * 0.5 + ot * otRate;
      } else if (status === 'absent') {
        absent += 1;
      } else {
        notMarked += 1;
      }
    });

    const totalStaff = activeStaffList.length;
    const presentEffective = present + half * 0.5;
    const percentage = totalStaff > 0 ? Math.round((presentEffective / totalStaff) * 100) : 0;

    return {
      totalStaff,
      present,
      absent,
      half,
      notMarked,
      totalOtHours,
      totalEstimatedDayWage,
      percentage,
    };
  }, [activeStaffList, attendanceMap]);

  // Filtered staff for the attendance breakdown card
  const filteredAttendanceStaff = useMemo(() => {
    return activeStaffList.filter((member) => {
      const record = attendanceMap.get(member.id);
      const status = record ? record.status : 'not_marked';

      if (attendanceFilter !== 'all' && status !== attendanceFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = member.name.toLowerCase().includes(query);
        const matchesId = member.id.toLowerCase().includes(query);
        const matchesRole = member.designation.toLowerCase().includes(query);
        return matchesName || matchesId || matchesRole;
      }

      return true;
    });
  }, [activeStaffList, attendanceMap, attendanceFilter, searchQuery]);

  // 2. LOAN PORTFOLIO & BORROWERS ANALYSIS
  const loanPortfolio = useMemo(() => {
    let totalLoansProvidedAllTime = 0;
    let totalLoansCollectedAllTime = 0;
    let totalActiveOutstandingLoan = 0;

    const borrowersList: Array<{
      staff: StaffMember;
      initialLoan: number;
      additionalLoans: number;
      totalProvided: number;
      directRepaid: number;
      salaryDeducted: number;
      totalCollected: number;
      outstandingBalance: number;
      recoveryPercentage: number;
    }> = [];

    staff.forEach((member) => {
      const initialLoan = Number(member.loanStart) || 0;

      // Loans issued via direct entries
      const staffEntries = loanAdvances.filter((l) => l.staffId === member.id);
      const additionalLoans = staffEntries
        .filter((l) => l.type === 'loan_issue')
        .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

      // Repayments via direct entries
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

      totalLoansProvidedAllTime += totalProvided;
      totalLoansCollectedAllTime += totalCollected;
      totalActiveOutstandingLoan += outstandingBalance;

      if (totalProvided > 0 || outstandingBalance > 0) {
        const recoveryPercentage =
          totalProvided > 0
            ? Math.min(100, Math.round((totalCollected / totalProvided) * 100))
            : 0;

        borrowersList.push({
          staff: member,
          initialLoan,
          additionalLoans,
          totalProvided,
          directRepaid,
          salaryDeducted,
          totalCollected,
          outstandingBalance,
          recoveryPercentage,
        });
      }
    });

    borrowersList.sort((a, b) => b.outstandingBalance - a.outstandingBalance);

    const overallRecoveryRate =
      totalLoansProvidedAllTime > 0
        ? Math.round((totalLoansCollectedAllTime / totalLoansProvidedAllTime) * 100)
        : 0;

    return {
      totalLoansProvidedAllTime,
      totalLoansCollectedAllTime,
      totalActiveOutstandingLoan,
      overallRecoveryRate,
      borrowersList,
    };
  }, [staff, loanAdvances, payments, getStaffLoanBalance]);

  // 3. ADVANCE PAYMENTS ANALYSIS
  const advancesAnalysis = useMemo(() => {
    const monthAdvanceEntries = loanAdvances.filter(
      (l) => l.type === 'advance' && l.month === selectedMonth
    );
    const totalMonthAdvances = monthAdvanceEntries.reduce(
      (sum, l) => sum + (Number(l.amount) || 0),
      0
    );

    const allAdvanceEntries = loanAdvances.filter((l) => l.type === 'advance');
    const totalAllTimeAdvances = allAdvanceEntries.reduce(
      (sum, l) => sum + (Number(l.amount) || 0),
      0
    );

    const enrichedMonthAdvances = monthAdvanceEntries.map((entry) => {
      const staffMember = staff.find((s) => s.id === entry.staffId);
      const isPaidOutInSalary = payments.some(
        (p) => p.staffId === entry.staffId && p.month === entry.month
      );
      return {
        ...entry,
        staff: staffMember,
        isDeductedFromSalary: isPaidOutInSalary,
      };
    });

    return {
      totalMonthAdvances,
      totalAllTimeAdvances,
      monthAdvanceCount: monthAdvanceEntries.length,
      allAdvanceCount: allAdvanceEntries.length,
      enrichedMonthAdvances,
    };
  }, [loanAdvances, selectedMonth, staff, payments]);

  // 4. RECENT TRANSACTIONS STREAM
  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'advance' | 'advance_repay' | 'loan_issue' | 'loan_repay' | 'payment';
      title: string;
      staffName: string;
      staffId: string;
      amount: number;
      date: string;
      timestamp: number;
      notes: string;
    }> = [];

    loanAdvances.forEach((item) => {
      const staffMember = staff.find((s) => s.id === item.staffId);
      list.push({
        id: item.id,
        type: item.type,
        title:
          item.type === 'advance'
            ? 'Salary Advance'
            : item.type === 'advance_repay'
            ? 'Advance Repaid'
            : item.type === 'loan_issue'
            ? 'Loan Issued'
            : 'Loan Repaid',
        staffName: staffMember?.name || item.staffId,
        staffId: item.staffId,
        amount: item.amount,
        date: item.date,
        timestamp: item.timestamp || 0,
        notes: item.notes || '',
      });
    });

    payments.forEach((p) => {
      list.push({
        id: p.id,
        type: 'payment',
        title: `Salary (${formatMonthName(p.month)})`,
        staffName: p.staffName,
        staffId: p.staffId,
        amount: p.net,
        date: p.date,
        timestamp: p.timestamp || 0,
        notes: `Method: ${p.paymentMethod}`,
      });
    });

    list.sort((a, b) => b.timestamp - a.timestamp);
    return list.slice(0, 6);
  }, [loanAdvances, payments, staff]);

  // Quick 1-click attendance setter
  const handleQuickMarkAttendance = async (staffId: string, status: AttendanceStatus) => {
    await saveAttendanceRecord({
      staffId,
      date: selectedDate,
      status,
      ot: 0,
    });
    const member = staff.find((s) => s.id === staffId);
    showToast(
      `Updated ${member?.name || staffId} to ${status.toUpperCase()} for ${formatDatePretty(
        selectedDate
      )}.`,
      'info'
    );
  };

  const handleMarkAllPresentToday = async () => {
    await markAllPresentForDate(selectedDate);
    showToast(`Marked all ${activeStaffList.length} staff members as PRESENT!`, 'success');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          1. EXECUTIVE HERO BANNER & PRIMARY CONTROLS
      ───────────────────────────────────────────────────────────── */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-3xl text-white shadow-xl shadow-slate-950/10 border border-slate-800 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{greeting}, {settings.companyName ? (settings.companyName.includes('MSS') ? settings.companyName : `MSS ${settings.companyName}`) : 'MSS Shree Lakshmi Bhavan'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Workforce &amp; Financial Cockpit
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Live attendance roll-call, cumulative loan disbursement &amp; recovery tracking, and mid-month advance payouts.
            </p>
          </div>

          {/* Interactive Date & Action Switchers */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Attendance Date Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-3 py-2 rounded-2xl text-xs">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Roll-Call Date
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer"
                  title="Select date to inspect roll-call"
                />
              </div>
              {selectedDate !== getTodayDateString() && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(getTodayDateString())}
                  className="ml-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                >
                  Reset Today
                </button>
              )}
            </div>

            {/* Payroll Cycle Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-3 py-2 rounded-2xl text-xs">
              <Wallet className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Payroll Cycle
                </span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer"
                  title="Select month for advances & loans"
                />
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              type="button"
              onClick={() => onOpenAdvance()}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <HandCoins className="w-4 h-4 stroke-[2.5]" />
              <span>Record Advance / Loan</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. THE 4 HERO METRIC CARDS (HIGH CLARITY & UNDERSTANDABILITY)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: TODAY'S ATTENDANCE STATUS */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Today's Attendance
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                {attendanceSummary.present}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                / {attendanceSummary.totalStaff} staff present
              </span>
              <span className="ml-auto text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-mono">
                {attendanceSummary.percentage}%
              </span>
            </div>

            {/* Turnout Progress Bar */}
            <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${attendanceSummary.percentage}%` }}
                title={`${attendanceSummary.present} Present`}
              />
              <div
                className="bg-rose-400 h-full transition-all duration-300"
                style={{
                  width: `${
                    attendanceSummary.totalStaff > 0
                      ? (attendanceSummary.absent / attendanceSummary.totalStaff) * 100
                      : 0
                  }%`,
                }}
                title={`${attendanceSummary.absent} Absent`}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 font-semibold">
              <span className="text-emerald-700">{attendanceSummary.present} Present</span>
              <span className="text-slate-300">·</span>
              <span className="text-rose-600">{attendanceSummary.absent} Absent</span>
              {attendanceSummary.half > 0 && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-amber-600">{attendanceSummary.half} Half</span>
                </>
              )}
            </div>
            <span className="text-slate-400 font-mono text-[10px]">
              {formatDatePretty(selectedDate)}
            </span>
          </div>
        </div>

        {/* KPI 2: TOTAL LOANS PROVIDED (CAPITAL OUTLAY) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Loans Given
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-950 font-mono tracking-tight">
                {formatCompactCurrency(loanPortfolio.totalLoansProvidedAllTime)}
              </span>
              <span className="text-xs text-amber-700 font-semibold">
                Disbursed
              </span>
            </div>

            <p className="mt-2 text-[11px] text-slate-500 leading-snug">
              Total loan capital given to staff members since account inception.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Active Borrowers:</span>
            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
              {loanPortfolio.borrowersList.length} employees
            </span>
          </div>
        </div>

        {/* KPI 3: LOANS COLLECTED & RECOVERY RATE */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Loans Recovered
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-blue-950 font-mono tracking-tight">
                {formatCompactCurrency(loanPortfolio.totalLoansCollectedAllTime)}
              </span>
              <span className="text-xs font-extrabold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 font-mono">
                {loanPortfolio.overallRecoveryRate}%
              </span>
            </div>

            {/* Recovery Progress Bar */}
            <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${loanPortfolio.overallRecoveryRate}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Remaining Debt:</span>
            <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
              {formatCompactCurrency(loanPortfolio.totalActiveOutstandingLoan)}
            </span>
          </div>
        </div>

        {/* KPI 4: MONTH ADVANCES (MID-MONTH CASH) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Salary Advances
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-purple-950 font-mono tracking-tight">
                {formatCompactCurrency(advancesAnalysis.totalMonthAdvances)}
              </span>
              <span className="text-xs font-semibold text-purple-700">
                in {formatMonthName(selectedMonth)}
              </span>
            </div>

            <p className="mt-2 text-[11px] text-slate-500 leading-snug">
              Mid-month wages disbursed in advance. Reconciled at salary payout.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Transactions:</span>
            <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md">
              {advancesAnalysis.monthAdvanceCount} requests
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SECTION: TODAY'S ATTENDANCE ROLL-CALL (SPACIOUS & INTUITIVE)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Header Strip */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Daily Workforce Roll-Call
                </h2>
                <p className="text-xs text-slate-500">
                  Attendance records for <span className="font-bold text-slate-800">{formatDatePretty(selectedDate)}</span>. Click status to update in real time.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isDateToday && (
              <button
                type="button"
                onClick={handleMarkAllPresentToday}
                className="px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                <span>Mark All Present</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigateTab('attendance')}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Full Attendance Register</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setAttendanceFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                attendanceFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              All Staff ({attendanceSummary.totalStaff})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceFilter('present')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                attendanceFilter === 'present'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-100/70'
              }`}
            >
              Present ({attendanceSummary.present})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceFilter('absent')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                attendanceFilter === 'absent'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-100/70'
              }`}
            >
              Absent ({attendanceSummary.absent})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceFilter('half')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                attendanceFilter === 'half'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 hover:bg-amber-100/70'
              }`}
            >
              Half-Day ({attendanceSummary.half})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID or role..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Staff Attendance Cards / Rows */}
        <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
          {filteredAttendanceStaff.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No staff members found matching filter.
            </div>
          ) : (
            filteredAttendanceStaff.map((member) => {
              const record = attendanceMap.get(member.id);
              const status = record ? record.status : 'not_marked';
              const ot = record ? record.ot : 0;

              return (
                <div
                  key={member.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  {/* Staff Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <StaffAvatar name={member.name} photo={member.photo} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onViewStaffDetails(member)}
                          className="font-bold text-sm text-slate-900 hover:text-emerald-700 transition-colors truncate text-left cursor-pointer"
                        >
                          {member.name}
                        </button>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {member.id}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-slate-700">{member.designation || 'Staff'}</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-emerald-700 font-semibold">
                          {formatCurrency(member.wage)}/day
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status & 1-Click Toggle Controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    {/* Active Status Badge */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                          status === 'present'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : status === 'absent'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : status === 'half'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {status === 'present' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {status === 'absent' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {status === 'half' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        <span className="capitalize">
                          {status === 'not_marked' ? 'Not Marked' : status}
                        </span>
                      </span>

                      {ot > 0 && (
                        <span className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-100 text-emerald-900">
                          +{ot}h OT
                        </span>
                      )}
                    </div>

                    {/* Quick 1-Click Action Buttons */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => handleQuickMarkAttendance(member.id, 'present')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          status === 'present'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-emerald-700 hover:bg-white'
                        }`}
                        title="Mark Present"
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickMarkAttendance(member.id, 'half')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          status === 'half'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-amber-700 hover:bg-white'
                        }`}
                        title="Mark Half-Day"
                      >
                        Half
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickMarkAttendance(member.id, 'absent')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          status === 'absent'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-rose-700 hover:bg-white'
                        }`}
                        title="Mark Absent"
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Estimated Day Labor Commitment:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {formatCurrency(attendanceSummary.totalEstimatedDayWage)}
            </span>
            <span className="text-slate-400">
              ({attendanceSummary.present} full + {attendanceSummary.half} half)
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
            <span>Live Sync with Cloud Database</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. DUAL FINANCIAL PORTFOLIOS:
             LEFT: Loans & Borrowers Ledger ("who we gave that amount and how much they collect")
             RIGHT: Salary Advances ("and advance payment also")
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* =========================================================
            CARD A: LOAN EXPOSURE & BORROWERS PORTFOLIO
        ========================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Staff Loans &amp; Debt Recovery
                  </h3>
                  <p className="text-xs text-slate-500">
                    Principal provided, amounts collected back, and active balance
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('loans')}
                className="text-xs font-bold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Full Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50/70 border-b border-slate-100 text-center">
              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Lent
                </span>
                <span className="text-sm font-black font-mono text-slate-900">
                  {formatCompactCurrency(loanPortfolio.totalLoansProvidedAllTime)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Recovered
                </span>
                <span className="text-sm font-black font-mono text-emerald-700">
                  {formatCompactCurrency(loanPortfolio.totalLoansCollectedAllTime)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Balance Due
                </span>
                <span className="text-sm font-black font-mono text-rose-700">
                  {formatCompactCurrency(loanPortfolio.totalActiveOutstandingLoan)}
                </span>
              </div>
            </div>

            {/* Borrowers List */}
            {loanPortfolio.borrowersList.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No loans currently active in the system.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                {loanPortfolio.borrowersList.map((item) => (
                  <div
                    key={item.staff.id}
                    className="p-4 sm:px-5 hover:bg-slate-50/70 transition-colors space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <StaffAvatar name={item.staff.name} photo={item.staff.photo} size="sm" />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onViewStaffDetails(item.staff)}
                            className="font-bold text-xs text-slate-900 hover:text-emerald-700 truncate text-left transition-colors cursor-pointer"
                          >
                            {item.staff.name}
                          </button>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.staff.id} · {item.staff.designation}
                          </div>
                          {item.staff.autoLoanDeduct !== false ? (
                            <span className="inline-block mt-0.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Auto Repay: {item.staff.monthlyLoanDeduction && item.staff.monthlyLoanDeduction > 0 ? `₹${item.staff.monthlyLoanDeduction.toLocaleString('en-IN')}/mo` : 'Full Balance'}
                            </span>
                          ) : (
                            <span className="inline-block mt-0.5 text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              Manual Repay Only
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Manage Loan Button */}
                      <button
                        type="button"
                        onClick={() => onOpenAdvance(item.staff)}
                        className="px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        Repay / Add
                      </button>
                    </div>

                    {/* Financial Metrics Strip */}
                    <div className="flex items-center justify-between text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Lent:</span>
                        <span className="font-bold text-slate-800">
                          {formatCurrency(item.totalProvided)}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 block font-sans">Collected:</span>
                        <span className="font-bold text-emerald-700">
                          {formatCurrency(item.totalCollected)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-sans">Remaining:</span>
                        <span className="font-bold text-rose-700">
                          {formatCurrency(item.outstandingBalance)}
                        </span>
                      </div>
                    </div>

                    {/* Recovery Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Recovery</span>
                        <span className="font-bold text-slate-700">{item.recoveryPercentage}% paid back</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${item.recoveryPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Overall Portfolio Recovery:</span>
            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/80">
              {loanPortfolio.overallRecoveryRate}% Recovered
            </span>
          </div>
        </div>

        {/* =========================================================
            CARD B: SALARY ADVANCES FOR CURRENT MONTH
        ========================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Salary Advances ({formatMonthName(selectedMonth)})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mid-month cash payouts to be deducted at payroll
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('advances')}
                className="text-xs font-bold text-purple-800 hover:text-purple-950 inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Full Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="grid grid-cols-2 gap-2 p-4 bg-slate-50/70 border-b border-slate-100 text-center">
              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Advances Disbursed
                </span>
                <span className="text-sm font-black font-mono text-purple-950">
                  {formatCurrency(advancesAnalysis.totalMonthAdvances)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Disbursement Count
                </span>
                <span className="text-sm font-black font-mono text-slate-900">
                  {advancesAnalysis.monthAdvanceCount} transactions
                </span>
              </div>
            </div>

            {/* Advance recipients list */}
            {advancesAnalysis.enrichedMonthAdvances.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No salary advances recorded for {formatMonthName(selectedMonth)}.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                {advancesAnalysis.enrichedMonthAdvances.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <StaffAvatar
                        name={entry.staff?.name || entry.staffId}
                        photo={entry.staff?.photo}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {entry.staff?.name || entry.staffId}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {formatDatePretty(entry.date)} {entry.notes && `· ${entry.notes}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-sm text-purple-900">
                        {formatCurrency(entry.amount)}
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          entry.isDeductedFromSalary
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {entry.isDeductedFromSalary ? 'Deducted in Salary' : 'Pending Month-End'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need to give advance?</span>
            <button
              type="button"
              onClick={() => onOpenAdvance()}
              className="font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Advance</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. SECTION: RECENT AUDIT & TRANSACTION ACTIVITY STREAM
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Live Transaction Audit Stream
              </h3>
              <p className="text-xs text-slate-500">
                Chronological ledger of recent advances, loan payouts, repayments, and salary slips
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            Real-time feed
          </span>
        </div>

        {recentActivities.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No recent financial transactions logged yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      act.type === 'advance'
                        ? 'bg-purple-100 text-purple-800'
                        : act.type === 'advance_repay'
                        ? 'bg-emerald-100 text-emerald-800'
                        : act.type === 'loan_issue'
                        ? 'bg-amber-100 text-amber-800'
                        : act.type === 'loan_repay'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {act.type === 'advance' && <Wallet className="w-4 h-4" />}
                    {act.type === 'advance_repay' && <HandCoins className="w-4 h-4" />}
                    {act.type === 'loan_issue' && <TrendingUp className="w-4 h-4" />}
                    {act.type === 'loan_repay' && <CheckCircle2 className="w-4 h-4" />}
                    {act.type === 'payment' && <Receipt className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-2">
                      <span>{act.staffName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({act.staffId})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {act.title} · {formatDatePretty(act.date)}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(act.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
