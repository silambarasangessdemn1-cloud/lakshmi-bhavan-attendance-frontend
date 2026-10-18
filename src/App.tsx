/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StaffProvider, useStaff } from './context/StaffContext';
import { Header, ActiveTab } from './components/Header';
import { AttendanceView } from './components/AttendanceView';
import { StaffDirectoryView } from './components/StaffDirectoryView';
import { AdvancesView } from './components/AdvancesView';
import { LoansView } from './components/LoansView';
import { StaffFormModal } from './components/StaffFormModal';
import { AdvanceLoanModal } from './components/AdvanceLoanModal';
import { StaffFullDetailsModal } from './components/StaffFullDetailsModal';
import { SalaryStudioModal } from './components/SalaryStudioModal';
import { SettingsModal, FONT_OPTIONS } from './components/SettingsModal';
import { ToastContainer } from './components/ToastNotification';
import { StaffMember, LoanAdvanceType } from './types';

const MainLayout: React.FC = () => {
  const { staff, toasts, dismissToast, settings } = useStaff();
  const [activeTab, setActiveTab] = useState<ActiveTab>('staff');
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<StaffMember | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Modal configuration for Advances & Loans
  const [advanceLoanModalConfig, setAdvanceLoanModalConfig] = useState<{
    isOpen: boolean;
    staff: StaffMember | null;
    mode: 'advance' | 'loan' | 'all';
    defaultType?: LoanAdvanceType;
  }>({
    isOpen: false,
    staff: null,
    mode: 'all',
    defaultType: 'advance',
  });

  const [selectedStaffForDetails, setSelectedStaffForDetails] = useState<StaffMember | null>(null);
  const [selectedStaffForSalary, setSelectedStaffForSalary] = useState<StaffMember | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('app_font_choice') || 'Inter';
    const chosen = FONT_OPTIONS.find((f) => f.id === saved);
    if (chosen) {
      document.body.style.fontFamily = chosen.family;
    }
  }, []);

  const handleEditStaff = (member: StaffMember) => {
    setStaffToEdit(member);
    setIsAddStaffModalOpen(true);
  };

  const handleOpenAddStaff = () => {
    setStaffToEdit(null);
    setIsAddStaffModalOpen(true);
  };

  const handleOpenAdvance = (targetStaff?: StaffMember) => {
    setAdvanceLoanModalConfig({
      isOpen: true,
      staff: targetStaff || null,
      mode: 'advance',
      defaultType: 'advance',
    });
  };

  const handleOpenLoan = (targetStaff?: StaffMember, defaultType: LoanAdvanceType = 'loan_issue') => {
    setAdvanceLoanModalConfig({
      isOpen: true,
      staff: targetStaff || null,
      mode: 'loan',
      defaultType,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans relative selection:bg-emerald-500 selection:text-white">
      {/* Subtle top ambient lighting glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-b from-emerald-500/5 via-teal-500/5 to-transparent blur-3xl -z-10" />

      {/* Top Header Application & Navigation Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAddStaff={handleOpenAddStaff}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Workspace (Initial Home View is Staff List) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 transition-all">
        {activeTab === 'staff' && (
          <StaffDirectoryView
            onEditStaff={handleEditStaff}
            onOpenAddStaff={handleOpenAddStaff}
          />
        )}

        {activeTab === 'attendance' && <AttendanceView />}

        {activeTab === 'advances' && (
          <AdvancesView
            onOpenRecordAdvance={(staffMember) => handleOpenAdvance(staffMember)}
            onViewStaffDetails={(staffMember) => setSelectedStaffForDetails(staffMember)}
          />
        )}

        {activeTab === 'loans' && (
          <LoansView
            onOpenIssueLoan={(staffMember) => handleOpenLoan(staffMember, 'loan_issue')}
            onOpenRepayLoan={(staffMember) => handleOpenLoan(staffMember, 'loan_repay')}
            onViewStaffDetails={(staffMember) => setSelectedStaffForDetails(staffMember)}
          />
        )}
      </main>

      {/* Modern Clean Footer */}
      <footer className="no-print mt-auto border-t border-slate-200/80 bg-white/80 backdrop-blur-md py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center text-xs text-slate-400">
          <span>© {new Date().getFullYear()} {settings.companyName || 'Shree Lakshmi Bhavan'}. All rights reserved.</span>
        </div>
      </footer>

      {/* Global Modals */}
      <StaffFormModal
        isOpen={isAddStaffModalOpen}
        onClose={() => {
          setIsAddStaffModalOpen(false);
          setStaffToEdit(null);
        }}
        staffToEdit={staffToEdit}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Dedicated Advance / Loan Modal */}
      {advanceLoanModalConfig.isOpen && (
        <AdvanceLoanModal
          isOpen={advanceLoanModalConfig.isOpen}
          onClose={() =>
            setAdvanceLoanModalConfig((prev) => ({ ...prev, isOpen: false, staff: null }))
          }
          staff={advanceLoanModalConfig.staff}
          defaultType={advanceLoanModalConfig.defaultType}
          mode={advanceLoanModalConfig.mode}
        />
      )}

      {/* Full Details Modal */}
      {selectedStaffForDetails && (
        <StaffFullDetailsModal
          isOpen={!!selectedStaffForDetails}
          onClose={() => setSelectedStaffForDetails(null)}
          staff={selectedStaffForDetails}
          onEditStaff={handleEditStaff}
          onOpenSalary={(staffId) => {
            const found = staff.find((s) => s.id === staffId);
            if (found) setSelectedStaffForSalary(found);
          }}
          onOpenAdvance={(staffMember) => handleOpenAdvance(staffMember)}
          onOpenLoan={(staffMember, defaultType) =>
            handleOpenLoan(staffMember, defaultType || 'loan_issue')
          }
        />
      )}

      {/* Salary Studio Modal */}
      {selectedStaffForSalary && (
        <SalaryStudioModal
          isOpen={!!selectedStaffForSalary}
          onClose={() => setSelectedStaffForSalary(null)}
          staffId={selectedStaffForSalary.id}
        />
      )}

      {/* Global Real-Time Action Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default function App() {
  return (
    <StaffProvider>
      <MainLayout />
    </StaffProvider>
  );
}

