-- =============================================================================
-- Migration: 20260827220000_phase_4_4m_product_chat_schema.sql
-- Phase     : 4.4M — Product Chat Database & Security Foundation
-- Tujuan    : Membuat tabel conversations + messages dengan RLS lengkap
--             untuk fitur Product Chat.
--
-- CATATAN PENTING:
-- - Tidak ada UI pada phase ini.
-- - Tidak ada realtime pada phase ini.
-- - Tidak ada notification pada phase ini.
-- - Seluruh migration bersifat additive / non-destructive.
-- - Gunakan CREATE TABLE IF NOT EXISTS agar aman dijalankan ulang.
--
-- Bergantung pada:
--   public.customers           (customers.id, customers.user_id)
--   public.products            (products.id)
--   auth.users                 (auth.uid())
--   public.get_my_role()       (dari 20260812123000_create_get_my_role_function.sql)
-- =============================================================================


-- =============================================================================
-- 1. CONVERSATIONS
--    Menyimpan satu percakapan customer mengenai satu produk.
--    Satu customer + satu product = satu conversation aktif (UNIQUE constraint).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.conversations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    product_id  UUID NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'open',
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- Satu customer hanya boleh memiliki satu conversation per produk
    CONSTRAINT conversations_customer_product_unique
        UNIQUE (customer_id, product_id),

    -- customer_id → customers (bukan langsung ke auth.users)
    -- Mengikuti pola existing project (customers.user_id = auth.uid())
    CONSTRAINT conversations_customer_fk
        FOREIGN KEY (customer_id)
        REFERENCES public.customers (id)
        ON DELETE CASCADE,

    -- product_id → products
    CONSTRAINT conversations_product_fk
        FOREIGN KEY (product_id)
        REFERENCES public.products (id)
        ON DELETE CASCADE,

    -- Hanya status yang valid
    CONSTRAINT conversations_status_check
        CHECK (status IN ('open', 'closed'))
);

COMMENT ON TABLE  public.conversations             IS 'Percakapan customer mengenai produk tertentu. Satu customer + satu produk = satu conversation.';
COMMENT ON COLUMN public.conversations.customer_id IS 'Relasi ke pelanggan pemilik conversation. Cascade delete jika customer dihapus.';
COMMENT ON COLUMN public.conversations.product_id  IS 'Produk yang dibicarakan. Cascade delete jika produk dihapus.';
COMMENT ON COLUMN public.conversations.status      IS 'Status conversation: open (aktif) atau closed (selesai/ditutup oleh admin).';
COMMENT ON COLUMN public.conversations.created_at  IS 'Waktu conversation dibuat — menggunakan server timestamp.';
COMMENT ON COLUMN public.conversations.updated_at  IS 'Waktu conversation terakhir diperbarui — diupdate oleh aplikasi saat ada pesan baru.';

