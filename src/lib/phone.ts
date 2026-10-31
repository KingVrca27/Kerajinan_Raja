/**
 * @file src/lib/phone.ts
 * Utilitas normalisasi nomor HP/WhatsApp Indonesia.
 *
 * Masalah: nomor yang tersimpan di DB bisa beragam format:
 *   "08123456789"  → lokal Indonesia
 *   "628123456789" → internasional tanpa +
 *   "+628123456789" → internasional dengan +
 *   "8123456789"   → tanpa prefix sama sekali
 *
 * Solusi: normalisasi semua ke format `08xxxxxxxxx` (lokal Indonesia)
 * sebelum disimpan ke DB dan sebelum digunakan untuk pencarian.
 */

/**
 * Normalisasi nomor HP Indonesia ke format lokal `08xxxxxxxxx`.
 *
 * @param raw - Nomor HP dalam format apapun
 * @returns Nomor HP dalam format `08xxxxxxxxx`, atau string kosong jika tidak valid
 *
 * @example
 * normalizePhone("628123456789")   // "08123456789"
 * normalizePhone("+628123456789")  // "08123456789"
 * normalizePhone("08123456789")    // "08123456789"
 * normalizePhone("8123456789")     // "08123456789"
 */
export function normalizePhone(raw: string): string {
  // Hapus semua karakter non-digit
  const digits = raw.replace(/\D/g, "");

  if (!digits) return "";

  // Format 62xxxxxxxxx → 08xxxxxxxxx
  if (digits.startsWith("62")) {
    return "0" + digits.slice(2);
  }

  // Format 8xxxxxxxxx (tanpa prefix) → 08xxxxxxxxx
  if (digits.startsWith("8") && digits.length >= 9) {
    return "0" + digits;
  }

  // Sudah dalam format 08xxxxxxxxx — kembalikan apa adanya
  if (digits.startsWith("0")) {
    return digits;
  }

  return digits;
}
