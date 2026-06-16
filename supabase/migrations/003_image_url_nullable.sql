-- Allow clothing items without an image
ALTER TABLE clothes ALTER COLUMN image_url DROP NOT NULL;
