-- BAŞVURU NUMARASI TAKİBİ İÇİN VERİTABANI SÜTUNLARI
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- 1. Sütunları ekle
ALTER TABLE clients ADD COLUMN IF NOT EXISTS application_number_updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS application_number_updated_by TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS application_number_manual_update BOOLEAN DEFAULT FALSE;

-- 2. Mevcut başvuru numarası olan kayıtları güncelle
UPDATE clients 
SET 
    application_number_updated_at = CURRENT_TIMESTAMP,
    application_number_manual_update = FALSE,
    application_number_updated_by = 'system'
WHERE application_number IS NOT NULL 
AND application_number != '' 
AND application_number_updated_at IS NULL;

-- 3. İndeks ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_clients_app_number_updated ON clients(application_number_updated_at);

-- 4. Kontrol sorgusu - sonuçları görmek için
SELECT 
    name,
    application_number,
    application_number_updated_at,
    application_number_manual_update,
    application_number_updated_by
FROM clients 
WHERE application_number IS NOT NULL 
AND application_number != ''
ORDER BY application_number_updated_at DESC
LIMIT 10;
