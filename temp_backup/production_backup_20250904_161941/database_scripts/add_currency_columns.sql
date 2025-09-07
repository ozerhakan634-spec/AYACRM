-- Clients tablosuna para birimi sütunları ekleme
-- Bu dosya Finans bölümü için gerekli para birimi bilgilerini ekler

-- Currency sütunu ekle (İngilizce)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'TRY';

-- Para birimi sütunu ekle (Türkçe)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS para_birimi VARCHAR(10) DEFAULT 'TRY';

-- Para birimi sütunları için indeks oluştur
CREATE INDEX IF NOT EXISTS idx_clients_currency ON clients(currency);
CREATE INDEX IF NOT EXISTS idx_clients_para_birimi ON clients(para_birimi);

-- Mevcut kayıtlar için varsayılan değer ata
UPDATE clients SET 
  currency = COALESCE(currency, 'TRY'),
  para_birimi = COALESCE(para_birimi, 'TRY')
WHERE currency IS NULL OR para_birimi IS NULL;

-- Sütunların eklendiğini doğrula
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'clients' 
  AND column_name IN ('currency', 'para_birimi')
ORDER BY column_name;
