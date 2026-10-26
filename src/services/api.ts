import {
  StaffMember,
  AttendanceRecord,
  PaymentRecord,
  LoanAdvanceEntry,
  CompanySettings,
  Branch,
  User,
} from '../types';

// Common centralized API endpoint for Shree Lakshmi Bhavan Staff & Payroll Manager
// Automatically connects to local backend or Render production backend
const DEFAULT_API_BASE = 'http://localhost:5050/api';
const RAW_API_BASE = (import.meta.env.VITE_API_URL as string) || DEFAULT_API_BASE;

export const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

export const TOKEN_KEY = 'staffpay_pro_jwt_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.warn('Failed to save auth token to localStorage', err);
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.warn('Failed to clear auth token from localStorage', err);
  }
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  stats?: any;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.message) errorMsg = errJson.message;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Health
  checkHealth: async () => {
    return request<{ status: string; database: { type: string; connected: boolean; fallbackActive: boolean } }>(
      '/admin/health'
    );
  },

  // Authentication
  login: async (username: string, password: string): Promise<{ token: string; user: User; branch?: Branch | null }> => {
    const res = await request<ApiResponse<{ token: string; user: User; branch?: Branch | null }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res.data?.token) {
      setAuthToken(res.data.token);
    }
    return res.data!;
  },

  getMe: async (): Promise<{ user: User; branch?: Branch | null }> => {
    const res = await request<ApiResponse<{ user: User; branch?: Branch | null }>>('/auth/me');
    return res.data!;
  },

  // Branches
  getBranches: async (): Promise<Branch[]> => {
    const res = await request<ApiResponse<Branch[]>>('/branches');
    return res.data || [];
  },

  createBranch: async (branch: Partial<Branch> & {
    username?: string;
    password?: string;
    pin?: string;
    managerName?: string;
  }): Promise<Branch> => {
    const res = await request<ApiResponse<Branch>>('/branches', {
      method: 'POST',
      body: JSON.stringify(branch),
    });
    return res.data!;
  },

  updateBranch: async (id: string, branch: Partial<Branch> & {
    username?: string;
    password?: string;
    pin?: string;
    managerName?: string;
  }): Promise<Branch> => {
    const res = await request<ApiResponse<Branch>>(`/branches/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(branch),
    });
    return res.data!;
  },

  deleteBranch: async (id: string): Promise<void> => {
    await request<ApiResponse>(`/branches/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Users (Branch Admins / Super Admins)
  getUsers: async (): Promise<User[]> => {
    const res = await request<ApiResponse<User[]>>('/users');
    return res.data || [];
  },

  createUser: async (userData: {
    username: string;
    password: string;
    name: string;
    role?: 'superadmin' | 'admin';
    branchId?: string | null;
    phone?: string;
  }): Promise<User> => {
    const res = await request<ApiResponse<User>>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return res.data!;
  },

  updateUser: async (id: string, userData: Partial<User> & { password?: string }): Promise<User> => {
    const res = await request<ApiResponse<User>>(`/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return res.data!;
  },

  deleteUser: async (id: string): Promise<void> => {
    await request<ApiResponse>(`/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Staff
  getStaff: async (params?: { branchId?: string }): Promise<StaffMember[]> => {
    const query = new URLSearchParams();
    if (params?.branchId && params.branchId !== 'all') {
      query.set('branchId', params.branchId);
    }
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request<ApiResponse<StaffMember[]>>(`/staff${queryString}`);
    return res.data || [];
  },

  createStaff: async (staff: StaffMember): Promise<StaffMember> => {
    const res = await request<ApiResponse<StaffMember>>('/staff', {
      method: 'POST',
      body: JSON.stringify(staff),
    });
    return res.data!;
  },

  updateStaff: async (id: string, staff: Partial<StaffMember>): Promise<StaffMember> => {
    const res = await request<ApiResponse<StaffMember>>(`/staff/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(staff),
    });
    return res.data!;
  },

  deleteStaff: async (id: string): Promise<void> => {
    await request<ApiResponse>(`/staff/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Attendance
  getAttendance: async (params?: { date?: string; month?: string; staffId?: string }): Promise<AttendanceRecord[]> => {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.month) query.set('month', params.month);
    if (params?.staffId) query.set('staffId', params.staffId);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request<ApiResponse<AttendanceRecord[]>>(`/attendance${queryString}`);
    return res.data || [];
  },

  saveAttendanceRecord: async (record: Omit<AttendanceRecord, 'id'> & { id?: string }): Promise<AttendanceRecord> => {
    const res = await request<ApiResponse<AttendanceRecord>>('/attendance/record', {
      method: 'POST',
      body: JSON.stringify(record),
    });
    return res.data!;
  },

  saveBulkAttendance: async (records: Omit<AttendanceRecord, 'id'>[]): Promise<AttendanceRecord[]> => {
    const res = await request<ApiResponse<AttendanceRecord[]>>('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
    return res.data || [];
  },

  replaceDateAttendance: async (date: string, records: AttendanceRecord[]): Promise<AttendanceRecord[]> => {
    const res = await request<ApiResponse<AttendanceRecord[]>>('/attendance/replace-date', {
      method: 'POST',
      body: JSON.stringify({ date, records }),
    });
    return res.data || [];
  },

  markAllPresent: async (date: string, staffList: StaffMember[]): Promise<AttendanceRecord[]> => {
    const res = await request<ApiResponse<AttendanceRecord[]>>('/attendance/mark-all-present', {
      method: 'POST',
      body: JSON.stringify({ date, staffList }),
    });
    return res.data || [];
  },

  deleteAttendance: async (staffId: string, date: string): Promise<void> => {
    const query = new URLSearchParams({ staffId, date });
    await request<ApiResponse>(`/attendance?${query.toString()}`, {
      method: 'DELETE',
    });
  },

  // Loans & Advances
  getLoanAdvances: async (params?: { staffId?: string; month?: string; type?: string }): Promise<LoanAdvanceEntry[]> => {
    const query = new URLSearchParams();
    if (params?.staffId) query.set('staffId', params.staffId);
    if (params?.month) query.set('month', params.month);
    if (params?.type) query.set('type', params.type);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request<ApiResponse<LoanAdvanceEntry[]>>(`/loans-advances${queryString}`);
    return res.data || [];
  },

  createLoanAdvance: async (entry: Omit<LoanAdvanceEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): Promise<LoanAdvanceEntry> => {
    const res = await request<ApiResponse<LoanAdvanceEntry>>('/loans-advances', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
    return res.data!;
  },

  deleteLoanAdvance: async (id: string): Promise<void> => {
    await request<ApiResponse>(`/loans-advances/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Payments / Salary Slips
  getPayments: async (params?: { staffId?: string; month?: string }): Promise<PaymentRecord[]> => {
    const query = new URLSearchParams();
    if (params?.staffId) query.set('staffId', params.staffId);
    if (params?.month) query.set('month', params.month);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request<ApiResponse<PaymentRecord[]>>(`/payments${queryString}`);
    return res.data || [];
  },

  recordPayment: async (payment: Omit<PaymentRecord, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): Promise<PaymentRecord> => {
    const res = await request<ApiResponse<PaymentRecord>>('/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
    return res.data!;
  },

  deletePayment: async (id: string): Promise<void> => {
    await request<ApiResponse>(`/payments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Settings
  getSettings: async (): Promise<CompanySettings> => {
    const res = await request<ApiResponse<CompanySettings>>('/settings');
    return res.data!;
  },

  updateSettings: async (settings: Partial<CompanySettings>): Promise<CompanySettings> => {
    const res = await request<ApiResponse<CompanySettings>>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    return res.data!;
  },

  // Backup & Restore
  exportBackup: async () => {
    return request<ApiResponse>('/admin/export');
  },
  exportDatabase: async () => {
    return request<ApiResponse>('/admin/export');
  },

  importBackup: async (data: any) => {
    return request<ApiResponse>('/admin/import', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  },
  importDatabase: async (data: any) => {
    return request<ApiResponse>('/admin/import', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  },

  resetAllData: async () => {
    return request<ApiResponse>('/admin/reset', {
      method: 'POST',
    });
  },
};
