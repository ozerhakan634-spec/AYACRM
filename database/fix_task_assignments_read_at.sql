-- Task Assignments Tablosuna read_at Sütunu Ekleme
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- read_at sütununu ekle (eğer yoksa)
ALTER TABLE task_assignments 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Mevcut kayıtlar için read_at değerini NULL olarak ayarla
UPDATE task_assignments 
SET read_at = NULL 
WHERE read_at IS NULL;

-- Sütunun eklendiğini kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'task_assignments' 
  AND column_name = 'read_at';

-- Başarı mesajı
SELECT 'read_at sütunu başarıyla eklendi!' AS status;
