-- Admin credentials detaylı kontrol
-- Login sistemindeki güvenlik şartlarını kontrol eder

SELECT 
    'ADMİN KULLANICI DETAYLI KONTROL:' as baslik,
    id,
    name,
    username,
    email,
    has_credentials,
    status,
    CASE 
        WHEN has_credentials IS NULL THEN '❌ has_credentials NULL'
        WHEN has_credentials = false THEN '❌ has_credentials FALSE'
        WHEN has_credentials = true THEN '✅ has_credentials TRUE'
    END as credentials_durumu,
    CASE 
        WHEN status IS NULL THEN '❌ status NULL'
        WHEN status != 'active' THEN '❌ status: ' || status
        WHEN status = 'active' THEN '✅ status: active'
    END as status_durumu,
    CASE 
        WHEN has_credentials = true AND status = 'active' THEN '✅ TÜM ŞARTLAR TAMAM'
        ELSE '❌ GÜVENLİK ŞARTLARI BAŞARISIZ'
    END as login_durumu
FROM consultants 
WHERE username = 'admin';

-- Eğer sorun varsa düzelt
UPDATE consultants 
SET 
    has_credentials = true,
    status = 'active'
WHERE username = 'admin';

-- Son kontrol
SELECT 
    'DÜZELTME SONRASI:' as baslik,
    username,
    has_credentials,
    status,
    CASE 
        WHEN has_credentials = true AND status = 'active' THEN '✅ LOGIN YAPABİLİR'
        ELSE '❌ HALA SORUN VAR'
    END as final_durum
FROM consultants 
WHERE username = 'admin';
