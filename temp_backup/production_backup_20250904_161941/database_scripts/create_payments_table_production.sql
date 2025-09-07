-- Production için Payments tablosu oluşturma
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Önce payments tablosu var mı kontrol et
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        RAISE NOTICE 'Payments tablosu bulunamadı, oluşturuluyor...';
    ELSE
        RAISE NOTICE 'Payments tablosu zaten mevcut!';
    END IF;
END $$;

-- 2. Payments tablosunu oluştur (Development'dan kopyalanan yapı)
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'TRY',
    payment_type VARCHAR(100) NOT NULL DEFAULT 'Vize Başvuru',
    payment_method VARCHAR(100) NOT NULL DEFAULT 'Banka Transferi',
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    description TEXT,
    consultant_id BIGINT,
    invoice_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. İndeksleri oluştur
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_consultant_id ON payments(consultant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_currency ON payments(currency);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_number ON payments(invoice_number);

-- 4. Updated_at trigger fonksiyonu oluştur
CREATE OR REPLACE FUNCTION update_payments_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 5. Trigger oluştur
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_payments_updated_at_column();

-- 6. Clients tablosundan mevcut verileri payments'a transfer et
INSERT INTO payments (
    client_id, 
    amount, 
    currency, 
    payment_type, 
    payment_method, 
    status, 
    payment_date, 
    description, 
    consultant_id, 
    invoice_number,
    created_at
)
SELECT 
    c.id as client_id,
    COALESCE(c.price, c.fiyat, c.amount, 0) as amount,
    COALESCE(c.currency, c.para_birimi, 'TRY') as currency,
    'Vize Başvuru' as payment_type,
    'Banka Transferi' as payment_method,
    CASE 
        WHEN c.status = 'completed' THEN 'completed'
        WHEN c.status = 'pending' THEN 'pending'
        WHEN c.status = 'active' THEN 'pending'
        ELSE 'pending'
    END as status,
    COALESCE(c.created_at::date, CURRENT_DATE) as payment_date,
    COALESCE('Vize başvuru ücreti - ' || c.country, 'Vize başvuru ücreti') as description,
    c.consultant_id,
    'INV-' || LPAD(c.id::text, 4, '0') as invoice_number,
    COALESCE(c.created_at, NOW()) as created_at
FROM clients c
WHERE COALESCE(c.price, c.fiyat, c.amount, 0) > 0  -- Sadece ücretli işlemler
ON CONFLICT DO NOTHING;  -- Eğer zaten varsa eklenmesin

-- 7. Row Level Security (RLS) aktif et
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 8. RLS politikalarını oluştur (tüm authenticated kullanıcılar için erişim)
CREATE POLICY "Enable payments access for authenticated users" ON payments
    FOR ALL USING (auth.role() = 'authenticated');

-- 9. Final rapor
SELECT 
    'Payments Tablosu Oluşturuldu' as durum,
    COUNT(*) as toplam_ödeme,
    COUNT(DISTINCT client_id) as toplam_müşteri,
    SUM(amount) as toplam_tutar,
    string_agg(DISTINCT currency, ', ') as para_birimleri
FROM payments;

-- 10. Tablo yapısını göster
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;
