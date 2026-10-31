-- =============================================================================
-- Migration: Add payment proof system to orders
-- Phase 4.4D — Payment Proof Upload, Storage Security & Admin Verification
-- =============================================================================

-- 1. Alter table orders (Additive)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_proof_path TEXT NULL,
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS payment_verified_by UUID NULL,
ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT NULL;

-- Relasi verifikator ke tabel users (admin)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_orders_verified_by'
    ) THEN
        ALTER TABLE public.orders
        ADD CONSTRAINT fk_orders_verified_by
        FOREIGN KEY (payment_verified_by)
        REFERENCES public.users(id)
        ON DELETE SET NULL;
    END IF;
END $$;

COMMENT ON COLUMN public.orders.payment_proof_path IS 'Path Storage untuk bukti pembayaran. Format: auth.uid()/filename.ext';
COMMENT ON COLUMN public.orders.payment_verified_at IS 'Waktu verifikasi bukti pembayaran oleh admin';
COMMENT ON COLUMN public.orders.payment_verified_by IS 'Admin yang memverifikasi bukti pembayaran';
COMMENT ON COLUMN public.orders.payment_rejection_reason IS 'Alasan jika bukti pembayaran ditolak';

-- 2. Inisialisasi Bucket "payment_proofs" (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment_proofs',
  'payment_proofs',
  false,
  5242880, -- 5 MB
  '{"image/jpeg","image/png","image/webp","application/pdf"}'
)
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = '{"image/jpeg","image/png","image/webp","application/pdf"}';

-- 3. Hapus policy lama (Idempotent)
DROP POLICY IF EXISTS "Allow authenticated insert to payment_proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated select own payment_proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update own payment_proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete own payment_proofs" ON storage.objects;

-- 4. Terapkan RLS Policy ketat di mana customer HANYA bisa mengakses foldernya sendiri (folder = auth.uid())

-- Customer INSERT: Harus ke folder dengan nama auth.uid()
CREATE POLICY "Allow authenticated insert to payment_proofs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment_proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Customer SELECT: Hanya bisa membaca filenya sendiri
CREATE POLICY "Allow authenticated select own payment_proofs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment_proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Customer UPDATE: Hanya filenya sendiri
CREATE POLICY "Allow authenticated update own payment_proofs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'payment_proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'payment_proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Customer DELETE: Hanya filenya sendiri
CREATE POLICY "Allow authenticated delete own payment_proofs" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'payment_proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Catatan: Admin akan mengakses storage object melewati server-side (supabaseAdmin service_role), 
-- sehingga RLS untuk admin SELECT tidak diperlukan (bypassed).
