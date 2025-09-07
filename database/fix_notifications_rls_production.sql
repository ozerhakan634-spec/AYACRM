-- Production ortamında notifications tablosu RLS sorununu çöz
-- Bu scripti Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. Önce mevcut notifications tablosunu kontrol et
SELECT COUNT(*) as total_notifications FROM notifications;

-- 2. RLS durumunu kontrol et
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';

-- 3. Mevcut RLS politikalarını listele
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notifications';

-- 4. Tüm mevcut notifications politikalarını sil
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON notifications;

-- 5. RLS'yi geçici olarak devre dışı bırak
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 6. Yeni geniş RLS politikası oluştur
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users" ON notifications
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 7. Test için bir bildirim oluştur (user_id için mevcut bir değer kullan)
INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
VALUES (
  (SELECT id FROM consultants LIMIT 1),
  'Test Bildirimi',
  'Bu bir test bildirimidir',
  'info',
  false,
  NOW()
);

-- 8. Oluşturulan bildirimi kontrol et
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1;

-- 9. Son durumu kontrol et
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notifications';
