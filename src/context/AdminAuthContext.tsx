"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from "react";

const ADMIN_SESSION_KEY = "kerajinan-raja-admin-session";

export interface AdminUser {
  username: string;
}

export interface AdminAuthContextType {
  /** Status keterisian sesi autentikasi admin */
  isAuthenticated: boolean;
  /** Objek data pengguna admin jika terautentikasi */
  user: AdminUser | null;
  /**
   * Mengautentikasi pengguna admin menggunakan username dan password.
   * @param username Teks username admin
   * @param password Teks kata sandi admin
   * @returns `true` jika login berhasil, `false` jika kredensial salah
   */
  login: (username: string, password: string) => boolean;
  /** Menghapus sesi login dan keluar dari dashboard */
  logout: () => void;
}

/** Context untuk mengelola status autentikasi Admin */
export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

export interface AdminAuthProviderProps {
  children: ReactNode;
}

/**
 * Provider autentikasi Admin Dashboard Kerajinan Raja.
 * Menyimpan sesi login di localStorage `kerajinan-raja-admin-session`.
 */
export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Baca status sesi dari localStorage saat mount
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(ADMIN_SESSION_KEY);
      if (savedSession) {
        const parsedUser = JSON.parse(savedSession);
        if (parsedUser && parsedUser.username) {
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error("Gagal membaca sesi admin:", error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Fungsi Login Admin dengan Kredensial Dummy (admin / admin123)
  const login = useCallback((username: string, password: string): boolean => {
    if (username === "admin" && password === "admin123") {
      const adminData: AdminUser = { username: "admin" };
      setUser(adminData);
      setIsAuthenticated(true);
      try {
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminData));
      } catch (e) {
        console.error("Gagal menyimpan sesi login admin:", e);
      }
      return true;
    }
    return false;
  }, []);

  // Fungsi Logout Admin
  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    } catch (e) {
      console.error("Gagal menghapus sesi login admin:", e);
    }
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthContext;
