-- Add new shipping data columns to customers table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'district') THEN
        ALTER TABLE customers ADD COLUMN district text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'village') THEN
        ALTER TABLE customers ADD COLUMN village text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'destination_id') THEN
        ALTER TABLE customers ADD COLUMN destination_id text;
    END IF;
END $$;

-- Add corresponding snapshot columns to orders table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_district') THEN
        ALTER TABLE orders ADD COLUMN shipping_district text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_village') THEN
        ALTER TABLE orders ADD COLUMN shipping_village text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_destination_id') THEN
        ALTER TABLE orders ADD COLUMN shipping_destination_id text;
    END IF;
END $$;
