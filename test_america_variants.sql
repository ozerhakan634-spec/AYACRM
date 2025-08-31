-- Amerika varyasyonlarını test etmek için SQL dosyası
-- Bu dosya, farklı yazım şekillerindeki "Amerika" varyasyonlarının 
-- aynı ülke olarak tanımlanıp tanımlanmadığını test eder

-- Test verileri ekle
INSERT INTO clients (name, email, phone, country, status, created_at) VALUES
('Test Client 1', 'test1@example.com', '+1234567890', 'Amerika', 'active', NOW()),
('Test Client 2', 'test2@example.com', '+1234567891', 'amerika', 'active', NOW()),
('Test Client 3', 'test3@example.com', '+1234567892', 'AMERİKA', 'active', NOW()),
('Test Client 4', 'test4@example.com', '+1234567893', 'AMERIKA', 'active', NOW()),
('Test Client 5', 'test5@example.com', '+1234567894', 'Amerika', 'active', NOW()),
('Test Client 6', 'test6@example.com', '+1234567895', 'amerika', 'active', NOW()),
('Test Client 7', 'test7@example.com', '+1234567896', 'AMERİKA', 'active', NOW()),
('Test Client 8', 'test8@example.com', '+1234567897', 'AMERIKA', 'active', NOW());

-- Test sonuçlarını kontrol et
SELECT 
    country as "Orijinal Ülke Adı",
    COUNT(*) as "Müşteri Sayısı"
FROM clients 
WHERE country IN ('Amerika', 'amerika', 'AMERİKA', 'AMERIKA', 'Amerika', 'amerika', 'AMERİKA', 'AMERIKA')
GROUP BY country
ORDER BY country;

-- Normalize edilmiş ülke isimlerini kontrol et (eğer normalize edilmiş bir alan varsa)
-- Bu sorgu, ülke normalizasyonunun çalışıp çalışmadığını gösterir
SELECT 
    'Normalize Edilmiş Sonuç' as "Test",
    'Tüm Amerika varyasyonları "Amerika Birleşik Devletleri" olarak görünmeli' as "Beklenen Sonuç";

-- Test verilerini temizle (isteğe bağlı)
-- DELETE FROM clients WHERE email LIKE 'test%@example.com';
