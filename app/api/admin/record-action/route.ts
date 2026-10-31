import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/src/lib/supabaseServerRoute";

export async function POST(req: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(req);
    const payload = await req.json();

    // Pastikan IP dan user_agent diisi di server
    payload.ip_address = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
    if (!payload.user_agent) {
      payload.user_agent = req.headers.get("user-agent") || "Server";
    }

    const { error } = await supabase.rpc("log_admin_activity", {
      payload
    });

    if (error) {
      console.error("[AdminRecordAction] RPC error:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[AdminRecordAction] Exception:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
