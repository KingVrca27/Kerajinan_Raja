"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { User, Phone, MapPin, FileText, Globe, Building2, Hash, CreditCard, Copy, Check, Search, X, Loader2, ChevronRight } from "lucide-react";
import { CheckoutCustomerData } from "@/src/lib/whatsapp";
import type { BankAccount } from "@/src/lib/bankAccountRepository";
import { createClient } from "@/src/lib/supabaseBrowser";

export interface CheckoutFormProps {
  /** Callback yang dipanggil saat form checkout berhasil divalidasi dan dikirim */
  onSubmit: (data: CheckoutCustomerData) => void;
  /** Status apakah tombol submit sedang dalam proses pengiriman */
  isSubmitting?: boolean;
  /** Kelas CSS tambahan */
  className?: string;
  /** Ref eksternal untuk men-trigger submit dari luar komponen */
  formRef?: React.RefObject<HTMLFormElement | null>;
  /**
   * Metode pembayaran yang diizinkan berdasarkan produk di cart (intersection).
   * Dihitung oleh CheckoutModal dari allowed_payment_methods setiap produk.
   * Hanya metode yang ada di sini yang akan ditampilkan sebagai opsi.
   * Default: keduanya tersedia.
   */
  allowedPaymentMethods?: string[];
  /** Daftar rekening bank aktif dari server, ditampilkan saat TRANSFER_BANK dipilih. */
  activeBankAccounts?: BankAccount[];
  /** ID rekening bank yang sedang dipilih customer */
  selectedBankAccountId?: string;
  /** Callback saat customer memilih rekening bank */
  onBankAccountChange?: (id: string | undefined) => void;
  /** Callback saat bukti pembayaran berhasil diupload */
  onPaymentProofUploaded?: (path: string | undefined) => void;
  /** Callback saat destinasi (kecamatan/kelurahan) dipilih atau diubah */
  onDestinationChange?: (destinationId: string | undefined) => void;
  /** Konten untuk opsi layanan pengiriman (disuntikkan dari modal) */
  shippingOptionsContent?: React.ReactNode;
  /** Profil customer (jika ada) */
  customerProfile?: any;
  /** Callback untuk memperbarui profile di modal setelah disave lokal */
  onProfileUpdated?: (profile: any) => void;
  /** Apakah profil customer memiliki data pengiriman lengkap? */
  hasCompleteProfile?: boolean;
}


export interface FormErrors {
  nama?: string;
  phone?: string;
  alamat?: string;
  provinsi?: string;
  kota?: string;
  kodePos?: string;
  paymentMethod?: string;
  paymentProof?: string;
}

/** Tipe satu entri hasil pencarian dari /api/shipping/destination */
interface DestinationResult {
  id: string;
  label: string;
  province_name: string;
  city_name: string;
  district_name: string;
  subdistrict_name: string;
  zip_code: string;
}

/**
 * Komponen `CheckoutForm` merender formulir input data pemesan
 * (Nama, No. HP, Alamat, Pencarian Destination, Provinsi, Kota, Kode Pos, Catatan)
 * dengan validasi field wajib sebelum dikirim ke API checkout.
 *
 * Destination search menggunakan endpoint internal /api/shipping/destination
 * agar API key RajaOngkir tidak pernah terekspos ke browser.
 */
