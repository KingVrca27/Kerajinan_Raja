-- =============================================================================
--  MIGRATION: Penyempurnaan Struktur Tabel Products
--  File     : 20260729132500_enhance_products_table.sql
--  Fase     : 4.1.5 — Blueprint Final Kerajinan Raja
--  Dibuat   : 2026-07-29
--
--  TUJUAN:
--    Menambahkan field, constraint, dan index yang belum ada pada tabel
--    products agar struktur database siap sebagai fondasi final untuk
--    migrasi data dari file statis ke Supabase PostgreSQL.
--
--  ATURAN:
--    - Tidak menghapus tabel atau data yang sudah ada.
--    - Tidak mengubah migration lama (20260729122624_initial_schema.sql).
--    - Seluruh perubahan dilakukan dengan ALTER TABLE (additive-only).
--    - Menggunakan IF NOT EXISTS / DO $$ ... $$ untuk idempotency.
--    - Kompatibel dengan PostgreSQL (Supabase).
--
--  FIELD YANG DITAMBAHKAN:
--    Tabel products:
--      + minimum_stock  INTEGER   — Batas stok minimum sebelum notifikasi
--      + length_cm      NUMERIC   — Panjang produk dalam cm (dimensi)
--      + width_cm       NUMERIC   — Lebar produk dalam cm (dimensi)
--      + height_cm      NUMERIC   — Tinggi produk dalam cm (dimensi)
--      + is_active      BOOLEAN   — Kontrol visibilitas produk di frontend
--      + display_order  INTEGER   — Urutan tampil produk di halaman katalog
--
--  CONSTRAINT YANG DIPERBAIKI / DITAMBAHKAN:
--    - products_weight_check  : Ubah dari > 0 menjadi >= 0 (berat boleh 0)
--    - products_min_stock_check  : minimum_stock >= 0
--    - products_length_check  : length_cm IS NULL OR length_cm >= 0
--    - products_width_check   : width_cm IS NULL OR width_cm >= 0
--    - products_height_check  : height_cm IS NULL OR height_cm >= 0
--
--  INDEX BARU:
--    - idx_products_is_active     ON products (is_active)
--    - idx_products_display_order ON products (display_order)
--
--  TIDAK DITAMBAHKAN (sesuai spesifikasi):
--    - rating / average_rating  → dihitung dari tabel reviews
--    - total_reviews            → COUNT dari tabel reviews
--    - best_seller              → dihitung berdasarkan query order_items
--    - is_new                   → dihitung dari created_at
--    - view_count               → akan ditangani tabel terpisah
-- =============================================================================


-- =============================================================================
-- BAGIAN 1 — TAMBAH FIELD BARU KE TABEL products
-- =============================================================================

-- 1.1 minimum_stock
--     Batas stok minimum. Jika stock <= minimum_stock, sistem akan
--     memunculkan notifikasi "Produk Hampir Habis" di dashboard admin.
--     Default 5 unit adalah nilai konservatif yang aman untuk toko kecil.
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS minimum_stock INTEGER NOT NULL DEFAULT 5;

COMMENT ON COLUMN products.minimum_stock IS
    'Batas stok minimum. Jika stock <= minimum_stock, admin mendapat notifikasi stok menipis. Default: 5.';

-- 1.2 length_cm
--     Panjang fisik produk dalam sentimeter. Digunakan untuk kalkulasi
--     ongkos kirim berdasarkan dimensi (volumetrik) dan tampilan spesifikasi.
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS length_cm NUMERIC(8,2);

COMMENT ON COLUMN products.length_cm IS
    'Panjang produk dalam sentimeter (cm). Digunakan untuk kalkulasi ongkos kirim volumetrik.';

-- 1.3 width_cm
--     Lebar fisik produk dalam sentimeter.
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS width_cm NUMERIC(8,2);

COMMENT ON COLUMN products.width_cm IS
    'Lebar produk dalam sentimeter (cm). Digunakan untuk kalkulasi ongkos kirim volumetrik.';

-- 1.4 height_cm
--     Tinggi fisik produk dalam sentimeter.
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS height_cm NUMERIC(8,2);

COMMENT ON COLUMN products.height_cm IS
    'Tinggi produk dalam sentimeter (cm). Digunakan untuk kalkulasi ongkos kirim volumetrik.';

