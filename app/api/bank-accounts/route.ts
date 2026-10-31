/**
 * @file app/api/bank-accounts/route.ts
 * Public API endpoint: GET daftar rekening bank aktif.
 *
 * KEAMANAN:
 *  - GET: PUBLIC — siapapun dapat membaca rekening aktif untuk keperluan checkout.
 *  - Tidak ada endpoint mutation (POST/PATCH/DELETE) di sini.
 *    Mutation hanya tersedia di /api/admin/bank-accounts.
 */

import { NextResponse } from "next/server";
import { getActiveBankAccounts } from "@/src/lib/bankAccountRepository";

export async function GET() {
  try {
    const accounts = await getActiveBankAccounts();
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("[/api/bank-accounts] GET error:", error);
    return NextResponse.json({ accounts: [] }, { status: 200 });
  }
}
