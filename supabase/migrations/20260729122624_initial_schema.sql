-- =============================================================================
--  DATABASE SCHEMA — KERAJINAN RAJA
--  Platform   : Supabase PostgreSQL
--  Dibuat     : 2026-07-29
--  Deskripsi  : Schema lengkap untuk website e-commerce dan dashboard admin
--               Kerajinan Raja — toko kerajinan tangan premium Indonesia.
--
--  URUTAN EKSEKUSI (dependency-first):
--    1. users            8. order_items      15. activity_logs
--    2. categories       9. reviews          16. inventory_logs
--    3. promotions      10. hero_banners     17. notifications
--    4. customers       11. gallery
--    5. products        12. about
--    6. product_images  13. faq
--    7. orders          14. site_settings
-- =============================================================================

-- Aktifkan ekstensi UUID (sudah aktif di Supabase secara default)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- 1. USERS
--    Akun pengguna internal (admin / superadmin) untuk dashboard.
--    Berbeda dari customers — ini adalah pengelola toko.
-- =============================================================================
CREATE TABLE users (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email            VARCHAR(255)    NOT NULL,
    full_name        VARCHAR(150)    NOT NULL,
    role             VARCHAR(20)     NOT NULL DEFAULT 'admin',
    avatar_url       TEXT,
    is_active        BOOLEAN         NOT NULL DEFAULT true,
    last_login_at    TIMESTAMP WITH TIME ZONE,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT users_email_unique     UNIQUE (email),
    CONSTRAINT users_role_check       CHECK (role IN ('admin', 'superadmin'))
);

COMMENT ON TABLE  users               IS 'Akun internal admin dan superadmin untuk dashboard pengelolaan toko.';
COMMENT ON COLUMN users.role          IS 'Hak akses pengguna: admin (akses terbatas) atau superadmin (akses penuh).';
COMMENT ON COLUMN users.is_active     IS 'False = akun dinonaktifkan, tidak dapat login.';
COMMENT ON COLUMN users.last_login_at IS 'Waktu terakhir pengguna berhasil login ke dashboard.';

CREATE INDEX idx_users_email     ON users (email);
CREATE INDEX idx_users_role      ON users (role);
CREATE INDEX idx_users_is_active ON users (is_active);


-- =============================================================================
-- 2. CATEGORIES
--    Kategori produk. Mendukung hierarki (parent_id) untuk sub-kategori.
-- =============================================================================
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   UUID,
    name        VARCHAR(100)  NOT NULL,
    slug        VARCHAR(120)  NOT NULL,
    description TEXT,
    image_url   TEXT,
    is_active   BOOLEAN       NOT NULL DEFAULT true,
    sort_order  INTEGER       NOT NULL DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT categories_slug_unique  UNIQUE (slug),
    CONSTRAINT categories_parent_fk    FOREIGN KEY (parent_id)
                                       REFERENCES categories (id)
                                       ON DELETE SET NULL
);

COMMENT ON TABLE  categories            IS 'Kategori produk. Mendukung sub-kategori melalui kolom parent_id.';
COMMENT ON COLUMN categories.parent_id  IS 'Referensi ke kategori induk. NULL berarti kategori utama (root).';
COMMENT ON COLUMN categories.slug       IS 'URL-friendly identifier unik untuk SEO (contoh: batik-tulis).';
COMMENT ON COLUMN categories.sort_order IS 'Urutan tampil di frontend. Nilai lebih kecil tampil lebih dulu.';

CREATE INDEX idx_categories_slug      ON categories (slug);
CREATE INDEX idx_categories_parent_id ON categories (parent_id);
CREATE INDEX idx_categories_is_active ON categories (is_active);