-- Index untuk performa query umum
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON public.conversations (customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_product_id  ON public.conversations (product_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status      ON public.conversations (status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at  ON public.conversations (created_at DESC);


-- =============================================================================
-- 2. MESSAGES
--    Menyimpan pesan dalam conversation.
--    sender_id merujuk ke auth.users.id (bisa customer atau admin).
--    Konten disimpan sebagai plain text — bukan HTML.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID NOT NULL,
    sender_id           UUID NOT NULL,
    content             TEXT NOT NULL,
    is_read_by_admin    BOOLEAN NOT NULL DEFAULT false,
    is_read_by_customer BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- conversation_id → conversations
    CONSTRAINT messages_conversation_fk
        FOREIGN KEY (conversation_id)
        REFERENCES public.conversations (id)
        ON DELETE CASCADE,

    -- sender_id → auth.users
    -- Memastikan sender adalah authenticated user yang terdaftar di Supabase Auth
    CONSTRAINT messages_sender_fk
        FOREIGN KEY (sender_id)
        REFERENCES auth.users (id)
        ON DELETE CASCADE,

    -- Pesan tidak boleh kosong
    CONSTRAINT messages_content_not_empty
        CHECK (content <> '')
);

COMMENT ON TABLE  public.messages                     IS 'Pesan dalam conversation antara customer dan admin. Konten plain text, bukan HTML.';
COMMENT ON COLUMN public.messages.conversation_id     IS 'Relasi ke conversation. Pesan terhapus otomatis jika conversation dihapus.';
COMMENT ON COLUMN public.messages.sender_id           IS 'auth.users.id pengirim pesan (customer atau admin). Cascade delete jika user dihapus dari auth.';
COMMENT ON COLUMN public.messages.content             IS 'Isi pesan dalam plain text. Jangan menyimpan HTML mentah.';
COMMENT ON COLUMN public.messages.is_read_by_admin    IS 'True = admin sudah membaca pesan ini.';
COMMENT ON COLUMN public.messages.is_read_by_customer IS 'True = customer sudah membaca pesan ini.';
COMMENT ON COLUMN public.messages.created_at          IS 'Waktu pesan dikirim — menggunakan server timestamp dari database.';

-- Index untuk performa query umum
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id     ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id           ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at          ON public.messages (created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read_by_admin    ON public.messages (is_read_by_admin);
CREATE INDEX IF NOT EXISTS idx_messages_is_read_by_customer ON public.messages (is_read_by_customer);


-- =============================================================================
-- 3. ROW LEVEL SECURITY — CONVERSATIONS
-- =============================================================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada (idempotent — aman dijalankan ulang)
DROP POLICY IF EXISTS "conv_select_own_customer" ON public.conversations;
DROP POLICY IF EXISTS "conv_insert_own_customer" ON public.conversations;
DROP POLICY IF EXISTS "conv_all_admin"           ON public.conversations;

-- -----------------------------------------------------------------------------
-- Policy: CUSTOMER SELECT
-- Customer hanya dapat melihat conversation miliknya sendiri.
-- Validation chain: conversations.customer_id
--                   → customers.id → customers.user_id = auth.uid()
-- Tidak ada hardcoded user ID. Tidak ada bypass.
-- -----------------------------------------------------------------------------
CREATE POLICY "conv_select_own_customer"
ON public.conversations
FOR SELECT
TO authenticated
USING (
    customer_id IN (
        SELECT id
        FROM public.customers
        WHERE user_id = auth.uid()
    )
);

-- -----------------------------------------------------------------------------
-- Policy: CUSTOMER INSERT
-- Customer hanya boleh membuat conversation atas namanya sendiri.
-- Tidak bisa mengirim customer_id milik user lain — subquery memverifikasi
-- bahwa customer_id tersebut memang terhubung ke auth.uid() yang sedang login.
-- -----------------------------------------------------------------------------
CREATE POLICY "conv_insert_own_customer"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
    customer_id IN (
        SELECT id
        FROM public.customers
        WHERE user_id = auth.uid()
    )
);

-- -----------------------------------------------------------------------------
-- Policy: ADMIN ALL
-- Admin dan Superadmin dapat melakukan semua operasi pada conversations.
-- Menggunakan get_my_role() SECURITY DEFINER — tidak bisa di-spoof dari client.
-- -----------------------------------------------------------------------------
CREATE POLICY "conv_all_admin"
ON public.conversations
FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('admin', 'superadmin')
)
WITH CHECK (
    public.get_my_role() IN ('admin', 'superadmin')
);


-- =============================================================================
-- 4. ROW LEVEL SECURITY — MESSAGES
-- =============================================================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada (idempotent — aman dijalankan ulang)
DROP POLICY IF EXISTS "msg_select_own_customer" ON public.messages;
DROP POLICY IF EXISTS "msg_insert_own_customer" ON public.messages;
DROP POLICY IF EXISTS "msg_all_admin"           ON public.messages;

-- -----------------------------------------------------------------------------
-- Policy: CUSTOMER SELECT
-- Customer hanya dapat membaca pesan dalam conversation miliknya.
-- Validation chain:
--   messages.conversation_id
--   → conversations.customer_id
--   → customers.user_id = auth.uid()
-- -----------------------------------------------------------------------------
CREATE POLICY "msg_select_own_customer"
ON public.messages
FOR SELECT
TO authenticated
USING (
    conversation_id IN (
        SELECT c.id
        FROM public.conversations c
        JOIN public.customers cu ON cu.id = c.customer_id
        WHERE cu.user_id = auth.uid()
    )
);

-- -----------------------------------------------------------------------------
-- Policy: CUSTOMER INSERT
-- Customer hanya dapat mengirim pesan ke conversation miliknya.
-- Dua kondisi WAJIB terpenuhi sekaligus:
--   1. sender_id = auth.uid()           → tidak bisa spoofing sender
--   2. conversation milik customer ini  → IDOR protection
-- -----------------------------------------------------------------------------
CREATE POLICY "msg_insert_own_customer"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid()
    AND
    conversation_id IN (
        SELECT c.id
        FROM public.conversations c
        JOIN public.customers cu ON cu.id = c.customer_id
        WHERE cu.user_id = auth.uid()
    )
);

-- -----------------------------------------------------------------------------
-- Policy: ADMIN ALL
-- Admin dan Superadmin dapat melakukan semua operasi pada messages.
-- Termasuk: SELECT semua, INSERT (membalas), UPDATE (tandai is_read_by_*).
-- -----------------------------------------------------------------------------
CREATE POLICY "msg_all_admin"
ON public.messages
FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('admin', 'superadmin')
)
WITH CHECK (
    public.get_my_role() IN ('admin', 'superadmin')
);


-- =============================================================================
-- END OF MIGRATION — PHASE 4.4M
-- Total tabel baru  : 2 (conversations, messages)
-- Total policy baru : 5
-- Total index baru  : 9
-- Total constraint  : 6
--
-- TIDAK ADA:
-- - Perubahan tabel existing
-- - DROP tabel/kolom/policy existing
-- - UI changes
-- - Realtime subscription
-- - Notification
-- - Dummy data
-- =============================================================================
