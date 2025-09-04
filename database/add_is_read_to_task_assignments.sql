-- Task assignments tablosuna is_read sütunu ekleme
ALTER TABLE task_assignments 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Mevcut kayıtlar için is_read değerini false olarak ayarla
UPDATE task_assignments 
SET is_read = FALSE 
WHERE is_read IS NULL;

-- Sütunun NULL olmamasını sağla
ALTER TABLE task_assignments 
ALTER COLUMN is_read SET NOT NULL;

-- İndeks ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_task_assignments_is_read 
ON task_assignments(is_read);

-- Değişiklikleri onayla
COMMIT;