-- =============================================================================
-- 3. PROMOTIONS
--    Kode promo / diskon yang dapat diterapkan pada pesanan.
--    Dibuat lebih awal karena direferensikan oleh tabel orders.
-- =============================================================================
CREATE TABLE promotions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code         VARCHAR(50)   NOT NULL,
    name         VARCHAR(150)  NOT NULL,
    description  TEXT,
    type         VARCHAR(20)   NOT NULL,
    value        NUMERIC(12,2) NOT NULL,
    min_purchase NUMERIC(12,2) NOT NULL DEFAULT 0,
    max_discount NUMERIC(12,2),
    usage_limit  INTEGER,
    usage_count  INTEGER       NOT NULL DEFAULT 0,
    is_active    BOOLEAN       NOT NULL DEFAULT true,
    starts_at    TIMESTAMP WITH TIME ZONE,
    expires_at   TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT promotions_code_unique        UNIQUE (code),
    CONSTRAINT promotions_type_check         CHECK (type IN ('percentage', 'fixed')),
    CONSTRAINT promotions_value_check        CHECK (value > 0),
    CONSTRAINT promotions_min_purchase_check CHECK (min_purchase >= 0),
    CONSTRAINT promotions_max_discount_check CHECK (max_discount IS NULL OR max_discount > 0),
    CONSTRAINT promotions_usage_limit_check  CHECK (usage_limit IS NULL OR usage_limit > 0),
    CONSTRAINT promotions_usage_count_check  CHECK (usage_count >= 0),
    CONSTRAINT promotions_date_check         CHECK (expires_at IS NULL OR starts_at IS NULL OR expires_at > starts_at)
);

COMMENT ON TABLE  promotions              IS 'Kode promo dan diskon yang bisa digunakan pelanggan saat checkout.';
COMMENT ON COLUMN promotions.code         IS 'Kode unik yang diinput pelanggan (contoh: RAJA10).';
COMMENT ON COLUMN promotions.type         IS 'Jenis diskon: percentage (%) atau fixed (nominal Rupiah).';
COMMENT ON COLUMN promotions.value        IS 'Nilai diskon. Jika type=percentage, nilai dalam %. Jika fixed, dalam Rupiah.';
COMMENT ON COLUMN promotions.min_purchase IS 'Minimum total belanja agar promo dapat digunakan.';
COMMENT ON COLUMN promotions.max_discount IS 'Batas maksimal potongan dalam Rupiah (khusus tipe percentage).';
COMMENT ON COLUMN promotions.usage_limit  IS 'Batas total pemakaian promo. NULL = tidak terbatas.';
COMMENT ON COLUMN promotions.usage_count  IS 'Jumlah pemakaian promo saat ini.';

CREATE INDEX idx_promotions_code       ON promotions (code);
CREATE INDEX idx_promotions_is_active  ON promotions (is_active);
CREATE INDEX idx_promotions_expires_at ON promotions (expires_at);


-- =============================================================================
-- 4. CUSTOMERS
--    Data pelanggan yang melakukan pembelian di toko.
--    Berbeda dari users — customers adalah pembeli, bukan admin.
-- =============================================================================
CREATE TABLE customers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name   VARCHAR(150)  NOT NULL,
    email       VARCHAR(255)  NOT NULL,
    phone       VARCHAR(20),
    address     TEXT,
    city        VARCHAR(100),
    province    VARCHAR(100),
    postal_code VARCHAR(10),
    notes       TEXT,
    is_active   BOOLEAN       NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT customers_email_unique UNIQUE (email)
);

COMMENT ON TABLE  customers           IS 'Data pelanggan yang terdaftar dan melakukan pembelian di toko.';
COMMENT ON COLUMN customers.phone     IS 'Nomor WhatsApp / telepon pelanggan untuk notifikasi pesanan.';
COMMENT ON COLUMN customers.is_active IS 'False = pelanggan diblokir dari sistem.';
COMMENT ON COLUMN customers.notes     IS 'Catatan internal admin mengenai pelanggan.';

CREATE INDEX idx_customers_email     ON customers (email);
CREATE INDEX idx_customers_phone     ON customers (phone);
CREATE INDEX idx_customers_is_active ON customers (is_active);


