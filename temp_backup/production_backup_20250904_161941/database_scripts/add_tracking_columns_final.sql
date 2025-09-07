-- Başvuru numarası takibi için veritabanı sütunları
-- Bu sütunlar MUTLAKA eklenmeli ki farklı bilgisayarlardan erişilebilsin

-- Sütunları ekle
ALTER TABLE clients ADD COLUMN IF NOT EXISTS application_number_updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS application_number_updated_by TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS application_number_manual_update BOOLEAN DEFAULT FALSE;

-- Mevcut başvuru numarası olan kayıtları güncelle
UPDATE clients 
SET 
    application_number_updated_at = CURRENT_TIMESTAMP,
    application_number_manual_update = FALSE
WHERE application_number IS NOT NULL 
AND application_number != '' 
AND application_number_updated_at IS NULL;

-- İndeks ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_clients_app_number_updated ON clients(application_number_updated_at);

-- Kontrol sorgusu
SELECT 
    name,
    application_number,
    application_number_updated_at,
    application_number_manual_update
FROM clients 
WHERE application_number IS NOT NULL 
AND application_number != ''
LIMIT 5;
