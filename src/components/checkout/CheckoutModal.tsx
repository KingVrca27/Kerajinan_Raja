"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, CheckCircle2, Info, Copy, Check, ChevronRight } from "lucide-react";
import { useCart } from "@/src/hooks/useCart";
import { CheckoutCustomerData } from "@/src/lib/whatsapp";
import { CheckoutForm } from "@/src/components/checkout/CheckoutForm";
import CheckoutSummary from "@/src/components/checkout/CheckoutSummary";
import { formatRupiah } from "@/src/lib/currency";
import { createClient } from "@/src/lib/supabaseBrowser";
import type { BankAccount } from "@/src/lib/bankAccountRepository";
import { getEstimatedArrivalText } from "@/src/utils/dateFormatter";

export interface CheckoutModalProps {
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `CheckoutModal` merender modal dialog interaktif untuk mengumpulkan
 * data pemesan dan menampilkan ringkasan belanja (termasuk ongkir flat-rate)
 * sebelum membuka WhatsApp resmi.
 */
export const CheckoutModal: React.FC<CheckoutModalProps> = ({ className = "" }) => {
  const {
    items,
    isCheckoutModalOpen,
    closeCheckoutModal,
    getTotalItems,
    getSubtotal,
    clearCart,
  } = useCart();

  // Hitung intersection metode pembayaran dari seluruh item di cart
  // Server akan memvalidasi ulang — ini hanya untuk filtering UI client-side
  const allowedPaymentMethods = React.useMemo(() => {
    if (!items || items.length === 0) return ["COD", "TRANSFER_BANK"];
    const ALL_METHODS = ["COD", "TRANSFER_BANK"];
    return ALL_METHODS.filter((method) =>
      items.every((item) => {
        const productMethods = item.product.allowedPaymentMethods;
        // Produk tanpa data (belum ada field) → dianggap support semua
        if (!productMethods || productMethods.length === 0) return true;
        return productMethods.includes(method);
      })
    );
  }, [items]);

  // Ongkir flat-rate dari server (0 = belum dihitung)
  const [shippingCost, setShippingCost] = useState<number | undefined>(0);
  const [user, setUser] = useState<any>(null);
  // Daftar rekening bank aktif dari server
  const [activeBankAccounts, setActiveBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string | undefined>(undefined);
  const [paymentProofPath, setPaymentProofPath] = useState<string | undefined>(undefined);
  
  // State tambahan Checkout
  const [destinationId, setDestinationId] = useState<string | undefined>(undefined);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShippingService, setSelectedShippingService] = useState<any | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [isShippingExpanded, setIsShippingExpanded] = useState(false);

  // Voucher State
  const [voucherCodeInput, setVoucherCodeInput] = useState<string>("");
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [voucherState, setVoucherState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null);

  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [hasCompleteProfile, setHasCompleteProfile] = useState(false);

  const supabase = createClient();

  // Fetch auth user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase]);

  // Penguncian scroll latar belakang & penanganan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCheckoutModalOpen) {
        closeCheckoutModal();
      }
    };

    if (isCheckoutModalOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCheckoutModalOpen, closeCheckoutModal]);

  // Fetch data saat modal dibuka
  useEffect(() => {
    if (!isCheckoutModalOpen) return;

    setShippingCost(0); // reset ke belum dihitung
    setSelectedBankAccountId(undefined); // reset pilihan rekening
    setPaymentProofPath(undefined); // reset payment proof
    setDestinationId(undefined);
    setIsCalculatingShipping(false);
    setShippingOptions([]);
    setSelectedShippingService(null);
    setShippingError(null);
    setIsShippingExpanded(false);

    // Reset Voucher
    setVoucherCodeInput("");
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setVoucherState("idle");
    setVoucherMessage(null);

    // Fetch daftar rekening bank aktif (selalu fetch saat modal dibuka)
    fetch("/api/bank-accounts")
      .then((res) => res.json())
      .then((data) => {
        setActiveBankAccounts(Array.isArray(data.accounts) ? data.accounts : []);
      })
      .catch(() => {
        setActiveBankAccounts([]);
      });

    // Fetch customer profile
    const fetchProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      
      const { data: profile } = await supabase
        .from("customers")
        .select("full_name, phone, address, village, district, city, province, postal_code, destination_id")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (profile) {
        setCustomerProfile(profile);
        const isComplete = Boolean(
          profile.full_name && 
          profile.phone && 
          profile.address && 
          profile.destination_id
        );
        setHasCompleteProfile(isComplete);
        
        // Auto-calculate shipping if profile is complete
        if (isComplete && profile.destination_id) {
          handleDestinationChange(profile.destination_id);
        }
      }
    };
    fetchProfile();
  }, [isCheckoutModalOpen]);

  // Handle cart changes (subtotal changed) to invalidate voucher
  const subtotal = getSubtotal();
  const prevSubtotalRef = useRef(subtotal);

  useEffect(() => {
    if (prevSubtotalRef.current !== subtotal) {
      if (appliedVoucher) {
        setAppliedVoucher(null);
        setVoucherCodeInput("");
        setDiscountAmount(0);
        setVoucherState("idle");
        setVoucherMessage("Subtotal berubah. Silakan pakai voucher kembali.");
      }
      prevSubtotalRef.current = subtotal;
    }
  }, [subtotal, appliedVoucher]);

  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<{
    orderNumber: string;
    waUrl: string;
    shippingCost: number;
    grandTotal: number;
    paymentMethod: string;
    bankAccount?: BankAccount;
  } | null>(null);

  // Reset success state when modal is closed
  useEffect(() => {
    if (!isCheckoutModalOpen) {
      setSuccessOrder(null);
    }
  }, [isCheckoutModalOpen]);

  const handleDestinationChange = async (id: string | undefined) => {
    setDestinationId(id);
    
    if (!id) {
      setShippingOptions([]);
      setSelectedShippingService(null);
      setShippingCost(0);
      setShippingError(null);
      return;
    }

    setIsCalculatingShipping(true);
    setShippingError(null);
    setShippingOptions([]);
    setSelectedShippingService(null);
    setShippingCost(undefined); // undefined untuk efek loading di summary
    
    const totalWeightGram = items.reduce((acc, item) => acc + (item.product.weight_gram || 1000) * item.quantity, 0);

    try {
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: 440, // Origin dari konfigurasi server (fallback aman ke 440 sesuai .env)
          destination: id,
          weight: totalWeightGram,
          courier: "jne"
        })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menghitung ongkos kirim.");
      }
      
      const services = Array.isArray(data.data) ? data.data : [];
      const jneServices = services.filter((s: any) => s.code === "jne" && typeof s.cost === "number" && s.cost > 0);
      
      if (jneServices.length === 0) {
        throw new Error("Tidak ada layanan JNE tersedia untuk rute ini.");
      }
      
      // Temukan yang termurah untuk default
      let cheapest = jneServices[0];
      for (const svc of jneServices) {
        if (svc.cost < cheapest.cost) cheapest = svc;
      }

      setShippingOptions(jneServices);
      setSelectedShippingService(cheapest);
      setShippingCost(cheapest.cost);
      setIsShippingExpanded(false);
    } catch (err: any) {
      console.warn("Shipping calculation failed:", err);
      setShippingError(err.message || "Gagal menghitung ongkos kirim.");
      
      // Muat flat rate dari API
      let fallbackCost = 0;
      try {
        const fbRes = await fetch("/api/shipping-cost");
        const fbData = await fbRes.json();
        fallbackCost = typeof fbData.shipping_cost === "number" ? fbData.shipping_cost : 0;
      } catch (e) {}
      
      setShippingCost(fallbackCost);
      setShippingOptions([]);
      setSelectedShippingService(null);
      setIsShippingExpanded(false);
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const handleApplyVoucher = async () => {
    const code = voucherCodeInput.trim();
    if (!code) {
      setVoucherState("error");
      setVoucherMessage("Kode voucher tidak boleh kosong");
      return;
    }

    setVoucherState("loading");
    setVoucherMessage(null);

    try {
      const res = await fetch("/api/checkout/voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherCode: code, subtotal }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setAppliedVoucher(null);
        setDiscountAmount(0);
        setVoucherState("error");
        setVoucherMessage(data.error || "Gagal menerapkan voucher");
      } else {
        setAppliedVoucher(data.code || code);
        setDiscountAmount(data.discountAmount);
        setVoucherState("success");
        setVoucherMessage(`Voucher ${data.code || code} berhasil diterapkan`);
      }
    } catch (error) {
      setAppliedVoucher(null);
      setDiscountAmount(0);
      setVoucherState("error");
      setVoucherMessage("Terjadi kesalahan jaringan");
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput("");
    setDiscountAmount(0);
    setVoucherState("idle");
    setVoucherMessage(null);
  };

  const handleFormSubmit = async (customerData: CheckoutCustomerData) => {
    await submitFinalCheckout(customerData);
  };

  const submitFinalCheckout = async (customerData: CheckoutCustomerData) => {
    setIsSubmitting(true);
    try {
      // Kirim bank_account_id jika TRANSFER_BANK
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerData,
          items,
          bank_account_id: customerData.paymentMethod === "TRANSFER_BANK" ? selectedBankAccountId : undefined,
          payment_proof_path: customerData.paymentMethod === "TRANSFER_BANK" ? paymentProofPath : undefined,
          voucherCode: appliedVoucher || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal menyimpan pesanan ke sistem.");
      }

      const data = await res.json();
      const orderNumber = data.orderNumber;
      const confirmedShippingCost: number = typeof data.shippingCost === "number" ? data.shippingCost : 0;
      const confirmedGrandTotal: number = typeof data.grandTotal === "number" ? data.grandTotal : getSubtotal();

      // Cari info rekening bank yang dipilih
      const chosenBank = activeBankAccounts.find((b) => b.id === selectedBankAccountId);

      clearCart();
      window.dispatchEvent(new Event("kr_order_updated"));
      setSuccessOrder({
        orderNumber,
        waUrl: "",
        shippingCost: confirmedShippingCost,
        grandTotal: confirmedGrandTotal,
        paymentMethod: customerData.paymentMethod || "COD",
        bankAccount: chosenBank,
      });
    } catch (error: any) {
      console.error("Checkout failed:", error);
      alert(error.message || "Terjadi kesalahan saat memproses pesanan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalItems = getTotalItems();
  const grandTotal = shippingCost !== undefined ? Math.max(0, subtotal - discountAmount) + shippingCost : undefined;

  return (
    <AnimatePresence>
      {isCheckoutModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto ${className}`}>
          {/* Backdrop Transparan Gelap */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCheckoutModal}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Dialog Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 my-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-[#FDFBF7] shadow-2xl border border-amber-900/10 max-h-[90vh] flex flex-col"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-amber-900/10 bg-gradient-to-r from-[#9D734E] via-[#896342] to-[#765335] px-5 py-4 sm:px-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-xs border border-white/10 shadow-xs">
                  <MessageCircle className="h-5 w-5 fill-white text-white stroke-none" />
                </div>
                <div>
                  <h2 className="font-heading text-lg sm:text-xl font-bold text-white tracking-tight">
                    Checkout Pesanan
                  </h2>
                  <p className="font-body text-xs text-amber-100/90 font-medium">
                    Lengkapi data pengiriman Anda
                  </p>
                </div>
              </div>

              {/* Tombol Tutup (X) */}
              <button
                type="button"
                aria-label="Tutup Modal Checkout"
                onClick={closeCheckoutModal}
                className="rounded-xl p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Modal (2-Column Responsive: Form & Summary) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#FDFBF7]">
              {successOrder ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h3 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    Pesanan Berhasil!
                  </h3>
                  <p className="font-body text-gray-600 mb-6 max-w-md">
                    Terima kasih, pesanan Anda telah masuk ke sistem kami. Nomor pesanan Anda adalah:
                  </p>
                  <div className="bg-white border-2 border-dashed border-amber-900/30 rounded-xl px-8 py-4 mb-5 shadow-sm">
                    <span className="font-mono text-2xl font-bold text-amber-900">{successOrder.orderNumber}</span>
                  </div>

                  {/* Ringkasan biaya */}
                  <div className="w-full max-w-md mb-4 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 text-left space-y-1.5">
                    <div className="flex justify-between font-body text-sm text-gray-600">
                      <span>Subtotal Produk</span>
                      <span className="font-semibold text-gray-900">
                        {formatRupiah(successOrder.grandTotal - successOrder.shippingCost)}
                      </span>
                    </div>
                    <div className="flex justify-between font-body text-sm text-gray-600">
                      <span>Ongkos Kirim</span>
                      <span className="font-semibold text-gray-900">
                        {successOrder.shippingCost === 0
                          ? <span className="text-gray-500 font-medium italic">Belum dihitung</span>
                          : formatRupiah(successOrder.shippingCost)
                        }
                      </span>
                    </div>
                    <div className="flex justify-between font-body text-sm font-bold pt-1.5 border-t border-amber-200">
                      <span className="text-gray-900">Total Pembayaran</span>
                      <span className="text-[#9D734E]">
                        {formatRupiah(successOrder.grandTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Instruksi Transfer Bank */}
                  {successOrder.paymentMethod === "TRANSFER_BANK" && successOrder.bankAccount && (
                    <div className="w-full max-w-md mb-4 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-left">
                      <p className="font-body text-xs font-bold text-blue-800 mb-2 uppercase tracking-wider">Transfer ke Rekening:</p>
                      <div className="space-y-1">
                        <p className="font-body text-sm font-bold text-gray-900">{successOrder.bankAccount.bank_name}</p>
                        <p className="font-body text-sm text-gray-700">{successOrder.bankAccount.account_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="font-mono text-base font-bold text-gray-900 tracking-widest">
                            {successOrder.bankAccount.account_number}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(successOrder.bankAccount!.account_number);
                              setCopiedId(successOrder.bankAccount!.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-blue-100 border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                            title="Salin nomor rekening"
                          >
                            {copiedId === successOrder.bankAccount.id
                              ? <><Check className="h-3.5 w-3.5" /> Disalin!</>
                              : <><Copy className="h-3.5 w-3.5" /> Salin</>
                            }
                          </button>
                        </div>
                      </div>
                      <p className="mt-3 text-[11px] text-blue-700 leading-relaxed">
                        ⚠ Harap transfer tepat sesuai jumlah di atas. Pembayaran akan diverifikasi oleh admin.
                      </p>
                    </div>
                  )}

                  {/* Transfer bank tapi tidak ada rekening spesifik (fallback) */}
                  {successOrder.paymentMethod === "TRANSFER_BANK" && !successOrder.bankAccount && (
                    <div className="w-full max-w-md mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="font-body text-xs text-amber-800 leading-relaxed">
                          Pesanan Anda tercatat. Silakan hubungi kami untuk mendapatkan informasi rekening transfer.
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      closeCheckoutModal();
                      window.location.href = "/profile/orders";
                    }}
                    className="w-full max-w-md flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-[#9D734E] px-6 py-3.5 font-body text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    Pantau Pesanan Saya
                  </button>

                  {/* Info pesan lanjutan */}
                  <div className="w-full max-w-md mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-left">
                    <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="font-body text-xs text-amber-800 leading-relaxed">
                      Pesanan Anda akan segera diproses. Anda bisa memantau status pesanan di halaman <span className="font-bold text-amber-900">Pesanan Saya</span>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Kolom Kiri: Form Data Pembeli (7 Cols on desktop) */}
                  <div className="lg:col-span-7">
                    <CheckoutForm
                      onSubmit={handleFormSubmit}
                      formRef={formRef}
                      isSubmitting={isSubmitting}
                      allowedPaymentMethods={allowedPaymentMethods}
                      activeBankAccounts={activeBankAccounts}
                      selectedBankAccountId={selectedBankAccountId}
                      onBankAccountChange={setSelectedBankAccountId}
                      onPaymentProofUploaded={setPaymentProofPath}
                      onDestinationChange={handleDestinationChange}
                      customerProfile={customerProfile}
                      hasCompleteProfile={hasCompleteProfile}
                      onProfileUpdated={(profile) => {
                        setCustomerProfile(profile);
                        setHasCompleteProfile(Boolean(profile.full_name && profile.phone && profile.address && profile.destination_id));
                      }}
                      shippingOptionsContent={
                        <div className="mt-4 pt-4 border-t border-amber-900/10">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-heading text-sm font-bold text-gray-900">
                              Layanan Pengiriman
                            </h3>
                            {shippingOptions.length > 0 && !isCalculatingShipping && destinationId && !shippingError && (
                              <button
                                type="button"
                                onClick={() => setIsShippingExpanded(!isShippingExpanded)}
                                className="hover:translate-x-1 transition-transform cursor-pointer"
                              >
                                <ChevronRight className="h-4 w-4 text-[#9D734E]" />
                              </button>
                            )}
                          </div>
                          {isCalculatingShipping ? (
                            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                              <div className="h-4 w-4 rounded-full border-2 border-amber-700 border-t-transparent animate-spin"></div>
                              Menghitung ongkos kirim...
                            </div>
                          ) : !destinationId ? (
                            <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                              Silakan pilih kecamatan/kelurahan tujuan terlebih dahulu.
                            </p>
                          ) : shippingError ? (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-left">
                              <p className="text-amber-900 font-bold text-sm mb-1">Peringatan Kalkulasi Ongkos Kirim</p>
                              <p className="text-amber-800 text-xs mb-3">{shippingError}</p>
                              <p className="text-amber-800 text-xs font-medium">Sistem menggunakan opsi flat-rate. Anda tetap dapat melanjutkan pesanan.</p>
                            </div>
                          ) : shippingOptions.length > 0 ? (
                            <div className="space-y-3">
                              {(isShippingExpanded ? shippingOptions : (selectedShippingService ? [selectedShippingService] : [])).map((service, idx) => {
                                const isSelected = selectedShippingService?.service === service.service;
                                return (
                                  <label 
                                    key={idx} 
                                    onClick={(e) => {
                                      if (!isShippingExpanded) {
                                        e.preventDefault();
                                        setIsShippingExpanded(true);
                                      }
                                    }}
                                    className={`flex items-start p-3.5 border rounded-xl cursor-pointer transition-all ${
                                    isSelected
                                      ? "border-[#9D734E] bg-amber-50/50 ring-1 ring-[#9D734E]"
                                      : "border-gray-200 hover:border-gray-300 bg-white"
                                  }`}>
                                    <div className="flex items-center h-5">
                                      <input 
                                        type="radio" 
                                        name="shippingService" 
                                        checked={isSelected} 
                                        onChange={() => {
                                          if (isShippingExpanded) {
                                            setSelectedShippingService(service);
                                            setShippingCost(service.cost);
                                            setIsShippingExpanded(false);
                                          }
                                        }} 
                                        className="h-4 w-4 text-[#9D734E] border-gray-300 focus:ring-[#9D734E]" 
                                      />
                                    </div>
                                    <div className="ml-3 flex flex-col flex-1">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="font-body text-sm font-bold text-gray-900">JNE {service.service}</span>
                                        <span className="font-body text-sm font-bold text-[#9D734E]">{formatRupiah(service.cost)}</span>
                                      </div>
                                      {(() => {
                                        const { text, hasDisclaimer } = getEstimatedArrivalText(service.etd);
                                        return (
                                          <div className="font-body text-[11px] text-gray-600 mt-0.5 space-y-1">
                                            <p>{text}</p>
                                            {hasDisclaimer && (
                                              <p className="text-[10px] text-gray-400">
                                                Estimasi dapat berubah sesuai proses pengiriman kurir.
                                              </p>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                              Tidak ada layanan pengiriman yang tersedia.
                            </p>
                          )}
                        </div>
                      }
                    />
                  </div>
  
                  {/* Kolom Kanan: Ringkasan Pesanan (5 Cols on desktop) */}
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <CheckoutSummary
                      items={items}
                      totalItems={totalItems}
                      subtotal={subtotal}
                      shippingCost={shippingCost}
                      grandTotal={grandTotal}
                      selectedShippingService={selectedShippingService}
                      voucherCodeInput={voucherCodeInput}
                      appliedVoucher={appliedVoucher}
                      discountAmount={discountAmount}
                      voucherState={voucherState}
                      voucherMessage={voucherMessage}
                      onVoucherCodeChange={setVoucherCodeInput}
                      onApplyVoucher={handleApplyVoucher}
                      onRemoveVoucher={handleRemoveVoucher}
                    />
                    
                    {/* Tombol Buat Pesanan */}
                    <button
                      type="button"
                      onClick={() => formRef.current?.requestSubmit()}
                      disabled={
                        isSubmitting || 
                        isCalculatingShipping || 
                        allowedPaymentMethods.length === 0 || 
                        !destinationId || 
                        (shippingOptions.length > 0 && !selectedShippingService)
                      }
                      className={`w-full flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 font-body text-sm font-semibold text-white shadow-md transition-all focus:outline-none cursor-pointer ${
                        isSubmitting || isCalculatingShipping || allowedPaymentMethods.length === 0 || !destinationId || (shippingOptions.length > 0 && !selectedShippingService)
                          ? "bg-gray-400 cursor-not-allowed shadow-none"
                          : "bg-gradient-to-r from-amber-600 to-[#9D734E] hover:from-amber-700 hover:to-[#896342] hover:shadow-lg active:scale-98"
                      }`}
                    >
                      <CheckCircle2 className="h-5 w-5 stroke-white" />
                      <span>{isSubmitting ? "Memproses..." : isCalculatingShipping ? "Menghitung Ongkir..." : "Buat Pesanan"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CheckoutModal;
