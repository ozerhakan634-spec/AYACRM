-- Tam logo URL'ini alma scripti
SELECT '=== TAM LOGO URL ===' as info;

-- Company logo URL'ini al
SELECT 
    setting_key,
    setting_value as full_logo_url,
    'Bu URL\'yi kopyalayın' as instruction
FROM company_settings 
WHERE setting_key = 'company_logo_url';

-- Eğer URL eksikse, storage bucket'ı kontrol et
SELECT '=== STORAGE BUCKET KONTROL ===' as info;
SELECT 
    name as bucket_name,
    public as is_public
FROM storage.buckets 
WHERE name = 'company-logos';

-- Storage'daki dosyaları listele
SELECT '=== STORAGE DOSYALARI ===' as info;
SELECT 
    name as file_name,
    bucket_id,
    created_at
FROM storage.objects 
WHERE bucket_id = 'company-logos'
ORDER BY created_at DESC;
