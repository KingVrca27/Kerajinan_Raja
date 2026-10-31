-- =============================================================================
--  MIGRATION: cms_hero_schedule
--  Tanggal   : 2026-07-29
--  Deskripsi : Tambah kolom jadwal tampil (schedule_start / schedule_end)
--              pada tabel hero_banners untuk fitur penjadwalan banner otomatis.
--
--  CARA MENJALANKAN:
--    Supabase Dashboard → SQL Editor → paste & Run
--    ATAU: supabase db push (jika menggunakan CLI)
--
--  AMAN DIJALANKAN BERULANG (idempotent via IF NOT EXISTS)
-- =============================================================================

-- Kolom jadwal mulai tampil banner (opsional)
ALTER TABLE hero_banners
  ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Kolom jadwal selesai tampil banner (opsional)
ALTER TABLE hero_banners
  ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Index untuk query banner aktif berdasarkan jadwal
CREATE INDEX IF NOT EXISTS idx_hero_banners_schedule_start
  ON hero_banners (schedule_start);

CREATE INDEX IF NOT EXISTS idx_hero_banners_schedule_end
  ON hero_banners (schedule_end);

-- Komentar dokumentasi kolom
COMMENT ON COLUMN hero_banners.schedule_start
  IS 'Waktu mulai banner ditampilkan (opsional). NULL = tidak ada jadwal mulai.';

COMMENT ON COLUMN hero_banners.schedule_end
  IS 'Waktu selesai banner ditampilkan (opsional). NULL = tidak ada jadwal berakhir.';
