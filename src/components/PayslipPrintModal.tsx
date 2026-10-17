import React, { useState } from 'react';
import { X, Printer, Share2, TableProperties, FileText } from 'lucide-react';
import { PayrollCalculation, CompanySettings, PaymentMethod } from '../types';
import {
  formatCurrency,
  formatMonthName,
  numberToWordsIndian,
  buildWhatsAppSlipUrl,
  getTodayDateString,
  formatDatePretty,
} from '../utils/formatters';
import { StaffLedgerSheet } from './StaffLedgerSheet';

interface PayslipPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  calc: PayrollCalculation;
  settings: CompanySettings;
  advanceDeduct: number;
  loanDeduct: number;
  paymentMethod: PaymentMethod;
  paymentNotes: string;
}

export const PayslipPrintModal: React.FC<PayslipPrintModalProps> = ({
  isOpen,
  onClose,
  calc,
  settings,
  advanceDeduct,
  loanDeduct,
  paymentMethod,
  paymentNotes,
}) => {
  const [printFormat, setPrintFormat] = useState<'sheet' | 'slip'>('sheet');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalDeductions = advanceDeduct + loanDeduct;
  const netPayable = Math.max(0, calc.gross - totalDeductions);
  const remainingLoan = Math.max(0, calc.outstandingLoan - loanDeduct);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const url = buildWhatsAppSlipUrl(
      calc.staff.phone,
      calc.staff.name,
      calc.staff.id,
      calc.month,
      calc.staff.wage,
      calc.effectiveDays,
      calc.otHours,
      calc.gross,
      advanceDeduct,
      loanDeduct,
      netPayable,
      settings.companyName
    );
    window.open(url, '_blank');
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Action bar (hidden on print) */}
        <div className="shrink-0 no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-5 py-3.5 bg-slate-900 text-white gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Salary Statement Preview
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-emerald-400">
              {formatMonthName(calc.month)}
            </span>

            {/* Format toggle: Sample Format vs Payslip */}
            <div className="flex items-center p-0.5 bg-slate-800 rounded-lg ml-2">
              <button
                type="button"
                onClick={() => setPrintFormat('sheet')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                  printFormat === 'sheet'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <TableProperties className="w-3.5 h-3.5" />
                <span>Sample Sheet Format</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('slip')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                  printFormat === 'slip'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Corporate Slip</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div className="p-4 sm:p-8 bg-white max-h-[85vh] overflow-y-auto">
          {printFormat === 'sheet' ? (
            /* Uploaded Sample Format */
            <div className="space-y-4">
              <StaffLedgerSheet staff={calc.staff} month={calc.month} />
            </div>
          ) : (
            /* Standard Corporate Payslip */
            <div id="printable-payslip" className="p-4 sm:p-6 bg-white text-slate-900 font-sans space-y-6">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                    {settings.companyName}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">{settings.tagline}</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-md">{settings.address}</p>
                  {settings.phone && (
                    <p className="text-[11px] text-slate-500 font-mono">Contact: {settings.phone}</p>
                  )}
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="inline-block bg-slate-900 text-white font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                    SALARY PAYSLIP
                  </span>
                  <div className="text-xs text-slate-600 font-medium mt-2">
                    Period: <strong className="text-slate-900">{formatMonthName(calc.month)}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Issue Date: {formatDatePretty(getTodayDateString())}
                  </div>
                </div>
              </div>

              {/* Employee Profile Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">Employee Name:</span>
                    <strong className="text-slate-900 font-semibold">{calc.staff.name}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">Staff ID:</span>
                    <span className="font-mono font-semibold text-slate-800">{calc.staff.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">Designation:</span>
                    <span className="text-slate-700">{calc.staff.designation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">Payment Mode:</span>
                    <span className="font-medium text-slate-800">{paymentMethod}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">Bank Name:</span>
                    <span className="text-slate-800">{calc.staff.bankName || 'Direct / Cash'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">A/C Number:</span>
                    <span className="font-mono text-slate-800">
                      {calc.staff.accountNumber || '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">IFSC Code:</span>
                    <span className="font-mono uppercase text-slate-800">{calc.staff.ifsc || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">Days Worked:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {calc.effectiveDays} Days ({calc.daysCount} Full, {calc.halfDaysCount} Half)
                    </span>
                  </div>
                </div>
              </div>

              {/* Earnings vs Deductions Dual Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-200 rounded-xl overflow-hidden">
                {/* Earnings Column */}
                <div>
                  <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700">
                    Earnings
                  </div>
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2.5 px-4 text-slate-600">
                          Basic Wages ({calc.effectiveDays} days @ {formatCurrency(calc.staff.wage)}/day)
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900">
                          {formatCurrency(calc.wageEarnings)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-slate-600">
                          Overtime Pay ({calc.otHours} hrs @ {formatCurrency(calc.otRate)}/hr)
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900">
                          {formatCurrency(calc.otEarnings)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-200 font-bold">
                        <td className="py-2.5 px-4 text-slate-800">Total Gross Earnings</td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-900">
                          {formatCurrency(calc.gross)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Deductions Column */}
                <div className="border-t sm:border-t-0 sm:border-l border-slate-200">
                  <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700">
                    Deductions
                  </div>
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2.5 px-4 text-slate-600">Advance Salary Deducted</td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900">
                          {formatCurrency(advanceDeduct)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-slate-600">Loan Installment Recovery</td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900">
                          {formatCurrency(loanDeduct)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-200 font-bold">
                        <td className="py-2.5 px-4 text-slate-800">Total Deductions</td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-900">
                          {formatCurrency(totalDeductions)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Net Payable Highlight Banner */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-xs uppercase font-bold text-emerald-800 tracking-wider block">
                    Net Salary Payable
                  </span>
                  <span className="text-xs text-emerald-700 italic">
                    {numberToWordsIndian(netPayable)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold font-mono text-emerald-900 tracking-tight">
                    {formatCurrency(netPayable)}
                  </span>
                </div>
              </div>

              {/* Loan Ledger Note */}
              {calc.outstandingLoan > 0 && (
                <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-xs text-amber-900 flex justify-between items-center">
                  <span>
                    Loan Balance Before Payment: <strong>{formatCurrency(calc.outstandingLoan)}</strong>
                  </span>
                  <span>
                    Remaining Loan Balance: <strong>{formatCurrency(remainingLoan)}</strong>
                  </span>
                </div>
              )}

              {paymentNotes && (
                <div className="text-xs text-slate-600 italic">
                  <strong>Notes:</strong> {paymentNotes}
                </div>
              )}

              {/* Signatures & Authorization */}
              <div className="pt-10 grid grid-cols-2 gap-8 text-xs text-slate-600">
                <div className="text-center pt-8 border-t border-slate-300">
                  <span className="font-semibold block text-slate-800">{calc.staff.name}</span>
                  <span className="text-[11px] text-slate-400">Employee Signature</span>
                </div>
                <div className="text-center pt-8 border-t border-slate-300">
                  <span className="font-semibold block text-slate-800">Authorized Signatory</span>
                  <span className="text-[11px] text-slate-400">{settings.companyName}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