-- =============================================================================
-- 5. PRODUCTS
--    Tabel utama produk kerajinan tangan.
-- =============================================================================
CREATE TABLE products (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id       UUID          NOT NULL,
    name              VARCHAR(200)  NOT NULL,
    slug              VARCHAR(220)  NOT NULL,
    short_description VARCHAR(500),
    description       TEXT,
    price             NUMERIC(12,2) NOT NULL,
    discount_price    NUMERIC(12,2),
    stock             INTEGER       NOT NULL DEFAULT 0,
    weight_gram       INTEGER,
    sku               VARCHAR(100),
    status            VARCHAR(20)   NOT NULL DEFAULT 'active',
    is_featured       BOOLEAN       NOT NULL DEFAULT false,
    meta_title        VARCHAR(200),
    meta_description  VARCHAR(500),
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT products_slug_unique          UNIQUE (slug),
    CONSTRAINT products_sku_unique           UNIQUE (sku),
    CONSTRAINT products_category_fk          FOREIGN KEY (category_id)
                                             REFERENCES categories (id)
                                             ON DELETE RESTRICT,
    CONSTRAINT products_price_check          CHECK (price >= 0),
    CONSTRAINT products_discount_price_check CHECK (discount_price IS NULL OR (discount_price >= 0 AND discount_price < price)),
    CONSTRAINT products_stock_check          CHECK (stock >= 0),
    CONSTRAINT products_weight_check         CHECK (weight_gram IS NULL OR weight_gram > 0),
    CONSTRAINT products_status_check         CHECK (status IN ('active', 'inactive', 'draft', 'out_of_stock'))
);

COMMENT ON TABLE  products                IS 'Katalog produk kerajinan tangan yang dijual di toko.';
COMMENT ON COLUMN products.category_id    IS 'Kategori produk. Tidak bisa dihapus jika masih ada produk yang menggunakannya.';
COMMENT ON COLUMN products.slug           IS 'URL-friendly identifier unik untuk halaman produk (SEO).';
COMMENT ON COLUMN products.price          IS 'Harga normal produk dalam Rupiah.';
COMMENT ON COLUMN products.discount_price IS 'Harga setelah diskon. Harus lebih kecil dari price. NULL = tidak ada diskon.';
COMMENT ON COLUMN products.weight_gram    IS 'Berat produk dalam gram untuk kalkulasi ongkos kirim.';
COMMENT ON COLUMN products.sku            IS 'Stock Keeping Unit — kode unik identifikasi produk secara internal.';
COMMENT ON COLUMN products.status         IS 'Status produk: active, inactive, draft, atau out_of_stock.';
COMMENT ON COLUMN products.is_featured    IS 'True = tampil di bagian produk unggulan di homepage.';

CREATE INDEX idx_products_slug        ON products (slug);
CREATE INDEX idx_products_category_id ON products (category_id);
CREATE INDEX idx_products_status      ON products (status);
CREATE INDEX idx_products_is_featured ON products (is_featured);
CREATE INDEX idx_products_sku         ON products (sku);
CREATE INDEX idx_products_price       ON products (price);


-- =============================================================================
-- 6. PRODUCT_IMAGES
--    Galeri gambar untuk setiap produk. Satu produk dapat memiliki banyak gambar.
-- =============================================================================
CREATE TABLE product_images (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID    NOT NULL,
    image_url  TEXT    NOT NULL,
    alt_text   VARCHAR(200),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT product_images_product_fk FOREIGN KEY (product_id)
                                         REFERENCES products (id)
                                         ON DELETE CASCADE
);

COMMENT ON TABLE  product_images            IS 'Galeri gambar produk. Setiap produk bisa memiliki banyak gambar.';
COMMENT ON COLUMN product_images.product_id IS 'Relasi ke produk. Gambar terhapus otomatis jika produk dihapus.';
COMMENT ON COLUMN product_images.is_primary IS 'True = gambar utama yang ditampilkan sebagai thumbnail produk.';
COMMENT ON COLUMN product_images.sort_order IS 'Urutan tampil gambar dalam galeri produk.';
COMMENT ON COLUMN product_images.alt_text   IS 'Teks alternatif gambar untuk aksesibilitas dan SEO.';

CREATE INDEX idx_product_images_product_id ON product_images (product_id);
CREATE INDEX idx_product_images_is_primary ON product_images (is_primary);


