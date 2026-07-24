/**
 * Memvalidasi apakah jumlah kuantitas produk berada dalam rentang valid.
 * 
 * @param quantity - Kuantitas yang akan diperiksa.
 * @param min - Batas minimum kuantitas (default: 1).
 * @param max - Batas maksimum kuantitas opsional (misal: stok produk).
 * @returns True jika kuantitas valid dan berada dalam rentang, sebaliknya False.
 */
export const validateQuantity = (
  quantity: number,
  min: number = 1,
  max?: number
): boolean => {
  if (typeof quantity !== "number" || isNaN(quantity) || !Number.isInteger(quantity)) {
    return false;
  }
  if (quantity < min) {
    return false;
  }
  if (max !== undefined && quantity > max) {
    return false;
  }
  return true;
};

/**
 * Memvalidasi nomor telepon Indonesia/WhatsApp.
 * Format valid mencakup awalan 08, 628, atau +628 dengan panjang 9-15 digit.
 * 
 * @param phone - String nomor telepon yang akan diperiksa.
 * @returns True jika format nomor valid, sebaliknya False.
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone) return false;
  // Membersihkan spasi, strip, atau tanda kurung
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
  // Regex untuk nomor Indonesia valid (awalan +62, 62, atau 08)
  const phoneRegex = /^(\+?62|0)8[1-9][0-9]{6,11}$/;
  return phoneRegex.test(cleanPhone);
};