-- 1.5 is_active
--     Kontrol visibilitas produk di sisi frontend (website pelanggan).
--     Berbeda dari kolom status:
--       - status    : siklus hidup produk (active, draft, out_of_stock, inactive)
--       - is_active : toggle cepat tampil/sembunyi tanpa mengubah status
--     Default TRUE agar produk baru langsung tampil setelah dipublikasikan.
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN products.is_active IS
    'Kontrol visibilitas produk di frontend. False = produk disembunyikan dari pelanggan tanpa mengubah status internal.';

-- 1.6 display_order
--     Urutan tampil produk di halaman katalog dan section homepage.
--     Nilai lebih kecil = tampil lebih awal (prioritas lebih tinggi).
--     Default 0 agar produk baru tampil di posisi normal.
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN products.display_order IS
    'Urutan tampil produk di katalog dan homepage. Nilai lebih kecil = prioritas lebih tinggi. Default: 0.';


-- =============================================================================
-- BAGIAN 2 — PERBAIKAN CONSTRAINT (DROP LAMA → TAMBAH BARU)
-- =============================================================================

-- 2.1 Perbaikan products_weight_check
--     Constraint lama: weight_gram > 0  (tidak mengizinkan berat = 0)
--     Constraint baru: weight_gram >= 0 (mengizinkan berat 0 untuk produk digital/bundle)
--     Alasan: Produk yang belum diinput berat seharusnya bisa disimpan dengan nilai 0.
--
--     Menggunakan DO block agar idempotent (tidak error jika constraint sudah tidak ada
--     atau sudah menggunakan definisi yang benar).
DO $$
BEGIN
    -- Hapus constraint lama jika masih ada
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'products'
          AND constraint_name = 'products_weight_check'
    ) THEN
        ALTER TABLE products DROP CONSTRAINT products_weight_check;
    END IF;

    -- Tambah constraint baru yang lebih permisif (>= 0)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'products'
          AND constraint_name = 'products_weight_gram_check'
    ) THEN
        ALTER TABLE products
            ADD CONSTRAINT products_weight_gram_check
            CHECK (weight_gram IS NULL OR weight_gram >= 0);
    END IF;
END;
$$;

-- 2.2 Constraint minimum_stock tidak boleh negatif
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'products'
          AND constraint_name = 'products_min_stock_check'
    ) THEN
        ALTER TABLE products
            ADD CONSTRAINT products_min_stock_check
            CHECK (minimum_stock >= 0);
    END IF;
END;
$$;

-- 2.3 Constraint length_cm tidak boleh negatif
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'products'
          AND constraint_name = 'products_length_check'
    ) THEN
        ALTER TABLE products
            ADD CONSTRAINT products_length_check
            CHECK (length_cm IS NULL OR length_cm >= 0);
    END IF;
END;
$$;

-- 2.4 Constraint width_cm tidak boleh negatif
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'products'
          AND constraint_name = 'products_width_check'
    ) THEN
        ALTER TABLE products
            ADD CONSTRAINT products_width_check
            CHECK (width_cm IS NULL OR width_cm >= 0);
    END IF;
END;
$$;

-- 2.5 Constraint height_cm tidak boleh negatif
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'products'
          AND constraint_name = 'products_height_check'
    ) THEN
        ALTER TABLE products
            ADD CONSTRAINT products_height_check
            CHECK (height_cm IS NULL OR height_cm >= 0);
    END IF;
END;
$$;


-- =============================================================================
-- BAGIAN 3 — TAMBAH INDEX BARU
-- =============================================================================

-- 3.1 Index is_active
--     Digunakan pada query catalog frontend yang selalu memfilter
--     WHERE is_active = true untuk menampilkan hanya produk yang aktif.
CREATE INDEX IF NOT EXISTS idx_products_is_active
    ON products (is_active);

-- 3.2 Index display_order
--     Digunakan pada query ORDER BY display_order ASC untuk menampilkan
--     produk sesuai urutan yang ditentukan admin.
CREATE INDEX IF NOT EXISTS idx_products_display_order
    ON products (display_order);

-- 3.3 Compound index is_active + display_order
--     Optimasi query paling umum di frontend:
--     WHERE is_active = true ORDER BY display_order ASC
--     Query ini digunakan di halaman katalog, homepage, dan semua section produk.
CREATE INDEX IF NOT EXISTS idx_products_active_order
    ON products (is_active, display_order);

