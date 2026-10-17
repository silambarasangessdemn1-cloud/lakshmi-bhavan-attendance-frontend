import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Camera, Trash2, Calculator, Check, AlertCircle } from 'lucide-react';
import { StaffMember } from '../types';
import { useStaff } from '../context/StaffContext';
import { StaffAvatar } from './StaffAvatar';
import { getTodayDateString, compressImageFile } from '../utils/formatters';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffToEdit?: StaffMember | null;
}

export const StaffFormModal: React.FC<StaffFormModalProps> = ({
  isOpen,
  onClose,
  staffToEdit,
}) => {
  const { addStaff, updateStaff, deleteStaff, staff, showToast } = useStaff();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<StaffMember>>({
    id: '',
    name: '',
    designation: '',
    phone: '',
    wage: 800,
    otRate: 100,
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    loanStart: 0,
    notes: '',
    photo: '',
    joiningDate: getTodayDateString(),
    status: 'active',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (staffToEdit) {
      setFormData({
        ...staffToEdit,
        monthlyLoanDeduction: staffToEdit.monthlyLoanDeduction || 0,
        autoLoanDeduct: staffToEdit.autoLoanDeduct !== false,
      });
    } else {
      setFormData({
        id: '',
        name: '',
        designation: '',
        phone: '',
        wage: 800,
        otRate: 100,
        bankName: '',
        accountHolder: '',
        accountNumber: '',
        ifsc: '',
        loanStart: 0,
        monthlyLoanDeduction: 0,
        autoLoanDeduct: true,
        notes: '',
        photo: '',
        joiningDate: getTodayDateString(),
        status: 'active',
      });
    }
    setError(null);
  }, [staffToEdit, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Please select an image smaller than 5 MB.');
      return;
    }

    try {
      // Compress to 160x160 web thumbnail so storage remains tiny (<20KB)
      const compressed = await compressImageFile(file, 160, 0.8);
      setFormData((prev) => ({ ...prev, photo: compressed }));
      setError(null);
    } catch {
      setError('Could not process image file.');
    }
  };

  const handleAutoCalcOT = () => {
    const wage = Number(formData.wage) || 0;
    if (wage > 0) {
      // Standard hourly wage = wage / 8
      const calculated = Math.round(wage / 8);
      setFormData((prev) => ({ ...prev, otRate: calculated }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedId = (formData.id || '').trim();
    const trimmedName = (formData.name || '').trim();

    if (!trimmedId) {
      setError('Staff / Emp ID is required. You can enter any custom number or ID.');
      return;
    }
    if (!trimmedName) {
      setError('Staff Name is required.');
      return;
    }
    if (Number(formData.wage) < 0) {
      setError('Daily wage cannot be negative.');
      return;
    }

    const payload: StaffMember = {
      id: trimmedId,
      name: trimmedName,
      designation: (formData.designation || 'Staff').trim(),
      phone: (formData.phone || '').trim(),
      wage: Number(formData.wage) || 0,
      otRate: Number(formData.otRate) || 0,
      bankName: (formData.bankName || '').trim(),
      accountHolder: (formData.accountHolder || formData.name || '').trim(),
      accountNumber: (formData.accountNumber || '').trim(),
      ifsc: (formData.ifsc || '').trim(),
      loanStart: Math.max(0, Number(formData.loanStart) || 0),
      monthlyLoanDeduction: Math.max(0, Number(formData.monthlyLoanDeduction) || 0),
      autoLoanDeduct: formData.autoLoanDeduct !== false,
      photo: formData.photo || '',
      notes: (formData.notes || '').trim(),
      joiningDate: formData.joiningDate || getTodayDateString(),
      status: formData.status || 'active',
    };

    if (staffToEdit) {
      const success = await updateStaff(staffToEdit.id, payload);
      if (!success) {
        setError(`Staff ID "${trimmedId}" already belongs to another staff member.`);
        return;
      }
      showToast(`Staff profile for ${payload.name} (${payload.id}) updated successfully!`, 'success');
      onClose();
    } else {
      const success = await addStaff(payload);
      if (!success) {
        setError(`Staff ID "${trimmedId}" already exists. Please choose a unique custom ID.`);
        return;
      }
      showToast(`New staff member ${payload.name} (${payload.id}) added successfully!`, 'success');
      onClose();
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header (Pinned at top) */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-md z-10">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {staffToEdit ? 'Edit Staff Profile & Loans' : 'Add Staff'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {staffToEdit
                ? 'Update employee details, manage active loan balance, and bank info'
                : 'Enter employee name, custom ID, designation, daily wage rate, and bank info'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
            {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Photo & Identity Section */}
          <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="relative group shrink-0">
              <StaffAvatar
                name={formData.name || 'Staff Member'}
                photo={formData.photo}
                size="lg"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 shadow-xs transition-colors"
                title="Change Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
                {formData.photo && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, photo: '' }))}
                    className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                JPG, PNG or WEBP up to 2MB. Optional.
              </p>
            </div>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Staff / Emp ID <span className="text-rose-500">*</span>
                </label>
                {!staffToEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      const existingNums = staff
                        .map((s) => {
                          const m = s.id.match(/\d+/);
                          return m ? parseInt(m[0], 10) : 0;
                        })
                        .filter((n) => !isNaN(n));
                      const next = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 101;
                      setFormData((prev) => ({ ...prev, id: String(next) }));
                    }}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium"
                  >
                    Auto-number
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="Enter any custom Emp ID (e.g. 101, 1, EMP-01)"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Any custom ID, number, or code is acceptable
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rajesh Kumar"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Designation / Role
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g. Machine Operator"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone / WhatsApp Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Wage & Financial Parameters (Wage & OT for all) */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/80 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Salary & Overtime Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daily Wage (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.wage}
                    onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 text-sm font-mono font-medium border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    OT Rate / Hour (₹)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoCalcOT}
                    className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                    title="Calculate based on standard 8-hour day"
                  >
                    <Calculator className="w-3 h-3" />
                    <span>Auto (Wage÷8)</span>
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.otRate}
                    onChange={(e) => setFormData({ ...formData, otRate: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 text-sm font-mono font-medium border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Loan Management & Automatic Monthly Repayment */}
          {staffToEdit && (
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Staff Loan &amp; Automatic Repayment
                  </h3>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Issue new loan or configure automatic collection from overall monthly salary
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                  Edit Staff Only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Active Loan Balance (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.loanStart}
                      onChange={(e) => setFormData({ ...formData, loanStart: Number(e.target.value) })}
                      className="w-full pl-7 pr-3 py-2 text-sm font-mono font-bold text-amber-950 border border-amber-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Fast Issue Loan Presets:
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[1000, 2000, 5000, 10000].map((delta) => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            loanStart: Math.max(0, (Number(prev.loanStart) || 0) + delta),
                          }))
                        }
                        className="px-2.5 py-1 text-xs font-mono font-bold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 rounded-md transition-colors shadow-2xs"
                        title={`Add ₹${delta} to loan balance`}
                      >
                        +{delta}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, loanStart: 0 }))}
                      className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 rounded-md transition-colors"
                      title="Clear loan balance"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Automatic Repayment Collection from Monthly Salary */}
              <div className="pt-3 border-t border-amber-200/70 space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.autoLoanDeduct !== false}
                    onChange={(e) =>
                      setFormData({ ...formData, autoLoanDeduct: e.target.checked })
                    }
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-950 block">
                      Automatically collect repayment from overall monthly salary
                    </span>
                    <span className="text-[11px] text-amber-800/80 block mt-0.5">
                      When monthly salary is processed, this repayment is automatically deducted from overall gross earnings until fully repaid.
                    </span>
                  </div>
                </label>

                {formData.autoLoanDeduct !== false && (
                  <div className="pl-6 space-y-2 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-semibold text-slate-700">
                        Monthly Deduction Amount / Installment (₹):
                      </label>
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              monthlyLoanDeduction: Number(prev.loanStart) || 0,
                            }))
                          }
                          className="px-2 py-0.5 text-[10px] font-bold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 rounded transition-colors"
                        >
                          Full Balance
                        </button>
                        {[1000, 2000, 3000, 5000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, monthlyLoanDeduction: amt }))
                            }
                            className="px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative max-w-xs">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={formData.monthlyLoanDeduction || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            monthlyLoanDeduction: Number(e.target.value),
                          })
                        }
                        placeholder={
                          formData.loanStart ? `Full balance (₹${formData.loanStart})` : 'e.g. 2000'
                        }
                        className="w-full pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-slate-900 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Set custom installment (e.g. ₹2,000/mo), or leave blank to deduct the remaining loan balance.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Banking Credentials */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Bank / Direct Disbursement Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g. State Bank of India"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="e.g. 32098451124"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  IFSC / Branch Code
                </label>
                <input
                  type="text"
                  value={formData.ifsc}
                  onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                  placeholder="e.g. SBIN0004211"
                  className="w-full px-3 py-2 text-sm font-mono uppercase border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Notes / Department Remarks
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Shift timings, emergency contact, machine assigned..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          </div>

          {/* Modal Footer Actions (Pinned at bottom) */}
          <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/95 backdrop-blur-md flex items-center justify-between z-10">
            {staffToEdit ? (
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `Are you sure you want to permanently delete ${staffToEdit.name} (${staffToEdit.id})? All attendance and salary history will be removed.`
                    )
                  ) {
                    deleteStaff(staffToEdit.id);
                    showToast(`Staff member ${staffToEdit.name} (${staffToEdit.id}) was deleted.`, 'info');
                    onClose();
                  }
                }}
                className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Staff Member</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{staffToEdit ? 'Save Changes' : 'Add Staff'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
