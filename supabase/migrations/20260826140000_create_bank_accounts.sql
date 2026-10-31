-- =============================================================================
-- Migration: Create bank_accounts table
-- Phase 4.4A — Bank Account & Transfer Payment Configuration
--
-- Tabel ini menyimpan rekening bank yang dapat digunakan customer sebagai
-- tujuan transfer saat memilih metode pembayaran TRANSFER_BANK.
--
-- RLS Policy:
--   - SELECT (aktif): Siapapun (anon + authenticated) dapat membaca rekening aktif
--   - SELECT (semua): Hanya admin/superadmin
--   - INSERT / UPDATE / DELETE: Hanya admin/superadmin
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name      VARCHAR(100) NOT NULL,
    account_name   VARCHAR(200) NOT NULL,
    account_number TEXT         NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT true,
    display_order  INTEGER      NOT NULL DEFAULT 0,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT bank_accounts_bank_name_not_empty
        CHECK (trim(bank_name) <> ''),
    CONSTRAINT bank_accounts_account_name_not_empty
        CHECK (trim(account_name) <> ''),
    CONSTRAINT bank_accounts_account_number_not_empty
        CHECK (trim(account_number) <> '')
);

COMMENT ON TABLE  public.bank_accounts                  IS 'Rekening bank toko yang digunakan sebagai tujuan transfer pembayaran TRANSFER_BANK.';
COMMENT ON COLUMN public.bank_accounts.bank_name        IS 'Nama bank, contoh: BCA, Mandiri, BRI, BNI.';
COMMENT ON COLUMN public.bank_accounts.account_name     IS 'Nama pemilik rekening yang terdaftar di bank.';
COMMENT ON COLUMN public.bank_accounts.account_number   IS 'Nomor rekening bank (disimpan sebagai teks agar tidak kehilangan leading zero).';
COMMENT ON COLUMN public.bank_accounts.is_active        IS 'True = rekening ditampilkan kepada customer. False = rekening disembunyikan.';
COMMENT ON COLUMN public.bank_accounts.display_order    IS 'Urutan tampil di UI. Semakin kecil angkanya semakin awal ditampilkan.';

CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_active ON public.bank_accounts (is_active);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_order     ON public.bank_accounts (display_order, created_at);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- 1. SELECT rekening aktif: dapat dibaca siapapun (publik / anon / customer)
DROP POLICY IF EXISTS "bank_accounts_select_active_public" ON public.bank_accounts;
CREATE POLICY "bank_accounts_select_active_public"
ON public.bank_accounts
FOR SELECT
USING (is_active = true);

-- 2. SELECT semua rekening (termasuk inactive): hanya admin/superadmin
DROP POLICY IF EXISTS "bank_accounts_select_all_admin" ON public.bank_accounts;
CREATE POLICY "bank_accounts_select_all_admin"
ON public.bank_accounts
FOR SELECT
TO authenticated
USING (
  public.get_my_role() IN ('admin', 'superadmin')
);

-- 3. INSERT: hanya admin/superadmin
DROP POLICY IF EXISTS "bank_accounts_insert_admin" ON public.bank_accounts;
CREATE POLICY "bank_accounts_insert_admin"
ON public.bank_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_my_role() IN ('admin', 'superadmin')
);

-- 4. UPDATE: hanya admin/superadmin
DROP POLICY IF EXISTS "bank_accounts_update_admin" ON public.bank_accounts;
CREATE POLICY "bank_accounts_update_admin"
ON public.bank_accounts
FOR UPDATE
TO authenticated
USING (
  public.get_my_role() IN ('admin', 'superadmin')
)
WITH CHECK (
  public.get_my_role() IN ('admin', 'superadmin')
);

-- 5. DELETE: hanya admin/superadmin
DROP POLICY IF EXISTS "bank_accounts_delete_admin" ON public.bank_accounts;
CREATE POLICY "bank_accounts_delete_admin"
ON public.bank_accounts
FOR DELETE
TO authenticated
USING (
  public.get_my_role() IN ('admin', 'superadmin')
);
