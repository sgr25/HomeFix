ALTER TABLE children
  ADD COLUMN current_size VARCHAR(50) NOT NULL DEFAULT '';

UPDATE children
SET current_size = current_sizes[1]
WHERE current_size = '' AND array_length(current_sizes, 1) > 0;
