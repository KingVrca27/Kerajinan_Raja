// =============================================================================
// src/lib/adminPermissions.ts
//
// Helper RBAC — menentukan izin akses berdasarkan role admin.
//
// Hierarki role:
//   superadmin → akses penuh ke seluruh fitur termasuk manajemen admin
//   admin       → akses ke semua fitur kecuali manajemen admin
//
// Cara penggunaan:
//   import { resolvePermissions, hasRole } from "@/src/lib/adminPermissions";
//
//   const permissions = resolvePermissions(adminProfile.role);
//   if (!permissions.canManageOrders) redirect("/admin/dashboard");
// =============================================================================

import type { AdminRole, AdminPermissions } from "@/src/types/admin";

// ── Matrix Izin per Role ───────────────────────────────────────────────────

/**
 * Menghitung seluruh izin yang dimiliki berdasarkan role.
 * Kembalikan objek `AdminPermissions` yang dapat digunakan langsung
 * sebagai kondisi boolean di komponen atau middleware.
 */
export function resolvePermissions(role: AdminRole): AdminPermissions {
  switch (role) {
    case "superadmin":
      return {
        canViewDashboard:    true,
        canManageProducts:   true,
        canManageCategories: true,
        canManageOrders:     true,
        canManageReviews:    true,
        canManageContent:    true,
        canManageSettings:   true,
        canManageAdmins:     true,   // ← eksklusif superadmin
        canViewLogs:         true,
      };

    case "admin":
      return {
        canViewDashboard:    true,
        canManageProducts:   true,
        canManageCategories: true,
        canManageOrders:     true,
        canManageReviews:    true,
        canManageContent:    true,
        canManageSettings:   true,
        canManageAdmins:     false,  // ← tidak boleh kelola admin lain
        canViewLogs:         true,
      };

    default: {
      // TypeScript exhaustive check — jika ada role baru yang belum ditangani
      const _exhaustive: never = role;
      void _exhaustive;
      // Kembalikan izin minimum sebagai fallback aman
      return {
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
    }
  }
}

// ── Helper Shorthand ───────────────────────────────────────────────────────

/**
 * Memeriksa apakah `currentRole` memiliki level yang sama atau lebih tinggi
 * dibandingkan `requiredRole`.
 *
 * Hierarki (tinggi → rendah): superadmin > admin
 *
 * @example
 * hasMinRole("superadmin", "admin")  // true  — superadmin ≥ admin
 * hasMinRole("admin", "superadmin")  // false — admin < superadmin
 */
export function hasMinRole(currentRole: AdminRole, requiredRole: AdminRole): boolean {
  const hierarchy: Record<AdminRole, number> = {
    superadmin: 2,
    admin:       1,
  };
  return hierarchy[currentRole] >= hierarchy[requiredRole];
}

/**
 * Memeriksa apakah `currentRole` adalah role tertentu secara eksak.
 *
 * @example
 * hasRole("superadmin", "superadmin") // true
 * hasRole("admin", "superadmin")       // false
 */
export function hasRole(currentRole: AdminRole, role: AdminRole): boolean {
  return currentRole === role;
}

/**
 * Label tampilan (display name) untuk setiap role.
 * Digunakan di UI badge/chip role.
 */
export const ROLE_LABELS: Record<AdminRole, string> = {
  superadmin: "Super Admin",
  admin:       "Admin",
};

/**
 * Warna Tailwind untuk badge role di UI.
 * Format: { bg, text, border } untuk konsistensi styling.
 */
export const ROLE_COLORS: Record<AdminRole, { bg: string; text: string; border: string }> = {
  superadmin: { bg: "bg-purple-50",  text: "text-purple-700", border: "border-purple-200" },
  admin:       { bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200"   },
};
