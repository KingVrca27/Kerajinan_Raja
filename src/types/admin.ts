// =============================================================================
// src/types/admin.ts
//
// Definisi tipe untuk sistem RBAC (Role-Based Access Control) Admin Dashboard.
// Digunakan di seluruh area admin — Guard, Hook, Layout, dan Helper permission.
// =============================================================================

/**
 * Role yang dikenali oleh sistem.
 * Hierarki: superadmin > admin
 */
export type AdminRole = "superadmin" | "admin";

/**
 * Profil admin yang diambil dari tabel `users` di database.
 * Merupakan sumber kebenaran tunggal untuk identitas dan role admin.
 */
export interface AdminProfile {
  /** UUID dari auth.users — primary key di tabel users */
  id: string;
  /** Nama lengkap admin (null jika belum diatur) */
  full_name: string | null;
  /** Alamat email admin (dari Supabase Auth) */
  email: string;
  /** Role admin yang menentukan hak akses */
  role: AdminRole;
  /** URL foto profil admin (opsional) */
  avatar_url: string | null;
  /** Apakah akun admin aktif. False = akses ditolak meski sudah login */
  is_active: boolean;
}

/**
 * Kumpulan izin yang dimiliki admin berdasarkan role-nya.
 * Dihasilkan oleh `resolvePermissions()` di adminPermissions.ts.
 */
export interface AdminPermissions {
  /** Melihat seluruh halaman dashboard */
  canViewDashboard: boolean;
  /** Mengelola produk (tambah, edit, hapus) */
  canManageProducts: boolean;
  /** Mengelola kategori produk */
  canManageCategories: boolean;
  /** Mengelola pesanan */
  canManageOrders: boolean;
  /** Mengelola ulasan/testimoni pelanggan */
  canManageReviews: boolean;
  /** Mengelola FAQ dan konten informasi */
  canManageContent: boolean;
  /** Mengelola pengaturan website (site_settings) */
  canManageSettings: boolean;
  /** Mengelola akun admin lain (hanya superadmin) */
  canManageAdmins: boolean;
  /** Melihat log aktivitas dan laporan */
  canViewLogs: boolean;
}
