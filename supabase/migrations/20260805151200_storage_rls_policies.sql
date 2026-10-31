-- =============================================================================
-- SQL MIGRATION - SUPABASE STORAGE BUCKETS & RLS POLICIES
-- =============================================================================

-- 1. Inisialisasi Bucket (Bila belum ada secara lokal/remote)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('Admin_Foto', 'Admin_Foto', true),
  ('Aset_Gambar', 'Aset_Gambar', true),
  ('product_images', 'product_images', true),
  ('Gambar_Banner', 'Gambar_Banner', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Hapus Kebijakan yang Mungkin Tumpang Tindih (Idempotent)
DROP POLICY IF EXISTS "Allow public select on Admin_Foto" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert to Admin_Foto" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update to Admin_Foto" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from Admin_Foto" ON storage.objects;

DROP POLICY IF EXISTS "Allow public select on Aset_Gambar" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert to Aset_Gambar" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update to Aset_Gambar" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from Aset_Gambar" ON storage.objects;

DROP POLICY IF EXISTS "Allow public select on product_images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert to product_images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update to product_images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from product_images" ON storage.objects;

DROP POLICY IF EXISTS "Allow public select on Gambar_Banner" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert to Gambar_Banner" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update to Gambar_Banner" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from Gambar_Banner" ON storage.objects;

-- 4. Terapkan Kebijakan RLS Baru

-- A. BUCKET: Admin_Foto
CREATE POLICY "Allow public select on Admin_Foto" ON storage.objects 
  FOR SELECT TO public USING (bucket_id = 'Admin_Foto');
CREATE POLICY "Allow authenticated insert to Admin_Foto" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'Admin_Foto');
CREATE POLICY "Allow authenticated update to Admin_Foto" ON storage.objects 
  FOR UPDATE TO authenticated USING (bucket_id = 'Admin_Foto') WITH CHECK (bucket_id = 'Admin_Foto');
CREATE POLICY "Allow authenticated delete from Admin_Foto" ON storage.objects 
  FOR DELETE TO authenticated USING (bucket_id = 'Admin_Foto');

-- B. BUCKET: Aset_Gambar
CREATE POLICY "Allow public select on Aset_Gambar" ON storage.objects 
  FOR SELECT TO public USING (bucket_id = 'Aset_Gambar');
CREATE POLICY "Allow authenticated insert to Aset_Gambar" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'Aset_Gambar');
CREATE POLICY "Allow authenticated update to Aset_Gambar" ON storage.objects 
  FOR UPDATE TO authenticated USING (bucket_id = 'Aset_Gambar') WITH CHECK (bucket_id = 'Aset_Gambar');
CREATE POLICY "Allow authenticated delete from Aset_Gambar" ON storage.objects 
  FOR DELETE TO authenticated USING (bucket_id = 'Aset_Gambar');

-- C. BUCKET: product_images
CREATE POLICY "Allow public select on product_images" ON storage.objects 
  FOR SELECT TO public USING (bucket_id = 'product_images');
CREATE POLICY "Allow authenticated insert to product_images" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product_images');
CREATE POLICY "Allow authenticated update to product_images" ON storage.objects 
  FOR UPDATE TO authenticated USING (bucket_id = 'product_images') WITH CHECK (bucket_id = 'product_images');
CREATE POLICY "Allow authenticated delete from product_images" ON storage.objects 
  FOR DELETE TO authenticated USING (bucket_id = 'product_images');

-- D. BUCKET: Gambar_Banner
CREATE POLICY "Allow public select on Gambar_Banner" ON storage.objects 
  FOR SELECT TO public USING (bucket_id = 'Gambar_Banner');
CREATE POLICY "Allow authenticated insert to Gambar_Banner" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'Gambar_Banner');
CREATE POLICY "Allow authenticated update to Gambar_Banner" ON storage.objects 
  FOR UPDATE TO authenticated USING (bucket_id = 'Gambar_Banner') WITH CHECK (bucket_id = 'Gambar_Banner');
CREATE POLICY "Allow authenticated delete from Gambar_Banner" ON storage.objects 
  FOR DELETE TO authenticated USING (bucket_id = 'Gambar_Banner');
