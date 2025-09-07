-- Payments tablosunun mevcut yapısını kontrol etme
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Mevcut sütunları listele
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Tablo yapısını detaylı göster
\d payments;

-- 3. Mevcut veri sayısını kontrol et
SELECT COUNT(*) as total_payments FROM payments;

-- 4. Örnek veri göster (eğer varsa)
SELECT * FROM payments LIMIT 5;

-- 5. Tablo kısıtlamalarını kontrol et
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'payments' 
  AND table_schema = 'public';
