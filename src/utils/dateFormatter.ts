/**
 * @file src/utils/dateFormatter.ts
 *
 * Utility untuk memproses tanggal estimasi pengiriman (ETD)
 * dari RajaOngkir (contoh: "2-3", "4", dsb.)
 * dan menghitung Business Days.
 *
 * ATURAN BISNIS:
 * - Senin s/d Sabtu = hari kerja
 * - Minggu = LIBUR (tidak dihitung)
 * - Timezone dasar = Asia/Makassar (WITA, UTC+8)
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/** Waktu proses minimum toko sebelum barang diserahkan ke kurir (hari kerja). */
const PROCESSING_MIN_DAYS = 1;

/** Waktu proses maksimum toko sebelum barang diserahkan ke kurir (hari kerja). */
const PROCESSING_MAX_DAYS = 2;

/** Timezone toko (Lombok/WITA). */
const STORE_TIMEZONE = "Asia/Makassar";

/** Teks fallback jika ETD tidak valid. */
const FALLBACK_MESSAGE =
  "Perkiraan tiba menyesuaikan waktu pengiriman JNE standar.";

// =============================================================================
// ETD PARSER
// =============================================================================

/**
 * Mengurai ETD dari Komerce/RajaOngkir menjadi rentang [min, max] hari.
 *
 * Contoh input yang ditangani:
 *   "2"    → [2, 2]
 *   "2-3"  → [2, 3]
 *   " 4-6" → [4, 6]
 *   "6-4"  → [4, 6]  (range terbalik aman)
 *   null / "" / "-" / "abc" → null (fallback)
 *
 * @returns [min, max] dalam bilangan bulat positif, atau null jika tidak valid.
 */
function parseEtd(etd: string | null | undefined): [number, number] | null {
  if (!etd || etd.trim() === "" || etd.trim() === "-") return null;

  // Hapus semua karakter selain digit dan tanda pisah
  const cleaned = etd.replace(/[^\d-]/g, "").trim();
  if (!cleaned) return null;

  const parts = cleaned.split("-").filter((p) => p !== "");

  if (parts.length === 0) return null;

  if (parts.length === 1) {
    const val = parseInt(parts[0], 10);
    if (isNaN(val) || val <= 0) return null;
    return [val, val];
  }

  // Dua angka atau lebih — ambil dua pertama dan urutkan aman
  const a = parseInt(parts[0], 10);
  const b = parseInt(parts[1], 10);
  if (isNaN(a) || isNaN(b)) return null;
  if (a <= 0 && b <= 0) return null;

  const minVal = Math.min(a, b);
  const maxVal = Math.max(a, b);
  return [minVal, maxVal];
}

// =============================================================================
// DATE UTILITIES
// =============================================================================

/**
 * Mendapatkan tanggal "hari ini" di timezone toko (Asia/Makassar),
 * dinormalisasi ke pukul 00:00:00 UTC tengah malam untuk menghindari
 * pergeseran tanggal akibat perbedaan timezone antara browser/server
 * dengan toko.
 *
 * Menggunakan Intl.DateTimeFormat untuk mengekstrak komponen tanggal
 * lokal WITA, lalu merekonstruksi Date object dengan nilai tersebut.
 */
function getTodayInStoreTimezone(): Date {
  const now = new Date();

  // Ekstrak komponen hari/bulan/tahun dalam timezone toko
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: STORE_TIMEZONE,
  }).formatToParts(now);

  // en-CA menghasilkan format "YYYY-MM-DD" yang mudah diparse
  const year = parseInt(parts.find((p) => p.type === "year")!.value, 10);
  const month = parseInt(parts.find((p) => p.type === "month")!.value, 10) - 1;
  const day = parseInt(parts.find((p) => p.type === "day")!.value, 10);

  // Buat Date di tengah hari (noon) untuk menghindari DST edge-case
  // Gunakan UTC konstruksi agar tidak terpengaruh system timezone
  return new Date(Date.UTC(year, month, day, 12, 0, 0));
}

/**
 * Menambahkan sejumlah hari kerja ke suatu tanggal.
 *
 * ATURAN:
 * - Senin–Sabtu = hari kerja (mengurangi counter).
 * - Minggu = libur (melewati, counter tidak berkurang).
 * - Jika daysToAdd = 0, kembalikan salinan tanggal yang sama.
 * - Tidak memodifikasi Date object asli (immutable input).
 *
 * @param startDate - Tanggal awal. Tidak dimodifikasi.
 * @param daysToAdd - Jumlah hari kerja yang ditambahkan (>= 0).
 * @returns Date baru setelah penambahan hari kerja.
 */
