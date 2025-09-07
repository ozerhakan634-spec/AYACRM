-- notifications tablosunun yapısını kontrol et
-- Bu scripti Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. Tablo yapısını kontrol et
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 2. Mevcut verileri kontrol et
SELECT * FROM notifications LIMIT 5;

-- 3. RLS durumunu kontrol et
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';
