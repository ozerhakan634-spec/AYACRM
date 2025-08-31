-- Duplicate username sorununu çöz
-- ayajourney kullanıcısının adını değiştir

-- Önce mevcut kullanıcıları kontrol et
SELECT 
    'MEVCUT KULLANICILAR:' as baslik,
    id,
    name,
    username,
    status,
    has_credentials
FROM consultants 
ORDER BY created_at;

-- ayajourney kullanıcısının username'ini değiştir
UPDATE consultants 
SET username = 'ayajourney_backup'
WHERE username = 'ayajourney' AND id != (
    SELECT id FROM consultants WHERE username = 'admin' LIMIT 1
);

-- Admin dışındaki duplicate kullanıcıları temizle
DELETE FROM consultants 
WHERE username = 'ayajourney' AND id != (
    SELECT id FROM consultants WHERE username = 'admin' LIMIT 1
);

-- Son durumu kontrol et
SELECT 
    'DÜZELTME SONRASI:' as baslik,
    id,
    name,
    username,
    status,
    has_credentials
FROM consultants 
ORDER BY created_at;

-- Username unique constraint kontrolü
SELECT 
    'USERNAME UNIQUE KONTROLÜ:' as baslik,
    username,
    COUNT(*) as adet
FROM consultants 
GROUP BY username
HAVING COUNT(*) > 1;
