import {
  StaffMember,
  AttendanceRecord,
  PaymentRecord,
  LoanAdvanceEntry,
  CompanySettings,
} from '../types';

const API_BASE = '/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  stats?: any;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

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

  // Staff
  getStaff: async (): Promise<StaffMember[]> => {
    const res = await request<ApiResponse<StaffMember[]>>('/staff');
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

  saveBulkAttendance: async (records: Omit<AttendanceRecord, 'id'>[]): Promise<void> => {
    await request<ApiResponse>('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  },

  replaceDateAttendance: async (date: string, records: AttendanceRecord[]): Promise<void> => {
    await request<ApiResponse>('/attendance/replace-date', {
      method: 'POST',
      body: JSON.stringify({ date, records }),
    });
  },

  markAllPresentForDate: async (date: string): Promise<AttendanceRecord[]> => {
    const res = await request<ApiResponse<AttendanceRecord[]>>('/attendance/mark-all-present', {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
    return res.data || [];
  },

  deleteAttendance: async (staffId: string, date: string): Promise<void> => {
    await request<ApiResponse>(
      `/attendance?staffId=${encodeURIComponent(staffId)}&date=${encodeURIComponent(date)}`,
      { method: 'DELETE' }
    );
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

  // Payments
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

  resetSettings: async (): Promise<CompanySettings> => {
    const res = await request<ApiResponse<CompanySettings>>('/settings/reset', {
      method: 'POST',
    });
    return res.data!;
  },

  // Admin: Reset, Export, Import
  resetAllData: async (): Promise<void> => {
    await request<ApiResponse>('/admin/reset', {
      method: 'POST',
    });
  },

  exportDatabase: async (): Promise<any> => {
    return request<any>('/admin/export');
  },

  importDatabase: async (data: any): Promise<any> => {
    return request<any>('/admin/import', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  },
};