-- =============================================================================
-- 7. ORDERS
--    Data pesanan pelanggan. Menyimpan snapshot harga, diskon, dan ongkir
--    agar tidak berubah meski pengaturan promo atau produk diedit.
-- =============================================================================
CREATE TABLE orders (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number         VARCHAR(50)   NOT NULL,
    customer_id          UUID          NOT NULL,
    promotion_id         UUID,
    status               VARCHAR(20)   NOT NULL DEFAULT 'pending',
    payment_status       VARCHAR(20)   NOT NULL DEFAULT 'unpaid',
    payment_method       VARCHAR(100),
    subtotal             NUMERIC(12,2) NOT NULL,
    discount_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    shipping_cost        NUMERIC(12,2) NOT NULL DEFAULT 0,
    total                NUMERIC(12,2) NOT NULL,
    shipping_name        VARCHAR(150),
    shipping_phone       VARCHAR(20),
    shipping_address     TEXT,
    shipping_city        VARCHAR(100),
    shipping_province    VARCHAR(100),
    shipping_postal_code VARCHAR(10),
    shipping_courier     VARCHAR(100),
    tracking_number      VARCHAR(100),
    notes                TEXT,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT orders_order_number_unique  UNIQUE (order_number),
    CONSTRAINT orders_customer_fk          FOREIGN KEY (customer_id)
                                           REFERENCES customers (id)
                                           ON DELETE RESTRICT,
    CONSTRAINT orders_promotion_fk         FOREIGN KEY (promotion_id)
                                           REFERENCES promotions (id)
                                           ON DELETE SET NULL,
    CONSTRAINT orders_status_check         CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('unpaid', 'paid', 'partial', 'refunded')),
    CONSTRAINT orders_subtotal_check       CHECK (subtotal >= 0),
    CONSTRAINT orders_discount_check       CHECK (discount_amount >= 0),
    CONSTRAINT orders_shipping_cost_check  CHECK (shipping_cost >= 0),
    CONSTRAINT orders_total_check          CHECK (total >= 0)
);

COMMENT ON TABLE  orders                  IS 'Rekap seluruh pesanan dari pelanggan.';
COMMENT ON COLUMN orders.order_number     IS 'Nomor pesanan unik yang ditampilkan ke pelanggan (contoh: KR-20260729-001).';
COMMENT ON COLUMN orders.customer_id      IS 'Relasi ke pelanggan. Tidak bisa dihapus jika masih ada pesanan aktif.';
COMMENT ON COLUMN orders.promotion_id     IS 'Promo yang digunakan. NULL = tidak memakai promo.';
COMMENT ON COLUMN orders.status           IS 'Status pesanan: pending > confirmed > processing > shipped > delivered. Bisa cancelled/refunded.';
COMMENT ON COLUMN orders.payment_status   IS 'Status pembayaran: unpaid, paid, partial, refunded.';
COMMENT ON COLUMN orders.subtotal         IS 'Total harga produk sebelum diskon dan ongkir.';
COMMENT ON COLUMN orders.discount_amount  IS 'Nominal diskon dari promo yang diaplikasikan.';
COMMENT ON COLUMN orders.shipping_cost    IS 'Ongkos kirim.';
COMMENT ON COLUMN orders.total            IS 'Total akhir = subtotal - discount_amount + shipping_cost.';
COMMENT ON COLUMN orders.tracking_number  IS 'Nomor resi pengiriman dari kurir.';

CREATE INDEX idx_orders_order_number   ON orders (order_number);
CREATE INDEX idx_orders_customer_id    ON orders (customer_id);
CREATE INDEX idx_orders_promotion_id   ON orders (promotion_id);
CREATE INDEX idx_orders_status         ON orders (status);
CREATE INDEX idx_orders_payment_status ON orders (payment_status);
CREATE INDEX idx_orders_created_at     ON orders (created_at DESC);


