-- Bildirim trigger'larını geçici olarak devre dışı bırak
-- Bu scripti Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. Mevcut trigger'ları listele
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('clients', 'tasks', 'support_tickets');

-- 2. Bildirim trigger'larını devre dışı bırak
DROP TRIGGER IF EXISTS create_notification_on_client_update ON clients;
DROP TRIGGER IF EXISTS create_notification_on_task_update ON tasks;
DROP TRIGGER IF EXISTS create_notification_on_support_ticket_update ON support_tickets;

-- 3. Son durumu kontrol et
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('clients', 'tasks', 'support_tickets');
