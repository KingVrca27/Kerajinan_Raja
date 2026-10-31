/**
 * @file src/lib/bankAccountRepository.ts
 * Repository untuk manajemen tabel `bank_accounts`.
 *
 * Terdapat dua mode akses:
 *  1. Public (anon/customer) — hanya membaca rekening aktif, gunakan supabaseBrowser
 *  2. Admin — akses penuh (CRUD), gunakan supabaseAdmin (service role)
 *
 * KEAMANAN:
 *  - Semua mutasi (insert/update/delete) hanya dapat dilakukan melalui
 *    fungsi-fungsi admin yang menggunakan supabaseAdmin (service role).
 *  - Fungsi publik hanya membaca is_active = true.
 *  - Tidak ada fungsi yang menerima account_number, bank_name, dsb dari client
 *    tanpa validasi lebih lanjut di sisi server.
 */

import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { supabase } from "@/src/lib/supabase";

// ─── Type Definitions ─────────────────────────────────────────────────────────

export interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface BankAccountInput {
  bank_name: string;
  account_name: string;
  account_number: string;
  is_active?: boolean;
  display_order?: number;
}

export interface BankAccountOperationResult {
  success: boolean;
  error?: string;
  data?: BankAccount;
}

// ─── Validation Helper ────────────────────────────────────────────────────────

function validateBankAccountInput(input: BankAccountInput): string | null {
  if (!input.bank_name?.trim()) return "Nama bank tidak boleh kosong";
  if (!input.account_name?.trim()) return "Nama pemilik rekening tidak boleh kosong";
  if (!input.account_number?.trim()) return "Nomor rekening tidak boleh kosong";
  if (input.bank_name.trim().length > 100) return "Nama bank maksimal 100 karakter";
  if (input.account_name.trim().length > 200) return "Nama pemilik rekening maksimal 200 karakter";
  return null;
}

// ─── Public Functions (customer/guest — read only) ────────────────────────────

/**
 * Mengambil semua rekening bank yang aktif untuk ditampilkan kepada customer.
 * Menggunakan browser supabase (anon key) — RLS memastikan hanya is_active = true.
 */
export async function getActiveBankAccounts(): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("id, bank_name, account_name, account_number, is_active, display_order, created_at, updated_at")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[bankAccountRepository] getActiveBankAccounts error:", error);
    return [];
  }
  return (data as BankAccount[]) ?? [];
}

// ─── Admin Functions (service role required) ──────────────────────────────────

/**
 * Mengambil semua rekening bank (aktif + nonaktif) untuk halaman admin.
 * Menggunakan supabaseAdmin (service role) — bypasses RLS.
 */
export async function getAllBankAccountsAdmin(): Promise<BankAccount[]> {
  const { data, error } = await supabaseAdmin
    .from("bank_accounts")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[bankAccountRepository] getAllBankAccountsAdmin error:", error);
    return [];
  }
  return (data as BankAccount[]) ?? [];
}

/**
 * Membuat rekening bank baru. Hanya boleh dipanggil dari server-side admin context.
 */
export async function createBankAccount(
  input: BankAccountInput
): Promise<BankAccountOperationResult> {
  const validationError = validateBankAccountInput(input);
  if (validationError) return { success: false, error: validationError };

  const { data, error } = await supabaseAdmin
    .from("bank_accounts")
    .insert({
      bank_name: input.bank_name.trim(),
      account_name: input.account_name.trim(),
      account_number: input.account_number.trim(),
      is_active: input.is_active ?? true,
      display_order: input.display_order ?? 0,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[bankAccountRepository] createBankAccount error:", error);
    return { success: false, error: "Gagal menyimpan rekening bank" };
  }

  return { success: true, data: data as BankAccount };
}

/**
 * Mengupdate rekening bank berdasarkan ID. Hanya boleh dipanggil dari server-side admin context.
 */
export async function updateBankAccount(
  id: string,
  input: Partial<BankAccountInput>
): Promise<BankAccountOperationResult> {
  if (!id) return { success: false, error: "ID rekening tidak valid" };

  // Validasi hanya field yang dikirim
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.bank_name !== undefined) {
    if (!input.bank_name.trim()) return { success: false, error: "Nama bank tidak boleh kosong" };
    updatePayload.bank_name = input.bank_name.trim();
  }
  if (input.account_name !== undefined) {
    if (!input.account_name.trim()) return { success: false, error: "Nama pemilik rekening tidak boleh kosong" };
    updatePayload.account_name = input.account_name.trim();
  }
  if (input.account_number !== undefined) {
    if (!input.account_number.trim()) return { success: false, error: "Nomor rekening tidak boleh kosong" };
    updatePayload.account_number = input.account_number.trim();
  }
  if (input.is_active !== undefined) {
    updatePayload.is_active = input.is_active;
  }
  if (input.display_order !== undefined) {
    updatePayload.display_order = input.display_order;
  }

  const { data, error } = await supabaseAdmin
    .from("bank_accounts")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("[bankAccountRepository] updateBankAccount error:", error);
    return { success: false, error: "Gagal mengupdate rekening bank" };
  }

  return { success: true, data: data as BankAccount };
}

/**
 * Mengaktifkan atau menonaktifkan rekening bank.
 */
export async function toggleBankAccountStatus(
  id: string,
  isActive: boolean
): Promise<BankAccountOperationResult> {
  return updateBankAccount(id, { is_active: isActive });
}

/**
 * Menghapus rekening bank berdasarkan ID.
 * PERINGATAN: Data akan dihapus permanen.
 */
export async function deleteBankAccount(
  id: string
): Promise<BankAccountOperationResult> {
  if (!id) return { success: false, error: "ID rekening tidak valid" };

  const { error } = await supabaseAdmin
    .from("bank_accounts")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[bankAccountRepository] deleteBankAccount error:", error);
    return { success: false, error: "Gagal menghapus rekening bank" };
  }

  return { success: true };
}

/**
 * Verifikasi rekening bank dari server: pastikan ID valid dan is_active = true.
 * Digunakan oleh checkout API untuk server-side validation rekening yang dipilih customer.
 */
export async function verifyActiveBankAccount(
  id: string
): Promise<BankAccount | null> {
  if (!id) return null;

  const { data, error } = await supabaseAdmin
    .from("bank_accounts")
    .select("id, bank_name, account_name, account_number, is_active, display_order, created_at, updated_at")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as BankAccount;
}
