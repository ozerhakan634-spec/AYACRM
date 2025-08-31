-- Plain password sütunu ekleme
-- Bu SQL'i çalıştırarak eksik sütunu ekleyin

-- Plain password sütunu ekle
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS plain_password VARCHAR(255);

-- Username için unique constraint ekle (varsa hata vermez)
ALTER TABLE consultants ADD CONSTRAINT unique_username UNIQUE (username);

-- Kontrol sorgusu
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'consultants' 
AND column_name IN ('username', 'password', 'plain_password', 'has_credentials')
ORDER BY column_name;

-- Test sorgusu
SELECT COUNT(*) as toplam_danışman FROM consultants;
