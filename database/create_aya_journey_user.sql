-- AYA JOURNEY MÜŞTERİSİ İÇİN ÜRETİM HESABI
-- İlk müşteri için hazır sistem kurulumu

-- Aya Journey şirketi bilgileri
INSERT INTO consultants (
    name,
    email,
    phone,
    department,
    position,
    status,
    username,
    has_credentials,
    permissions,
    created_at,
    updated_at
) VALUES (
    'Aya Journey Yöneticisi',
    'yonetici@ayajourney.com',
    '+90 212 555 7001',
    'Genel Yönetim',
    'Sistem Yöneticisi',
    'active',
    'ayajourney',
    false,
    '{"dashboard": true, "clients": true, "documents": true, "calendar": true, "reports": true, "finance": true, "consultants": true, "settings": true}',
    NOW(),
    NOW()
) ON CONFLICT (username) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- Aya Journey için danışman kullanıcıları
INSERT INTO consultants (
    name,
    email,
    phone,
    department,
    position,
    status,
    username,
    has_credentials,
    permissions,
    created_at,
    updated_at
) VALUES 
(
    'Aya Journey Uzmanı',
    'uzman@ayajourney.com',
    '+90 212 555 7002',
    'Vize Danışmanlığı',
    'Vize Uzmanı',
    'active',
    'ayauzman',
    false,
    '{"dashboard": true, "clients": true, "documents": true, "calendar": true, "reports": false, "finance": false, "consultants": false, "settings": false}',
    NOW(),
    NOW()
),
(
    'Aya Journey Muhasebe',
    'muhasebe@ayajourney.com',
    '+90 212 555 7003',
    'Finans',
    'Muhasebe Uzmanı',
    'active',
    'ayafinans',
    false,
    '{"dashboard": true, "clients": true, "documents": false, "calendar": false, "reports": true, "finance": true, "consultants": false, "settings": false}',
    NOW(),
    NOW()
) ON CONFLICT (username) DO NOTHING;

-- Aya Journey için örnek müşteri verileri (gerçek sistem kullanımı için)
INSERT INTO clients (
    name,
    email,
    phone,
    country,
    visa_type,
    status,
    registration_date,
    consultant_id,
    created_at
) VALUES 
(
    'Ahmet Yılmaz',
    'ahmet@email.com',
    '+90 532 123 4567',
    'Amerika',
    'Turist Vizesi',
    'active',
    NOW() - INTERVAL '5 days',
    (SELECT id FROM consultants WHERE username = 'ayauzman' LIMIT 1),
    NOW() - INTERVAL '5 days'
),
(
    'Fatma Demir',
    'fatma@email.com',
    '+90 533 234 5678',
    'İngiltere',
    'Öğrenci Vizesi',
    'pending',
    NOW() - INTERVAL '3 days',
    (SELECT id FROM consultants WHERE username = 'ayauzman' LIMIT 1),
    NOW() - INTERVAL '3 days'
),
(
    'Mehmet Kaya',
    'mehmet@email.com',
    '+90 534 345 6789',
    'Kanada',
    'İş Vizesi',
    'completed',
    NOW() - INTERVAL '10 days',
    (SELECT id FROM consultants WHERE username = 'ayauzman' LIMIT 1),
    NOW() - INTERVAL '10 days'
),
(
    'Ayşe Öztürk',
    'ayse@email.com',
    '+90 535 456 7890',
    'Almanya',
    'Aile Birleşimi',
    'active',
    NOW() - INTERVAL '1 day',
    (SELECT id FROM consultants WHERE username = 'ayauzman' LIMIT 1),
    NOW() - INTERVAL '1 day'
),
(
    'Can Polat',
    'can@email.com',
    '+90 536 567 8901',
    'Avustralya',
    'Turist Vizesi',
    'pending',
    NOW() - INTERVAL '2 days',
    (SELECT id FROM consultants WHERE username = 'ayauzman' LIMIT 1),
    NOW() - INTERVAL '2 days'
) ON CONFLICT DO NOTHING;

-- Aya Journey için örnek finans kayıtları
INSERT INTO finance_records (
    client_id,
    amount,
    currency,
    type,
    description,
    payment_date,
    status,
    created_at
) VALUES 
(
    (SELECT id FROM clients WHERE email = 'ahmet@email.com' LIMIT 1),
    1500.00,
    'TRY',
    'income',
    'Vize başvuru ücreti',
    NOW() - INTERVAL '5 days',
    'completed',
    NOW() - INTERVAL '5 days'
),
(
    (SELECT id FROM clients WHERE email = 'fatma@email.com' LIMIT 1),
    2000.00,
    'TRY',
    'income',
    'Öğrenci vize danışmanlığı',
    NOW() - INTERVAL '3 days',
    'pending',
    NOW() - INTERVAL '3 days'
),
(
    (SELECT id FROM clients WHERE email = 'mehmet@email.com' LIMIT 1),
    3000.00,
    'TRY',
    'income',
    'İş vizesi tam paket',
    NOW() - INTERVAL '10 days',
    'completed',
    NOW() - INTERVAL '10 days'
) ON CONFLICT DO NOTHING;

-- Kontrol sorgusu
SELECT 
    'Aya Journey Kullanıcıları' as tablo,
    name,
    username,
    email,
    department,
    position,
    has_credentials
FROM consultants 
WHERE username LIKE 'aya%'
ORDER BY username;

SELECT 
    'Demo Müşteriler' as tablo,
    COUNT(*) as toplam_musteri
FROM clients 
WHERE consultant_id IN (SELECT id FROM consultants WHERE username LIKE 'aya%');
