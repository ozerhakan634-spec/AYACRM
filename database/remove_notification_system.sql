-- Bildirim Sistemini Tamamen Kaldırma Script'i
-- Bu script bildirim sistemini tamamen kaldırır ve önceki haline döndürür

-- 1. Notification trigger'larını kaldır
SELECT '=== NOTIFICATION TRIGGERLARINI KALDIRIYORUM ===' as info;

-- Mevcut trigger'ları listele
SELECT trigger_name, table_name, event_manipulation 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%notification%' OR trigger_name LIKE '%client%' OR trigger_name LIKE '%task%' OR trigger_name LIKE '%support%';

-- Trigger'ları kaldır
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name, table_name
        FROM information_schema.triggers 
        WHERE trigger_name LIKE '%notification%' OR trigger_name LIKE '%client%' OR trigger_name LIKE '%task%' OR trigger_name LIKE '%support%'
    LOOP
        BEGIN
            EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON ' || trigger_record.table_name;
            RAISE NOTICE 'Trigger kaldirildi: % on table %', trigger_record.trigger_name, trigger_record.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Trigger kaldirilirken hata: % on table % - %', trigger_record.trigger_name, trigger_record.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. Notification fonksiyonlarını kaldır
SELECT '=== NOTIFICATION FONKSIYONLARINI KALDIRIYORUM ===' as info;

-- Mevcut fonksiyonları listele
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%notification%' OR routine_name LIKE '%create_notification%';

-- Fonksiyonları kaldır
DROP FUNCTION IF EXISTS create_notification_for_task_assignment() CASCADE;
DROP FUNCTION IF EXISTS create_notification_for_client_assignment() CASCADE;
DROP FUNCTION IF EXISTS create_notification_for_support_update() CASCADE;
DROP FUNCTION IF EXISTS create_notification(text, text, text, text) CASCADE;

-- 3. Notifications tablosunu kaldır
SELECT '=== NOTIFICATIONS TABLOSUNU KALDIRIYORUM ===' as info;

-- RLS politikalarını kaldır
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON notifications;

-- Tabloyu kaldır
DROP TABLE IF EXISTS notifications CASCADE;

-- 4. RLS politikalarını eski haline döndür
SELECT '=== RLS POLITIKALARINI ESKI HALINE DONDUROYORUM ===' as info;

-- Clients tablosu için basit RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON clients;
CREATE POLICY "Enable all operations for authenticated users" ON clients
    FOR ALL USING (auth.role() = 'authenticated');

-- Consultants tablosu için basit RLS
ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON consultants;
CREATE POLICY "Enable all operations for authenticated users" ON consultants
    FOR ALL USING (auth.role() = 'authenticated');

-- Tasks tablosu için basit RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON tasks;
CREATE POLICY "Enable all operations for authenticated users" ON tasks
    FOR ALL USING (auth.role() = 'authenticated');

-- Support tickets tablosu için basit RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON support_tickets;
CREATE POLICY "Enable all operations for authenticated users" ON support_tickets
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Final kontrol
SELECT '=== FINAL KONTROL ===' as info;

-- Kalan trigger'ları kontrol et
SELECT trigger_name, table_name 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%notification%';

-- Kalan fonksiyonları kontrol et
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%notification%';

-- Tabloları kontrol et
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'notifications';

SELECT 'Bildirim sistemi basariyla kaldirildi!' as result;
