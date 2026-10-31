"use client";

import { useContext } from "react";
import { AdminProfileContext } from "@/src/context/AdminProfileContext";
import { resolvePermissions } from "@/src/lib/adminPermissions";
import type { AdminPermissions } from "@/src/types/admin";

// =============================================================================
// useAdminProfile
//
// Hook utama untuk mengakses data admin yang sedang login beserta izin RBAC-nya.
//
// Mengembalikan:
//   - profile    : AdminProfile | null — data dari tabel users
//   - permissions: AdminPermissions    — izin yang dihitung dari profile.role
//   - isLoading  : boolean             — sedang fetch profil dari DB
//
// Cara penggunaan di komponen:
//   const { profile, permissions } = useAdminProfile();
//   if (!permissions.canManageOrders) return <Unauthorized />;
//
// CATATAN: Hook ini hanya dapat digunakan di dalam komponen yang dibungkus
// oleh AdminProfileProvider (sudah ada di AdminSessionGuard).
// =============================================================================

export function useAdminProfile() {
  const context = useContext(AdminProfileContext);

  if (!context) {
    throw new Error(
      "useAdminProfile() harus digunakan di dalam komponen yang berada " +
        "di bawah AdminSessionGuard (yang sudah menyertakan AdminProfileProvider)."
    );
  }

  const { profile, isLoading } = context;

  // Hitung permissions dari role — fallback ke semua false jika profil belum ada
  const permissions: AdminPermissions = profile
    ? resolvePermissions(profile.role)
    : {
        canViewDashboard:    false,
        canManageProducts:   false,
        canManageCategories: false,
        canManageOrders:     false,
        canManageReviews:    false,
        canManageContent:    false,
        canManageSettings:   false,
        canManageAdmins:     false,
        canViewLogs:         false,
      };

  return {
    profile,
    permissions,
    isLoading,
  };
}

export default useAdminProfile;
