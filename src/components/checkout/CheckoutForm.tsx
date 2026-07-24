"use client";

import React, { useState } from "react";
import { User, Phone, MapPin, FileText, MessageCircle } from "lucide-react";
import { CheckoutCustomerData } from "@/src/lib/whatsapp";

export interface CheckoutFormProps {
  /** Callback yang dipanggil saat form checkout berhasil divalidasi dan dikirim */
  onSubmit: (data: CheckoutCustomerData) => void;
  /** Status apakah tombol submit sedang dalam proses pengiriman */
  isSubmitting?: boolean;
  /** Kelas CSS tambahan */
  className?: string;
}

export interface FormErrors {
  nama?: string;
  phone?: string;
  alamat?: string;
}

/**
 * Komponen `CheckoutForm` merender formulir input data pemesan (Nama, No. HP, Alamat, Catatan)
 * dengan validasi field wajib sebelum dikirim ke WhatsApp.
 */
export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  onSubmit,
  isSubmitting = false,
  className = "",
}) => {
  const [formData, setFormData] = useState<CheckoutCustomerData>({
    nama: "",
    phone: "",
    alamat: "",
    catatan: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

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

  const validateForm = (): boolean => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {/* Field 1: Nama Lengkap (Wajib) */}
      <div>
        <label htmlFor="nama" className="block font-body text-xs font-semibold text-text-primary mb-1">
          Nama Lengkap <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
            <User className="h-4 w-4" />
          </div>
          <input
            type="text"
            id="nama"
            name="nama"
            value={formData.nama}
            onChange={handleChange}
            placeholder="Masukkan nama lengkap Anda"
            className={`w-full rounded-xl border pl-9 pr-3 py-2.5 font-body text-xs sm:text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none transition-colors ${
              errors.nama
                ? "border-red-500 bg-red-50/20 focus:border-red-500"
                : "border-primary/20 bg-white focus:border-primary"
            }`}
          />
        </div>
        {errors.nama && (
          <p className="mt-1 font-body text-[11px] font-medium text-red-500">
            {errors.nama}
          </p>
        )}
      </div>

      {/* Field 2: No. HP / WhatsApp (Wajib) */}
      <div>
        <label htmlFor="phone" className="block font-body text-xs font-semibold text-text-primary mb-1">
          No. HP / WhatsApp <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
            <Phone className="h-4 w-4" />
          </div>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Contoh: 081234567890"
            className={`w-full rounded-xl border pl-9 pr-3 py-2.5 font-body text-xs sm:text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none transition-colors ${
              errors.phone
                ? "border-red-500 bg-red-50/20 focus:border-red-500"
                : "border-primary/20 bg-white focus:border-primary"
            }`}
          />
        </div>
        {errors.phone && (
          <p className="mt-1 font-body text-[11px] font-medium text-red-500">
            {errors.phone}
          </p>
        )}
      </div>

      {/* Field 3: Alamat Lengkap (Wajib) */}
      <div>
        <label htmlFor="alamat" className="block font-body text-xs font-semibold text-text-primary mb-1">
          Alamat Lengkap Pengiriman <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute top-3 left-0 flex items-start pl-3 pointer-events-none text-text-secondary">
            <MapPin className="h-4 w-4" />
          </div>
          <textarea
            id="alamat"
            name="alamat"
            rows={3}
            value={formData.alamat}
            onChange={handleChange}
            placeholder="Jalan, No. Rumah, RT/RW, Kecamatan, Kota, Provinsi"
            className={`w-full rounded-xl border pl-9 pr-3 py-2.5 font-body text-xs sm:text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none transition-colors resize-none ${
              errors.alamat
                ? "border-red-500 bg-red-50/20 focus:border-red-500"
                : "border-primary/20 bg-white focus:border-primary"
            }`}
          />
        </div>
        {errors.alamat && (
          <p className="mt-1 font-body text-[11px] font-medium text-red-500">
            {errors.alamat}
          </p>
        )}
      </div>

      {/* Field 4: Catatan Pesanan (Opsional) */}
      <div>
        <label htmlFor="catatan" className="block font-body text-xs font-semibold text-text-primary mb-1">
          Catatan Pesanan <span className="text-text-secondary font-normal">(Opsional)</span>
        </label>
        <div className="relative">
          <div className="absolute top-3 left-0 flex items-start pl-3 pointer-events-none text-text-secondary">
            <FileText className="h-4 w-4" />
          </div>
          <textarea
            id="catatan"
            name="catatan"
            rows={2}
            value={formData.catatan}
            onChange={handleChange}
            placeholder="Catatan tambahan misal: ucapan kado, warna khusus, dsb."
            className="w-full rounded-xl border border-primary/20 bg-white pl-9 pr-3 py-2.5 font-body text-xs sm:text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      {/* Tombol Kirim ke WhatsApp */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-whatsapp px-6 py-3.5 font-body text-sm font-semibold text-white shadow-md shadow-whatsapp/20 transition-all hover:bg-whatsapp/90 hover:shadow-lg active:scale-98 focus:outline-none cursor-pointer mt-4"
      >
        <MessageCircle className="h-5 w-5 fill-white stroke-none" />
        <span>Kirim ke WhatsApp</span>
      </button>
    </form>
  );
};

export default CheckoutForm;
