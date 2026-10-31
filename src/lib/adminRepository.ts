/**
 * @file src/lib/adminRepository.ts
 * Repository pattern untuk Manajemen Admin User (tabel `users`)
 *
 * PERUBAHAN (Self-Service Profile):
 * - createAdmin() hanya menerima email + role (tidak lagi menerima full_name/avatar_url)
 * - uploadAdminPhoto() diganti dengan uploadProfilePhoto() yang menggunakan auth.uid()
 *   sebagai folder identity (bukan email)
 * - Ditambahkan deleteProfilePhoto() untuk menghapus foto profil sendiri
 * - Ditambahkan updateAvatarUrl() untuk menyimpan referensi avatar ke database
 */

import { supabase } from "@/src/lib/supabase";
import { activityLogRepository } from "@/src/lib/activityLogRepository";
import type { AdminProfile, AdminRole } from "@/src/types/admin";
import { validateImageFile } from "@/src/lib/imageRepository";

export interface AdminOperationResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export interface AdminUserExtended extends AdminProfile {
  created_at?: string;
  updated_at?: string;
  last_sign_in_at?: string;
}

/** Nama bucket Supabase Storage untuk foto profil admin */
const ADMIN_PHOTO_BUCKET = "Admin_Foto";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Ekstrak storage path dari URL publik Supabase Storage pada bucket Admin_Foto.
 * Mengembalikan null jika URL bukan berasal dari bucket ini.
 */
function extractAdminFotoPath(avatarUrl: string): string | null {
  try {
    const marker = `/object/public/${ADMIN_PHOTO_BUCKET}/`;
    const idx = avatarUrl.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(avatarUrl.slice(idx + marker.length));
  } catch {
    return null;
  }
}

// ─── Upload Foto Profil (Self-Service) ────────────────────────────────────────

/**
 * Upload foto profil milik admin yang sedang login ke Supabase Storage.
 *
 * Path yang digunakan: avatars/{uid}/profile-{timestamp}-{random}.{ext}
 * Identity folder menggunakan UUID user (bukan email).
 *
 * Urutan aman:
 *   1. Validasi file
 *   2. Ambil auth.uid() dari session
 *   3. Upload ke Storage
 *   4. Kembalikan publicUrl + storagePath (belum update DB, caller yang update)
 *
 * @param file - File foto yang akan diupload (JPG/PNG/WEBP/GIF, maks 5MB)
 * @returns { publicUrl, storagePath } atau null jika gagal
 */
export async function uploadProfilePhoto(
  file: File
): Promise<{ publicUrl: string; storagePath: string } | null> {
  // 1. Validasi file
  const validationError = validateImageFile(file);
  if (validationError) {
    console.error("[adminRepository.uploadProfilePhoto]", validationError);
    return null;
  }

  // 2. Ambil user yang sedang login
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    console.error("[adminRepository.uploadProfilePhoto] Tidak ada sesi aktif.");
    return null;
  }

  const uid = session.user.id;
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const storagePath = `avatars/${uid}/profile-${timestamp}-${random}.${ext}`;

  // 3. Upload ke Storage
  const { error: uploadError } = await supabase.storage
    .from(ADMIN_PHOTO_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("[adminRepository.uploadProfilePhoto] Upload error:", uploadError.message);
    return null;
  }

  // 4. Ambil public URL
  const { data: { publicUrl } } = supabase.storage
    .from(ADMIN_PHOTO_BUCKET)
    .getPublicUrl(storagePath);

  return { publicUrl, storagePath };
}

// ─── Update Avatar URL di Database ────────────────────────────────────────────

/**
 * Simpan referensi avatar_url milik user yang sedang login ke tabel users.
 * Hanya self-service: caller = target.
 *
 * @param avatarUrl - URL publik foto baru, atau null untuk menghapus avatar
 */
async function updateAvatarUrl(
  session: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>,
  avatarUrl: string | null
): Promise<AdminOperationResult> {
  const response = await fetch("/api/admin/users/update", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      target_user_id: session.user.id,
      avatar_url: avatarUrl,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    return { success: false, error: body.error || "Gagal memperbarui avatar di database." };
  }

  return { success: true };
}

