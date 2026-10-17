export type AttendanceStatus = 'present' | 'half' | 'absent' | 'leave';

export interface StaffMember {
  id: string; // e.g. "EMP-001" or "ST001"
  name: string;
  designation: string; // e.g. "Production Supervisor", "Senior Welder", "Machine Operator"
  phone: string;
  wage: number; // Daily Wage in currency
  otRate: number; // Overtime Rate per hour
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  loanStart: number; // Starting loan balance granted
  monthlyLoanDeduction?: number; // Automatic monthly repayment collected from salary
  autoLoanDeduct?: boolean; // Whether repayment is automatically collected from overall monthly salary
  photo?: string; // Base64 data URL
  notes?: string;
  joiningDate?: string;
  status: 'active' | 'inactive';
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  inTime?: string; // e.g. "09:00"
  outTime?: string; // e.g. "18:00"
  ot: number; // OT hours (0, 0.5, 1, 1.5, etc.)
  notes?: string;
}

export type PaymentMethod = 'Bank Transfer' | 'Cash' | 'UPI' | 'Cheque';

export interface PaymentRecord {
  id: string;
  date: string; // Processing date YYYY-MM-DD
  month: string; // YYYY-MM
  staffId: string;
  staffName: string;
  dailyWage: number;
  daysPresent: number; // Unit count: full = 1, half = 0.5
  otHours: number;
  otRate: number;
  otEarnings: number;
  gross: number;
  advance: number;
  loanDeduct: number;
  loanAdded?: number;
  net: number;
  status: 'Paid' | 'Pending';
  paymentMethod: PaymentMethod;
  notes: string;
  timestamp: number;
}

export type LoanAdvanceType = 'advance' | 'loan_issue' | 'loan_repay';

export interface LoanAdvanceEntry {
  id: string;
  staffId: string;
  type: LoanAdvanceType;
  amount: number;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  notes: string;
  timestamp: number;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  currency: string;
  currencySymbol: string;
}

export interface PayrollCalculation {
  staff: StaffMember;
  month: string;
  daysCount: number;
  halfDaysCount: number;
  effectiveDays: number;
  otHours: number;
  otRate: number;
  otEarnings: number;
  wageEarnings: number;
  gross: number;
  advanceMonth: number;
  outstandingLoan: number;
  currentLoanDeduction: number;
  netPayable: number;
  attendanceRecords: AttendanceRecord[];
}
