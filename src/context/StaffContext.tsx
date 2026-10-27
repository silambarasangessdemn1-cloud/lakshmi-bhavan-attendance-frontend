import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  StaffMember,
  AttendanceRecord,
  PaymentRecord,
  CompanySettings,
  PayrollCalculation,
  LoanAdvanceEntry,
} from '../types';
import { defaultCompanySettings } from '../utils/companyDefaults';
import { getCurrentMonth } from '../utils/formatters';
import { ToastMessage, ToastType } from '../components/ToastNotification';
import { api } from '../services/api';

interface StaffContextType {
  staff: StaffMember[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  loanAdvances: LoanAdvanceEntry[];
  settings: CompanySettings;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastType, title?: string) => void;
  dismissToast: (id: string) => void;
  isBackendConnected: boolean;
  isLoading: boolean;
  refreshData: () => Promise<void>;

  // Staff CRUD
  addStaff: (member: StaffMember) => Promise<boolean>;
  updateStaff: (id: string, member: Partial<StaffMember>) => Promise<boolean>;
  deleteStaff: (id: string) => Promise<void>;
  getStaff: (id: string) => StaffMember | undefined;

  // Attendance
  saveAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => Promise<void>;
  saveBulkAttendance: (records: Omit<AttendanceRecord, 'id'>[]) => Promise<void>;
  replaceDateAttendance: (date: string, records: AttendanceRecord[]) => Promise<void>;
  markAllPresentForDate: (date: string) => Promise<void>;
  deleteAttendance: (staffId: string, date: string) => Promise<void>;
  getAttendanceForStaffAndMonth: (staffId: string, month: string) => AttendanceRecord[];
  getAttendanceForDate: (date: string) => AttendanceRecord[];

  // Loan & Advance Direct Management
  addLoanAdvance: (entry: Omit<LoanAdvanceEntry, 'id' | 'timestamp'>) => Promise<void>;
  deleteLoanAdvance: (id: string) => Promise<void>;
  getStaffAdvancesForMonth: (staffId: string, month: string) => number;
  getStaffLoanAdvanceEntries: (staffId: string) => LoanAdvanceEntry[];

  // Payroll & Loans
  getStaffLoanBalance: (staffId: string) => number;
  calculateStaffPayroll: (staffId: string, month?: string) => PayrollCalculation | null;
  recordPayment: (payment: Omit<PaymentRecord, 'id' | 'timestamp'>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;

  // Settings & Storage
  updateCompanySettings: (newSettings: Partial<CompanySettings>) => Promise<void>;
  resetToShreeLakshmiBhavan: () => Promise<void>;
  clearAllData: () => Promise<void>;
  exportBackup: () => Promise<void>;
  importBackup: (fileContent: string) => Promise<boolean>;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

const STORAGE_KEY = 'staffpay_pro_slb_v7_db';
const SETTINGS_KEY = 'staffpay_pro_slb_v7_settings';

// Hardcoded legacy demo staff IDs to ignore
const LEGACY_DEMO_IDS = new Set(['SLB-101', 'SLB-102', 'SLB-103', 'SLB-104', 'SLB-105']);

// Safe helper to read from localStorage with fallback
function getInitialLocalStorageData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('staffpay_pro_slb_v6_db');
    if (raw) {
      const parsed = JSON.parse(raw);
      const rawStaff: StaffMember[] = Array.isArray(parsed.staff) ? parsed.staff : [];
      // Strictly filter out any legacy hardcoded demo staff
      const cleanStaff = rawStaff.filter((s) => !LEGACY_DEMO_IDS.has(s.id));

      return {
        staff: cleanStaff,
        attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
        payments: Array.isArray(parsed.payments) ? parsed.payments : [],
        loanAdvances: Array.isArray(parsed.loanAdvances) ? parsed.loanAdvances : [],
      };
    }
  } catch (e) {
    console.warn('Could not read initial localStorage:', e);
  }
  return { staff: [], attendance: [], payments: [], loanAdvances: [] };
}

