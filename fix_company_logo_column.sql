-- Production'da eksik olan company_logo_url sütununu ekleme scripti
-- Bu script production veritabanında çalıştırılmalıdır

SELECT '=== COMPANY_LOGO_URL SUTUNU KONTROL EDILIYOR ===' as info;

-- Önce mevcut company_settings tablosunu kontrol et
SELECT '=== MEVCUT TABLO YAPISI ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'company_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- company_logo_url sütunu var mı kontrol et
SELECT '=== COMPANY_LOGO_URL SUTUNU KONTROL ===' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'company_settings' 
            AND column_name = 'company_logo_url'
            AND table_schema = 'public'
        ) 
        THEN 'company_logo_url sütunu MEVCUT'
        ELSE 'company_logo_url sütunu EKSIK - EKLENECEK'
    END as logo_column_status;

-- Eğer sütun yoksa ekle
DO $$
BEGIN
    -- company_logo_url sütunu var mı kontrol et
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_settings' 
        AND column_name = 'company_logo_url'
        AND table_schema = 'public'
    ) THEN
        -- Sütunu ekle
        ALTER TABLE company_settings 
        ADD COLUMN company_logo_url TEXT;
        
        RAISE NOTICE 'company_logo_url sütunu başarıyla eklendi!';
    ELSE
        RAISE NOTICE 'company_logo_url sütunu zaten mevcut!';
    END IF;
END $$;

-- Şimdi company_logo_url ayarını ekle (eğer yoksa)
SELECT '=== COMPANY_LOGO_URL AYARI EKLENIYOR ===' as info;
INSERT INTO company_settings (setting_key, setting_value, setting_type, category, description) 
VALUES ('company_logo_url', null, 'string', 'company', 'Şirket logo URL adresi')
ON CONFLICT (setting_key) DO NOTHING;

-- Final kontrol
SELECT '=== FINAL KONTROL ===' as info;

-- Sütun kontrolü
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'company_settings' 
            AND column_name = 'company_logo_url'
            AND table_schema = 'public'
        ) 
        THEN '✅ company_logo_url sütunu MEVCUT'
        ELSE '❌ company_logo_url sütunu HALA EKSIK'
    END as final_column_status;

-- Ayar kontrolü
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM company_settings 
            WHERE setting_key = 'company_logo_url'
        ) 
        THEN '✅ company_logo_url ayarı MEVCUT'
        ELSE '❌ company_logo_url ayarı EKSIK'
    END as final_setting_status;

-- Mevcut company_settings verilerini göster
SELECT '=== MEVCUT COMPANY_SETTINGS VERILERI ===' as info;
SELECT 
    setting_key,
    setting_value,
    setting_type,
    category
FROM company_settings 
WHERE category = 'company'
ORDER BY setting_key;

SELECT '=== COMPANY_LOGO_URL SUTUNU BASARIYLA EKLENDI ===' as result;
