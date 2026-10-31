-- =============================================================================
-- MIGRATION: fix_promo_banner_storage_policy (STEP 6G-2 Security Fix)
-- Tanggal  : 2026-09-02
--
-- Tujuan:
--   Mempersempit akses write bucket Promo_Banner dari "semua authenticated"
--   menjadi HANYA admin/superadmin menggunakan public.get_my_role().
--
-- Konteks:
--   Migration sebelumnya (20260902150000_add_promo_banner_fields.sql) membuat
--   policy INSERT/UPDATE/DELETE dengan TO authenticated tanpa pembatasan role.
--   Hal ini terlalu luas karena customer biasa juga berstatus authenticated.
--
--   Security fix ini telah dijalankan manual di Supabase SQL Editor dengan
--   hasil "Success. No rows returned", dan migration ini merekam perubahan
--   tersebut agar codebase tetap sinkron dengan database.
--
-- Policy yang direkam:
--   SELECT : public (semua dapat membaca gambar promo)
--   INSERT : authenticated + get_my_role() IN ('admin', 'superadmin')
--   UPDATE : authenticated + get_my_role() IN ('admin', 'superadmin')
--   DELETE : authenticated + get_my_role() IN ('admin', 'superadmin')
--
-- Prerequisite:
--   - Fungsi public.get_my_role() sudah ada (20260812123000_create_get_my_role_function.sql)
--   - Bucket Promo_Banner sudah ada (dibuat manual di Supabase Dashboard)
--
-- Idempotent: Ya (menggunakan DROP IF EXISTS sebelum CREATE)
-- =============================================================================

-- =============================================================================
-- 1. DROP policy lama yang terlalu luas (TO authenticated tanpa role check)
--    Nama policy sesuai dengan yang dibuat oleh:
--    20260902150000_add_promo_banner_fields.sql
-- =============================================================================

DROP POLICY IF EXISTS "Allow authenticated insert to Promo_Banner" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update to Promo_Banner" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from Promo_Banner" ON storage.objects;

-- SELECT tidak perlu di-drop karena sudah benar (TO public)
-- DROP POLICY IF EXISTS "Allow public select on Promo_Banner" ON storage.objects;

-- =============================================================================
-- 2. BUAT policy write yang dipersempit ke admin/superadmin (idempotent)
-- =============================================================================

-- INSERT: hanya admin/superadmin
DROP POLICY IF EXISTS "Allow admin insert to Promo_Banner" ON storage.objects;
CREATE POLICY "Allow admin insert to Promo_Banner" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'Promo_Banner'
    AND public.get_my_role() IN ('admin', 'superadmin')
  );

-- UPDATE: hanya admin/superadmin
DROP POLICY IF EXISTS "Allow admin update to Promo_Banner" ON storage.objects;
CREATE POLICY "Allow admin update to Promo_Banner" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'Promo_Banner'
    AND public.get_my_role() IN ('admin', 'superadmin')
  )
  WITH CHECK (
    bucket_id = 'Promo_Banner'
    AND public.get_my_role() IN ('admin', 'superadmin')
  );

-- DELETE: hanya admin/superadmin
DROP POLICY IF EXISTS "Allow admin delete from Promo_Banner" ON storage.objects;
CREATE POLICY "Allow admin delete from Promo_Banner" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'Promo_Banner'
    AND public.get_my_role() IN ('admin', 'superadmin')
  );

-- =============================================================================
-- 3. PASTIKAN policy SELECT public tetap ada (idempotent guard)
-- =============================================================================

DROP POLICY IF EXISTS "Allow public select on Promo_Banner" ON storage.objects;

CREATE POLICY "Allow public select on Promo_Banner"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'Promo_Banner'
  );
