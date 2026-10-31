import { CartItem } from "@/src/types/cart";
import { SITE_CONFIG } from "@/src/constants/site";
import { formatRupiah } from "./currency";
import { siteSettingsRepository, SETTINGS_KEYS } from "./cmsRepository";

/**
 * Interface definisi data pelanggan untuk proses Checkout.
 * Mencakup data pribadi, alamat pengiriman lengkap, dan catatan.
 */
export interface CheckoutCustomerData {
  /** Nama lengkap penerima */
  nama: string;
  /** Nomor HP / WhatsApp aktif pembeli */
  phone: string;
  /** Alamat lengkap pengiriman (jalan, RT/RW, dsb.) */
  alamat: string;
  /** Provinsi tujuan pengiriman */
  provinsi: string;
  /** Kota / Kabupaten tujuan pengiriman */
  kota: string;
  /** Kecamatan tujuan pengiriman */
  district?: string;
  /** Desa / Kelurahan tujuan pengiriman */
  village?: string;
  /** Kode Pos tujuan pengiriman */
  kodePos: string;
  /** Catatan khusus tambahan (opsional) */
  catatan?: string;
  /** Metode pembayaran pilihan pelanggan */
  paymentMethod?: "COD" | "TRANSFER_BANK";
  /**
   * ID destination RajaOngkir (subdistrict_id) yang dipilih customer.
   * Diisi saat customer memilih lokasi dari hasil pencarian destination.
   * Opsional untuk menjaga kompatibilitas mundur.
   */
  destinationId?: string;
}

/**
 * Menyusun pesan WhatsApp pesanan keranjang belanja dengan format terstruktur rapi.
 * Menyertakan informasi ongkir flat-rate dan total akhir.
 *
 * @param items - Daftar item produk dalam keranjang belanja.
 * @param customer - Data pembeli (Nama, No. HP, Alamat, Provinsi, Kota, Kode Pos, Catatan).
 * @param orderNumber - Nomor pesanan dari server (opsional).
 * @param shippingCost - Ongkos kirim dari server (opsional).
 * @returns String format pesan teks siap kirim via WhatsApp.
 */
export const buildCheckoutMessage = (
  items: CartItem[],
  customer: CheckoutCustomerData,
  orderNumber?: string,
  shippingCost?: number
): string => {
  let message = `Halo Admin ${SITE_CONFIG.name},\n\nSaya ingin melakukan pemesanan.\n\n`;

  // DATA PEMBELI
  message += `=========================\nDATA PEMBELI\n=========================\n\n`;
  if (orderNumber) {
    message += `No. Pesanan : ${orderNumber}\n\n`;
  }
  message += `Nama : ${customer.nama}\n\n`;
  message += `No. HP : ${customer.phone}\n\n`;
  message += `Alamat : ${customer.alamat}\n\n`;
  message += `Kota : ${customer.kota}\n\n`;
  message += `Provinsi : ${customer.provinsi}\n\n`;
  message += `Kode Pos : ${customer.kodePos}\n\n`;
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
  if (shippingCost !== undefined) {
    message += `Ongkos Kirim : ${formatRupiah(shippingCost)}\n\n`;
    message += `TOTAL : ${formatRupiah(subtotal + shippingCost)}\n\n`;
  }
  message += `=========================\n\nTerima kasih.`;

  return message;
};

/**
 * Membuat URL tautan langsung WhatsApp (`https://wa.me/...`) yang telah di-encode URI.
 * Nomor WhatsApp diambil secara dinamis dari Supabase site_settings (store_whatsapp).
 * Jika tidak ditemukan, fallback ke SITE_CONFIG.whatsappNumber.
 *
 * @param message - Teks pesan yang ingin dikirim.
 * @returns URL lengkap WhatsApp direct link.
 */
export const generateWhatsAppURL = async (
  message: string
): Promise<string> => {
  // Ambil nomor WA dari Supabase (diisi admin di halaman Informasi Toko)
  let phoneNumber: string = SITE_CONFIG.whatsappNumber;
  try {
    const dbPhone = await siteSettingsRepository.getSetting(SETTINGS_KEYS.STORE_WHATSAPP);
    if (dbPhone && dbPhone.trim() !== "") {
      phoneNumber = dbPhone.trim();
    }
  } catch {
    // fallback ke SITE_CONFIG jika Supabase gagal
  }

  const cleanPhone = phoneNumber.replace(/\D/g, "");
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

/**
 * Menyusun URL tautan langsung WhatsApp untuk pembelian satu produk tertentu.
 *
 * @param productName - Nama produk.
 * @param productPrice - Harga produk (opsional).
 * @returns URL lengkap WhatsApp direct link.
 */
export const generateSingleProductWhatsAppURL = async (
  productName: string,
  productPrice?: number
): Promise<string> => {
  let message = `Halo Admin ${SITE_CONFIG.name}, saya tertarik untuk membeli produk *${productName}*`;
  if (productPrice !== undefined) {
    message += ` (Harga: ${formatRupiah(productPrice)})`;
  }
  message += `.\nMohon informasi ketersediaan stok dan cara pemesanan. Terima kasih!`;

  return generateWhatsAppURL(message);
};
