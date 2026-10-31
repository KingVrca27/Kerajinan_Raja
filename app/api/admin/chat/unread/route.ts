import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { createRouteHandlerClient } from "@/src/lib/supabaseServerRoute";

export async function GET(req: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(req);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (
      userError ||
      !userData ||
      !userData.is_active ||
      !["admin", "superadmin"].includes(userData.role)
    ) {
      return NextResponse.json(
        { error: "Forbidden: Admins only" },
        { status: 403 }
      );
    }

    const { count, error } = await supabaseAdmin
      .from("messages")
      .select("*", { count: 'exact', head: true })
      .eq("is_read_by_admin", false);

    if (error) {
      console.error("[AdminChatUnread:GET] error:", error);
      return NextResponse.json(
        { error: "Gagal mengambil jumlah pesan." },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count || 0 });
  } catch (err) {
    console.error("[AdminChatUnread:GET] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
