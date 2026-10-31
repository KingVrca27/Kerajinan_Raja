/**
 * @file app/api/admin/bank-accounts/[id]/route.ts
 * Admin-only API endpoint untuk PATCH (update) dan DELETE rekening bank by ID.
 *
 * KEAMANAN:
 *  - Setiap request wajib membawa session Supabase yang valid.
 *  - Role diverifikasi server-side dari tabel `users`.
 *  - Hanya role 'admin' dan 'superadmin' yang dapat mengakses.
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/src/lib/supabaseServerRoute";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import {
  updateBankAccount,
  deleteBankAccount,
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

// ─── PATCH: Update rekening bank ──────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyAdminRole(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID rekening tidak valid" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const input: Partial<BankAccountInput> = {};

    if (body.bank_name !== undefined) input.bank_name = body.bank_name;
    if (body.account_name !== undefined) input.account_name = body.account_name;
    if (body.account_number !== undefined) input.account_number = body.account_number;
    if (body.is_active !== undefined) input.is_active = Boolean(body.is_active);
    if (body.display_order !== undefined) input.display_order = Number(body.display_order);

    const result = await updateBankAccount(id, input);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ account: result.data });
  } catch (error) {
    console.error("[/api/admin/bank-accounts/[id]] PATCH error:", error);
    return NextResponse.json({ error: "Gagal mengupdate rekening bank" }, { status: 500 });
  }
}

// ─── DELETE: Hapus rekening bank ──────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyAdminRole(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID rekening tidak valid" }, { status: 400 });
  }

  try {
    const result = await deleteBankAccount(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/admin/bank-accounts/[id]] DELETE error:", error);
    return NextResponse.json({ error: "Gagal menghapus rekening bank" }, { status: 500 });
  }
}