import { useAuth } from './AuthContext';

function getInitialSettings(): CompanySettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY) || localStorage.getItem('staffpay_pro_slb_v6_settings');
    if (raw) {
      return { ...defaultCompanySettings, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Could not read initial settings:', e);
  }
  return { ...defaultCompanySettings };
}

export const StaffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeBranchId, user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonth());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initialLocal = getInitialLocalStorageData();
  const [staff, setStaff] = useState<StaffMember[]>(initialLocal.staff);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialLocal.attendance);
  const [payments, setPayments] = useState<PaymentRecord[]>(initialLocal.payments);
  const [loanAdvances, setLoanAdvances] = useState<LoanAdvanceEntry[]>(initialLocal.loanAdvances);
  const [settings, setSettings] = useState<CompanySettings>(getInitialSettings);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (message: string, type: ToastType = 'success', title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  // Persist to localStorage safely
  useEffect(() => {
    try {
      const payload = { staff, attendance, payments, loanAdvances };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('LocalStorage save quota exceeded or unavailable:', e);
    }
  }, [staff, attendance, payments, loanAdvances]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }
  }, [settings]);

  // Sync data with backend API - strictly sets dynamic data returned by API
  const refreshData = useCallback(async () => {
    try {
      const health = await api.checkHealth();
      setIsBackendConnected(true);

      const branchFilter = activeBranchId && activeBranchId !== 'all' ? activeBranchId : undefined;

      const [staffData, attData, loansData, paysData, settingsData] = await Promise.all([
        api.getStaff(branchFilter ? { branchId: branchFilter } : undefined),
        api.getAttendance(),
        api.getLoanAdvances(),
        api.getPayments(),
        api.getSettings(),
      ]);

      if (Array.isArray(staffData)) {
        // Exclude any legacy demo IDs
        let dynamicOnly = staffData.filter((s) => !LEGACY_DEMO_IDS.has(s.id));
        if (branchFilter) {
          dynamicOnly = dynamicOnly.filter((s) => !s.branchId || s.branchId === branchFilter);
        }
        setStaff(dynamicOnly);
      }
      if (Array.isArray(attData)) {
        setAttendance(attData);
      }
      if (Array.isArray(loansData)) {
        setLoanAdvances(loansData);
      }
      if (Array.isArray(paysData)) {
        setPayments(paysData);
      }
      if (settingsData) {
        setSettings(settingsData);
      }
    } catch (err: any) {
      setIsBackendConnected(false);
      console.warn('Backend API connection offline, running in resilient local mode:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeBranchId]);

  // Reload data when active branch changes
  useEffect(() => {
    refreshData();
  }, [refreshData, activeBranchId]);

  // Staff helpers
  const getStaff = (id: string) => staff.find((s) => s.id === id);

  const addStaff = async (member: StaffMember): Promise<boolean> => {
    if (staff.some((s) => s.id.toLowerCase() === member.id.toLowerCase())) {
      return false;
    }

    setStaff((prev) => [...prev, member]);

    try {
      if (isBackendConnected) {
        await api.createStaff(member);
      }
    } catch (err) {
      console.warn('Could not sync created staff to backend:', err);
    }
    return true;
  };

  const updateStaff = async (id: string, member: Partial<StaffMember>): Promise<boolean> => {
    const newId = member.id?.trim();
    if (newId && newId.toLowerCase() !== id.toLowerCase()) {
      if (staff.some((s) => s.id.toLowerCase() === newId.toLowerCase() && s.id.toLowerCase() !== id.toLowerCase())) {
        return false;
      }
    }

    setStaff((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...member, id: newId || s.id } : s))
    );

    if (newId && newId !== id) {
      setAttendance((prev) =>
        prev.map((a) =>
          a.staffId === id
            ? { ...a, staffId: newId, id: `att-${newId}-${a.date}` }
            : a
        )
      );
      setPayments((prev) =>
        prev.map((p) =>
          p.staffId === id
            ? { ...p, staffId: newId, staffName: member.name || p.staffName }
            : p
        )
      );
      setLoanAdvances((prev) =>
        prev.map((l) => (l.staffId === id ? { ...l, staffId: newId } : l))
      );
    }

    try {
      if (isBackendConnected) {
        await api.updateStaff(id, member);
      }
    } catch (err) {
      console.warn('Could not sync updated staff to backend:', err);
    }
    return true;
  };

  const deleteStaff = async (id: string): Promise<void> => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
    setAttendance((prev) => prev.filter((a) => a.staffId !== id));
    setPayments((prev) => prev.filter((p) => p.staffId !== id));
    setLoanAdvances((prev) => prev.filter((l) => l.staffId !== id));

    try {
      if (isBackendConnected) {
        await api.deleteStaff(id);
      }
    } catch (err) {
      console.warn('Could not sync staff deletion to backend:', err);
    }
  };

  // Attendance helpers
  const saveAttendanceRecord = async (record: Omit<AttendanceRecord, 'id'>): Promise<void> => {
    const recordId = `att-${record.staffId}-${record.date}`;
    const fullRecord: AttendanceRecord = { ...record, id: recordId };

    setAttendance((prev) => {
      const idx = prev.findIndex((a) => a.staffId === record.staffId && a.date === record.date);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = fullRecord;
        return next;
      }
      return [...prev, fullRecord];
    });

    try {
      if (isBackendConnected) {
        await api.saveAttendanceRecord(fullRecord);
      }
    } catch (err) {
      console.warn('Could not sync attendance record to backend:', err);
    }
  };

  const saveBulkAttendance = async (records: Omit<AttendanceRecord, 'id'>[]): Promise<void> => {
    const fullRecords: AttendanceRecord[] = records.map((r) => ({
      ...r,
      id: `att-${r.staffId}-${r.date}`,
    }));

    setAttendance((prev) => {
      const map = new Map<string, AttendanceRecord>();
      prev.forEach((r) => map.set(`${r.staffId}_${r.date}`, r));
      fullRecords.forEach((r) => map.set(`${r.staffId}_${r.date}`, r));
      return Array.from(map.values());
    });

    try {
      if (isBackendConnected) {
        await api.saveBulkAttendance(fullRecords);
      }
    } catch (err) {
      console.warn('Could not sync bulk attendance to backend:', err);
    }
  };

  const replaceDateAttendance = async (date: string, records: AttendanceRecord[]): Promise<void> => {
    setAttendance((prev) => {
      const otherDates = prev.filter((r) => r.date !== date);
      return [...otherDates, ...records];
    });

    try {
      if (isBackendConnected) {
        await api.replaceDateAttendance(date, records);
      }
    } catch (err) {
      console.warn('Could not sync date replacement to backend:', err);
    }
  };

  const markAllPresentForDate = async (date: string): Promise<void> => {
    const activeStaff = staff.filter((s) => s.status !== 'inactive');
    const newRecords: AttendanceRecord[] = activeStaff.map((s) => ({
      id: `att-${s.id}-${date}`,
      staffId: s.id,
      date,
      status: 'present',
      inTime: '09:00',
      outTime: '18:00',
      ot: 0,
      notes: 'Marked present (All-in)',
    }));

    await replaceDateAttendance(date, newRecords);
  };

  const deleteAttendance = async (staffId: string, date: string): Promise<void> => {
    setAttendance((prev) => prev.filter((a) => !(a.staffId === staffId && a.date === date)));

    try {
      if (isBackendConnected) {
        await api.deleteAttendance(staffId, date);
      }
    } catch (err) {
      console.warn('Could not sync attendance deletion to backend:', err);
    }
  };

  const getAttendanceForStaffAndMonth = (staffId: string, month: string): AttendanceRecord[] => {
    return attendance.filter((a) => a.staffId === staffId && a.date.startsWith(month));
  };

  const getAttendanceForDate = (date: string): AttendanceRecord[] => {
    return attendance.filter((a) => a.date === date);
  };

  // Direct Loan & Advance helpers
  const addLoanAdvance = async (entry: Omit<LoanAdvanceEntry, 'id' | 'timestamp'>): Promise<void> => {
    const newEntry: LoanAdvanceEntry = {
      ...entry,
      id: `${entry.type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    setLoanAdvances((prev) => [newEntry, ...prev]);

    try {
      if (isBackendConnected) {
        await api.createLoanAdvance(newEntry);
      }
    } catch (err) {
      console.warn('Could not sync loan/advance to backend:', err);
    }
  };

  const deleteLoanAdvance = async (id: string): Promise<void> => {
    setLoanAdvances((prev) => prev.filter((l) => l.id !== id));

    try {
      if (isBackendConnected) {
        await api.deleteLoanAdvance(id);
      }
    } catch (err) {
      console.warn('Could not sync loan/advance deletion to backend:', err);
    }
  };

  const getStaffLoanAdvanceEntries = (staffId: string): LoanAdvanceEntry[] => {
    return loanAdvances.filter((l) => l.staffId === staffId);
  };

  const getStaffAdvancesForMonth = (staffId: string, month: string): number => {
    const issued = loanAdvances
      .filter((l) => l.staffId === staffId && l.type === 'advance' && l.month === month)
      .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    const repaid = loanAdvances
      .filter((l) => l.staffId === staffId && l.type === 'advance_repay' && l.month === month)
      .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    return Math.max(0, issued - repaid);
  };

  // Loan Balance calculation
  const getStaffLoanBalance = (staffId: string): number => {
    const member = getStaff(staffId);
    if (!member) return 0;
    const initial = Number(member.loanStart) || 0;

    // Direct loan issues
    const staffEntries = loanAdvances.filter((l) => l.staffId === staffId);
    const loansIssued = staffEntries
      .filter((l) => l.type === 'loan_issue')
      .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

    // Payments recorded deductions (deduplicated by month to prevent corruption!)
    const uniqueMonthPayments = new Map<string, PaymentRecord>();
    payments
      .filter((p) => p.staffId === staffId)
      .forEach((p) => uniqueMonthPayments.set(p.month, p));

    const paymentLoanAdded = Array.from(uniqueMonthPayments.values()).reduce(
      (sum, p) => sum + (Number(p.loanAdded) || 0),
      0
    );

    // Loan repayments: For any month, loan repayment is settled through payment.loanDeduct
    // or recorded via direct loan_repay entries. Take max per month to prevent double deduction.
    const allRepayMonths = new Set<string>();
    staffEntries.filter((l) => l.type === 'loan_repay').forEach((l) => {
      const m = l.month || (l.date ? l.date.slice(0, 7) : '');
      if (m) allRepayMonths.add(m);
    });
    uniqueMonthPayments.forEach((_, m) => allRepayMonths.add(m));

    let totalRepaid = 0;
    allRepayMonths.forEach((m) => {
      const directInMonth = staffEntries
        .filter((l) => l.type === 'loan_repay' && (l.month === m || l.date?.startsWith(m)))
        .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
      const paymentInMonth = uniqueMonthPayments.get(m);
      const salaryDeductInMonth = paymentInMonth ? Number(paymentInMonth.loanDeduct) || 0 : 0;
      totalRepaid += Math.max(directInMonth, salaryDeductInMonth);
    });

    const unassignedDirectRepaid = staffEntries
      .filter((l) => l.type === 'loan_repay' && !l.month && !l.date)
      .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    totalRepaid += unassignedDirectRepaid;

    return Math.max(0, initial + loansIssued + paymentLoanAdded - totalRepaid);
  };

  // Payroll calculation
  const calculateStaffPayroll = (staffId: string, month = selectedMonth): PayrollCalculation | null => {
    const member = getStaff(staffId);
    if (!member) return null;

    const monthRecords = getAttendanceForStaffAndMonth(staffId, month);
    let daysCount = 0;
    let halfDaysCount = 0;
    let otHours = 0;

    monthRecords.forEach((rec) => {
      if (rec.status === 'present') daysCount += 1;
      else if (rec.status === 'half') halfDaysCount += 1;
      otHours += Number(rec.ot) || 0;
    });

    const effectiveDays = daysCount + halfDaysCount * 0.5;
    const wageEarnings = effectiveDays * (Number(member.wage) || 0);
    const otRate = Number(member.otRate) || 0;
    const otEarnings = otHours * otRate;
    const gross = wageEarnings + otEarnings;

    const monthPayment = payments.find((p) => p.staffId === staffId && p.month === month);
    const directAdvance = getStaffAdvancesForMonth(staffId, month);
    const advanceMonth = monthPayment ? Number(monthPayment.advance) || 0 : directAdvance;

    // Direct loan repayments recorded for this month (e.g. from "Repay Loan")
    const staffEntries = loanAdvances.filter((l) => l.staffId === staffId);
    const directLoanRepayMonth = staffEntries
      .filter((l) => l.type === 'loan_repay' && (l.month === month || l.date?.startsWith(month)))
      .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

    const outstandingLoan = getStaffLoanBalance(staffId);
    let currentLoanDeduction = 0;
    if (monthPayment) {
      currentLoanDeduction = Number(monthPayment.loanDeduct) || 0;
    } else {
      // Prior loan balance before this month's direct loan repayment
      const priorLoanBalance = outstandingLoan + directLoanRepayMonth;
      const availableEarnings = Math.max(0, gross - advanceMonth);

      let targetDeduction = directLoanRepayMonth;
      if (member.autoLoanDeduct !== false && priorLoanBalance > 0) {
        const targetEmi =
          member.monthlyLoanDeduction && member.monthlyLoanDeduction > 0
            ? member.monthlyLoanDeduction
            : priorLoanBalance;
        targetDeduction = Math.max(directLoanRepayMonth, Math.min(targetEmi, priorLoanBalance));
      }

      currentLoanDeduction = Math.min(targetDeduction, priorLoanBalance, availableEarnings);
    }
    const netPayable = Math.max(0, gross - advanceMonth - currentLoanDeduction);

    return {
      staff: member,
      month,
      daysCount,
      halfDaysCount,
      effectiveDays,
      otHours,
      otRate,
      otEarnings,
      wageEarnings,
      gross,
      advanceMonth,
      outstandingLoan,
      currentLoanDeduction,
      netPayable,
      attendanceRecords: monthRecords,
    };
  };

  // Record Payment: UPSERT prevents duplicate rows for staffId and month!
  const recordPayment = async (payment: Omit<PaymentRecord, 'id' | 'timestamp'>): Promise<void> => {
    const existingIndex = payments.findIndex(
      (p) => p.staffId === payment.staffId && p.month === payment.month
    );

    const id =
      existingIndex >= 0
        ? payments[existingIndex].id
        : `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const fullPayment: PaymentRecord = {
      ...payment,
      id,
      timestamp: Date.now(),
    };

    setPayments((prev) => {
      const filtered = prev.filter(
        (p) => !(p.staffId === payment.staffId && p.month === payment.month)
      );
      return [fullPayment, ...filtered];
    });

    try {
      if (isBackendConnected) {
        await api.recordPayment(fullPayment);
      }
    } catch (err) {
      console.warn('Could not sync payment record to backend:', err);
    }
  };

  const deletePayment = async (id: string): Promise<void> => {
    setPayments((prev) => prev.filter((p) => p.id !== id));

    try {
      if (isBackendConnected) {
        await api.deletePayment(id);
      }
    } catch (err) {
      console.warn('Could not sync payment deletion to backend:', err);
    }
  };

  const updateCompanySettings = async (newSettings: Partial<CompanySettings>): Promise<void> => {
    setSettings((prev) => ({ ...prev, ...newSettings }));

    try {
      if (isBackendConnected) {
        await api.updateSettings(newSettings);
      }
    } catch (err) {
      console.warn('Could not sync settings to backend:', err);
    }
  };

  const resetToShreeLakshmiBhavan = async (): Promise<void> => {
    try {
      if (isBackendConnected) {
        await api.resetAllData();
        await refreshData();
      } else {
        setStaff([]);
        setAttendance([]);
        setPayments([]);
        setLoanAdvances([]);
        setSettings({ ...defaultCompanySettings });
      }
      setSelectedMonth(getCurrentMonth());
      showToast(
        'All records reset. Shree Lakshmi Bhavan is ready with fresh initial records.',
        'success',
        'Fresh Start Completed'
      );
    } catch (err: any) {
      showToast(err.message || 'Reset failed', 'error');
    }
  };

  const clearAllData = async (): Promise<void> => {
    try {
      if (isBackendConnected) {
        await api.resetAllData();
      }
      setStaff([]);
      setAttendance([]);
      setPayments([]);
      setLoanAdvances([]);
      showToast('All staff records cleared. Blank roster ready.', 'info', 'Empty Roster');
    } catch (err: any) {
      showToast(err.message || 'Clear failed', 'error');
    }
  };

  // Full Database Backup Export
  const exportBackup = async (): Promise<void> => {
    try {
      let exportObj;
      if (isBackendConnected) {
        exportObj = await api.exportDatabase();
      } else {
        exportObj = {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          data: { staff, attendance, loanAdvances, payments, settings },
        };
      }

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shree_lakshmi_bhavan_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Complete database backup downloaded successfully.', 'success', 'Backup Exported');
    } catch (err: any) {
      showToast(err.message || 'Export failed', 'error');
    }
  };

  // Full Database Restore Import
  const importBackup = async (fileContent: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(fileContent);
      const data = parsed.data || parsed;

      if (!data) throw new Error('Invalid backup file format');

      if (isBackendConnected) {
        await api.importDatabase(data);
        await refreshData();
      } else {
        if (Array.isArray(data.staff)) setStaff(data.staff);
        if (Array.isArray(data.attendance)) setAttendance(data.attendance);
        if (Array.isArray(data.loanAdvances)) setLoanAdvances(data.loanAdvances);
        if (Array.isArray(data.payments)) setPayments(data.payments);
        if (data.settings) setSettings(data.settings);
      }

      showToast('Database restored successfully from backup file.', 'success', 'Backup Restored');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Invalid JSON file', 'error', 'Restore Failed');
      return false;
    }
  };

  return (
    <StaffContext.Provider
      value={{
        staff,
        attendance,
        payments,
        loanAdvances,
        settings,
        selectedMonth,
        setSelectedMonth,
        toasts,
        showToast,
        dismissToast,
        isBackendConnected,
        isLoading,
        refreshData,
        addStaff,
        updateStaff,
        deleteStaff,
        getStaff,
        saveAttendanceRecord,
        saveBulkAttendance,
        replaceDateAttendance,
        markAllPresentForDate,
        deleteAttendance,
        getAttendanceForStaffAndMonth,
        getAttendanceForDate,
        addLoanAdvance,
        deleteLoanAdvance,
        getStaffAdvancesForMonth,
        getStaffLoanAdvanceEntries,
        getStaffLoanBalance,
        calculateStaffPayroll,
        recordPayment,
        deletePayment,
        updateCompanySettings,
        resetToShreeLakshmiBhavan,
        clearAllData,
        exportBackup,
        importBackup,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = () => {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
};
