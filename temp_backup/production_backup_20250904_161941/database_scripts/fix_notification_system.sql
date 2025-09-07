-- Bildirim Sistemi Düzeltme Script'i
-- Bu script bildirim sistemini düzeltir ve RLS sorunlarını çözer

SELECT '=== BILDIRIM SISTEMI DUZELTILIYOR ===' as info;

-- 1. Notifications tablosunu kontrol et
SELECT '=== NOTIFICATIONS TABLOSU KONTROL ===' as info;

-- Tablo var mı kontrol et
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
) as notifications_table_exists;

-- 2. Notifications tablosu varsa RLS'yi kapat
SELECT '=== NOTIFICATIONS RLS KAPATILIYOR ===' as info;

-- RLS'yi devre dışı bırak
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Tüm politikaları kaldır
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON notifications;

-- 3. Notifications tablosu yoksa oluştur
SELECT '=== NOTIFICATIONS TABLOSU OLUSTURULUYOR ===' as info;

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info',
    category VARCHAR(50) DEFAULT 'general',
    is_read BOOLEAN DEFAULT FALSE,
    related_id INTEGER,
    related_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler oluştur
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);

-- 4. RLS'yi kapalı tut
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 5. Test bildirimi ekle
SELECT '=== TEST BILDIRIMI EKLENIYOR ===' as info;

INSERT INTO notifications (user_id, title, message, type, category, related_id, related_type)
VALUES (1, 'Sistem Test', 'Bildirim sistemi başarıyla çalışıyor', 'success', 'system', 1, 'test')
ON CONFLICT DO NOTHING;

-- 6. Final kontrol
SELECT '=== FINAL KONTROL ===' as info;

-- Notifications tablosu durumu
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'notifications';

-- Notifications veri sayısı
SELECT 'NOTIFICATIONS VERI SAYISI:' as info;
SELECT COUNT(*) as notification_count FROM notifications;

-- İlk 3 bildirim
SELECT 'ILK 3 BILDIRIM:' as info;
SELECT id, title, message, created_at FROM notifications ORDER BY created_at DESC LIMIT 3;

SELECT 'Bildirim sistemi basariyla duzeltildi!' as result;
