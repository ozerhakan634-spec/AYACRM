-- Başvuru numarası güncelleme takibi için sütunlar ekleme
-- Bu sütunlar müşterilerin başvuru numarası güncellemelerini takip etmek için

-- İlk olarak sütunların var olup olmadığını kontrol edelim
DO $$ 
BEGIN 
    -- Başvuru numarası son güncelleme tarihi
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'application_number_updated_at'
    ) THEN
        ALTER TABLE clients ADD COLUMN application_number_updated_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Başvuru numarasını kimin güncellediği bilgisi
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'application_number_updated_by'
    ) THEN
        ALTER TABLE clients ADD COLUMN application_number_updated_by TEXT;
    END IF;

    -- Başvuru numarası manuel olarak mı yoksa otomatik mi güncellendi
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'application_number_manual_update'
    ) THEN
        ALTER TABLE clients ADD COLUMN application_number_manual_update BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Mevcut başvuru numarası olan kayıtlar için başlangıç değerlerini ayarla
UPDATE clients 
SET 
    application_number_updated_at = CURRENT_TIMESTAMP,
    application_number_manual_update = FALSE
WHERE application_number IS NOT NULL 
AND application_number != '' 
AND application_number_updated_at IS NULL;

-- İndeks oluşturalım performans için
CREATE INDEX IF NOT EXISTS idx_clients_application_number_updated_at ON clients(application_number_updated_at);

-- Başvuru numarası güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_application_number_tracking()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer application_number değişti ise güncelleme bilgilerini kaydet
    IF OLD.application_number IS DISTINCT FROM NEW.application_number THEN
        NEW.application_number_updated_at = CURRENT_TIMESTAMP;
        NEW.application_number_manual_update = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı oluşturalım
DROP TRIGGER IF EXISTS trigger_application_number_tracking ON clients;
CREATE TRIGGER trigger_application_number_tracking
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_application_number_tracking();

-- Test için birkaç örnek kayıt kontrol edelim
SELECT 
    name,
    application_number,
    application_number_updated_at,
    application_number_manual_update,
    CASE 
        WHEN application_number_updated_at IS NOT NULL THEN
            GREATEST(0, 20 - EXTRACT(DAY FROM CURRENT_TIMESTAMP - application_number_updated_at)::INTEGER)
        ELSE NULL 
    END as days_until_next_update
FROM clients 
WHERE application_number IS NOT NULL 
AND application_number != ''
LIMIT 5;
