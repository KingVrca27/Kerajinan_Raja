-- Menambahkan order_item_id ke tabel reviews untuk melacak ulasan per item pesanan
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_item_id UUID;

-- Menambahkan foreign key dari order_item_id ke tabel order_items
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_order_item_fk') THEN
        ALTER TABLE reviews ADD CONSTRAINT reviews_order_item_fk FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Memastikan 1 item pesanan hanya bisa diulas 1 kali (mencegah spam)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_review_per_order_item') THEN
        ALTER TABLE reviews ADD CONSTRAINT unique_review_per_order_item UNIQUE (order_item_id);
    END IF;
END $$;
