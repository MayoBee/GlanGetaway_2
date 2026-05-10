import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminAuthContextType {
  isAdmin: boolean;
  setAdminStatus: (status: boolean) => void;
  clearAdminStatus: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = 'is_super_admin';

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  // Load admin status from localStorage on mount
  useEffect(() => {
    const storedAdminStatus = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (storedAdminStatus === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const setAdminStatus = (status: boolean) => {
    setIsAdmin(status);
    localStorage.setItem(ADMIN_STORAGE_KEY, String(status));
  };

  const clearAdminStatus = () => {
    setIsAdmin(false);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdmin, setAdminStatus, clearAdminStatus }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

