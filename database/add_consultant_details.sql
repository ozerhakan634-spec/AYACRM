-- Consultants tablosuna detay bilgileri sütunları ekleme
-- Bu dosyayı veritabanında çalıştırın

-- Eğitim bilgileri sütunu ekle
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS education TEXT;

-- Sertifikalar sütunu ekle
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS certifications TEXT;

-- Konuştuğu diller sütunu ekle
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS languages TEXT;

-- Notlar sütunu ekle
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS notes TEXT;

-- Mevcut kayıtları güncelle (opsiyonel)
UPDATE consultants SET 
  education = COALESCE(education, ''),
  certifications = COALESCE(certifications, ''),
  languages = COALESCE(languages, ''),
  notes = COALESCE(notes, '')
WHERE education IS NULL OR certifications IS NULL OR languages IS NULL OR notes IS NULL;

-- Değişiklikleri onayla
COMMIT; 