/**
 * Memotong teks jika melebihi panjang maksimum dan menambahkan ellipsis (...).
 * 
 * @param text - Teks asal yang akan dipotong.
 * @param maxLength - Batas maksimum karakter.
 * @returns Teks yang dipotong beserta ellipsis jika melampaui batas.
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

/**
 * Mengubah huruf pertama pada setiap kata menjadi huruf kapital (Title Case).
 * 
 * @param str - Kalimat atau kata yang akan diformat.
 * @returns String dengan format kapital pada setiap awal kata.
 */
export const capitalizeWords = (str: string): string => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Memformat angka rating ke bentuk satu desimal (contoh: 4.85 -> "4.9").
 * 
 * @param rating - Nilai rating produk (0-5).
 * @returns String rating dengan presisi 1 angka di belakang koma.
 */
export const formatRating = (rating: number): string => {
  if (typeof rating !== "number" || isNaN(rating)) return "0.0";
  return rating.toFixed(1);
};
