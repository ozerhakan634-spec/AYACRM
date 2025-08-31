-- Basit Profile Photos Kurulumu
-- Bu dosya sadece gerekli sütunları ve bucket'ı oluşturur

-- 1. Consultants tablosuna profil fotoğrafı sütunları ekle
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_filename TEXT;

-- 2. İndeks ekle (performans için)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_consultants_profile_photo') THEN
        CREATE INDEX idx_consultants_profile_photo 
        ON consultants(profile_photo_url) 
        WHERE profile_photo_url IS NOT NULL;
    END IF;
END $$;

-- 3. Sütun yorumları
COMMENT ON COLUMN consultants.profile_photo_url IS 'Profil fotoğrafının public URL''si';
COMMENT ON COLUMN consultants.profile_photo_filename IS 'Storage dosya adı (silmek için)';

-- 4. Mevcut consultants verilerini kontrol et
SELECT 
    COUNT(*) as toplam_consultants,
    COUNT(profile_photo_url) as fotografi_olanlar,
    COUNT(*) - COUNT(profile_photo_url) as fotografi_olmayanlar
FROM consultants;

-- Başarı mesajı
SELECT 'Profil fotoğrafı veritabanı kurulumu tamamlandı! Şimdi Storage bucket''ı manuel oluşturun.' as message;
