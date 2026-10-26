import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Branch } from '../types';
import { api, getAuthToken, clearAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  branches: Branch[];
  activeBranchId: string; // 'all' or branch.id
  currentBranch: Branch | null;
  isAuthLoading: boolean;
  isSuperAdmin: boolean;
  isBranchAdmin: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setActiveBranchId: (branchId: string) => void;
  refreshBranches: () => Promise<void>;
  updateUserContext: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_BRANCH_KEY = 'staffpay_active_branch_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchIdState] = useState<string>(() => {
    return localStorage.getItem(ACTIVE_BRANCH_KEY) || 'all';
  });
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const isSuperAdmin = user?.role === 'superadmin';
  const isBranchAdmin = user?.role === 'admin';

  const refreshBranches = useCallback(async () => {
    try {
      const list = await api.getBranches();
      setBranches(list);
    } catch (err) {
      console.warn('Could not fetch branches:', err);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const storedToken = getAuthToken();
      if (!storedToken) {
        if (isMounted) setIsAuthLoading(false);
        return;
      }

      try {
        const { user: fetchedUser } = await api.getMe();
        if (isMounted) {
          setUser(fetchedUser);
          setToken(storedToken);

          // If branch admin, force activeBranchId to their assigned branch
          if (fetchedUser.role === 'admin' && fetchedUser.branchId) {
            setActiveBranchIdState(fetchedUser.branchId);
            localStorage.setItem(ACTIVE_BRANCH_KEY, fetchedUser.branchId);
          }

          // Fetch branches list
          try {
            const branchList = await api.getBranches();
            if (isMounted) setBranches(branchList);
          } catch (e) {
            console.warn('Failed to load branches on init:', e);
          }
        }
      } catch (err) {
        console.warn('Stored session invalid or expired:', err);
        clearAuthToken();
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    }

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.login(username, password);
      setUser(res.user);
      setToken(res.token);

      // Load branches
      const branchList = await api.getBranches();
      setBranches(branchList);

      // If branch admin, strictly pin their branch
      if (res.user.role === 'admin' && res.user.branchId) {
        setActiveBranchIdState(res.user.branchId);
        localStorage.setItem(ACTIVE_BRANCH_KEY, res.user.branchId);
      } else {
        // Default Super Admin to 'all' or previously saved branch
        const saved = localStorage.getItem(ACTIVE_BRANCH_KEY);
        if (saved && branchList.some((b) => b.id === saved)) {
          setActiveBranchIdState(saved);
        } else {
          setActiveBranchIdState('all');
          localStorage.setItem(ACTIVE_BRANCH_KEY, 'all');
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Login failed.' };
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    setToken(null);
    setBranches([]);
    localStorage.removeItem(ACTIVE_BRANCH_KEY);
  };

  const setActiveBranchId = (branchId: string) => {
    // Branch admins cannot switch away from their assigned branch
    if (isBranchAdmin && user?.branchId) {
      setActiveBranchIdState(user.branchId);
      localStorage.setItem(ACTIVE_BRANCH_KEY, user.branchId);
      return;
    }
    setActiveBranchIdState(branchId);
    localStorage.setItem(ACTIVE_BRANCH_KEY, branchId);
  };

  const updateUserContext = (updated: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  const currentBranch = branches.find((b) => b.id === activeBranchId) || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        branches,
        activeBranchId,
        currentBranch,
        isAuthLoading,
        isSuperAdmin,
        isBranchAdmin,
        login,
        logout,
        setActiveBranchId,
        refreshBranches,
        updateUserContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
