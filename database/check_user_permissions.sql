-- Kullanıcıların destek sayfası izinlerini kontrol et
-- Bu sorgu hangi kullanıcıların destek sayfasına erişebileceğini gösterir

SELECT 
    id,
    name,
    username,
    email,
    department,
    position,
    status,
    permissions,
    -- Destek sayfası için gerekli izinler
    CASE 
        WHEN (permissions->>'support')::boolean = true THEN '✅ DESTEK'
        ELSE '❌ DESTEK'
    END as support_permission,
    CASE 
        WHEN (permissions->>'support_management')::boolean = true THEN '✅ DESTEK YÖNETİMİ'
        ELSE '❌ DESTEK YÖNETİMİ'
    END as support_management_permission,
    -- Destek sayfası görünürlüğü
    CASE 
        WHEN (permissions->>'support')::boolean = true OR (permissions->>'support_management')::boolean = true 
        THEN '✅ DESTEK SAYFASI GÖRÜNÜR'
        ELSE '❌ DESTEK SAYFASI GİZLİ'
    END as can_see_support_page
FROM consultants 
ORDER BY 
    CASE 
        WHEN (permissions->>'support')::boolean = true THEN 1
        WHEN (permissions->>'support_management')::boolean = true THEN 2
        ELSE 3
    END,
    name;

-- Özet istatistik
SELECT 
    'ÖZET:' as baslik,
    COUNT(*) as toplam_kullanici,
    COUNT(CASE WHEN (permissions->>'support')::boolean = true THEN 1 END) as support_izni_olan,
    COUNT(CASE WHEN (permissions->>'support_management')::boolean = true THEN 1 END) as support_management_izni_olan,
    COUNT(CASE WHEN (permissions->>'support')::boolean = true OR (permissions->>'support_management')::boolean = true THEN 1 END) as destek_sayfasi_gorebilen
FROM consultants;
