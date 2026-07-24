"use client";

import { useContext } from "react";
import { AdminAuthContext, AdminAuthContextType } from "@/src/context/AdminAuthContext";

/**
 * Custom Hook `useAdminAuth` untuk mengakses status dan aksi autentikasi Admin Dashboard.
 *
 * @throws {Error} Jika dipanggil di luar `AdminAuthProvider`.
 * @returns {AdminAuthContextType} Objek Context Autentikasi Admin.
 *
 * @example
 * ```tsx
 * const { isAuthenticated, login, logout } = useAdminAuth();
 * ```
 */
export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error(
      "useAdminAuth harus digunakan di dalam komponen yang dibungkus <AdminAuthProvider>."
    );
  }
  return context;
};

export default useAdminAuth;
