-- Müşteri Atama Testi
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Mevcut müşterileri kontrol et
SELECT 
  id,
  name,
  consultant_id,
  created_at
FROM clients 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Mevcut danışmanları kontrol et
SELECT 
  id,
  name,
  email
FROM consultants 
ORDER BY id 
LIMIT 5;

-- 3. Test müşterisi oluştur (eğer yoksa)
INSERT INTO clients (name, email, phone, consultant_id)
VALUES (
  'Test Müşteri - Bildirim Testi',
  'test@example.com',
  '555-1234',
  NULL
) ON CONFLICT DO NOTHING;

-- 4. Test müşterisini danışmana ata
UPDATE clients 
SET consultant_id = 1
WHERE name = 'Test Müşteri - Bildirim Testi'
  AND consultant_id IS NULL;

-- 5. Bildirimlerin oluşup oluşmadığını kontrol et
SELECT 
  id,
  user_id,
  title,
  message,
  type,
  category,
  is_read,
  created_at
FROM notifications 
WHERE category = 'client'
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Başarı mesajı
SELECT 'Müşteri atama testi tamamlandı!' AS status;
