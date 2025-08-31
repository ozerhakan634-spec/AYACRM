-- payments tablosuna eksik sütunları ekleme
-- Bu dosya Finance sayfasında payments.status kullanımı için gerekli

-- 1. Status sütunu ekleme
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- 2. Ödeme tarihi sütunu ekleme  
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT CURRENT_DATE;

-- 3. Açıklama sütunu ekleme
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 4. Danışman ID sütunu ekleme (eğer yoksa)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS consultant_id BIGINT REFERENCES consultants(id) ON DELETE SET NULL;

-- 5. Fatura numarası sütunu ekleme
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);

-- 6. Güncelleme zamanı sütunu ekleme
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 7. Status sütunu için index oluşturma
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 8. Ödeme tarihi için index oluşturma
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- 9. Müşteri ID için index oluşturma (eğer yoksa)
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);

-- 10. Güncelleme zamanı için trigger fonksiyonu (eğer yoksa)
CREATE OR REPLACE FUNCTION update_payments_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Trigger oluşturma
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_payments_updated_at_column();

-- 12. Mevcut clients tablosundaki durum bilgilerini payments tablosuna taşıma
-- Bu işlem sadece payments tablosu boşken yapılmalı
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

-- 13. Sonuçları kontrol etme
SELECT 
  'Toplam Müşteri Sayısı' as bilgi,
  COUNT(*) as değer
FROM clients
UNION ALL
SELECT 
  'Toplam Ödeme Kaydı' as bilgi,
  COUNT(*) as değer
FROM payments
UNION ALL
SELECT 
  'Durum Dağılımı' as bilgi,
  status || ': ' || COUNT(*) as değer
FROM payments
GROUP BY status;
