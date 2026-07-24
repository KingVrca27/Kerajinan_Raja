"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, ShoppingBag } from "lucide-react";
import { useCart } from "@/src/hooks/useCart";
import { buildCheckoutMessage, generateWhatsAppURL, CheckoutCustomerData } from "@/src/lib/whatsapp";
import CheckoutForm from "@/src/components/checkout/CheckoutForm";
import CheckoutSummary from "@/src/components/checkout/CheckoutSummary";

export interface CheckoutModalProps {
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `CheckoutModal` merender modal dialog interaktif untuk mengumpulkan
 * data pemesan dan menampilkan ringkasan belanja sebelum membuka WhatsApp resmi.
 */
export const CheckoutModal: React.FC<CheckoutModalProps> = ({ className = "" }) => {
  const {
    items,
    isCheckoutModalOpen,
    closeCheckoutModal,
    getTotalItems,
    getSubtotal,
  } = useCart();

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

  const handleFormSubmit = (customerData: CheckoutCustomerData) => {
    // 1. Susun pesan format eksak WhatsApp
    const message = buildCheckoutMessage(items, customerData);

    // 2. Buat URL WhatsApp menggunakan helper (nomor dari SITE_CONFIG)
    const whatsappUrl = generateWhatsAppURL(message);

    // 3. Buka link WhatsApp di tab baru
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    // 4. Tutup modal checkout
    closeCheckoutModal();
  };

  const totalItems = getTotalItems();
  const subtotal = getSubtotal();

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
            className="relative z-10 my-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-background shadow-2xl border border-primary/10 max-h-[90vh] flex flex-col"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-primary/10 bg-secondary/50 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-whatsapp/10 text-whatsapp">
                  <MessageCircle className="h-5 w-5 fill-whatsapp stroke-none" />
                </div>
                <div>
                  <h2 className="font-heading text-lg sm:text-xl font-bold text-text-primary">
                    Checkout via WhatsApp
                  </h2>
                  <p className="font-body text-xs text-text-secondary">
                    Lengkapi data pengiriman untuk terhubung langsung dengan Admin
                  </p>
                </div>
              </div>

              {/* Tombol Tutup (X) */}
              <button
                type="button"
                aria-label="Tutup Modal Checkout"
                onClick={closeCheckoutModal}
                className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Modal (2-Column Responsive: Form & Summary) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Kolom Kiri: Form Data Pembeli (7 Cols on desktop) */}
                <div className="lg:col-span-7">
                  <h3 className="font-heading text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                    <span>Data Pengiriman</span>
                  </h3>
                  <CheckoutForm onSubmit={handleFormSubmit} />
                </div>

                {/* Kolom Kanan: Ringkasan Pesanan (5 Cols on desktop) */}
                <div className="lg:col-span-5">
                  <CheckoutSummary
                    items={items}
                    totalItems={totalItems}
                    subtotal={subtotal}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CheckoutModal;
