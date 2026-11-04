import React, { useState } from 'react';
import {
  X,
  ArrowRightLeft,
  Building2,
  Clock,
  Check,
  Ban,
  User,
  Loader2,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useStaff } from '../context/StaffContext';
import { useAuth } from '../context/AuthContext';
import { TransferRequestStatus } from '../types';

interface TransferRequestsListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransferRequestsListModal: React.FC<TransferRequestsListModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isSuperAdmin, isBranchAdmin } = useAuth();
  const {
    transferRequests,
    respondTransfer,
    showToast,
  } = useStaff();

  const [filterStatus, setFilterStatus] = useState<TransferRequestStatus | 'all'>('pending');
  const [actioningId, setActioningId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredRequests = transferRequests.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const pendingCount = transferRequests.filter((r) => r.status === 'pending').length;

  const handleAction = async (requestId: string, action: 'approve' | 'reject' | 'cancel') => {
    setActioningId(requestId);
    try {
      const res = await respondTransfer(requestId, action);
      if (res.success) {
        showToast(res.message, 'success');
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Branch Transfer Requests</h2>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    {pendingCount} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                {isSuperAdmin
                  ? 'Review and approve staff transfer requests submitted by branch administrators'
                  : 'Track the status of staff transfer requests submitted to Super Admin'}
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

        {/* Filter Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">Filter:</span>
          </div>

          <div className="flex items-center gap-1">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  filterStatus === status
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {status === 'pending'
                  ? `Pending (${pendingCount})`
                  : status}
              </button>
            ))}
          </div>
        </div>

        {/* Request List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <ArrowRightLeft className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">No transfer requests found.</p>
              <p className="text-xs mt-1">
                {filterStatus === 'pending'
                  ? 'All staff transfer requests have been processed.'
                  : 'No transfer requests matching this filter.'}
              </p>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{req.staffName}</h4>
                      <span className="font-mono text-xs text-slate-500 font-semibold">
                        ({req.staffId})
                      </span>
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

                    <div className="flex items-center gap-2 mt-1.5 text-xs">
                      <span className="flex items-center gap-1 font-semibold text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.fromBranchName}</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="flex items-center gap-1 font-bold text-emerald-700">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{req.toBranchName}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions for Super Admin on Pending Request */}
                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      {isSuperAdmin ? (
                        <>
                          <button
                            type="button"
                            disabled={actioningId === req.id}
                            onClick={() => handleAction(req.id, 'approve')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                          >
                            {actioningId === req.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Accept &amp; Move</span>
                          </button>
                          <button
                            type="button"
                            disabled={actioningId === req.id}
                            onClick={() => handleAction(req.id, 'reject')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={actioningId === req.id}
                          onClick={() => handleAction(req.id, 'cancel')}
                          className="px-3 py-1 text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {req.reason && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                    "{req.reason}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>
                    Requested by <strong>{req.requestedByUserName}</strong> ({req.requestedByUserRole})
                  </span>
                  <span>{new Date(req.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Transferred staff retain their complete salary, loan balance, and payment ledger history.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
