-- Basit notifications RLS düzeltme
-- Bu scripti Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. Mevcut notifications tablosunu kontrol et
SELECT COUNT(*) as total_notifications FROM notifications;

-- 2. Tüm mevcut notifications politikalarını sil
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON notifications;

-- 3. RLS'yi geçici olarak devre dışı bırak
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 4. Yeni geniş RLS politikası oluştur
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users" ON notifications
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 5. Son durumu kontrol et
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notifications';
