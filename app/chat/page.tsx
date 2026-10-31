import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabaseServer";
import CustomerChatView from "@/src/components/chat/CustomerChatView";

/**
 * SEO Metadata untuk halaman Chat Customer.
 */
export const metadata: Metadata = {
  title: "Pesan | Putra Art Shop",
  description:
    "Lihat dan lanjutkan percakapan Anda dengan Putra Art Shop seputar produk kerajinan tangan Lombok.",
  alternates: {
    canonical: "/chat",
  },
};

/**
 * Halaman Pesan Customer (/chat) — Server Component.
 *
 * Memverifikasi sesi pengguna di server. Jika belum login,
 * diarahkan ke /login dengan redirect parameter.
 * Jika sudah login, merender CustomerChatView.
 *
 * Phase 4.5C
 */
export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/chat");
  }

  return <CustomerChatView />;
}