// ─── Delete Foto Profil (Self-Service) ────────────────────────────────────────

/**
 * Hapus foto profil milik admin yang sedang login.
 *
 * Aturan keamanan:
 * - Menggunakan auth.uid() dari session, bukan input client.
 * - Hanya file di dalam folder avatars/{uid}/ yang diperbolehkan dihapus.
 * - Jika avatar_url bukan milik bucket Admin_Foto, hanya set NULL di DB.
 *
 * Urutan aman:
 *   1. Ambil session + profil saat ini
 *   2. Verifikasi path storage milik user ini
 *   3. Hapus dari Storage
 *   4. Set avatar_url = null di DB
 */
export async function deleteProfilePhoto(): Promise<AdminOperationResult> {
  try {
    // 1. Ambil session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return { success: false, error: "Tidak ada sesi aktif." };
    }

    const uid = session.user.id;

    // 2. Ambil profil saat ini untuk mendapatkan avatar_url
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("avatar_url")
      .eq("id", uid)
      .single();

    if (fetchError || !userData) {
      return { success: false, error: "Gagal mengambil data profil." };
    }

    const avatarUrl = userData.avatar_url as string | null;

    if (!avatarUrl) {
      return { success: false, error: "Tidak ada foto profil untuk dihapus." };
    }

    // 3. Ekstrak path dan verifikasi ownership
    const storagePath = extractAdminFotoPath(avatarUrl);

    if (storagePath) {
      // Pastikan path berada dalam folder milik user ini (keamanan)
      const expectedPrefix = `avatars/${uid}/`;
      if (!storagePath.startsWith(expectedPrefix)) {
        console.warn(
          "[adminRepository.deleteProfilePhoto] Path tidak milik user ini:",
          storagePath
        );
        // Tetap hapus referensi dari DB meskipun tidak hapus Storage
      } else {
        // 4a. Hapus dari Storage
        const { error: storageError } = await supabase.storage
          .from(ADMIN_PHOTO_BUCKET)
          .remove([storagePath]);

        if (storageError) {
          console.warn(
            "[adminRepository.deleteProfilePhoto] Storage remove error:",
            storageError.message
          );
          // Lanjutkan hapus referensi DB meskipun Storage gagal
        }
      }
    }

    // 4b. Set avatar_url = null di database
    return await updateAvatarUrl(session, null);
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ─── Upload + Simpan Foto (Full Flow) ─────────────────────────────────────────

/**
 * Flow lengkap: upload foto baru → update DB → cleanup jika DB gagal.
 *
 * Urutan aman:
 *   1. Upload foto baru ke Storage
 *   2. Update avatar_url di DB
 *   3. Jika DB gagal → hapus foto baru dari Storage (cleanup)
 *
 * TIDAK menghapus foto lama sebelum upload berhasil.
 * Foto lama akan dilepas dari referensi DB, tetapi tidak dihapus otomatis
 * (untuk mencegah data loss jika ada race condition).
 *
 * @param file - File foto baru
 */
export async function uploadAndSaveProfilePhoto(
  file: File
): Promise<AdminOperationResult> {
  try {
    // 1. Ambil session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return { success: false, error: "Tidak ada sesi aktif." };
    }

    // 2. Upload foto baru
    const uploaded = await uploadProfilePhoto(file);
    if (!uploaded) {
      return { success: false, error: "Gagal mengupload foto profil." };
    }

    // 3. Update avatar_url di database
    const updateResult = await updateAvatarUrl(session, uploaded.publicUrl);

    if (!updateResult.success) {
      // 3a. Cleanup: hapus file baru dari Storage jika update DB gagal
      await supabase.storage
        .from(ADMIN_PHOTO_BUCKET)
        .remove([uploaded.storagePath]);

      return {
        success: false,
        error: updateResult.error || "Gagal menyimpan referensi foto ke database.",
      };
    }

    return { success: true, data: { avatarUrl: uploaded.publicUrl } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ─── Repository Object ────────────────────────────────────────────────────────

export const adminRepository = {
  /** Ambil semua user admin dari tabel users */
  async getAllAdmins(): Promise<AdminUserExtended[]> {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, avatar_url, is_active, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[adminRepository.getAllAdmins]", error.message);
      return [];
    }

    return (data || []) as AdminUserExtended[];
  },

  /** Update role admin (hanya Superadmin yang boleh memanggil ini) */
  async updateRole(
    userId: string,
    role: AdminRole
  ): Promise<AdminOperationResult> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return { success: false, error: "Gagal mendapatkan sesi. Pastikan Anda sudah login." };
      }

      const response = await fetch("/api/admin/users/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ target_user_id: userId, role }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { success: false, error: data.error || "Terjadi kesalahan saat memperbarui role." };
      }

      await activityLogRepository.logActivity({
        action: "Ubah Role Admin",
        entity_type: "auth",
        entity_id: userId,
        description: `Mengubah role admin (ID: ${userId}) menjadi ${role}`,
        metadata: { target_user_id: userId, new_role: role },
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },

  /** Toggle status aktif/nonaktif admin (hanya Superadmin yang boleh memanggil ini) */
  async toggleActive(
    userId: string,
    isActive: boolean
  ): Promise<AdminOperationResult> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return { success: false, error: "Gagal mendapatkan sesi. Pastikan Anda sudah login." };
      }

      const response = await fetch("/api/admin/users/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ target_user_id: userId, is_active: isActive }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { success: false, error: data.error || "Terjadi kesalahan saat memperbarui status." };
      }

      await activityLogRepository.logActivity({
        action: isActive ? "Aktifkan Admin" : "Nonaktifkan Admin",
        entity_type: "auth",
        entity_id: userId,
        description: isActive ? `Mengaktifkan admin (ID: ${userId})` : `Menonaktifkan admin (ID: ${userId})`,
        metadata: { target_user_id: userId, is_active: isActive },
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },

  /**
   * Update nama lengkap milik admin yang sedang login (self-service).
   * Endpoint hanya mengizinkan caller = target.
   */
  async updateMyName(fullName: string): Promise<AdminOperationResult> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return { success: false, error: "Gagal mendapatkan sesi. Pastikan Anda sudah login." };
      }

      const response = await fetch("/api/admin/users/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          target_user_id: session.user.id,
          full_name: fullName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { success: false, error: data.error || "Terjadi kesalahan saat memperbarui nama." };
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },

  /**
   * Kirim email reset password via Supabase Auth.
   * Supabase akan kirim link ke email admin yang bersangkutan.
   */
  async sendPasswordReset(email: string): Promise<AdminOperationResult> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/admin/reset-password`,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  /** Ambil profil admin berdasarkan ID */
  async getById(userId: string): Promise<AdminUserExtended | null> {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, avatar_url, is_active, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as AdminUserExtended;
  },

  /**
   * Buat invitation admin baru.
   * Hanya menerima email dan role — full_name dan avatar_url diisi oleh admin
   * yang bersangkutan setelah login (self-service).
   */
  async createAdmin(payload: {
    email: string;
    role: AdminRole;
  }): Promise<AdminOperationResult> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return { success: false, error: "Gagal mendapatkan sesi. Pastikan Anda sudah login." };
      }

      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: payload.email,
          role: payload.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Terjadi kesalahan saat mengundang admin." };
      }

      await activityLogRepository.logActivity({
        action: "Invite Admin",
        entity_type: "auth",
        description: `Mengundang admin baru dengan email: ${payload.email} (${payload.role})`,
        metadata: { email: payload.email, role: payload.role },
      });

      return { success: true, data: { message: data.message } };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },

  /**
   * Menghapus admin secara permanen.
   * Hanya bisa dilakukan jika admin berstatus tidak aktif.
   */
  async deleteAdmin(userId: string): Promise<AdminOperationResult> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return { success: false, error: "Gagal mendapatkan sesi. Pastikan Anda sudah login." };
      }

      const response = await fetch("/api/admin/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ target_user_id: userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Terjadi kesalahan saat menghapus admin." };
      }

      await activityLogRepository.logActivity({
        action: "Hapus Admin",
        entity_type: "auth",
        entity_id: userId,
        description: `Menghapus admin (ID: ${userId})`,
        metadata: { target_user_id: userId },
      });

      return { success: true, data: { message: data.message } };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};
