-- Logo URL'ini kontrol etme scripti
-- Bu scripti Supabase SQL Editor'da çalıştırın

SELECT '=== COMPANY_LOGO_URL KONTROL ===' as info;

-- Mevcut company_logo_url değerini kontrol et
SELECT 
    setting_key,
    setting_value,
    setting_type,
    category,
    created_at,
    updated_at
FROM company_settings 
WHERE setting_key = 'company_logo_url';

-- Tüm company ayarlarını kontrol et
SELECT '=== TUM COMPANY AYARLARI ===' as info;
SELECT 
    setting_key,
    setting_value,
    setting_type
FROM company_settings 
WHERE category = 'company'
ORDER BY setting_key;

-- Logo URL'i null değilse test et
SELECT '=== LOGO URL TEST ===' as info;
SELECT 
    CASE 
        WHEN setting_value IS NOT NULL AND setting_value != '' 
        THEN 'Logo URL mevcut: ' || setting_value
        ELSE 'Logo URL bulunamadı veya boş'
    END as logo_status
FROM company_settings 
WHERE setting_key = 'company_logo_url';
