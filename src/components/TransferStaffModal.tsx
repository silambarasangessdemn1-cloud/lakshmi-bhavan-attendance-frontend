import React, { useState } from 'react';
import {
  X,
  ArrowRightLeft,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Check,
  Ban,
  User,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useStaff } from '../context/StaffContext';
import { useAuth } from '../context/AuthContext';
import { StaffMember } from '../types';

interface TransferStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
}

export const TransferStaffModal: React.FC<TransferStaffModalProps> = ({
  isOpen,
  onClose,
  staff,
}) => {
  const { branches, isSuperAdmin, isBranchAdmin, user } = useAuth();
  const {
    requestStaffTransfer,
    respondTransfer,
    transferRequests,
    showToast,
  } = useStaff();

  const [toBranchId, setToBranchId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');

  if (!isOpen || !staff) return null;

  const currentBranch = branches.find((b) => b.id === staff.branchId);
  const targetBranches = branches.filter((b) => b.id !== staff.branchId);

  // Transfer history for this staff member
  const staffTransfers = transferRequests.filter((t) => t.staffId === staff.id);
  const pendingRequest = staffTransfers.find((t) => t.status === 'pending');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toBranchId) {
      showToast('Please select a destination branch.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestStaffTransfer(staff.id, toBranchId, reason);
      if (res.success) {
        showToast(res.message, 'success');
        onClose();
      } else {
        showToast(res.message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (requestId: string, action: 'approve' | 'reject' | 'cancel') => {
    setActioningId(requestId);
    try {
      const res = await respondTransfer(requestId, action);
      if (res.success) {
        showToast(res.message, 'success');
        if (action === 'approve') {
          onClose();
        }
      } else {
        showToast(res.message, 'error');
      }
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Transfer Staff Across Branches</h3>
              <p className="text-xs text-slate-300">
                Move {staff.name} ({staff.id}) to another branch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection if there is request history */}
        {staffTransfers.length > 0 && (
          <div className="flex items-center border-b border-slate-200 px-5 pt-2 bg-slate-50 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('request')}
              className={`pb-2.5 text-xs font-semibold px-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'request'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Transfer Request
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 text-xs font-semibold px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Transfer History</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                {staffTransfers.length}
              </span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'request' ? (
            <>
              {/* Staff Current Location Banner */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Current Branch
                  </span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{currentBranch?.name || 'Unassigned Branch'}</span>
                    {currentBranch && (
                      <span className="text-[10px] font-mono text-slate-500 font-normal">
                        ({currentBranch.code})
                      </span>
                    )}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Staff Member
                  </span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {staff.name} ({staff.id})
                  </span>
                </div>
              </div>

              {/* Pending Request Alert (if any active) */}
              {pendingRequest && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold block">
                        Transfer Request Pending Approval
                      </span>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Transfer to <strong>{pendingRequest.toBranchName}</strong> requested by{' '}
                        <strong>{pendingRequest.requestedByUserName}</strong>.
                      </p>
                      {pendingRequest.reason && (
                        <p className="text-[11px] italic text-amber-700 mt-1">
                          "{pendingRequest.reason}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions on Pending Request */}
                  <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
                    {isSuperAdmin ? (
                      <>
                        <button
                          type="button"
                          disabled={actioningId === pendingRequest.id}
                          onClick={() => handleAction(pendingRequest.id, 'approve')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          {actioningId === pendingRequest.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          <span>Accept &amp; Move Staff</span>
                        </button>
                        <button
                          type="button"
                          disabled={actioningId === pendingRequest.id}
                          onClick={() => handleAction(pendingRequest.id, 'reject')}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={actioningId === pendingRequest.id}
                        onClick={() => handleAction(pendingRequest.id, 'cancel')}
                        className="px-2.5 py-1 text-slate-600 hover:text-rose-700 hover:bg-white border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Form to submit a new transfer request */}
              {!pendingRequest && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isBranchAdmin && (
                    <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <span>
                        As a <strong>Branch Admin</strong>, your transfer request will be sent to the{' '}
                        <strong>Super Admin</strong>. Once approved, the staff member and their records will be moved to the new branch.
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Destination Branch <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={toBranchId}
                      onChange={(e) => setToBranchId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    >
                      <option value="">Select Destination Branch</option>
                      {targetBranches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code}) {b.location ? `— ${b.location}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reason for Transfer (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Operational requirement, staff relocation, machine operator replacement..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !toBranchId}
                      className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>
                            {isSuperAdmin ? 'Transfer Now' : 'Send Transfer Request'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            /* History Tab */
            <div className="space-y-2.5">
              {staffTransfers.map((req) => (
                <div
                  key={req.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span>{req.fromBranchName}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-emerald-700">{req.toBranchName}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : req.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  {req.reason && (
                    <p className="text-[11px] text-slate-600 italic">"{req.reason}"</p>
                  )}
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span>Requested by {req.requestedByUserName}</span>
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
