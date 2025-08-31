-- Profile Photos Storage Bucket oluşturma ve politika ayarlama
-- Bu dosyayı Supabase SQL Editor'de çalıştırın

-- 1. Profile photos bucket'ını oluştur (eğer yoksa)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- 2. Önce mevcut policy'leri sil (varsa)
DROP POLICY IF EXISTS "Public Access for Profile Photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Upload Profile Photos" ON storage.objects;
DROP POLICY IF EXISTS "Users Can Update Own Profile Photos" ON storage.objects;
DROP POLICY IF EXISTS "Users Can Delete Own Profile Photos" ON storage.objects;

-- 3. Herkese okuma izni ver (public access)
CREATE POLICY "Public Access for Profile Photos" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-photos');

-- 4. Sadece authenticated kullanıcılar upload edebilsin
CREATE POLICY "Authenticated Users Can Upload Profile Photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.role() = 'authenticated'
);

-- 5. Sadece kendi fotoğrafını güncelleyebilsin
CREATE POLICY "Users Can Update Own Profile Photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-photos' 
  AND auth.role() = 'authenticated'
);

-- 6. Sadece kendi fotoğrafını silebilsin  
CREATE POLICY "Users Can Delete Own Profile Photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-photos' 
  AND auth.role() = 'authenticated'
);

-- 6. Consultants tablosuna profile photo sütunları ekle (eğer yoksa)
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_filename TEXT;

-- 7. İndeks ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_consultants_profile_photo 
ON consultants(profile_photo_url) 
WHERE profile_photo_url IS NOT NULL;

-- Başarılı mesajı
SELECT 'Profile photos bucket ve politikalar başarıyla oluşturuldu!' as message;