export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  onSubmit,
  isSubmitting = false,
  className = "",
  formRef,
  allowedPaymentMethods = ["COD", "TRANSFER_BANK"],
  activeBankAccounts = [],
  selectedBankAccountId,
  onBankAccountChange,
  onPaymentProofUploaded,
  onDestinationChange,
  shippingOptionsContent,
  customerProfile,
  onProfileUpdated,
  hasCompleteProfile = false,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // ─── Mode View / Edit Alamat ───────────────────────────────────────────────
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  
  const supabase = createClient();

  // ─── Destination Search State ──────────────────────────────────────────────
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationResults, setDestinationResults] = useState<DestinationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [destinationId, setDestinationId] = useState<string>("");
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Form Data ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<CheckoutCustomerData>({
    nama: customerProfile?.full_name || "",
    phone: customerProfile?.phone || "",
    alamat: customerProfile?.address || "",
    provinsi: customerProfile?.province || "",
    kota: customerProfile?.city || "",
    kodePos: customerProfile?.postal_code || "",
    village: customerProfile?.village || undefined,
    district: customerProfile?.district || undefined,
    catatan: "",
    paymentMethod: undefined,
    destinationId: customerProfile?.destination_id || undefined,
  });

  useEffect(() => {
    if (customerProfile) {
      setFormData((prev) => ({
        ...prev,
        nama: customerProfile.full_name || prev.nama,
        phone: customerProfile.phone || prev.phone,
        alamat: customerProfile.address || prev.alamat,
        provinsi: customerProfile.province || prev.provinsi,
        kota: customerProfile.city || prev.kota,
        kodePos: customerProfile.postal_code || prev.kodePos,
        village: customerProfile.village || prev.village,
        district: customerProfile.district || prev.district,
        destinationId: customerProfile.destination_id || prev.destinationId,
      }));
    }
  }, [customerProfile]);

  // Call onDestinationChange on mount if we have a complete profile
  useEffect(() => {
    if (hasCompleteProfile && customerProfile?.destination_id) {
      onDestinationChange?.(customerProfile.destination_id);
    }
  }, [hasCompleteProfile, customerProfile?.destination_id]);

  const [errors, setErrors] = useState<FormErrors>({});

  // ─── Tutup dropdown saat klik di luar ──────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Debounced destination search ─────────────────────────────────────────
  const searchDestination = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setDestinationResults([]);
      setShowDropdown(false);
      setSearchError("");
      return;
    }

    setIsSearching(true);
    setSearchError("");

    try {
      const res = await fetch(
        `/api/shipping/destination?search=${encodeURIComponent(query.trim())}`
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        setSearchError(json.message || "Gagal mencari lokasi");
        setDestinationResults([]);
        setShowDropdown(false);
        return;
      }

      const results: DestinationResult[] = Array.isArray(json.data) ? json.data : [];
      setDestinationResults(results);
      setShowDropdown(results.length > 0);
      if (results.length === 0) {
        setSearchError("Lokasi tidak ditemukan. Coba kata kunci lain.");
      }
    } catch {
      setSearchError("Terjadi kesalahan jaringan. Coba lagi.");
      setDestinationResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleDestinationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDestinationQuery(val);

    // Reset pilihan sebelumnya jika user mengubah query
    if (destinationId) {
      setDestinationId("");
      setSelectedLabel("");
      setFormData((prev) => ({
        ...prev,
        provinsi: "",
        kota: "",
        district: undefined,
        village: undefined,
        kodePos: "",
        destinationId: undefined,
      }));
      onDestinationChange?.(undefined);
    }

    setSearchError("");

    // Debounce 400ms
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      searchDestination(val);
    }, 400);
  };

  const handleDestinationSelect = (item: DestinationResult) => {
    setDestinationId(item.id);
    setSelectedLabel(item.label);
    setDestinationQuery(item.label);
    setShowDropdown(false);
    setDestinationResults([]);
    setSearchError("");

    // Auto-fill provinsi, kota, kodePos
    setFormData((prev) => ({
      ...prev,
      provinsi: item.province_name,
      kota: item.city_name,
      district: item.district_name,
      village: item.subdistrict_name,
      kodePos: item.zip_code,
      destinationId: item.id,
    }));
    onDestinationChange?.(item.id);

    // Hapus error terkait field yang terisi otomatis
    setErrors((prev) => ({
      ...prev,
      provinsi: undefined,
      kota: undefined,
      kodePos: undefined,
    }));
  };

  const handleClearDestination = () => {
    setDestinationId("");
    setSelectedLabel("");
    setDestinationQuery("");
    setDestinationResults([]);
    setShowDropdown(false);
    setSearchError("");
    setFormData((prev) => ({
      ...prev,
      provinsi: "",
      kota: "",
      district: undefined,
      village: undefined,
      kodePos: "",
      destinationId: undefined,
    }));
    onDestinationChange?.(undefined);
  };

  // ─── Generic field change ──────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Hapus pesan error jika pengguna mulai mengetik
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // ─── Validation ───────────────────────────────────────────────────────────
  const validateAddressForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nama.trim()) {
      newErrors.nama = "Nama lengkap wajib diisi";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Nomor WhatsApp / HP wajib diisi";
    } else if (formData.phone.trim().length < 9) {
      newErrors.phone = "Nomor HP minimal 9 digit";
    }

    if (!formData.alamat.trim()) {
      newErrors.alamat = "Alamat lengkap pengiriman wajib diisi";
    }

    if (!formData.provinsi.trim()) {
      newErrors.provinsi = "Provinsi tujuan pengiriman wajib diisi";
    }

    if (!formData.kota.trim()) {
      newErrors.kota = "Kota / Kabupaten tujuan pengiriman wajib diisi";
    }

    if (!formData.kodePos.trim()) {
      newErrors.kodePos = "Kode Pos wajib diisi";
    } else if (!/^\d{5}$/.test(formData.kodePos.trim())) {
      newErrors.kodePos = "Kode Pos harus 5 angka";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Pastikan user tidak sedang edit. Jika edit belum disave, tidak bisa submit checkout.
    if (isEditMode) {
       alert("Harap simpan alamat pengiriman Anda terlebih dahulu sebelum membuat pesanan.");
       return false;
    }
    
    // Address validasi minimal
    if (!formData.nama.trim() || !formData.destinationId) {
       alert("Data pengiriman belum lengkap.");
       return false;
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = "Pilih metode pembayaran";
    }

    if (formData.paymentMethod === "TRANSFER_BANK" && !uploadSuccess) {
      newErrors.paymentProof = "Bukti pembayaran wajib diunggah";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({ ...formData });
    }
  };

  const handleSaveAddress = async () => {
    if (!validateAddressForm()) return;
    
    setIsSavingAddress(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi tidak valid");

      const updatePayload = {
        full_name: formData.nama,
        phone: formData.phone,
        address: formData.alamat,
        province: formData.provinsi,
        city: formData.kota,
        district: formData.district,
        village: formData.village,
        postal_code: formData.kodePos,
        destination_id: formData.destinationId
      };

      const { error } = await supabase.from('customers').update(updatePayload).eq('user_id', user.id);
      if (error) throw error;
      
      // Update the local customerProfile reference object so cancel works correctly
      if (customerProfile) {
         Object.assign(customerProfile, updatePayload);
      }
      
      onProfileUpdated?.(customerProfile || updatePayload);
      onDestinationChange?.(formData.destinationId);
      setIsEditMode(false);
      alert("Alamat berhasil diperbarui. Ongkir telah dihitung ulang.");
    } catch (err: any) {
      alert("Gagal menyimpan alamat: " + err.message);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleCancelEdit = () => {
    if (customerProfile?.destination_id) {
       setFormData((prev) => ({
         ...prev,
         nama: customerProfile.full_name || "",
         phone: customerProfile.phone || "",
         alamat: customerProfile.address || "",
         provinsi: customerProfile.province || "",
         kota: customerProfile.city || "",
         kodePos: customerProfile.postal_code || "",
         village: customerProfile.village || undefined,
         district: customerProfile.district || undefined,
         destinationId: customerProfile.destination_id || undefined,
       }));
       onDestinationChange?.(customerProfile.destination_id);
    }
    setIsEditMode(false);
  };

  // ─── File Upload ──────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, paymentProof: "Ukuran file maksimal 5 MB" }));
      return;
    }

    // Validasi MIME type
    const allowedMime = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedMime.includes(file.type)) {
      setErrors((prev) => ({ ...prev, paymentProof: "Format file tidak didukung (gunakan JPG, PNG, WEBP, atau PDF)" }));
      return;
    }

    // Validasi Magic Bytes (File Signature) untuk mencegah MIME spoofing
    const validateMagicBytes = async (fileToCheck: File): Promise<boolean> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = (event) => {
          if (!event.target || !event.target.result) {
            resolve(false);
            return;
          }
          const arr = new Uint8Array(event.target.result as ArrayBuffer).subarray(0, 4);
          const header = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
          
          let isValid = false;
          if (header.startsWith("FFD8FF")) isValid = true; // JPEG
          else if (header === "89504E47") isValid = true; // PNG
          else if (header === "52494646") isValid = true; // WEBP (RIFF)
          else if (header === "25504446") isValid = true; // PDF
          
          resolve(isValid);
        };
        reader.onerror = () => resolve(false);
        reader.readAsArrayBuffer(fileToCheck.slice(0, 4));
      });
    };

    const isMagicValid = await validateMagicBytes(file);
    if (!isMagicValid) {
      setErrors((prev) => ({ ...prev, paymentProof: "Isi file tidak valid atau termanipulasi. Pastikan file adalah gambar atau PDF asli." }));
      return;
    }

    setIsUploading(true);
    setErrors((prev) => ({ ...prev, paymentProof: undefined }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Sesi tidak ditemukan. Silakan login kembali.");
      }

      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `${user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("payment_proofs")
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      setUploadSuccess(true);
      onPaymentProofUploaded?.(data.path);
    } catch (error: unknown) {
      console.error("Upload failed:", error);
      const msg = error instanceof Error ? error.message : "Gagal mengunggah bukti pembayaran";
      setErrors((prev) => ({ ...prev, paymentProof: msg }));
      setUploadSuccess(false);
      onPaymentProofUploaded?.(undefined);
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Style helpers ─────────────────────────────────────────────────────────
  const inputClass = (field: keyof FormErrors) =>
    `w-full rounded-xl border pl-9 pr-3 py-2.5 font-body text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all shadow-2xs ${
      errors[field]
        ? "border-rose-500 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
        : "border-amber-900/15 bg-white focus:border-[#9D734E] focus:ring-1 focus:ring-[#9D734E]"
    }`;

  const iconClass = "absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#9D734E]";
  const iconTopClass = "absolute top-3 left-0 flex items-start pl-3 pointer-events-none text-[#9D734E]";
  const labelClass = "block font-body text-xs font-bold text-gray-900 mb-1";
  const errorClass = "mt-1 font-body text-[11px] font-medium text-rose-600";

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <form ref={formRef} onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {/* ── ALAMAT PENGIRIMAN ── */}
      <div className="bg-white border border-[#9D734E]/20 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
        {!isEditMode ? (
          <div className="relative z-10">
            <button 
              type="button"
              onClick={() => setIsEditMode(true)}
              className="w-full text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#9D734E]" />
                  <span className="font-heading text-sm font-bold text-gray-900">Alamat Pengiriman</span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#9D734E] group-hover:translate-x-1 transition-transform" />
              </div>
              
              {formData.destinationId ? (
                <div className="space-y-1 mb-4">
                  <p className="font-body text-sm font-bold text-gray-900">{formData.nama}</p>
                  <p className="font-body text-xs text-gray-600 font-medium">{formData.phone}</p>
                  <p className="font-body text-xs text-gray-500 mt-2 leading-relaxed">{formData.alamat}</p>
                  <p className="font-body text-xs text-gray-500">{formData.village}, {formData.district}</p>
                  <p className="font-body text-xs text-gray-500">{formData.kota}, {formData.provinsi} {formData.kodePos}</p>
                </div>
              ) : (
                <div className="mb-4">
                  <p className="font-body text-sm text-gray-500 italic">Anda belum memiliki alamat pengiriman</p>
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className="w-full rounded-xl border border-[#9D734E] py-2 text-xs font-semibold text-[#9D734E] hover:bg-[#9D734E]/10 transition-colors"
            >
              {formData.destinationId ? "Ubah Alamat" : "+ Tambah Alamat"}
            </button>
          </div>
        ) : (
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#9D734E]" />
                <span className="font-heading text-sm font-bold text-gray-900">Edit Alamat Pengiriman</span>
              </div>
            </div>
      {/* Field 1: Nama Lengkap (Wajib) */}
      <div>
        <label htmlFor="nama" className={labelClass}>
          Nama Lengkap <span className="text-rose-600">*</span>
        </label>
        <div className="relative">
          <div className={iconClass}>
            <User className="h-4 w-4" />
          </div>
          <input
            type="text"
            id="nama"
            name="nama"
            value={formData.nama}
            onChange={handleChange}
            placeholder="Masukkan nama lengkap Anda"
            className={inputClass("nama")}
          />
        </div>
        {errors.nama && <p className={errorClass}>{errors.nama}</p>}
      </div>

      {/* Field 2: No. HP / WhatsApp (Wajib) */}
      <div>
        <label htmlFor="phone" className={labelClass}>
          No. HP / WhatsApp <span className="text-rose-600">*</span>
        </label>
        <div className="relative">
          <div className={iconClass}>
            <Phone className="h-4 w-4" />
          </div>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Contoh: 081234567890"
            className={inputClass("phone")}
          />
        </div>
        {errors.phone && <p className={errorClass}>{errors.phone}</p>}
      </div>

      {/* Field 3: Alamat Lengkap (Wajib) */}
      <div>
        <label htmlFor="alamat" className={labelClass}>
          Alamat Lengkap <span className="text-rose-600">*</span>
        </label>
        <div className="relative">
          <div className={iconTopClass}>
            <MapPin className="h-4 w-4" />
          </div>
          <textarea
            id="alamat"
            name="alamat"
            rows={3}
            value={formData.alamat}
            onChange={handleChange}
            placeholder="Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan"
            className={`w-full rounded-xl border pl-9 pr-3 py-2.5 font-body text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all resize-none shadow-2xs ${
              errors.alamat
                ? "border-rose-500 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                : "border-amber-900/15 bg-white focus:border-[#9D734E] focus:ring-1 focus:ring-[#9D734E]"
            }`}
          />
        </div>
        {errors.alamat && <p className={errorClass}>{errors.alamat}</p>}
      </div>

      {/* ── Destination Search (RajaOngkir via internal API) ─────────────── */}
      <div>
        <label htmlFor="destination-search" className={labelClass}>
          Cari Kecamatan / Kelurahan Tujuan{" "}
          <span className="text-rose-600">*</span>
        </label>
        <div className="relative" ref={dropdownRef}>
          {/* Input pencarian */}
          <div className="relative">
            <div className={iconClass}>
              <Search className="h-4 w-4" />
            </div>
            <input
              id="destination-search"
              type="text"
              value={destinationQuery}
              onChange={handleDestinationInputChange}
              onFocus={() => {
                if (destinationResults.length > 0) setShowDropdown(true);
              }}
              placeholder="Ketik nama kecamatan / kelurahan…"
              autoComplete="off"
              className={`w-full rounded-xl border pl-9 py-2.5 font-body text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all shadow-2xs ${
                destinationId
                  ? "pr-9 border-emerald-500 bg-emerald-50/20 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  : (errors.provinsi || errors.kota || errors.kodePos)
                  ? "pr-9 border-rose-500 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  : "pr-9 border-amber-900/15 bg-white focus:border-[#9D734E] focus:ring-1 focus:ring-[#9D734E]"
              }`}
            />
            {/* Tombol clear atau loader */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#9D734E]" />
              ) : destinationId ? (
                <button
                  type="button"
                  onClick={handleClearDestination}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title="Hapus pilihan"
                  aria-label="Hapus pilihan destination"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Konfirmasi pilihan aktif */}
          {destinationId && selectedLabel && (
            <p className="mt-1 font-body text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <Check className="h-3 w-3 flex-shrink-0" />
              <span>Dipilih: {selectedLabel}</span>
            </p>
          )}

          {/* Error pencarian */}
          {!destinationId && searchError && (
            <p className="mt-1 font-body text-[11px] font-medium text-amber-600">
              {searchError}
            </p>
          )}

          {/* Dropdown hasil pencarian */}
          {showDropdown && destinationResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-xl border border-amber-900/15 bg-white shadow-lg overflow-hidden">
              <ul className="max-h-56 overflow-y-auto divide-y divide-amber-900/5">
                {destinationResults.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleDestinationSelect(item)}
                      className="w-full text-left px-4 py-2.5 hover:bg-amber-50 transition-colors cursor-pointer"
                    >
                      <p className="font-body text-xs font-semibold text-gray-900 leading-snug">
                        {item.subdistrict_name && item.subdistrict_name !== item.district_name
                          ? `${item.subdistrict_name}, `
                          : ""}
                        {item.district_name}
                      </p>
                      <p className="font-body text-[11px] text-gray-500 mt-0.5">
                        {item.city_name} · {item.province_name} · {item.zip_code}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Hint saat belum memilih */}
        {!destinationId && !destinationQuery && (
          <p className="mt-1 font-body text-[10px] text-gray-400">
            Ketik minimal 2 karakter untuk mencari kecamatan / kelurahan tujuan. Provinsi, Kota, dan Kode Pos akan terisi otomatis.
          </p>
        )}
      </div>

          {/* Field 4 + 5: Provinsi & Kota (2 kolom) — read-only jika destinationId terisi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Provinsi */}
            <div>
              <label htmlFor="provinsi" className={labelClass}>
                Provinsi <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className={iconClass}>
                  <Globe className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  id="provinsi"
                  name="provinsi"
                  value={formData.provinsi}
                  onChange={handleChange}
                  placeholder="Contoh: Nusa Tenggara Barat"
                  readOnly={!!destinationId}
                  className={`${inputClass("provinsi")} ${destinationId ? "bg-gray-50 cursor-default" : ""}`}
                />
              </div>
              {errors.provinsi && <p className={errorClass}>{errors.provinsi}</p>}
            </div>

            {/* Kota / Kabupaten */}
            <div>
              <label htmlFor="kota" className={labelClass}>
                Kota / Kabupaten <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className={iconClass}>
                  <Building2 className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  id="kota"
                  name="kota"
                  value={formData.kota}
                  onChange={handleChange}
                  placeholder="Contoh: Lombok Timur"
                  readOnly={!!destinationId}
                  className={`${inputClass("kota")} ${destinationId ? "bg-gray-50 cursor-default" : ""}`}
                />
              </div>
              {errors.kota && <p className={errorClass}>{errors.kota}</p>}
            </div>
          </div>

          {/* Field 6: Kode Pos (Wajib) — read-only jika destinationId terisi */}
          <div>
            <label htmlFor="kodePos" className={labelClass}>
              Kode Pos <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <div className={iconClass}>
                <Hash className="h-4 w-4" />
              </div>
              <input
                type="text"
                id="kodePos"
                name="kodePos"
                value={formData.kodePos}
                onChange={handleChange}
                placeholder="Contoh: 83611"
                maxLength={5}
                readOnly={!!destinationId}
                className={`${inputClass("kodePos")} ${destinationId ? "bg-gray-50 cursor-default" : ""}`}
              />
            </div>
            {errors.kodePos && <p className={errorClass}>{errors.kodePos}</p>}
          </div>
          
          {/* Action Buttons for Edit Mode */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveAddress}
              disabled={isSavingAddress}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-xs font-semibold text-white shadow-sm hover:shadow-md transition-all disabled:opacity-60 flex items-center justify-center"
            >
              {isSavingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Alamat"}
            </button>
          </div>
          </div>
        )}
      </div>



      {/* Disuntikkan dari CheckoutModal: Pilihan Layanan Pengiriman */}
      {shippingOptionsContent}

      {/* Field 8: Metode Pembayaran (Wajib) */}
      <div>
        <label className={labelClass}>
          Metode Pembayaran <span className="text-rose-600">*</span>
        </label>

        {/* Peringatan jika tidak ada metode yang kompatibel */}
        {allowedPaymentMethods.length === 0 ? (
          <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 leading-relaxed">
            <strong>⚠ Produk dalam keranjang memiliki metode pembayaran yang berbeda.</strong> Silakan pisahkan pesanan atau sesuaikan produk agar bisa checkout.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {/* Opsi COD — hanya tampil jika ada di intersection */}
            {allowedPaymentMethods.includes("COD") && (
              <label
                className={`flex items-start p-3 border rounded-xl cursor-pointer transition-all ${
                  formData.paymentMethod === "COD"
                    ? "border-[#9D734E] bg-amber-50/50 ring-1 ring-[#9D734E]"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={formData.paymentMethod === "COD"}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#9D734E] border-gray-300 focus:ring-[#9D734E]"
                  />
                </div>
                <div className="ml-3 flex flex-col">
                  <span className="font-body text-sm font-semibold text-gray-900">COD (Cash on Delivery)</span>
                  <span className="font-body text-xs text-gray-500 mt-0.5">Bayar saat pesanan tiba di tempat Anda.</span>
                </div>
              </label>
            )}

            {/* Opsi Transfer Bank — hanya tampil jika ada di intersection */}
            {allowedPaymentMethods.includes("TRANSFER_BANK") && (
              <label
                className={`flex items-start p-3 border rounded-xl cursor-pointer transition-all ${
                  formData.paymentMethod === "TRANSFER_BANK"
                    ? "border-[#9D734E] bg-amber-50/50 ring-1 ring-[#9D734E]"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="TRANSFER_BANK"
                    checked={formData.paymentMethod === "TRANSFER_BANK"}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#9D734E] border-gray-300 focus:ring-[#9D734E]"
                  />
                </div>
                <div className="ml-3 flex flex-col">
                  <span className="font-body text-sm font-semibold text-gray-900">Transfer Bank</span>
                  <span className="font-body text-xs text-gray-500 mt-0.5">Transfer langsung ke rekening resmi toko.</span>
                </div>
              </label>
            )}
          </div>
        )}
        {errors.paymentMethod && <p className={errorClass}>{errors.paymentMethod}</p>}

        {/* Pilihan Rekening Bank — tampil saat TRANSFER_BANK dipilih */}
        {formData.paymentMethod === "TRANSFER_BANK" && allowedPaymentMethods.includes("TRANSFER_BANK") && (
          <div className="mt-3 space-y-2">
            <p className="font-body text-xs font-bold text-gray-700">
              Pilih Rekening Tujuan Transfer
            </p>
            {activeBankAccounts.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="font-body text-xs text-amber-800">
                  ⚠ Saat ini tidak ada rekening bank yang tersedia. Silakan hubungi kami untuk informasi transfer.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeBankAccounts.map((bank) => {
                  const isSelected = selectedBankAccountId === bank.id;
                  return (
                    <div
                      key={bank.id}
                      onClick={() => onBankAccountChange?.(bank.id)}
                      className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#9D734E] bg-amber-50/60 ring-1 ring-[#9D734E]"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black flex-shrink-0 ${isSelected ? "bg-[#9D734E] text-white" : "bg-gray-100 text-gray-600"}`}>
                          {bank.bank_name.slice(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-body text-sm font-bold text-gray-900">{bank.bank_name}</p>
                          <p className="font-body text-xs text-gray-500">{bank.account_name}</p>
                          <p className="font-mono text-sm font-semibold text-gray-900 tracking-wider mt-0.5">{bank.account_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(bank.account_number);
                            setCopiedId(bank.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="flex items-center gap-1 rounded-lg bg-gray-100 border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                          title="Salin nomor rekening"
                        >
                          {copiedId === bank.id
                            ? <><Check className="h-3.5 w-3.5 text-emerald-600" /><span className="text-emerald-600">Disalin!</span></>
                            : <><Copy className="h-3.5 w-3.5" />Salin</>
                          }
                        </button>
                        <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${isSelected ? "border-[#9D734E] bg-[#9D734E]" : "border-gray-300"}`}>
                          {isSelected && <div className="h-full w-full rounded-full flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-white" /></div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Upload Bukti Pembayaran */}
            <div className="mt-4 pt-3 border-t border-amber-900/10">
              <p className="font-body text-xs font-bold text-gray-700 mb-2">
                Upload Bukti Pembayaran <span className="text-rose-600">*</span>
              </p>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading || isSubmitting}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-xl file:border-0
                    file:text-xs file:font-semibold
                    file:bg-amber-50 file:text-amber-700
                    hover:file:bg-amber-100 cursor-pointer border border-gray-200 rounded-xl"
                />
                {isUploading && <p className="text-xs text-amber-600 font-medium animate-pulse">Mengunggah...</p>}
                {uploadSuccess && <p className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3 h-3"/> Berhasil diunggah</p>}
                {errors.paymentProof && <p className={errorClass}>{errors.paymentProof}</p>}
                <p className="font-body text-[10px] text-gray-400">
                  Maksimal 5 MB. Format: JPG, PNG, WEBP, PDF.
                </p>
              </div>
            </div>

            <p className="font-body text-[11px] text-gray-500 leading-relaxed mt-2">
              Pembayaran akan diverifikasi oleh admin setelah Anda melakukan transfer.
            </p>
          </div>
        )}
      </div>
    </form>
  );
};

export default CheckoutForm;