-- =============================================================================
-- 8. ORDER_ITEMS
--    Item (produk) yang ada dalam setiap pesanan. Menyimpan snapshot
--    nama dan harga produk saat pembelian agar tidak berubah jika produk diedit.
-- =============================================================================
CREATE TABLE order_items (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     UUID          NOT NULL,
    product_id   UUID,
    product_name VARCHAR(200)  NOT NULL,
    product_sku  VARCHAR(100),
    quantity     INTEGER       NOT NULL,
    unit_price   NUMERIC(12,2) NOT NULL,
    subtotal     NUMERIC(12,2) NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT order_items_order_fk       FOREIGN KEY (order_id)
                                          REFERENCES orders (id)
                                          ON DELETE CASCADE,
    CONSTRAINT order_items_product_fk     FOREIGN KEY (product_id)
                                          REFERENCES products (id)
                                          ON DELETE SET NULL,
    CONSTRAINT order_items_quantity_check CHECK (quantity > 0),
    CONSTRAINT order_items_price_check    CHECK (unit_price >= 0),
    CONSTRAINT order_items_subtotal_check CHECK (subtotal >= 0)
);

COMMENT ON TABLE  order_items              IS 'Detail item produk dalam setiap pesanan.';
COMMENT ON COLUMN order_items.order_id     IS 'Relasi ke pesanan. Item terhapus otomatis jika pesanan dihapus.';
COMMENT ON COLUMN order_items.product_id   IS 'Relasi ke produk. NULL jika produk telah dihapus dari katalog.';
COMMENT ON COLUMN order_items.product_name IS 'Snapshot nama produk saat pembelian agar tidak berubah jika katalog diedit.';
COMMENT ON COLUMN order_items.product_sku  IS 'Snapshot SKU produk saat pembelian.';
COMMENT ON COLUMN order_items.unit_price   IS 'Snapshot harga satuan saat pembelian.';
COMMENT ON COLUMN order_items.subtotal     IS 'quantity x unit_price.';

CREATE INDEX idx_order_items_order_id   ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);


-- =============================================================================
-- 9. REVIEWS
--    Ulasan dan rating produk dari pelanggan yang sudah membeli.
-- =============================================================================
CREATE TABLE reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID     NOT NULL,
    customer_id UUID,
    rating      SMALLINT NOT NULL,
    title       VARCHAR(200),
    content     TEXT,
    is_approved BOOLEAN  NOT NULL DEFAULT false,
    admin_reply TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT reviews_product_fk   FOREIGN KEY (product_id)
                                    REFERENCES products (id)
                                    ON DELETE CASCADE,
    CONSTRAINT reviews_customer_fk  FOREIGN KEY (customer_id)
                                    REFERENCES customers (id)
                                    ON DELETE SET NULL,
    CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5)
);

COMMENT ON TABLE  reviews             IS 'Ulasan dan penilaian produk dari pelanggan.';
COMMENT ON COLUMN reviews.product_id  IS 'Relasi ke produk. Ulasan terhapus otomatis jika produk dihapus.';
COMMENT ON COLUMN reviews.customer_id IS 'Relasi ke pelanggan. NULL jika akun pelanggan dihapus.';
COMMENT ON COLUMN reviews.rating      IS 'Penilaian 1 hingga 5 bintang.';
COMMENT ON COLUMN reviews.is_approved IS 'Ulasan hanya tampil di frontend setelah disetujui oleh admin.';
COMMENT ON COLUMN reviews.admin_reply IS 'Balasan resmi dari admin/toko terhadap ulasan pelanggan.';

CREATE INDEX idx_reviews_product_id  ON reviews (product_id);
CREATE INDEX idx_reviews_customer_id ON reviews (customer_id);
CREATE INDEX idx_reviews_rating      ON reviews (rating);
CREATE INDEX idx_reviews_is_approved ON reviews (is_approved);


