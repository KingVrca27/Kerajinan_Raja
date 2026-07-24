import { CartItem } from "@/src/types/cart";
import { SITE_CONFIG } from "@/src/constants/site";
import { formatRupiah } from "./currency";

/**
 * Interface definisi data pelanggan untuk proses Checkout WhatsApp.
 */
export interface CheckoutCustomerData {
  /** Nama lengkap pembeli */
  nama: string;
  /** Nomor HP / WhatsApp aktif pembeli */
  phone: string;
  /** Alamat lengkap pengiriman */
  alamat: string;
  /** Catatan khusus tambahan (opsional) */
  catatan?: string;
}

/**
 * Menyusun pesan WhatsApp pesanan keranjang belanja dengan format terstruktur rapi.
 * 
 * @param items - Daftar item produk dalam keranjang belanja.
 * @param customer - Data pembeli (Nama, No. HP, Alamat, Catatan).
 * @returns String format pesan teks siap kirim via WhatsApp.
 */
export const buildCheckoutMessage = (
  items: CartItem[],
  customer: CheckoutCustomerData
): string => {
  let message = `Halo Admin ${SITE_CONFIG.name},\n\nSaya ingin melakukan pemesanan.\n\n`;

  // DATA PEMBELI
  message += `=========================\nDATA PEMBELI\n=========================\n\n`;
  message += `Nama : ${customer.nama}\n\n`;
  message += `No. HP : ${customer.phone}\n\n`;
  message += `Alamat : ${customer.alamat}\n\n`;
  message += `Catatan : ${customer.catatan && customer.catatan.trim() !== "" ? customer.catatan.trim() : "-"}\n\n`;

  // PESANAN
  message += `=========================\nPESANAN\n=========================\n\n`;

  let totalItems = 0;
  let subtotal = 0;

  items.forEach((item, index) => {
    const itemSubtotal = item.product.price * item.quantity;
    totalItems += item.quantity;
    subtotal += itemSubtotal;

    message += `${index + 1}. ${item.product.name}\n\n`;
    message += `Qty : ${item.quantity}\n\n`;
    message += `Harga : ${formatRupiah(item.product.price)}\n\n`;
  });

  // RINGKASAN
  message += `=========================\nRINGKASAN\n=========================\n\n`;
  message += `Total Produk : ${items.length}\n\n`;
  message += `Total Item : ${totalItems}\n\n`;
  message += `Subtotal : ${formatRupiah(subtotal)}\n\n`;
  message += `=========================\n\nTerima kasih.`;

  return message;
};

/**
 * Membuat URL tautan langsung WhatsApp (`https://wa.me/...`) yang telah di-encode URI.
 * Nomor WhatsApp diambil secara terpusat dari SITE_CONFIG.whatsappNumber pada constants/site.ts.
 * 
 * @param message - Teks pesan yang ingin dikirim.
 * @param phoneNumber - Nomor WhatsApp tujuan (default dari SITE_CONFIG).
 * @returns URL lengkap WhatsApp direct link.
 */
export const generateWhatsAppURL = (
  message: string,
  phoneNumber: string = SITE_CONFIG.whatsappNumber
): string => {
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

/**
 * Menyusun URL tautan langsung WhatsApp untuk pembelian satu produk tertentu.
 * 
 * @param productName - Nama produk.
 * @param productPrice - Harga produk (opsional).
 * @param phoneNumber - Nomor WhatsApp tujuan (default dari SITE_CONFIG).
 * @returns URL lengkap WhatsApp direct link.
 */
export const generateSingleProductWhatsAppURL = (
  productName: string,
  productPrice?: number,
  phoneNumber: string = SITE_CONFIG.whatsappNumber
): string => {
  let message = `Halo Admin ${SITE_CONFIG.name}, saya tertarik untuk membeli produk *${productName}*`;
  if (productPrice !== undefined) {
    message += ` (Harga: ${formatRupiah(productPrice)})`;
  }
  message += `.\nMohon informasi ketersediaan stok dan cara pemesanan. Terima kasih!`;

  return generateWhatsAppURL(message, phoneNumber);
};
