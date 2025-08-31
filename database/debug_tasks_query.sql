-- Debug: Tasks ve assignments tablolarını kontrol et

-- 1. Tasks tablosunu kontrol et
SELECT 'TASKS TABLOSU' as table_name;
SELECT 
    id,
    title,
    status,
    priority,
    created_by,
    created_by_user_id,
    created_at
FROM tasks 
ORDER BY created_at DESC;

-- 2. Task assignments tablosunu kontrol et
SELECT 'TASK_ASSIGNMENTS TABLOSU' as table_name;
SELECT 
    id,
    task_id,
    consultant_id,
    consultant_name,
    assigned_at
FROM task_assignments 
ORDER BY assigned_at DESC;

-- 3. JOIN'li sorgu - görevler ve atamaları birlikte
SELECT 'GÖREVLERİN ATAMALARI' as info;
SELECT 
    t.id as task_id,
    t.title,
    t.status,
    t.created_by,
    ta.consultant_id,
    ta.consultant_name,
    ta.assigned_at
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
ORDER BY t.created_at DESC;

-- 4. Danışman bazında görev sayısı
SELECT 'DANIŞMAN BAŞINA GÖREV SAYISI' as info;
SELECT 
    ta.consultant_id,
    ta.consultant_name,
    COUNT(*) as task_count
FROM task_assignments ta
GROUP BY ta.consultant_id, ta.consultant_name
ORDER BY task_count DESC;
