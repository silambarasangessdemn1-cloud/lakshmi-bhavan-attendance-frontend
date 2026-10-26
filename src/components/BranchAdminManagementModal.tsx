import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Users,
  Plus,
  Trash2,
  Edit2,
  KeyRound,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  MapPin,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
import { Branch, User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useStaff } from '../context/StaffContext';

interface BranchAdminManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BranchAdminManagementModal: React.FC<BranchAdminManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { branches, refreshBranches, isSuperAdmin } = useAuth();
  const { staff, showToast } = useStaff();

  const [activeTab, setActiveTab] = useState<'branches' | 'admins'>('branches');
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Branch Form Modal State
  const [isBranchFormOpen, setIsBranchFormOpen] = useState<boolean>(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    location: '',
    username: '',
    password: '',
    managerName: '',
  });

  // Admin Form Modal State
  const [isAdminFormOpen, setIsAdminFormOpen] = useState<boolean>(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [adminForm, setAdminForm] = useState({
    name: '',
    username: '',
    password: '',
    branchId: '',
    phone: '',
    role: 'admin' as 'admin' | 'superadmin',
  });

  // Load admins list
  const loadAdmins = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUsers();
      setUserList(data);
    } catch (err: any) {
      console.warn('Could not fetch admins:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      refreshBranches();
      loadAdmins();
    }
  }, [isOpen, refreshBranches]);

  if (!isOpen || !isSuperAdmin) return null;

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Branch CRUD Handlers
  const handleOpenAddBranch = () => {
    setEditingBranch(null);
    setBranchForm({
      name: '',
      code: '',
      location: '',
      username: '',
      password: '',
      managerName: '',
    });
    setShowPassword(false);
    setErrorMsg('');
    setSuccessMsg('');
    setIsBranchFormOpen(true);
  };

  const handleOpenEditBranch = (b: Branch) => {
    const existingAdmin = userList.find((u) => u.branchId === b.id);
    setEditingBranch(b);
    setBranchForm({
      name: b.name,
      code: b.code,
      location: b.location || '',
      username: existingAdmin?.username || `${b.code.toLowerCase()}_admin`,
      password: '', // Blank unless resetting
      managerName: existingAdmin?.name || `${b.name} Manager`,
    });
    setShowPassword(false);
    setErrorMsg('');
    setSuccessMsg('');
    setIsBranchFormOpen(true);
  };

  const handleCodeChange = (newCode: string) => {
    const cleanCode = newCode.trim().toUpperCase();
    setBranchForm((prev) => ({
      ...prev,
      code: cleanCode,
      // Auto-populate username if not manually modified
      username: !editingBranch && (!prev.username || prev.username.endsWith('_admin'))
        ? `${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '')}_admin`
        : prev.username,
    }));
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name.trim() || !branchForm.code.trim()) {
      setErrorMsg('Branch Name and Code are required.');
      return;
    }

    if (!editingBranch && !branchForm.password.trim()) {
      setErrorMsg('Please enter a Password or PIN for the branch login.');
      return;
    }

    const finalUsername = (
      branchForm.username ||
      `${branchForm.code.toLowerCase().replace(/[^a-z0-9]/g, '')}_admin`
    ).trim().toLowerCase();

    try {
      if (editingBranch) {
        await api.updateBranch(editingBranch.id, {
          name: branchForm.name,
          code: branchForm.code,
          location: branchForm.location,
          username: finalUsername,
          password: branchForm.password.trim() || undefined,
          pin: branchForm.password.trim() || undefined,
          managerName: branchForm.managerName.trim() || undefined,
        });
        showToast(`Branch "${branchForm.name}" updated successfully.`, 'success');
      } else {
        await api.createBranch({
          name: branchForm.name,
          code: branchForm.code,
          location: branchForm.location,
          username: finalUsername,
          password: branchForm.password.trim(),
          pin: branchForm.password.trim(),
          managerName: branchForm.managerName.trim() || `${branchForm.name.trim()} Manager`,
        });
        showToast(
          `Branch "${branchForm.name}" created with Login: "${finalUsername}"!`,
          'success'
        );
      }
      setIsBranchFormOpen(false);
      await refreshBranches();
      await loadAdmins();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save branch.');
    }
  };

  const handleDeleteBranch = async (branchId: string, branchName: string) => {
    const branchStaff = staff.filter((s) => s.branchId === branchId);
    if (branchStaff.length > 0) {
      setErrorMsg(
        `Cannot delete branch "${branchName}" because it has ${branchStaff.length} active staff member(s). Please reassign or delete them first.`
      );
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete branch "${branchName}" and its login account?`
      )
    ) {
      return;
    }

    try {
      await api.deleteBranch(branchId);
      showToast(`Branch "${branchName}" deleted.`, 'info');
      await refreshBranches();
      await loadAdmins();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete branch.');
    }
  };

  // Direct Admin Form Handlers
  const handleOpenAddAdmin = () => {
    setEditingAdmin(null);
    setAdminForm({
      name: '',
      username: '',
      password: '',
      branchId: branches[0]?.id || '',
      phone: '',
      role: 'admin',
    });
    setErrorMsg('');
    setSuccessMsg('');
    setIsAdminFormOpen(true);
  };

  const handleOpenEditAdmin = (u: User) => {
    setEditingAdmin(u);
    setAdminForm({
      name: u.name,
      username: u.username,
      password: '',
      branchId: u.branchId || '',
      phone: u.phone || '',
      role: u.role,
    });
    setErrorMsg('');
    setSuccessMsg('');
    setIsAdminFormOpen(true);
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.name.trim() || !adminForm.username.trim()) {
      setErrorMsg('Full Name and Username are required.');
      return;
    }

    if (!editingAdmin && !adminForm.password) {
      setErrorMsg('Password or PIN is required for new accounts.');
      return;
    }

    if (adminForm.role === 'admin' && !adminForm.branchId) {
      setErrorMsg('Please select an assigned branch.');
      return;
    }

    try {
      if (editingAdmin) {
        await api.updateUser(editingAdmin.id, {
          name: adminForm.name,
          branchId: adminForm.role === 'admin' ? adminForm.branchId : null,
          role: adminForm.role,
          phone: adminForm.phone,
          ...(adminForm.password ? { password: adminForm.password } : {}),
        });
        showToast(`Admin account "${adminForm.username}" updated.`, 'success');
      } else {
        await api.createUser({
          name: adminForm.name,
          username: adminForm.username,
          password: adminForm.password,
          branchId: adminForm.role === 'admin' ? adminForm.branchId : null,
          role: adminForm.role,
          phone: adminForm.phone,
        });
        showToast(`Admin "${adminForm.username}" created successfully!`, 'success');
      }
      setIsAdminFormOpen(false);
      await loadAdmins();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save admin account.');
    }
  };

  const handleDeleteAdmin = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to remove admin account "${username}"?`)) return;

    try {
      await api.deleteUser(userId);
      showToast(`User "${username}" removed.`, 'info');
      await loadAdmins();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove admin.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Branch &amp; Admin Accounts</h2>
              <p className="text-xs text-slate-300">
                Create branch locations and their login credentials (Password or PIN)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('branches')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'branches'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Branches ({branches.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'admins'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Admin Logins ({userList.filter((u) => !!u.username).length})</span>
            </button>
          </div>

          <div className="pb-3">
            {activeTab === 'branches' ? (
              <button
                onClick={handleOpenAddBranch}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Branch &amp; Login</span>
              </button>
            ) : (
              <button
                onClick={handleOpenAddAdmin}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'branches' ? (
            /* BRANCHES LIST */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branches.length === 0 ? (
                <div className="col-span-2 py-12 text-center text-slate-400">
                  <Building2 className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">No branches created yet.</p>
                  <p className="text-xs mt-1">
                    Click "+ Add Branch &amp; Login" to create your first branch and its password or PIN.
                  </p>
                </div>
              ) : (
                branches.map((b) => {
                  const staffInBranch = staff.filter((s) => s.branchId === b.id).length;
                  const branchAdminUser = userList.find((u) => u.branchId === b.id);

                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-1">
                              {b.code}
                            </span>
                            <h3 className="text-base font-bold text-slate-800">{b.name}</h3>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditBranch(b)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                              title="Edit Branch / Change PIN"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBranch(b.id, b.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Delete Branch"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {b.location && (
                          <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{b.location}</span>
                          </p>
                        )}

                        {/* Login Username & Account Badge */}
                        <div className="mt-3 p-2.5 bg-slate-100/90 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <KeyRound className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <div>
                              <span className="text-[11px] text-slate-500 block leading-tight">
                                Login Username:
                              </span>
                              <strong className="text-slate-900 font-mono font-bold text-xs">
                                {branchAdminUser?.username || `${b.code.toLowerCase()}_admin`}
                              </strong>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(branchAdminUser?.username || `${b.code.toLowerCase()}_admin`)
                            }
                            className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Copy Username"
                          >
                            {copiedText ===
                            (branchAdminUser?.username || `${b.code.toLowerCase()}_admin`) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600 font-medium">
                        <span className="flex items-center gap-1 text-emerald-700 font-bold">
                          <Users className="w-3.5 h-3.5" />
                          <span>{staffInBranch} Staff Member(s)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditBranch(b)}
                          className="text-xs text-slate-500 hover:text-emerald-700 font-semibold"
                        >
                          Reset PIN / Password →
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* ADMINS LIST */
            <div className="space-y-3">
              {userList.filter((u) => !!u.username).length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">No admin accounts found.</p>
                </div>
              ) : (
                userList
                  .filter((u) => !!u.username)
                  .map((u) => {
                    const assignedBranch = branches.find((b) => b.id === u.branchId);

                  return (
                    <div
                      key={u.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                            u.role === 'superadmin'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{u.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                u.role === 'superadmin'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-teal-100 text-teal-800'
                              }`}
                            >
                              {u.role === 'superadmin' ? 'Super Admin' : 'Branch Admin'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                            <span>
                              Username: <strong className="text-slate-700">{u.username}</strong>
                            </span>
                            {u.role === 'admin' && (
                              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                <Building2 className="w-3.5 h-3.5" />
                                <span>{assignedBranch?.name || 'Assigned Branch'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditAdmin(u)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Change PIN / Name</span>
                        </button>
                        {u.role !== 'superadmin' && (
                          <button
                            onClick={() => handleDeleteAdmin(u.id, u.username)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Branch Admins log in using their Username &amp; Password/PIN to manage staff &amp; payroll.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* SUB-MODAL: Add / Edit Branch Form with Password or PIN */}
      {isBranchFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingBranch ? 'Edit Branch & Credentials' : 'Create Branch & Admin Login'}
                </h3>
                <p className="text-xs text-slate-500">
                  Set branch info and login password or PIN for the branch manager.
                </p>
              </div>
              <button
                onClick={() => setIsBranchFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  placeholder="e.g. Main Branch or Branch 1"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Branch Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={branchForm.code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="e.g. BR-01"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location / City
                  </label>
                  <input
                    type="text"
                    value={branchForm.location}
                    onChange={(e) => setBranchForm({ ...branchForm, location: e.target.value })}
                    placeholder="e.g. City / Location"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Login Credentials Section */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Branch Admin Login Credentials</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username * (login name)
                  </label>
                  <input
                    type="text"
                    required
                    value={branchForm.username}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, username: e.target.value.toLowerCase() })
                    }
                    placeholder="e.g. branch_admin"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {editingBranch ? 'New Password or PIN (leave blank to keep current)' : 'Password or PIN *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingBranch}
                      value={branchForm.password}
                      onChange={(e) => setBranchForm({ ...branchForm, password: e.target.value })}
                      placeholder={editingBranch ? 'Leave empty to keep unchanged' : 'e.g. 1234 or welcome123'}
                      className="w-full px-3 pr-10 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Can be a simple 4-6 digit numeric PIN or a password.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Manager Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={branchForm.managerName}
                    onChange={(e) => setBranchForm({ ...branchForm, managerName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBranchFormOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {editingBranch ? 'Save Changes' : 'Create Branch & Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Direct Create/Edit Admin Account Form */}
      {isAdminFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingAdmin ? 'Edit Admin Account' : 'Create Admin Account'}
              </h3>
              <button
                onClick={() => setIsAdminFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdmin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username * (lowercase login name)
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingAdmin}
                  value={adminForm.username}
                  onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value.toLowerCase() })}
                  placeholder="e.g. branch_admin"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {editingAdmin ? 'New Password or PIN (leave blank to keep current)' : 'Password or PIN *'}
                </label>
                <input
                  type="password"
                  required={!editingAdmin}
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder="e.g. 1234 or pass123"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={adminForm.role}
                  onChange={(e) =>
                    setAdminForm({
                      ...adminForm,
                      role: e.target.value as 'admin' | 'superadmin',
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="admin">Branch Admin (Assigned branch only)</option>
                  <option value="superadmin">Super Admin (Universal access)</option>
                </select>
              </div>

              {adminForm.role === 'admin' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign Branch *
                  </label>
                  <select
                    required
                    value={adminForm.branchId}
                    onChange={(e) => setAdminForm({ ...adminForm, branchId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="">Select Branch...</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAdminFormOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {editingAdmin ? 'Save Changes' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
