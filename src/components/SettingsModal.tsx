import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  Building2,
  RefreshCw,
  Trash2,
  Check,
  Download,
  Upload,
  Database,
  Server,
  CloudCheck,
} from 'lucide-react';
import { useStaff } from '../context/StaffContext';
import { defaultCompanySettings } from '../utils/companyDefaults';
import { CompanySettings } from '../types';

export const FONT_OPTIONS = [
  {
    id: 'Inter',
    name: 'Inter',
    sub: 'Crisp & Modern (Default)',
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  {
    id: 'DM Sans',
    name: 'DM Sans',
    sub: 'Clean Geometric',
    family: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  {
    id: 'Plus Jakarta Sans',
    name: 'Plus Jakarta',
    sub: 'Modern Rounded',
    family: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  {
    id: 'System',
    name: 'System UI',
    sub: 'Native OS font',
    family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    updateCompanySettings,
    resetToShreeLakshmiBhavan,
    clearAllData,
    exportBackup,
    importBackup,
    isBackendConnected,
    refreshData,
    showToast,
  } = useStaff();

  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [currentFont, setCurrentFont] = useState<string>(() => {
    return localStorage.getItem('app_font_choice') || 'Inter';
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
    }
  }, [isOpen, settings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleFontChange = (fontId: string) => {
    setCurrentFont(fontId);
    localStorage.setItem('app_font_choice', fontId);
    const chosen = FONT_OPTIONS.find((f) => f.id === fontId);
    if (chosen) {
      document.body.style.fontFamily = chosen.family;
      showToast(`Font updated to ${chosen.name}`, 'info');
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const ok = await importBackup(content);
        if (ok) {
          setActionNotice('Database restored successfully from backup!');
          setTimeout(() => setActionNotice(null), 4000);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCompanySettings(formData);
    setSaveSuccess(true);
    showToast('Company settings updated successfully!', 'success');
    setTimeout(() => setSaveSuccess(false), 3000);
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
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header (Pinned) */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">System & Company Settings</h2>
              <p className="text-xs text-slate-500">
                Configure business details, font, and database backups
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Close settings (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6">
          {actionNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
              {actionNotice}
            </div>
          )}

          {/* Database Connection Status Banner */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isBackendConnected
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <Server className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Backend Database:</span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isBackendConnected
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {isBackendConnected ? 'Connected' : 'Offline Mode'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {isBackendConnected
                    ? 'Live synced with Express.js REST API & MongoDB storage.'
                    : 'Changes securely cached in persistent offline storage.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => refreshData()}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
              title="Test & Refresh Connection"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Company Information Form */}
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Employer Details (Printed on Payslips)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tagline / Unit
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Vegetarian Restaurant & Sweets"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone / Mobile
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98401 23456"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Office / Facility Address
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. No. 42, Trunk Road, Poonamallee, Chennai"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Typography / Application Font */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                Application Font
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FONT_OPTIONS.map((f) => {
                  const isSelected = currentFont === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleFontChange(f.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/30'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-bold">{f.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{f.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {saveSuccess ? (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Company details saved!</span>
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
              >
                Save Settings
              </button>
            </div>
          </form>

          {/* Database Backup & Restore */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Database Backup & Restore</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Export your full database to a downloadable JSON file for safekeeping, or restore from a past backup.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportBackup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Backup (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Restore Backup (JSON)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </div>
          </div>

          {/* Reset / Clear Data */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={async () => {
                if (
                  confirm(
                    'Clear all staff, attendance, payment, and loan records and reset company details for Shree Lakshmi Bhavan? This will seed default records.'
                  )
                ) {
                  await resetToShreeLakshmiBhavan();
                  setFormData({ ...defaultCompanySettings });
                  setActionNotice('All records reset. Shree Lakshmi Bhavan is ready with fresh initial records.');
                  setTimeout(() => setActionNotice(null), 3000);
                }
              }}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Fresh Start: Seed SLB Records</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                if (
                  confirm(
                    'Warning: This will delete ALL staff members, attendance records, and transactions for a clean blank slate. Proceed?'
                  )
                ) {
                  await clearAllData();
                  setActionNotice('All records cleared for blank start.');
                  setTimeout(() => setActionNotice(null), 3000);
                }
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Data (Blank Slate)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
