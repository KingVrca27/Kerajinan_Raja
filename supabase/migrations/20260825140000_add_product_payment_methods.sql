-- =============================================================================
--  MIGRATION: Tambah allowed_payment_methods pada tabel products
--  File     : 20260825140000_add_product_payment_methods.sql
--  Fase     : 4.3Q — Product-Level Payment Method Configuration
--  Dibuat   : 2026-08-25
--
--  TUJUAN:
--    Menambahkan kolom allowed_payment_methods pada tabel products agar
--    admin dapat mengonfigurasi metode pembayaran yang diperbolehkan
--    per produk (COD, Transfer Bank, atau keduanya).
--
--  ATURAN:
--    - Tidak menghapus tabel atau data yang sudah ada.
--    - Tidak mengubah migration lama.
--    - ALTER TABLE additive-only.
--    - IF NOT EXISTS untuk idempotency.
--    - Default = kedua metode aktif (backward compatible).
--
--  FIELD YANG DITAMBAHKAN:
--    products:
--      + allowed_payment_methods  TEXT[]  — Metode pembayaran yang diizinkan
--
--  CONSTRAINT:
--    - Tidak boleh kosong (NOT NULL)
--    - Default: '{COD,TRANSFER_BANK}' → backward compatible
--    - CHECK: hanya berisi nilai yang valid
--
--  BACKWARD COMPATIBILITY:
--    Semua produk existing otomatis mendapat default {COD, TRANSFER_BANK}
--    → tidak ada produk yang kehilangan metode pembayaran.
-- =============================================================================


-- =============================================================================
-- BAGIAN 1 — TAMBAH KOLOM allowed_payment_methods
-- =============================================================================

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS allowed_payment_methods TEXT[]
    NOT NULL
    DEFAULT ARRAY['COD', 'TRANSFER_BANK'];

COMMENT ON COLUMN products.allowed_payment_methods IS
    'Metode pembayaran yang diizinkan untuk produk ini. Nilai valid: COD, TRANSFER_BANK. Default: keduanya aktif.';


-- =============================================================================
-- BAGIAN 2 — CONSTRAINT: Pastikan array tidak kosong dan hanya berisi nilai valid
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'products'
          AND constraint_name = 'products_payment_methods_check'
    ) THEN
        ALTER TABLE products
            ADD CONSTRAINT products_payment_methods_check
            CHECK (
                array_length(allowed_payment_methods, 1) > 0
                AND allowed_payment_methods <@ ARRAY['COD', 'TRANSFER_BANK']
            );
    END IF;
END;
$$;


-- =============================================================================
-- BAGIAN 3 — INDEX untuk query yang memfilter berdasarkan payment methods
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_products_payment_methods
    ON products USING GIN (allowed_payment_methods);


-- =============================================================================
-- VERIFIKASI FINAL (COMMENT)
-- =============================================================================
--
--  Field baru setelah migration ini:
--    ✅ allowed_payment_methods  TEXT[]  NOT NULL
--                                DEFAULT '{COD,TRANSFER_BANK}'
--                                CHECK: tidak kosong, hanya nilai valid
--
--  Backward compatibility:
--    ✅ Semua produk existing: allowed_payment_methods = '{COD,TRANSFER_BANK}'
--    ✅ Tidak ada produk yang kehilangan metode pembayaran
--    ✅ Tidak ada data loss
--
-- =============================================================================
--  END OF MIGRATION — 20260825140000_add_product_payment_methods.sql
--  Total field baru : 1
--  Total constraint : 1
--  Total index baru : 1
-- =============================================================================