-- =============================================================================
-- 10. HERO_BANNERS
--     Banner utama di halaman beranda untuk promosi dan highlight produk.
-- =============================================================================
CREATE TABLE hero_banners (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title      VARCHAR(200) NOT NULL,
    subtitle   TEXT,
    image_url  TEXT         NOT NULL,
    link_url   TEXT,
    link_text  VARCHAR(100),
    is_active  BOOLEAN      NOT NULL DEFAULT true,
    sort_order INTEGER      NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE  hero_banners            IS 'Banner slider di halaman beranda untuk kampanye dan promosi.';
COMMENT ON COLUMN hero_banners.link_url   IS 'URL tujuan saat banner diklik (contoh: /kategori/batik atau /produk/slug).';
COMMENT ON COLUMN hero_banners.link_text  IS 'Teks tombol CTA pada banner (contoh: Belanja Sekarang).';
COMMENT ON COLUMN hero_banners.is_active  IS 'Hanya banner aktif yang ditampilkan di frontend.';
COMMENT ON COLUMN hero_banners.sort_order IS 'Urutan tampil banner dalam slider. Nilai lebih kecil tampil pertama.';

CREATE INDEX idx_hero_banners_is_active  ON hero_banners (is_active);
CREATE INDEX idx_hero_banners_sort_order ON hero_banners (sort_order);


-- =============================================================================
-- 11. GALLERY
--     Galeri foto produk, workshop, atau behind-the-scenes untuk halaman galeri.
-- =============================================================================
CREATE TABLE gallery (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(200),
    description TEXT,
    image_url   TEXT    NOT NULL,
    alt_text    VARCHAR(200),
    category    VARCHAR(100),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE  gallery            IS 'Galeri foto untuk ditampilkan di halaman galeri website.';
COMMENT ON COLUMN gallery.category   IS 'Pengelompokan foto (contoh: produk, workshop, acara, behind-the-scenes).';
COMMENT ON COLUMN gallery.alt_text   IS 'Deskripsi alternatif gambar untuk aksesibilitas dan SEO.';
COMMENT ON COLUMN gallery.is_active  IS 'Hanya item aktif yang ditampilkan di halaman galeri.';

CREATE INDEX idx_gallery_is_active ON gallery (is_active);
CREATE INDEX idx_gallery_category  ON gallery (category);


-- =============================================================================
-- 12. ABOUT
--     Konten halaman "Tentang Kami" yang dibagi per section agar
--     masing-masing bagian dapat diedit secara independen dari dashboard.
-- =============================================================================
CREATE TABLE about (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section    VARCHAR(100) NOT NULL,
    title      VARCHAR(200),
    content    TEXT,
    image_url  TEXT,
    is_active  BOOLEAN      NOT NULL DEFAULT true,
    sort_order INTEGER      NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT about_section_unique UNIQUE (section)
);

COMMENT ON TABLE  about            IS 'Konten halaman Tentang Kami, dibagi per section yang dikelola secara terpisah.';
COMMENT ON COLUMN about.section    IS 'Identifier section unik (contoh: hero, story, mission, vision, team).';
COMMENT ON COLUMN about.content    IS 'Isi konten section. Dapat berisi teks panjang atau HTML sederhana.';
COMMENT ON COLUMN about.is_active  IS 'Section tidak aktif tidak akan ditampilkan di halaman About.';

CREATE INDEX idx_about_is_active  ON about (is_active);
CREATE INDEX idx_about_sort_order ON about (sort_order);


-- =============================================================================
-- 13. FAQ
--     Daftar Pertanyaan yang Sering Diajukan untuk halaman bantuan pelanggan.
-- =============================================================================
CREATE TABLE faq (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question   TEXT         NOT NULL,
    answer     TEXT         NOT NULL,
    category   VARCHAR(100),
    is_active  BOOLEAN      NOT NULL DEFAULT true,
    sort_order INTEGER      NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE  faq            IS 'Kumpulan pertanyaan dan jawaban umum untuk halaman FAQ website.';
COMMENT ON COLUMN faq.category   IS 'Kelompok topik FAQ (contoh: pengiriman, pembayaran, produk, retur).';
COMMENT ON COLUMN faq.is_active  IS 'FAQ tidak aktif tidak ditampilkan di website.';
COMMENT ON COLUMN faq.sort_order IS 'Urutan tampil FAQ dalam setiap kategori.';

CREATE INDEX idx_faq_is_active ON faq (is_active);
CREATE INDEX idx_faq_category  ON faq (category);


-- =============================================================================
-- 14. SITE_SETTINGS
--     Pengaturan global website berbasis key-value. Dapat dikelola dari
--     dashboard admin tanpa perlu mengubah kode atau melakukan deploy ulang.
-- =============================================================================
CREATE TABLE site_settings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         VARCHAR(100) NOT NULL,
    value       TEXT,
    label       VARCHAR(200),
    description TEXT,
    type        VARCHAR(20)  NOT NULL DEFAULT 'text',
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT site_settings_key_unique  UNIQUE (key),
    CONSTRAINT site_settings_type_check  CHECK (type IN ('text', 'number', 'boolean', 'json', 'image', 'color'))
);

COMMENT ON TABLE  site_settings             IS 'Pengaturan global website dengan pola key-value yang fleksibel.';
COMMENT ON COLUMN site_settings.key         IS 'Identifier unik pengaturan (contoh: site_name, whatsapp_number, primary_color).';
COMMENT ON COLUMN site_settings.value       IS 'Nilai pengaturan dalam format teks. Parsing disesuaikan dengan kolom type.';
COMMENT ON COLUMN site_settings.label       IS 'Label ramah pengguna yang tampil di form dashboard admin.';
COMMENT ON COLUMN site_settings.type        IS 'Tipe nilai: text, number, boolean, json, image, color.';

CREATE INDEX idx_site_settings_key ON site_settings (key);


-- =============================================================================
-- 15. ACTIVITY_LOGS
--     Rekam jejak setiap aktivitas admin di dashboard untuk keperluan audit.
-- =============================================================================
CREATE TABLE activity_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id   UUID,
    description TEXT,
    metadata    JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT activity_logs_user_fk FOREIGN KEY (user_id)
                                     REFERENCES users (id)
                                     ON DELETE SET NULL
);

COMMENT ON TABLE  activity_logs             IS 'Log aktivitas admin untuk keperluan audit dan keamanan dashboard.';
COMMENT ON COLUMN activity_logs.user_id     IS 'Admin yang melakukan aksi. NULL jika aksi dilakukan oleh sistem secara otomatis.';
COMMENT ON COLUMN activity_logs.action      IS 'Jenis aksi yang dilakukan (contoh: create_product, update_order, delete_user).';
COMMENT ON COLUMN activity_logs.entity_type IS 'Nama tabel entitas yang terpengaruh (contoh: products, orders, users).';
COMMENT ON COLUMN activity_logs.entity_id   IS 'UUID baris entitas yang terpengaruh oleh aksi.';
COMMENT ON COLUMN activity_logs.metadata    IS 'Data tambahan dalam format JSON (contoh: perubahan field sebelum dan sesudah).';
COMMENT ON COLUMN activity_logs.ip_address  IS 'Alamat IP admin saat melakukan aksi.';

CREATE INDEX idx_activity_logs_user_id     ON activity_logs (user_id);
CREATE INDEX idx_activity_logs_action      ON activity_logs (action);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs (entity_type);
CREATE INDEX idx_activity_logs_entity_id   ON activity_logs (entity_id);
CREATE INDEX idx_activity_logs_created_at  ON activity_logs (created_at DESC);


-- =============================================================================
-- 16. INVENTORY_LOGS
--     Riwayat setiap perubahan stok produk untuk keperluan audit inventori
--     dan rekonsiliasi stok secara berkala.
-- =============================================================================
CREATE TABLE inventory_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id     UUID     NOT NULL,
    user_id        UUID,
    type           VARCHAR(20) NOT NULL,
    quantity       INTEGER  NOT NULL,
    stock_before   INTEGER  NOT NULL,
    stock_after    INTEGER  NOT NULL,
    reference_type VARCHAR(50),
    reference_id   UUID,
    notes          TEXT,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT inventory_logs_product_fk     FOREIGN KEY (product_id)
                                             REFERENCES products (id)
                                             ON DELETE CASCADE,
    CONSTRAINT inventory_logs_user_fk        FOREIGN KEY (user_id)
                                             REFERENCES users (id)
                                             ON DELETE SET NULL,
    CONSTRAINT inventory_logs_type_check     CHECK (type IN ('in', 'out', 'adjustment', 'return')),
    CONSTRAINT inventory_logs_quantity_check CHECK (quantity <> 0),
    CONSTRAINT inventory_logs_stock_check    CHECK (stock_before >= 0 AND stock_after >= 0)
);

