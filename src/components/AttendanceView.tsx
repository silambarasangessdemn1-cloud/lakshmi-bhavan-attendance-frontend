import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  RotateCcw,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { useStaff } from '../context/StaffContext';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { StaffAvatar } from './StaffAvatar';
import { NumberStepper } from './NumberStepper';
import {
  getTodayDateString,
  formatDatePretty,
  getCurrentMonth,
  formatMonthName,
  formatCurrency,
} from '../utils/formatters';

export const AttendanceView: React.FC = () => {
  const {
    staff,
    attendance,
    saveAttendanceRecord,
    replaceDateAttendance,
    deleteAttendance,
    selectedMonth,
    setSelectedMonth,
    showToast,
  } = useStaff();

  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'matrix'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Draft attendance state for selectedDate (NOT automatic save)
  const [draftRecords, setDraftRecords] = useState<Record<string, AttendanceRecord>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Load saved attendance from context into draftRecords when date changes
  useEffect(() => {
    const map: Record<string, AttendanceRecord> = {};
    attendance
      .filter((a) => a.date === selectedDate)
      .forEach((rec) => {
        map[rec.staffId] = { ...rec };
      });
    setDraftRecords(map);
    setHasUnsavedChanges(false);
  }, [selectedDate, attendance]);

  const activeStaff = useMemo(() => {
    return staff.filter((s) => s.status !== 'inactive');
  }, [staff]);

  const filteredStaff = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return activeStaff.filter((s) => {
      // Status filter
      if (statusFilter !== 'all') {
        const record = draftRecords[s.id];
        if (record?.status !== statusFilter) return false;
      }

      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.designation.toLowerCase().includes(q)
      );
    });
  }, [activeStaff, searchTerm, statusFilter, draftRecords]);

  // Compute stats from current draft records for instant responsive feedback
  const dayRecordsList = useMemo(() => {
    return Object.values(draftRecords);
  }, [draftRecords]);

  const dayStats = useMemo(() => {
    let present = 0;
    let half = 0;
    let absent = 0;
    let leave = 0;
    let totalOt = 0;

    dayRecordsList.forEach((r) => {
      if (r.status === 'present') present++;
      else if (r.status === 'half') half++;
      else if (r.status === 'absent') absent++;
      else if (r.status === 'leave') leave++;
      totalOt += Number(r.ot) || 0;
    });

    const notMarked = Math.max(0, activeStaff.length - dayRecordsList.length);

    return { present, half, absent, leave, totalOt, notMarked };
  }, [dayRecordsList, activeStaff]);

  // Quick date change helpers with unsaved guard
  const handleShiftDate = (days: number) => {
    if (hasUnsavedChanges) {
      showToast('Unsaved changes discarded on date switch.', 'info');
      setHasUnsavedChanges(false);
    }
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yr}-${mo}-${da}`);
  };

  const handleDateSelect = (newDate: string) => {
    if (hasUnsavedChanges) {
      showToast('Unsaved changes discarded on date switch.', 'info');
      setHasUnsavedChanges(false);
    }
    setSelectedDate(newDate);
  };

  // Draft updates - NOT saving automatically
  const handleStatusChange = (staffId: string, status: AttendanceStatus) => {
    setDraftRecords((prev) => {
      const existing = prev[staffId];
      return {
        ...prev,
        [staffId]: {
          id: existing?.id || `att-${staffId}-${selectedDate}`,
          staffId,
          date: selectedDate,
          status,
          inTime:
            status === 'present' || status === 'half'
              ? existing?.inTime || '09:00'
              : undefined,
          outTime:
            status === 'present'
              ? existing?.outTime || '18:00'
              : status === 'half'
              ? existing?.outTime || '13:30'
              : undefined,
          ot: existing?.ot || 0,
          notes: existing?.notes || '',
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleInTimeChange = (staffId: string, inTime: string) => {
    setDraftRecords((prev) => {
      const existing = prev[staffId];
      return {
        ...prev,
        [staffId]: {
          id: existing?.id || `att-${staffId}-${selectedDate}`,
          staffId,
          date: selectedDate,
          status: existing?.status || 'present',
          inTime,
          outTime: existing?.outTime || '18:00',
          ot: existing?.ot || 0,
          notes: existing?.notes || '',
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleOutTimeChange = (staffId: string, outTime: string) => {
    setDraftRecords((prev) => {
      const existing = prev[staffId];
      return {
        ...prev,
        [staffId]: {
          id: existing?.id || `att-${staffId}-${selectedDate}`,
          staffId,
          date: selectedDate,
          status: existing?.status || 'present',
          inTime: existing?.inTime || '09:00',
          outTime,
          ot: existing?.ot || 0,
          notes: existing?.notes || '',
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleOtChange = (staffId: string, ot: number) => {
    setDraftRecords((prev) => {
      const existing = prev[staffId];
      return {
        ...prev,
        [staffId]: {
          id: existing?.id || `att-${staffId}-${selectedDate}`,
          staffId,
          date: selectedDate,
          status: existing?.status || 'present',
          inTime: existing?.inTime || '09:00',
          outTime: existing?.outTime || '18:00',
          ot,
          notes: existing?.notes || '',
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleMarkAllPresent = () => {
    const listToSave: AttendanceRecord[] = activeStaff.map((m) => {
      const existing = draftRecords[m.id];
      return {
        id: existing?.id || `att-${m.id}-${selectedDate}`,
        staffId: m.id,
        date: selectedDate,
        status: 'present' as AttendanceStatus,
        inTime: existing?.inTime || '06:30',
        outTime: existing?.outTime || '15:30',
        ot: existing?.ot || 0,
        notes: existing?.notes || 'Marked present (All-in)',
      };
    });

    const nextMap: Record<string, AttendanceRecord> = {};
    listToSave.forEach((r) => {
      nextMap[r.staffId] = r;
    });

    setDraftRecords(nextMap);
    replaceDateAttendance(selectedDate, listToSave);
    setHasUnsavedChanges(false);
    setSaveSuccessNotice(
      `Marked all ${activeStaff.length} active staff as Present and saved for ${formatDatePretty(selectedDate)}!`
    );
    showToast(
      `Marked all ${activeStaff.length} staff as Present & saved!`,
      'success',
      'All Present Saved'
    );
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  const handleDiscardChanges = () => {
    const map: Record<string, AttendanceRecord> = {};
    attendance
      .filter((a) => a.date === selectedDate)
      .forEach((rec) => {
        map[rec.staffId] = { ...rec };
      });
    setDraftRecords(map);
    setHasUnsavedChanges(false);
    showToast('Unsaved changes discarded.', 'info');
  };

  const handleSaveDailyAttendance = () => {
    const listToSave: AttendanceRecord[] = activeStaff.map((m) => {
      const existing = draftRecords[m.id];
      return {
        id: existing?.id || `att-${m.id}-${selectedDate}`,
        staffId: m.id,
        date: selectedDate,
        status: existing?.status || 'present',
        inTime: existing?.inTime || '06:30',
        outTime: existing?.outTime || '15:30',
        ot: existing?.ot || 0,
        notes: existing?.notes || '',
      };
    });

    replaceDateAttendance(selectedDate, listToSave);
    setHasUnsavedChanges(false);
    setSaveSuccessNotice(
      `Daily Attendance for ${formatDatePretty(selectedDate)} saved successfully (${listToSave.length} staff logged)!`
    );
    showToast(
      `Daily Attendance for ${formatDatePretty(selectedDate)} saved successfully!`,
      'success',
      'Attendance Saved'
    );
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  // Matrix calculations
  const [matrixYear, matrixMonth] = (selectedMonth || getCurrentMonth()).split('-').map(Number);
  const daysInMatrixMonth = new Date(matrixYear, matrixMonth, 0).getDate();
  const matrixDays = Array.from({ length: daysInMatrixMonth }, (_, i) => i + 1);

  const cycleStatus = (staffId: string, dayNum: number) => {
    const dateStr = `${selectedMonth}-${String(dayNum).padStart(2, '0')}`;
    const rec = attendance.find((a) => a.staffId === staffId && a.date === dateStr);

    const sequence: AttendanceStatus[] = ['present', 'half', 'absent', 'leave'];
    if (!rec) {
      saveAttendanceRecord({ staffId, date: dateStr, status: 'present', inTime: '09:00', outTime: '18:00', ot: 0 });
    } else {
      const currentIdx = sequence.indexOf(rec.status);
      if (currentIdx === sequence.length - 1) {
        deleteAttendance(staffId, dateStr);
      } else {
        saveAttendanceRecord({
          staffId,
          date: dateStr,
          status: sequence[currentIdx + 1],
          inTime: rec.inTime,
          outTime: rec.outTime,
          ot: rec.ot || 0,
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shadow-xs shrink-0">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Daily Attendance Register
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Live Register
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily staff roll-call, IN &amp; OUT timings, overtime hours, and monthly attendance sheet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveSubTab('daily')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Roll-Call
            </button>
            <button
              onClick={() => setActiveSubTab('matrix')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'matrix'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Sheet Matrix
            </button>
          </div>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {activeSubTab === 'daily' ? (
        /* DAILY ROLL-CALL VIEW */
        <div className="space-y-4">
          {/* Unsaved Changes Banner */}
          {hasUnsavedChanges && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                <span>
                  You have uncommitted changes for <strong>{formatDatePretty(selectedDate)}</strong>. Click <strong>Save Daily Attendance</strong> to apply.
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  className="px-2.5 py-1 text-xs text-amber-800 hover:text-amber-950 hover:bg-amber-100 rounded-md font-semibold transition-colors"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveDailyAttendance}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Attendance</span>
                </button>
              </div>
            </div>
          )}

          {/* Date Selector & Action Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleShiftDate(-1)}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateSelect(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                />
              </div>

              <button
                onClick={() => handleShiftDate(1)}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDateSelect(getTodayDateString())}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  selectedDate === getTodayDateString()
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Today
              </button>
            </div>

            {/* Save Attendance & Mark All Action buttons */}
            <div className="flex items-center justify-between md:justify-end gap-2.5">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
                title="Mark all active staff members as Present for today"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark All Present</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDailyAttendance}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap shadow-xs ${
                  hasUnsavedChanges
                    ? 'text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 ring-2 ring-emerald-500/30'
                    : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                }`}
                title="Save daily attendance records to ledger"
              >
                <Save className="w-4 h-4" />
                <span>Save Daily Attendance</span>
                {hasUnsavedChanges && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </button>

              {hasUnsavedChanges && (
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Discard unsaved edits"
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                  Discard
                </button>
              )}
            </div>
          </div>

          {/* Day Status Summary Strip (Clickable Filter Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`p-3 rounded-2xl border text-center transition-all btn-press shadow-2xs ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span className={`text-[11px] block font-semibold ${statusFilter === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>
                Total Roster
              </span>
              <span className="text-xl font-extrabold font-mono mt-0.5 block">
                {activeStaff.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'present' ? 'all' : 'present')}
              className={`p-3 rounded-2xl border text-center transition-all btn-press shadow-2xs ${
                statusFilter === 'present'
                  ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-100 text-emerald-900'
              }`}
            >
              <span className={`text-[11px] block font-bold ${statusFilter === 'present' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                Present (1.0)
              </span>
              <span className="text-xl font-extrabold font-mono mt-0.5 block">
                {dayStats.present}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'half' ? 'all' : 'half')}
              className={`p-3 rounded-2xl border text-center transition-all btn-press shadow-2xs ${
                statusFilter === 'half'
                  ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-100 text-amber-900'
              }`}
            >
              <span className={`text-[11px] block font-bold ${statusFilter === 'half' ? 'text-amber-100' : 'text-amber-700'}`}>
                Half Day (0.5)
              </span>
              <span className="text-xl font-extrabold font-mono mt-0.5 block">
                {dayStats.half}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'absent' ? 'all' : 'absent')}
              className={`p-3 rounded-2xl border text-center transition-all btn-press shadow-2xs ${
                statusFilter === 'absent'
                  ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-500/20 shadow-xs'
                  : 'bg-rose-50/70 hover:bg-rose-100/70 border-rose-100 text-rose-900'
              }`}
            >
              <span className={`text-[11px] block font-bold ${statusFilter === 'absent' ? 'text-rose-100' : 'text-rose-700'}`}>
                Absent (0)
              </span>
              <span className="text-xl font-extrabold font-mono mt-0.5 block">
                {dayStats.absent}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'leave' ? 'all' : 'leave')}
              className={`p-3 rounded-2xl border text-center transition-all btn-press shadow-2xs ${
                statusFilter === 'leave'
                  ? 'bg-sky-600 text-white border-sky-600 ring-2 ring-sky-500/20 shadow-xs'
                  : 'bg-sky-50/70 hover:bg-sky-100/70 border-sky-100 text-sky-900'
              }`}
            >
              <span className={`text-[11px] block font-bold ${statusFilter === 'leave' ? 'text-sky-100' : 'text-sky-700'}`}>
                On Leave
              </span>
              <span className="text-xl font-extrabold font-mono mt-0.5 block">
                {dayStats.leave}
              </span>
            </button>

            <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-100 text-center shadow-2xs">
              <span className="text-[11px] text-purple-700 block font-bold">
                Total OT Hours
              </span>
              <span className="text-xl font-extrabold font-mono text-purple-900 mt-0.5 block">
                {dayStats.totalOt}h
              </span>
            </div>
          </div>

          {/* Search & Filter Strip */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff in roll-call..."
                className="w-full pl-10 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {statusFilter !== 'all' && (
              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="text-xs text-slate-500 font-medium">Filtering by:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-2xs">
                  <span className="capitalize">{statusFilter}</span>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className="hover:text-rose-300 ml-1"
                    title="Clear filter"
                  >
                    ×
                  </button>
                </span>
              </div>
            )}
          </div>

          {/* Roll Call Roster List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No staff members match the selected criteria for this roll-call.
                </div>
              ) : (
                filteredStaff.map((member) => {
                  const record = draftRecords[member.id];
                  const currentStatus = record?.status;
                  const currentOt = record?.ot || 0;

                  return (
                    <div
                      key={member.id}
                      className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4"
                    >
                      {/* Staff Identity */}
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <StaffAvatar name={member.name} photo={member.photo} size="sm" />
                        <div>
                          <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <span>{member.name}</span>
                            <span className="font-mono text-[10px] text-slate-400 font-normal">
                              ({member.id})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{member.designation}</span>
                            <span className="text-slate-300">·</span>
                            <span className="font-mono font-medium text-slate-700">Wage {formatCurrency(member.wage)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Attendance Status Selector (Segmented Pill Buttons) */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 w-full sm:w-auto shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(member.id, 'present')}
                          className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all btn-press ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                          }`}
                        >
                          Present (1.0)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(member.id, 'half')}
                          className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all btn-press ${
                            currentStatus === 'half'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                          }`}
                        >
                          Half (0.5)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(member.id, 'absent')}
                          className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all btn-press ${
                            currentStatus === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                          }`}
                        >
                          Absent (0)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(member.id, 'leave')}
                          className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all btn-press ${
                            currentStatus === 'leave'
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                          }`}
                        >
                          Leave
                        </button>
                      </div>

                      {/* IN and OUT Time Inputs */}
                      <div className="flex items-center gap-2.5 self-start lg:self-center">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">IN:</span>
                          <input
                            type="time"
                            value={record?.inTime || (currentStatus === 'present' || currentStatus === 'half' ? '09:00' : '')}
                            onChange={(e) => handleInTimeChange(member.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono bg-white text-slate-800 shadow-2xs focus:outline-hidden focus:border-emerald-600"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">OUT:</span>
                          <input
                            type="time"
                            value={record?.outTime || (currentStatus === 'present' ? '18:00' : currentStatus === 'half' ? '13:30' : '')}
                            onChange={(e) => handleOutTimeChange(member.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono bg-white text-slate-800 shadow-2xs focus:outline-hidden focus:border-emerald-600"
                          />
                        </div>
                      </div>

                      {/* Overtime (OT) Stepper */}
                      <div className="flex items-center gap-2 self-start lg:self-center">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold">OT:</span>
                        </div>
                        <NumberStepper
                          value={currentOt}
                          onChange={(val) => handleOtChange(member.id, val)}
                          step={0.5}
                          min={0}
                          max={12}
                          size="sm"
                          stepButtons={[
                            { label: '+1h', delta: 1 },
                            { label: '+2h', delta: 2 },
                          ]}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Save Attendance Bar */}
            <div className="p-4 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                <span>
                  Logged for {formatDatePretty(selectedDate)}: <strong>{dayStats.present} Present</strong> · <strong>{dayStats.half} Half</strong> · <strong>{dayStats.totalOt}h Overtime</strong>
                </span>
                {hasUnsavedChanges ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                    Unsaved Draft
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full shadow-2xs">
                    <Check className="w-3 h-3 text-emerald-600" />
                    All Saved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {hasUnsavedChanges && (
                  <button
                    type="button"
                    onClick={handleDiscardChanges}
                    className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs btn-press"
                  >
                    Discard Changes
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveDailyAttendance}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm btn-press ${
                    hasUnsavedChanges
                      ? 'text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 ring-2 ring-emerald-500/30'
                      : 'text-slate-700 bg-slate-200 hover:bg-slate-300'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>Save Daily Attendance</span>
                  {hasUnsavedChanges && (
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MONTHLY MATRIX SHEET VIEW */
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payroll Cycle:</span>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80">
                <CalendarIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer"
                />
              </div>
              <span className="text-xs font-extrabold text-slate-900 hidden sm:inline">
                {formatMonthName(selectedMonth)}
              </span>
            </div>

            {/* Interactive Legend */}
            <div className="flex items-center gap-2 text-xs font-semibold overflow-x-auto">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Present (P)</span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs text-[11px]">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Half (H)</span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs text-[11px]">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Absent (A)</span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs text-[11px]">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Leave (L)</span>
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-center border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 text-[11px]">
                  <tr>
                    <th className="sticky left-0 bg-slate-50 z-20 py-3 px-4 text-left font-semibold text-slate-600 min-w-[160px] border-r border-slate-200">
                      Staff Member
                    </th>
                    {matrixDays.map((dayNum) => {
                      const dayDate = new Date(matrixYear, matrixMonth - 1, dayNum);
                      const isSunday = dayDate.getDay() === 0;
                      return (
                        <th
                          key={dayNum}
                          className={`py-2 px-1 min-w-[28px] border-r border-slate-100 font-mono ${
                            isSunday ? 'bg-rose-50/60 text-rose-700' : 'text-slate-600'
                          }`}
                        >
                          <div className="text-[10px] uppercase font-sans">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][dayDate.getDay()]}
                          </div>
                          <div className="font-semibold">{dayNum}</div>
                        </th>
                      );
                    })}
                    <th className="py-2 px-3 bg-slate-100 font-semibold text-slate-700 border-l border-slate-200 whitespace-nowrap">
                      Units
                    </th>
                    <th className="py-2 px-3 bg-slate-100 font-semibold text-slate-700 whitespace-nowrap">
                      OT (h)
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs font-mono">
                  {filteredStaff.map((member) => {
                    const memberMonthRecords = attendance.filter(
                      (a) => a.staffId === member.id && a.date.startsWith(selectedMonth)
                    );

                    let totalUnits = 0;
                    let totalOt = 0;

                    memberMonthRecords.forEach((r) => {
                      if (r.status === 'present') totalUnits += 1;
                      else if (r.status === 'half') totalUnits += 0.5;
                      totalOt += Number(r.ot) || 0;
                    });

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="sticky left-0 bg-white hover:bg-slate-50/70 z-10 py-2 px-4 text-left font-sans font-medium text-slate-900 border-r border-slate-200 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <StaffAvatar name={member.name} photo={member.photo} size="sm" />
                            <div className="truncate max-w-[120px]">
                              <div className="truncate text-xs font-semibold">{member.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{member.id}</div>
                            </div>
                          </div>
                        </td>

                        {matrixDays.map((dayNum) => {
                          const dateStr = `${selectedMonth}-${String(dayNum).padStart(2, '0')}`;
                          const rec = memberMonthRecords.find((a) => a.date === dateStr);
                          const dayDate = new Date(matrixYear, matrixMonth - 1, dayNum);
                          const isSunday = dayDate.getDay() === 0;

                          let cellContent = '—';
                          let cellBg = isSunday ? 'bg-rose-50/30' : '';

                          if (rec?.status === 'present') {
                            cellContent = 'P';
                            cellBg = 'bg-emerald-100 text-emerald-800 font-bold';
                          } else if (rec?.status === 'half') {
                            cellContent = 'H';
                            cellBg = 'bg-amber-100 text-amber-800 font-bold';
                          } else if (rec?.status === 'absent') {
                            cellContent = 'A';
                            cellBg = 'bg-rose-100 text-rose-800 font-bold';
                          } else if (rec?.status === 'leave') {
                            cellContent = 'L';
                            cellBg = 'bg-blue-100 text-blue-800 font-bold';
                          }

                          return (
                            <td
                              key={dayNum}
                              onClick={() => cycleStatus(member.id, dayNum)}
                              className={`p-1 border-r border-slate-100 cursor-pointer select-none transition-colors hover:brightness-95 ${cellBg}`}
                              title={`Click to cycle: ${member.name} on ${dateStr}`}
                            >
                              <div className="flex flex-col items-center justify-center min-h-[26px]">
                                <span>{cellContent}</span>
                                {rec && rec.ot > 0 && (
                                  <span className="text-[9px] text-purple-700 leading-none">
                                    +{rec.ot}h
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        <td className="py-2 px-3 bg-slate-50 font-bold text-slate-900 border-l border-slate-200">
                          {totalUnits}
                        </td>
                        <td className="py-2 px-3 bg-slate-50 font-semibold text-purple-700">
                          {totalOt > 0 ? totalOt : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Tip: In the Monthly Sheet, click on any date cell to quickly cycle its status (P → H → A → L → Clear).
          </p>
        </div>
      )}
    </div>
  );
};