-- 3.4 Compound index is_active + is_featured
--     Optimasi query untuk section "Produk Unggulan" di homepage:
--     WHERE is_active = true AND is_featured = true
CREATE INDEX IF NOT EXISTS idx_products_active_featured
    ON products (is_active, is_featured);

-- 3.5 Compound index is_active + category_id
--     Optimasi query filter produk per kategori di halaman katalog:
--     WHERE is_active = true AND category_id = $1
CREATE INDEX IF NOT EXISTS idx_products_active_category
    ON products (is_active, category_id);

-- 3.6 Compound index is_active + price
--     Optimasi query filter rentang harga sekaligus filter aktif:
--     WHERE is_active = true AND price BETWEEN $min AND $max
CREATE INDEX IF NOT EXISTS idx_products_active_price
    ON products (is_active, price);


-- =============================================================================
-- BAGIAN 4 — VERIFIKASI FINAL (COMMENT ONLY)
-- =============================================================================
--
--  Konfirmasi field yang ADA setelah migration ini dijalankan:
--
--  IDENTITAS PRODUK:
--    ✅ id            UUID PRIMARY KEY
--    ✅ sku           VARCHAR(100) UNIQUE
--    ✅ slug          VARCHAR(220) UNIQUE
--    ✅ name          VARCHAR(200) NOT NULL
--
--  INFORMASI PRODUK:
--    ✅ short_description  VARCHAR(500)
--    ✅ description        TEXT
--
--  HARGA:
--    ✅ price           NUMERIC(12,2) NOT NULL >= 0
--    ✅ discount_price  NUMERIC(12,2) nullable, < price
--
--  STOK:
--    ✅ stock          INTEGER NOT NULL >= 0
--    ✅ minimum_stock  INTEGER NOT NULL >= 0   ← BARU
--
--  BERAT:
--    ✅ weight_gram    INTEGER nullable >= 0   ← CONSTRAINT DIPERBAIKI
--
--  DIMENSI:
--    ✅ length_cm      NUMERIC(8,2) nullable >= 0  ← BARU
--    ✅ width_cm       NUMERIC(8,2) nullable >= 0  ← BARU
--    ✅ height_cm      NUMERIC(8,2) nullable >= 0  ← BARU
--
--  SEO:
--    ✅ meta_title        VARCHAR(200)
--    ✅ meta_description  VARCHAR(500)
--
--  STATUS:
--    ✅ status      VARCHAR(20) — enum: active, inactive, draft, out_of_stock
--    ✅ is_active   BOOLEAN NOT NULL DEFAULT true  ← BARU
--    ✅ is_featured BOOLEAN NOT NULL DEFAULT false
--
--  URUTAN:
--    ✅ display_order  INTEGER NOT NULL DEFAULT 0  ← BARU
--
--  RELASI:
--    ✅ category_id → categories.id (FK, ON DELETE RESTRICT)
--
--  TIMESTAMP:
--    ✅ created_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
--    ✅ updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
--
--  TIDAK DITAMBAHKAN (sesuai spesifikasi Blueprint Final):
--    ✗ rating / average_rating  → dihitung dari tabel reviews
--    ✗ total_reviews            → COUNT(*) dari tabel reviews
--    ✗ best_seller / is_new     → dihitung dari query dinamis
--    ✗ view_count               → akan ditangani log/analytics terpisah
--
--  SELURUH INDEX YANG ADA SETELAH MIGRATION INI:
--    ✅ idx_products_slug              (slug)
--    ✅ idx_products_category_id       (category_id)
--    ✅ idx_products_status            (status)
--    ✅ idx_products_is_featured       (is_featured)
--    ✅ idx_products_sku               (sku)
--    ✅ idx_products_price             (price)
--    ✅ idx_products_is_active         (is_active)          ← BARU
--    ✅ idx_products_display_order     (display_order)       ← BARU
--    ✅ idx_products_active_order      (is_active, display_order) ← BARU
--    ✅ idx_products_active_featured   (is_active, is_featured)   ← BARU
--    ✅ idx_products_active_category   (is_active, category_id)   ← BARU
--    ✅ idx_products_active_price      (is_active, price)         ← BARU
--
-- =============================================================================
--  END OF MIGRATION — 20260729132500_enhance_products_table.sql
--  Total field baru  : 6
--  Total constraint  : 5 baru + 1 diperbaiki
--  Total index baru  : 6
-- =============================================================================
