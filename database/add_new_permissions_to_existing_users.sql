-- Mevcut kullanıcılara yeni izinleri eklemek için SQL
-- Bu script yeni eklenen "tasks" ve "chatbot" izinlerini mevcut kullanıcılara ekler

-- Consultants tablosundaki permissions sütununu güncelle
-- Mevcut permissions JSON'ına yeni alanları ekle

-- Her kullanıcı için permissions JSON'ını güncelle
UPDATE consultants 
SET permissions = jsonb_set(
    jsonb_set(
        COALESCE(permissions, '{}'::jsonb),
        '{tasks}',
        'false'::jsonb
    ),
    '{chatbot}',
    'false'::jsonb
)
WHERE permissions IS NOT NULL;

-- Eğer permissions sütunu NULL olan kayıtlar varsa, onlar için temel permissions oluştur
UPDATE consultants 
SET permissions = '{
    "dashboard": false,
    "clients": false,
    "documents": false,
    "tasks": false,
    "calendar": false,
    "reports": false,
    "finance": false,
    "consultants": false,
    "chatbot": false,
    "settings": false
}'::jsonb
WHERE permissions IS NULL;

-- Kontrol için: Tüm kullanıcıların güncellenmiş permissions'larını göster
SELECT 
    id,
    name,
    email,
    permissions
FROM consultants
ORDER BY id;
