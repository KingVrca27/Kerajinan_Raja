"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/src/lib/supabaseBrowser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, User, Phone, MapPin, Lock, LogOut, CheckCircle, AlertCircle, Loader2, Wallet, Package, Truck, Star, Search, X, ChevronRight } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface CustomerProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  village: string | null;
  district: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  destination_id: string | null;
  is_active: boolean;
}

type FeedbackState = { type: "success" | "error"; message: string } | null;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Feedback banner
// ─────────────────────────────────────────────────────────────────────────────
function Feedback({ state }: { state: FeedbackState }) {
  if (!state) return null;
  const isSuccess = state.type === "success";
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
        isSuccess
          ? "bg-green-50 text-green-800 border border-green-200"
          : "bg-red-50 text-red-800 border border-red-200"
      }`}
    >
      {isSuccess ? (
        <CheckCircle className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      {state.message}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  // Session / profile state
  const [user, setUser] = useState<any>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Bagian Badge Order Summary
  const [badges, setBadges] = useState({
    unpaid: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    rating: 0,
  });

  // Personal info form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<FeedbackState>(null);

  // Password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<FeedbackState>(null);

  // UI State
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  // ── Fetch user + profile ──────────────────────────────────────────────────
  const fetchUserAndProfile = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      router.push("/login");
      return;
    }

    setUser(authUser);

    // RLS: hanya record dengan user_id = auth.uid() yang dikembalikan
    const { data: profileData } = await supabase
      .from("customers")
      .select("id, full_name, email, phone, address, village, district, city, province, postal_code, destination_id, is_active")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (profileData) {
      setCustomerProfile(profileData as any);
      setFullName(profileData.full_name ?? "");
      setPhone(profileData.phone ?? "");
    }

    try {
      const sumRes = await fetch("/api/orders/summary");
      if (sumRes.ok) {
        const sumJson = await sumRes.json();
        if (sumJson.success && sumJson.data) {
          let finalDeliveredCount = sumJson.data.delivered || 0;
          if (sumJson.data.deliveredIds && typeof window !== "undefined") {
            try {
              const viewedStr = localStorage.getItem("viewed_delivered_orders");
              const viewed = viewedStr ? JSON.parse(viewedStr) : [];
              const unviewedIds = sumJson.data.deliveredIds.filter((id: string) => !viewed.includes(id));
              finalDeliveredCount = unviewedIds.length;
            } catch (e) {
              console.error("Failed to parse viewed orders", e);
            }
          }

          setBadges({
            unpaid: sumJson.data.unpaid || 0,
            processing: sumJson.data.processing || 0,
            shipped: sumJson.data.shipped || 0,
            delivered: finalDeliveredCount,
            rating: sumJson.data.rating || 0,
          });
        }
      }
    } catch (err) {
      console.error("Gagal mengambil data ringkasan pesanan", err);
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchUserAndProfile();
  }, [fetchUserAndProfile]);



  // ── Simpan Informasi Pribadi ──────────────────────────────────────────────
  // Menggunakan API route server-side agar INSERT aman meski tanpa RLS INSERT policy.
  // Identity selalu diambil dari server-side session cookie, bukan dari body.
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileFeedback(null);

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan profil.");

      // Refresh profil dari database
      await fetchUserAndProfile();
      setProfileFeedback({ type: "success", message: "Profil berhasil disimpan!" });
    } catch (err: any) {
      setProfileFeedback({ type: "error", message: err.message || "Gagal menyimpan profil." });
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Ganti Password ────────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!newPassword) {
      setPasswordFeedback({ type: "error", message: "Password baru wajib diisi." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFeedback({ type: "error", message: "Password minimal 6 karakter." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", message: "Konfirmasi password tidak cocok." });
      return;
    }

    setSavingPassword(true);
    try {
      // Menggunakan Supabase Auth — password tidak pernah disimpan/log
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      setPasswordFeedback({ type: "success", message: "Password berhasil diubah. Silakan login kembali jika diperlukan." });
    } catch (err: any) {
      setPasswordFeedback({ type: "error", message: err.message || "Gagal mengubah password." });
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-amber-200 border-t-[#9D734E] animate-spin" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDFBF7] py-10 px-4 sm:px-6 lg:px-8 font-body">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-heading text-gray-900 tracking-tight">Profil</h1>
          <p className="mt-1 text-gray-500 text-sm">Kelola informasi akun dan pesanan Anda.</p>
        </div>

        {/* ── 1. Informasi Pribadi ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setIsPersonalInfoOpen(!isPersonalInfoOpen)}
            className="w-full flex items-center justify-between p-6 sm:p-8 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">Informasi Pribadi</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-[#9D734E]">
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
          
          {isPersonalInfoOpen && (
            <div className="px-6 pb-6 sm:px-8 sm:pb-8 border-t border-gray-100 pt-6">
              <div className="space-y-6">
                {/* Informasi Akun */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Email
                    </label>
                    <p className="text-gray-900 font-medium bg-gray-50 rounded-xl px-4 py-2.5 text-sm border border-gray-100">
                      {user?.email}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Email tidak dapat diubah pada halaman ini.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Status Akun
                    </label>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                      customerProfile?.is_active !== false
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${customerProfile?.is_active !== false ? "bg-green-500" : "bg-red-500"}`} />
                      {customerProfile?.is_active !== false ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100"></div>

                {/* Form Informasi Pribadi */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Nama */}
                  <div>
                    <label htmlFor="full-name" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        id="full-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nama lengkap Anda"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#9D734E] focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Nomor HP */}
                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Nomor HP / WhatsApp
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <Phone className="h-4 w-4" />
                      </div>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="08xx-xxxx-xxxx"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#9D734E] focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>



                  <Feedback state={profileFeedback} />

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-[#9D734E] py-3 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60 transition-all active:scale-[0.99]"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Perubahan"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* ── 2. Pesanan Saya ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <Link
            href="/profile/orders"
            className="flex items-center justify-between gap-2 mb-6 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-900 uppercase tracking-wider group-hover:text-amber-900 transition-colors">Pesanan Saya</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-[#9D734E] group-hover:text-amber-700 transition-colors">
              Riwayat Pesanan <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-700 transition-colors" />
            </div>
          </Link>
          
          <div className="grid grid-cols-5 gap-2 overflow-x-auto pt-2 pb-2 -mx-2 px-2 scrollbar-hide">
            <Link href="/profile/orders?tab=unpaid" className="relative flex flex-col items-center gap-1.5 group/icon min-w-[60px]">
              <div className="relative flex h-10 w-10 items-center justify-center text-gray-400 group-hover/icon:text-[#9D734E] transition-colors group-hover/icon:bg-amber-50 rounded-xl">
                <Wallet className="h-5 w-5" />
                {badges.unpaid > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white group-hover/icon:ring-amber-50">
                    {badges.unpaid}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold text-gray-500 group-hover/icon:text-[#9D734E] text-center leading-tight">Belum<br/>Bayar</span>
            </Link>

            <Link href="/profile/orders?tab=processing" className="relative flex flex-col items-center gap-1.5 group/icon min-w-[60px]">
              <div className="relative flex h-10 w-10 items-center justify-center text-gray-400 group-hover/icon:text-[#9D734E] transition-colors group-hover/icon:bg-amber-50 rounded-xl">
                <Package className="h-5 w-5" />
                {badges.processing > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white group-hover/icon:ring-amber-50">
                    {badges.processing}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold text-gray-500 group-hover/icon:text-[#9D734E] text-center leading-tight">Dikemas</span>
            </Link>

            <Link href="/profile/orders?tab=shipped" className="relative flex flex-col items-center gap-1.5 group/icon min-w-[60px]">
              <div className="relative flex h-10 w-10 items-center justify-center text-gray-400 group-hover/icon:text-[#9D734E] transition-colors group-hover/icon:bg-amber-50 rounded-xl">
                <Truck className="h-5 w-5" />
                {badges.shipped > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white group-hover/icon:ring-amber-50">
                    {badges.shipped}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold text-gray-500 group-hover/icon:text-[#9D734E] text-center leading-tight">Dikirim</span>
            </Link>

            <Link href="/profile/orders?tab=delivered" className="relative flex flex-col items-center gap-1.5 group/icon min-w-[60px]">
              <div className="relative flex h-10 w-10 items-center justify-center text-gray-400 group-hover/icon:text-[#9D734E] transition-colors group-hover/icon:bg-amber-50 rounded-xl">
                <CheckCircle className="h-5 w-5" />
                {/* NO BADGE FOR SELESAI */}
              </div>
              <span className="text-[10px] font-semibold text-gray-500 group-hover/icon:text-[#9D734E] text-center leading-tight">Selesai</span>
            </Link>

            <Link href="/profile/orders?tab=rating" className="relative flex flex-col items-center gap-1.5 group/icon min-w-[60px]">
              <div className="relative flex h-10 w-10 items-center justify-center text-gray-400 group-hover/icon:text-[#9D734E] transition-colors group-hover/icon:bg-amber-50 rounded-xl">
                <Star className="h-5 w-5" />
                {badges.rating > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white group-hover/icon:ring-amber-50">
                    {badges.rating}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold text-gray-500 group-hover/icon:text-[#9D734E] text-center leading-tight">Rating</span>
            </Link>
          </div>
        </div>

        {/* ── 3. Keamanan Akun ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setIsSecurityOpen(!isSecurityOpen)}
            className="w-full flex items-center justify-between p-6 sm:p-8 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div>
                <span className="block text-sm font-bold text-gray-900 uppercase tracking-wider">Keamanan Akun</span>
                <span className="block text-xs text-gray-500 mt-0.5 font-normal">Kelola keamanan akun dan password Anda</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-[#9D734E] shrink-0 ml-4">
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
          
          {isSecurityOpen && (
            <div className="px-6 pb-6 sm:px-8 sm:pb-8 border-t border-gray-100 pt-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Password Baru */}
                <div>
                  <label htmlFor="new-password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Password Baru
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="new-password"
                      type={showNewPwd ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#9D734E] focus:bg-white focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showNewPwd ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Password */}
                <div>
                  <label htmlFor="confirm-password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="confirm-password"
                      type={showConfirmPwd ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang password baru"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#9D734E] focus:bg-white focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showConfirmPwd ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Feedback state={passwordFeedback} />

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#9D734E] py-3 text-sm font-semibold text-[#9D734E] bg-white hover:bg-[#9D734E]/5 disabled:opacity-60 transition-all active:scale-[0.99]"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Ganti Password"
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ── 4. Keluar Akun ── */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-3xl border border-gray-200 py-4 text-sm font-semibold text-red-600 bg-white hover:bg-red-50 hover:border-red-100 transition-colors active:scale-[0.99]"
        >
          <LogOut className="h-4 w-4" />
          Keluar Akun
        </button>

      </div>
    </div>
  );
}
