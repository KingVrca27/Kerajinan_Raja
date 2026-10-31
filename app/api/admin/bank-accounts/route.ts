/**
 * @file app/api/admin/bank-accounts/route.ts
 * Admin-only API endpoint untuk CRUD rekening bank.
 *
 * KEAMANAN:
 *  - Setiap request wajib membawa session Supabase yang valid.
 *  - Role pengguna diverifikasi dari tabel `users` (bukan dari client).
 *  - Hanya role 'admin' dan 'superadmin' yang dapat mengakses endpoint ini.
 *
 * ENDPOINTS:
 *  GET    /api/admin/bank-accounts           — Daftar semua rekening (aktif + tidak aktif)
 *  POST   /api/admin/bank-accounts           — Buat rekening baru
 *  PATCH  /api/admin/bank-accounts/[id]      — Update rekening (lihat [id]/route.ts)
 *  DELETE /api/admin/bank-accounts/[id]      — Hapus rekening (lihat [id]/route.ts)
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/src/lib/supabaseServerRoute";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import {
  getAllBankAccountsAdmin,
  createBankAccount,
  type BankAccountInput,
} from "@/src/lib/bankAccountRepository";

// ─── Helper: Verify Admin Role ────────────────────────────────────────────────

async function verifyAdminRole(req: NextRequest): Promise<{ userId: string } | NextResponse> {
  const { supabase: supabaseAuth } = createRouteHandlerClient(req);
  const {
    data: { user: authUser },
  } = await supabaseAuth.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verifikasi role dari tabel users (bukan dari token/client)
  const { data: userRow, error: roleError } = await supabaseAdmin
    .from("users")
    .select("role, is_active")
    .eq("id", authUser.id)
    .maybeSingle();

  if (roleError || !userRow || !userRow.is_active) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!["admin", "superadmin"].includes(userRow.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { userId: authUser.id };
}

// ─── GET: Daftar semua rekening bank ─────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authResult = await verifyAdminRole(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const accounts = await getAllBankAccountsAdmin();
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("[/api/admin/bank-accounts] GET error:", error);
    return NextResponse.json({ error: "Gagal mengambil data rekening bank" }, { status: 500 });
  }
}

// ─── POST: Buat rekening bank baru ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authResult = await verifyAdminRole(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const input: BankAccountInput = {
      bank_name: body.bank_name,
      account_name: body.account_name,
      account_number: body.account_number,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      display_order: typeof body.display_order === "number" ? body.display_order : 0,
    };

    const result = await createBankAccount(input);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ account: result.data }, { status: 201 });
  } catch (error) {
    console.error("[/api/admin/bank-accounts] POST error:", error);
    return NextResponse.json({ error: "Gagal membuat rekening bank" }, { status: 500 });
  }
}
