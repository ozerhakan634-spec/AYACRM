-- Mevcut clients tablosuna kullanici_adi sütunu ekleme
-- Bu komutu Supabase SQL Editor'da çalıştırın

-- 1. Kullanici_adi sütununu ekle
ALTER TABLE clients 
ADD COLUMN kullanici_adi VARCHAR(100);

-- 2. Sütun açıklamasını ekle (opsiyonel)
COMMENT ON COLUMN clients.kullanici_adi IS 'Kullanıcı adı';

-- 3. Mevcut kayıtlar için varsayılan değer ata (opsiyonel)
UPDATE clients 
SET kullanici_adi = COALESCE(name, 'Kullanıcı_' || id) 
WHERE kullanici_adi IS NULL;

-- 4. Sütunun eklenip eklenmediğini kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name = 'kullanici_adi';

-- 5. Örnek veri ile test et
SELECT id, name, kullanici_adi, email 
FROM clients 
LIMIT 5; 