COMMENT ON TABLE  inventory_logs                IS 'Log setiap perubahan stok produk untuk audit dan rekonsiliasi inventori.';
COMMENT ON COLUMN inventory_logs.product_id     IS 'Produk yang stoknya berubah. Log terhapus otomatis jika produk dihapus.';
COMMENT ON COLUMN inventory_logs.user_id        IS 'Admin yang mencatat perubahan. NULL jika otomatis dari sistem (order/retur).';
COMMENT ON COLUMN inventory_logs.type           IS 'Jenis perubahan: in (masuk), out (keluar), adjustment (koreksi), return (retur).';
COMMENT ON COLUMN inventory_logs.quantity       IS 'Jumlah perubahan stok. Positif = stok masuk, negatif = stok keluar.';
COMMENT ON COLUMN inventory_logs.stock_before   IS 'Jumlah stok sebelum perubahan terjadi.';
COMMENT ON COLUMN inventory_logs.stock_after    IS 'Jumlah stok setelah perubahan terjadi.';
COMMENT ON COLUMN inventory_logs.reference_type IS 'Sumber perubahan stok (contoh: order, manual_adjustment, return_order).';
COMMENT ON COLUMN inventory_logs.reference_id   IS 'UUID entitas sumber perubahan (contoh: UUID order yang memicu pengurangan stok).';