function addBusinessDays(startDate: Date, daysToAdd: number): Date {
  if (daysToAdd < 0) {
    // Negative tidak didukung — kembalikan salinan tanggal asal
    return new Date(startDate.getTime());
  }

  const result = new Date(startDate.getTime());
  let remainingDays = daysToAdd;

  while (remainingDays > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    // 0 = Minggu — jika bukan Minggu, hitung sebagai hari kerja
    // getUTCDay() digunakan karena date dikonstruksi via UTC
    if (result.getUTCDay() !== 0) {
      remainingDays--;
    }
  }

  return result;
}

// =============================================================================
// FORMAT TANGGAL
// =============================================================================

/**
 * Memformat dua Date object menjadi rentang tanggal natural berbahasa Indonesia.
 *
 * Format output:
 *   Sama hari          → "12 September 2026"
 *   Berbeda hari, bulan sama → "14–16 September 2026"
 *   Berbeda bulan      → "30 September–2 Oktober 2026"
 *   Berbeda tahun      → "30 Desember 2026–2 Januari 2027"
 *
 * Menggunakan en dash (–) sebagai pemisah, bukan hyphen (-).
 */
function formatArrivalDateRange(minDate: Date, maxDate: Date): string {
  const tzOpts = { timeZone: STORE_TIMEZONE } as const;

  const fmtFull = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...tzOpts,
  });
  const fmtDay = new Intl.DateTimeFormat("id-ID", { day: "numeric", ...tzOpts });
  const fmtMonth = new Intl.DateTimeFormat("id-ID", { month: "long", ...tzOpts });
  const fmtYear = new Intl.DateTimeFormat("id-ID", { year: "numeric", ...tzOpts });

  const minDay = fmtDay.format(minDate);
  const minMonth = fmtMonth.format(minDate);
  const minYear = fmtYear.format(minDate);

  const maxDay = fmtDay.format(maxDate);
  const maxMonth = fmtMonth.format(maxDate);
  const maxYear = fmtYear.format(maxDate);

  // Sama persis
  if (minDay === maxDay && minMonth === maxMonth && minYear === maxYear) {
    return fmtFull.format(minDate);
  }

  // Berbeda tahun
  if (minYear !== maxYear) {
    return `${fmtFull.format(minDate)}–${fmtFull.format(maxDate)}`;
  }

  // Berbeda bulan, tahun sama
  if (minMonth !== maxMonth) {
    return `${minDay} ${minMonth}–${fmtFull.format(maxDate)}`;
  }

  // Sama bulan dan tahun, beda hari
  return `${minDay}–${fmtFull.format(maxDate)}`;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Menghitung dan memformat teks estimasi tanggal tiba berdasarkan:
 *   - ETD kurir (dari RajaOngkir, contoh: "2-3")
 *   - Processing time toko (1–2 hari kerja, terdefinisi sebagai constant)
 *   - Hari kerja Senin–Sabtu, Minggu libur
 *   - Timezone Asia/Makassar (WITA)
 *
 * @param etd - String ETD dari service.etd RajaOngkir.
 * @returns { text, hasDisclaimer }
 */
export function getEstimatedArrivalText(etd: string | null | undefined): {
  text: string;
  hasDisclaimer: boolean;
} {
  const parsed = parseEtd(etd);

  if (!parsed) {
    return { text: FALLBACK_MESSAGE, hasDisclaimer: false };
  }

  const [etdMin, etdMax] = parsed;
  const totalMinDays = PROCESSING_MIN_DAYS + etdMin;
  const totalMaxDays = PROCESSING_MAX_DAYS + etdMax;

  // Tanggal dasar = hari ini di timezone toko (Asia/Makassar)
  const baseDate = getTodayInStoreTimezone();

  const minDate = addBusinessDays(baseDate, totalMinDays);
  const maxDate = addBusinessDays(baseDate, totalMaxDays);

  const rangeStr = formatArrivalDateRange(minDate, maxDate);

  return {
    text: `Perkiraan tiba ${rangeStr}`,
    hasDisclaimer: true,
  };
}
