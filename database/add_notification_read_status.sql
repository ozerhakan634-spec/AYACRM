-- Bildirim okundu durumunu takip etmek için task_assignments tablosuna alan ekleme

-- read_at alanını ekle (bildirim ne zaman okundu)
ALTER TABLE task_assignments 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- is_read boolean alanını ekle (okundu/okunmadı durumu)
ALTER TABLE task_assignments 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Index ekle performans için
CREATE INDEX IF NOT EXISTS idx_task_assignments_is_read ON task_assignments(is_read);
CREATE INDEX IF NOT EXISTS idx_task_assignments_read_at ON task_assignments(read_at);

-- Mevcut kayıtları varsayılan olarak okunmamış işaretle
UPDATE task_assignments 
SET is_read = FALSE, read_at = NULL 
WHERE is_read IS NULL;