CREATE INDEX idx_inventory_logs_product_id   ON inventory_logs (product_id);
CREATE INDEX idx_inventory_logs_user_id      ON inventory_logs (user_id);
CREATE INDEX idx_inventory_logs_type         ON inventory_logs (type);
CREATE INDEX idx_inventory_logs_reference_id ON inventory_logs (reference_id);
CREATE INDEX idx_inventory_logs_created_at   ON inventory_logs (created_at DESC);


-- =============================================================================
-- 17. NOTIFICATIONS
--     Notifikasi untuk admin terkait pesanan baru, ulasan masuk,
--     stok menipis, pembayaran, dan event sistem lainnya.
-- =============================================================================
CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID,
    type       VARCHAR(50)  NOT NULL,
    title      VARCHAR(200) NOT NULL,
    message    TEXT         NOT NULL,
    is_read    BOOLEAN      NOT NULL DEFAULT false,
    link_url   TEXT,
    metadata   JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT notifications_user_fk    FOREIGN KEY (user_id)
                                        REFERENCES users (id)
                                        ON DELETE CASCADE,
    CONSTRAINT notifications_type_check CHECK (type IN ('order', 'review', 'stock', 'promotion', 'payment', 'system'))
);

COMMENT ON TABLE  notifications          IS 'Notifikasi untuk admin dashboard terkait aktivitas penting di toko.';
COMMENT ON COLUMN notifications.user_id  IS 'Admin penerima notifikasi. NULL = notifikasi broadcast untuk semua admin.';
COMMENT ON COLUMN notifications.type     IS 'Kategori notifikasi: order, review, stock, promotion, payment, system.';
COMMENT ON COLUMN notifications.is_read  IS 'False = notifikasi belum dibaca oleh admin.';
COMMENT ON COLUMN notifications.link_url IS 'URL di dashboard yang relevan (contoh: /admin/orders/<uuid>).';
COMMENT ON COLUMN notifications.metadata IS 'Data tambahan dalam format JSON (contoh: order_number, product_id).';

CREATE INDEX idx_notifications_user_id    ON notifications (user_id);
CREATE INDEX idx_notifications_type       ON notifications (type);
CREATE INDEX idx_notifications_is_read    ON notifications (is_read);
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);


-- =============================================================================
--  END OF SCHEMA — KERAJINAN RAJA
--  Total tabel  : 17
--  Total index  : 47
--
--  CATATAN PENTING:
--  - Jalankan script ini SEKALI pada database baru yang masih kosong.
--  - Tidak ada trigger, function, RLS, atau dummy data di file ini.
--  - Kolom updated_at perlu diperbarui secara manual dari sisi aplikasi.
--  - UUID dihasilkan PostgreSQL via gen_random_uuid() dari ekstensi pgcrypto.
--  - Cara menjalankan: Supabase Dashboard > SQL Editor > paste & Run.
-- =============================================================================
