-- Consultants tablosuna profil fotoğrafı sütunları ekleme
-- Bu dosya profil fotoğrafı özelliği için gerekli veritabanı değişikliklerini yapar

-- 1. Profil fotoğrafı sütunlarını ekle (eğer yoksa)
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_filename TEXT;

-- 2. Sütunlara yorum ekle (dokümantasyon için)
COMMENT ON COLUMN consultants.profile_photo_url IS 'Danışmanın profil fotoğrafının public URL''si';
COMMENT ON COLUMN consultants.profile_photo_filename IS 'Storage''da saklanan dosyanın adı (silmek için gerekli)';

-- 3. İndeks ekle (performans için, sadece fotoğrafı olan kullanıcılar için)
CREATE INDEX IF NOT EXISTS idx_consultants_profile_photo 
ON consultants(profile_photo_url) 
WHERE profile_photo_url IS NOT NULL;

-- 4. Mevcut sütunları kontrol et ve bilgi ver
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'consultants' 
AND column_name IN ('profile_photo_url', 'profile_photo_filename')
ORDER BY column_name;

-- Başarı mesajı
SELECT 'Profil fotoğrafı sütunları başarıyla eklendi!' as message;
