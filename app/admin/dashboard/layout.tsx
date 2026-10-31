"use client";

import React from "react";
import AdminSessionGuard from "@/src/components/admin/AdminSessionGuard";
import AdminLayout from "@/src/components/admin/AdminLayout";
import DynamicFavicon from "@/src/components/common/DynamicFavicon";

// =============================================================================
// AdminDashboardLayout
//
// Layout root untuk seluruh route /admin/dashboard/**.
//
// Lapisan keamanan:
//   1. AdminSessionGuard → cek Supabase session
//   2. AdminSessionGuard → fetch + validasi profil dari tabel `users`
//   3. AdminSessionGuard → inject AdminProfile ke AdminProfileContext
//   4. AdminLayout       → tampilkan UI dengan data profil & role
//
// Komponen halaman di bawahnya dapat mengakses profil & permission via:
//   const { profile, permissions } = useAdminProfile();
// =============================================================================

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Pastikan favicon dinamis selalu termuat di halaman admin */}
      <DynamicFavicon />
      <AdminSessionGuard>
        {({ profile, onLogout }) => (
          <AdminLayout profile={profile} onLogout={onLogout}>
            {children}
          </AdminLayout>
        )}
      </AdminSessionGuard>
    </>
  );
}
