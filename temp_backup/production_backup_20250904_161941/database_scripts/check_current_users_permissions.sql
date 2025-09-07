-- Mevcut kullanıcıları ve izinlerini kontrol et
-- Bu sorgu hangi kullanıcıların hangi izinlere sahip olduğunu gösterir

SELECT 
    id,
    name,
    username,
    email,
    department,
    position,
    status,
    permissions,
    -- Silme butonu için gerekli izinler
    CASE 
        WHEN (permissions->>'settings')::boolean = true THEN '✅ SETTINGS'
        ELSE '❌ SETTINGS'
    END as settings_permission,
    CASE 
        WHEN (permissions->>'support')::boolean = true THEN '✅ SUPPORT'
        ELSE '❌ SUPPORT'
    END as support_permission,
    -- Silme butonu görünürlüğü
    CASE 
        WHEN (permissions->>'settings')::boolean = true OR (permissions->>'support')::boolean = true 
        THEN '✅ SİLME BUTONU GÖRÜNÜR'
        ELSE '❌ SİLME BUTONU GİZLİ'
    END as can_delete_tickets
FROM consultants 
ORDER BY 
    CASE 
        WHEN (permissions->>'settings')::boolean = true THEN 1
        WHEN (permissions->>'support')::boolean = true THEN 2
        ELSE 3
    END,
    name;

-- Özet istatistik
SELECT 
    'ÖZET:' as baslik,
    COUNT(*) as toplam_kullanici,
    COUNT(CASE WHEN (permissions->>'settings')::boolean = true THEN 1 END) as settings_izni_olan,
    COUNT(CASE WHEN (permissions->>'support')::boolean = true THEN 1 END) as support_izni_olan,
    COUNT(CASE WHEN (permissions->>'settings')::boolean = true OR (permissions->>'support')::boolean = true THEN 1 END) as silme_butonu_gorebilen
FROM consultants;
