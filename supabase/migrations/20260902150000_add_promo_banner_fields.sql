-- =============================================================================
-- MIGRATION: add_promo_banner_fields
-- Tujuan: Menambah dukungan Promo Banner pada tabel hero_banners (STEP 6G-2)
-- =============================================================================

-- 1. Tambahkan kolom baru
ALTER TABLE public.hero_banners
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'hero',
ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMP WITH TIME ZONE NULL;

-- Constraint CHECK hanya memperbolehkan hero atau promo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'hero_banners_type_check'
    ) THEN
        ALTER TABLE hero_banners
        ADD CONSTRAINT hero_banners_type_check CHECK (type IN ('hero', 'promo'));
    END IF;
END $$;

COMMENT ON COLUMN hero_banners.type IS 'Tipe banner: hero (banner biasa) atau promo (banner diskon).';
COMMENT ON COLUMN hero_banners.promo_code IS 'Kode diskon/voucher (opsional) yang dihubungkan jika type = promo.';

-- =============================================================================
-- MIGRATION: add_promo_banner_storage_policies
-- =============================================================================

-- Asumsi bucket Promo_Banner sudah dibuat manual (PUBLIC)
-- Kita tambahkan policy standar (sama seperti bucket lainnya).

-- 1. Bersihkan policy lama jika ada
DROP POLICY IF EXISTS "Allow public select on Promo_Banner" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert to Promo_Banner" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update to Promo_Banner" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from Promo_Banner" ON storage.objects;

-- 2. Buat policy baru
CREATE POLICY "Allow public select on Promo_Banner" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'Promo_Banner');

CREATE POLICY "Allow authenticated insert to Promo_Banner" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'Promo_Banner');

CREATE POLICY "Allow authenticated update to Promo_Banner" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'Promo_Banner') WITH CHECK (bucket_id = 'Promo_Banner');

CREATE POLICY "Allow authenticated delete from Promo_Banner" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'Promo_Banner');
