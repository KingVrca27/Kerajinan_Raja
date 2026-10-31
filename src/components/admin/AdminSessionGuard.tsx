"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldX } from "lucide-react";
import { createClient } from "@/src/lib/supabaseBrowser";
import { activityLogRepository } from "@/src/lib/activityLogRepository";
import { AdminProfileProvider } from "@/src/context/AdminProfileContext";
import type { User } from "@supabase/supabase-js";
import type { AdminProfile, AdminRole } from "@/src/types/admin";

// =============================================================================
// AdminSessionGuard  (v2 — dengan RBAC)
//
// Alur lengkap:
//   1. Mount → status: "loading"
//   2. getSession() → tidak ada session → redirect ke /admin
//   3. Ada session → fetch baris dari tabel `users` berdasarkan auth UID
//   4a. Baris tidak ditemukan → logout + redirect + pesan error
//   4b. is_active = false     → logout + redirect + pesan error
//   4c. Profil valid          → status: "authenticated"
//                               inject AdminProfile ke AdminProfileProvider
//                               render children
//   5. onAuthStateChange → deteksi logout / token refresh / session expired
//
// Prinsip:
//   - Supabase session = satu-satunya sumber autentikasi
//   - Tabel `users`    = satu-satunya sumber role & is_active
//   - localStorage     = tidak digunakan sama sekali untuk auth
// =============================================================================

// Jenis error akses yang dapat terjadi (untuk pesan UI yang tepat)
type AccessError =
  | "account_not_found"  // auth UID tidak ada di tabel users
  | "account_inactive"   // is_active = false
  | "fetch_failed";      // error jaringan/DB saat fetch profil

type GuardStatus = "loading" | "authenticated" | "unauthenticated" | "access_denied";

// ── Helper: Fetch profil dari tabel users ────────────────────────────────────

async function fetchAdminProfile(
  uid: string,
  email: string,
  supabase: any
): Promise<{ profile: AdminProfile | null; error: AccessError | null }> {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, role, is_active, avatar_url")
    .eq("id", uid)
    .single();

  if (error || !data) {
    return { profile: null, error: "account_not_found" };
  }

  if (!data.is_active) {
    return { profile: null, error: "account_inactive" };
  }

  // Validasi role — jika nilai di DB tidak dikenali, tolak akses
  const validRoles: AdminRole[] = ["superadmin", "admin"];
  if (!validRoles.includes(data.role as AdminRole)) {
    return { profile: null, error: "account_not_found" };
  }

  // Sanitasi avatar_url: string "NULL", string kosong, atau bukan URL/path
  // yang valid (http/https//) harus dinormalisasi ke null agar tidak dikirim
  // ke <Image src="NULL"> yang menyebabkan Error Boundary.
  const rawAvatar = data.avatar_url;
  const sanitizedAvatar =
    rawAvatar &&
    rawAvatar !== "NULL" &&
    rawAvatar !== "null" &&
    rawAvatar.trim() !== "" &&
    (rawAvatar.startsWith("http://") ||
      rawAvatar.startsWith("https://") ||
      rawAvatar.startsWith("/"))
      ? rawAvatar
      : null;

  const profile: AdminProfile = {
    id:         data.id,
    full_name:  data.full_name,
    email,
    role:       data.role as AdminRole,
    avatar_url: sanitizedAvatar,
    is_active:  data.is_active,
  };

  return { profile, error: null };
}

// ── Pesan error yang ditampilkan ke pengguna ─────────────────────────────────

const ACCESS_ERROR_MESSAGES: Record<AccessError, string> = {
  account_not_found:
    "Akun Anda tidak terdaftar sebagai admin. Hubungi Super Admin untuk mendapatkan akses.",
  account_inactive:
    "Akun Anda telah dinonaktifkan. Hubungi Super Admin untuk mengaktifkan kembali akses.",
  fetch_failed:
    "Gagal memverifikasi akun Anda. Periksa koneksi internet dan coba lagi.",
};

// ── Tipe Props ────────────────────────────────────────────────────────────────

export interface AdminSessionGuardProps {
  children: (props: {
    profile: AdminProfile;
    onLogout: () => Promise<void>;
  }) => React.ReactNode;
}

// ── Komponen Utama ─────────────────────────────────────────────────────────────

export default function AdminSessionGuard({ children }: AdminSessionGuardProps) {
  const router = useRouter();

  const [status, setStatus]           = useState<GuardStatus>("loading");
  const [profile, setProfile]         = useState<AdminProfile | null>(null);
  const [accessError, setAccessError] = useState<AccessError | null>(null);
  const supabase = createClient();

  const initialized = useRef(false);

  // ── Proses verifikasi lengkap (session + profil DB) ──────────────────────
  const verifyAndLoadProfile = useCallback(async (authUser: User) => {
    const { profile: fetchedProfile, error } = await fetchAdminProfile(
      authUser.id,
      authUser.email ?? "",
      supabase
    );

    if (error || !fetchedProfile) {
      // Profil tidak valid — logout otomatis dan tampilkan error
      setAccessError(error ?? "fetch_failed");
      setStatus("access_denied");
      await supabase.auth.signOut();
      return;
    }

    setProfile(fetchedProfile);
    setStatus("authenticated");
  }, []);

  // ── Mount: cek session awal ──────────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 1. Cek session yang sudah ada
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        setStatus("unauthenticated");
        return;
      }
      verifyAndLoadProfile(session.user);
    });

    // 2. Subscribe perubahan auth (logout, token refresh, session expired)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setProfile(null);
        setStatus("unauthenticated");
      }
      // Jika session baru/refresh, biarkan verifyAndLoadProfile menangani saat mount
      // Tidak perlu re-verify di sini untuk menghindari multiple fetch
    });

    return () => subscription.unsubscribe();
  }, [verifyAndLoadProfile]);

  // ── Redirect ketika unauthenticated ─────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/admin");
    }
  }, [status, router]);

  // ── Handler Logout ───────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    // Catat aktivitas logout jika user masih terautentikasi (mencegah log gagal jika session sudah mati)
    if (profile) {
      // Kita tetap await agar log dipastikan terkirim sebelum pindah halaman
      await activityLogRepository.logActivity({
        action: "Logout Admin",
        entity_type: "auth",
        description: `Admin ${profile.email} melakukan logout.`,
      });
    }

    await supabase.auth.signOut();
    
    // Gunakan hard-reload untuk segera memutus state React dan menuju halaman login
    window.location.href = "/admin";
  }, [profile]);

  // ── Render: Loading ──────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="font-body text-sm text-text-secondary">
            Memverifikasi sesi dan hak akses…
          </p>
        </div>
      </div>
    );
  }

  // ── Render: Access Denied ────────────────────────────────────────────────
  if (status === "access_denied" && accessError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-500">
            <ShieldX className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-heading text-xl font-bold text-text-primary">
            Akses Ditolak
          </h1>
          <p className="mt-2 font-body text-sm text-text-secondary">
            {ACCESS_ERROR_MESSAGES[accessError]}
          </p>
          <button
            type="button"
            onClick={() => router.replace("/admin")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-body text-sm font-semibold text-white transition-all hover:bg-primary/90 focus:outline-none cursor-pointer"
          >
            Kembali ke Halaman Login
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Unauthenticated (null saat redirect berlangsung) ─────────────
  if (status === "unauthenticated" || !profile) {
    return null;
  }

  // ── Render: Authenticated ────────────────────────────────────────────────
  return (
    <AdminProfileProvider profile={profile} isLoading={false}>
      {children({ profile, onLogout: handleLogout })}
    </AdminProfileProvider>
  );
}
