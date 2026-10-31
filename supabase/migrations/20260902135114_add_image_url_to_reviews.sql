-- Add image_url to reviews table for STEP 6E
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS image_url TEXT;
