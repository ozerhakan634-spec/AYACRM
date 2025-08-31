-- Ülke normalizasyonunu test etmek için örnek veriler
-- Bu script mevcut veritabanına test verileri ekler

-- Mevcut müşterileri güncelle (örnek olarak)
UPDATE clients 
SET country = 'ALMANYA' 
WHERE id = 1;

UPDATE clients 
SET country = 'germany' 
WHERE id = 2;

UPDATE clients 
SET country = 'AAAAAA' 
WHERE id = 3;

UPDATE clients 
SET country = 'almanya' 
WHERE id = 4;

UPDATE clients 
SET country = 'Germany' 
WHERE id = 5;

-- Yeni test müşterileri ekle (eğer varsa)
INSERT INTO clients (name, email, country, status, created_at) VALUES
('Test Müşteri 1', 'test1@example.com', 'ALMANYA', 'active', NOW()),
('Test Müşteri 2', 'test2@example.com', 'germany', 'active', NOW()),
('Test Müşteri 3', 'test3@example.com', 'AAAAAA', 'active', NOW()),
('Test Müşteri 4', 'test4@example.com', 'almanya', 'active', NOW()),
('Test Müşteri 5', 'test5@example.com', 'Germany', 'active', NOW()),
('Test Müşteri 6', 'test6@example.com', 'Deutschland', 'active', NOW()),
('Test Müşteri 7', 'test7@example.com', 'TÜRKIYE', 'active', NOW()),
('Test Müşteri 8', 'test8@example.com', 'turkey', 'active', NOW()),
('Test Müşteri 9', 'test9@example.com', 'türkiye', 'active', NOW()),
('Test Müşteri 10', 'test10@example.com', 'Turkey', 'active', NOW()),
('Test Müşteri 11', 'test11@example.com', 'AMERİKA', 'active', NOW()),
('Test Müşteri 12', 'test12@example.com', 'AMERIKA', 'active', NOW()),
('Test Müşteri 13', 'test13@example.com', 'Amerika', 'active', NOW()),
('Test Müşteri 14', 'test14@example.com', 'amerika', 'active', NOW()),
('Test Müşteri 15', 'test15@example.com', 'USA', 'active', NOW()),
('Test Müşteri 16', 'test16@example.com', 'usa', 'active', NOW()),
('Test Müşteri 17', 'test17@example.com', 'UNITED STATES', 'active', NOW()),
('Test Müşteri 18', 'test18@example.com', 'united states', 'active', NOW()),
('Test Müşteri 19', 'test19@example.com', 'İNGİLTERE', 'active', NOW()),
('Test Müşteri 20', 'test20@example.com', 'ingiltere', 'active', NOW()),
('Test Müşteri 21', 'test21@example.com', 'ENGLAND', 'active', NOW()),
('Test Müşteri 22', 'test22@example.com', 'england', 'active', NOW()),
('Test Müşteri 23', 'test23@example.com', 'UK', 'active', NOW()),
('Test Müşteri 24', 'test24@example.com', 'uk', 'active', NOW())
ON CONFLICT (id) DO NOTHING;

-- Mevcut ülke verilerini kontrol et
SELECT DISTINCT country, COUNT(*) as count 
FROM clients 
WHERE country IS NOT NULL 
GROUP BY country 
ORDER BY count DESC;
