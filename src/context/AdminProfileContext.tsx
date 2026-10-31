"use client";

import React, { createContext } from "react";
import type { AdminProfile } from "@/src/types/admin";

// =============================================================================
// AdminProfileContext
//
// Context ringan yang hanya menyimpan data AdminProfile yang sudah diverifikasi.
// Context ini TIDAK mengurus autentikasi — itu tugas AdminSessionGuard.
//
// Alur data:
//   Supabase Auth (session)
//     → AdminSessionGuard (fetch tabel users)
//       → AdminProfileProvider (inject ke context)
//         → useAdminProfile() (konsumsi di komponen)
// =============================================================================

export interface AdminProfileContextValue {
  /** Profil admin dari tabel users. Null selama proses loading awal. */
  profile: AdminProfile | null;
  /** True selama profil sedang di-fetch dari database. */
  isLoading: boolean;
}

export const AdminProfileContext = createContext<AdminProfileContextValue | undefined>(
  undefined
);

export interface AdminProfileProviderProps {
  profile: AdminProfile | null;
  isLoading: boolean;
  children: React.ReactNode;
}

/**
 * Provider yang mendistribusikan profil admin ke seluruh pohon komponen dashboard.
 * Diinstansiasi oleh AdminSessionGuard setelah profil berhasil diambil dari DB.
 */
export function AdminProfileProvider({
  profile,
  isLoading,
  children,
}: AdminProfileProviderProps) {
  return (
    <AdminProfileContext.Provider value={{ profile, isLoading }}>
      {children}
    </AdminProfileContext.Provider>
  );
}

export default AdminProfileContext;
