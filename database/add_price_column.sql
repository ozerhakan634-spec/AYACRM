-- Clients tablosuna fiyat sütunları ekleme
-- Bu dosya Finans bölümü için gerekli fiyat bilgilerini ekler

-- Price sütunu ekle (İngilizce)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS price DECIMAL(12,2) DEFAULT 0.00;

-- Fiyat sütunu ekle (Türkçe)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS fiyat DECIMAL(12,2) DEFAULT 0.00;

-- Amount sütunu ekle (alternatif)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS amount DECIMAL(12,2) DEFAULT 0.00;

-- Fiyat sütunları için indeks oluştur
CREATE INDEX IF NOT EXISTS idx_clients_price ON clients(price);
CREATE INDEX IF NOT EXISTS idx_clients_fiyat ON clients(fiyat);
CREATE INDEX IF NOT EXISTS idx_clients_amount ON clients(amount);

-- Mevcut kayıtlar için varsayılan değer ata
UPDATE clients SET 
  price = COALESCE(price, 0.00),
  fiyat = COALESCE(fiyat, 0.00),
  amount = COALESCE(amount, 0.00)
WHERE price IS NULL OR fiyat IS NULL OR amount IS NULL;

-- Sütunların eklenip eklenmediğini kontrol et
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
  AND column_name IN ('price', 'fiyat', 'amount')
ORDER BY column_name;
