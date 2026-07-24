/**
 * Format angka ke dalam format mata uang Rupiah (IDR).
 * 
 * @param amount - Jumlah nominal harga yang akan diformat.
 * @returns String nominal terformat (contoh: "Rp 185.000").
 */
export const formatRupiah = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "Rp 0";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};
