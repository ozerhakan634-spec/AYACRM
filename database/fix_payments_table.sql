-- Payments tablosunu Finance sayfası için düzeltme
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Önce mevcut yapıyı kontrol et
DO $$
BEGIN
    RAISE NOTICE 'Payments tablosu yapısı kontrol ediliyor...';
END $$;

-- 2. Eksik sütunları ekle (IF NOT EXISTS ile güvenli)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT CURRENT_DATE;

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS consultant_id BIGINT REFERENCES consultants(id) ON DELETE SET NULL;

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Sütun isimlerini kontrol et ve gerekirse yeniden adlandır
-- Eğer payment_type sütunu yoksa ekle
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(100) DEFAULT 'Vize Başvuru';

-- Eğer payment_method sütunu yoksa ekle
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100) DEFAULT 'Banka Transferi';

-- 4. Eksik indeksleri oluştur
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);

-- 5. Güncelleme zamanı için trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_payments_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Trigger oluştur (eğer yoksa)
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_payments_updated_at_column();

-- 7. Mevcut verileri kontrol et
SELECT 
    'Tablo Durumu' as bilgi,
    COUNT(*) as değer
FROM payments
UNION ALL
SELECT 
    'Müşteri Sayısı' as bilgi,
    COUNT(DISTINCT client_id) as değer
FROM payments
UNION ALL
SELECT 
    'Durum Dağılımı' as bilgi,
    status || ': ' || COUNT(*) as değer
FROM payments
GROUP BY status;

-- 8. Eğer payments tablosu boşsa, clients tablosundan veri oluştur
INSERT INTO payments (client_id, amount, currency, payment_type, payment_method, status, payment_date, description, consultant_id, invoice_number)
SELECT 
    c.id as client_id,
    COALESCE(c.price, c.fiyat, c.amount, 0) as amount,
    COALESCE(c.currency, c.para_birimi, 'TRY') as currency,
    'Vize Başvuru' as payment_type,
    'Banka Transferi' as payment_method,
    CASE 
        WHEN c.status = 'completed' THEN 'completed'
        WHEN c.status = 'pending' THEN 'pending'
        ELSE 'pending'
    END as status,
    COALESCE(c.created_at::date, CURRENT_DATE) as payment_date,
    COALESCE(c.country, 'Bilinmeyen Ülke') || ' vize başvuru ücreti' as description,
    c.consultant_id,
    'INV-' || LPAD(c.id::text, 3, '0') as invoice_number
FROM clients c
WHERE NOT EXISTS (
    SELECT 1 FROM payments p WHERE p.client_id = c.id
);

-- 9. Son kontrol
SELECT 
    'İşlem Tamamlandı' as durum,
    COUNT(*) as toplam_ödeme,
    COUNT(DISTINCT client_id) as toplam_müşteri
FROM payments;
