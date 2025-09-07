-- Basit sütun ekleme - başvuru numarası takibi için

-- 1. application_number_updated_at sütunu ekle
ALTER TABLE clients ADD COLUMN IF NOT EXISTS application_number_updated_at TIMESTAMP WITH TIME ZONE;

-- 2. application_number_updated_by sütunu ekle  
ALTER TABLE clients ADD COLUMN IF NOT EXISTS application_number_updated_by TEXT;

-- 3. application_number_manual_update sütunu ekle
ALTER TABLE clients ADD COLUMN IF NOT EXISTS application_number_manual_update BOOLEAN DEFAULT FALSE;

-- Mevcut kayıtları güncelle
UPDATE clients 
SET 
    application_number_updated_at = CURRENT_TIMESTAMP,
    application_number_manual_update = FALSE
WHERE application_number IS NOT NULL 
AND application_number != '' 
AND application_number_updated_at IS NULL;
