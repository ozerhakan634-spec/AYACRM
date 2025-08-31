-- Doğum Tarihi sütunu ekleme
ALTER TABLE clients ADD COLUMN dogum_tarihi DATE;

-- Sütun açıklaması ekleme
COMMENT ON COLUMN clients.dogum_tarihi IS 'Doğum tarihi';

-- Mevcut kayıtlar için varsayılan değer (opsiyonel)
-- UPDATE clients SET dogum_tarihi = NULL WHERE dogum_tarihi IS NULL;

-- Sütunun eklendiğini kontrol etme
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' AND column_name = 'dogum_tarihi';

-- Örnek veri kontrolü
SELECT id, name, dogum_tarihi, email FROM clients LIMIT 5; 