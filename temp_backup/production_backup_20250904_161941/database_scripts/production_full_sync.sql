-- Production'u Development ile senkronize et
-- Bu dosyayı Supabase Production SQL Editor'da çalıştırın

-- 1. Önce payments tablosunu oluştur
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

-- 2. Clients tablosuna eksik sütunları ekle
ALTER TABLE clients ADD COLUMN IF NOT EXISTS kullanici_adi VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS dogum_tarihi DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0.00;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS fiyat NUMERIC DEFAULT 0.00;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0.00;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'TRY';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS para_birimi VARCHAR(10) DEFAULT 'TRY';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS durum VARCHAR(50) DEFAULT 'bekliyor';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS application_number_updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS application_number_updated_by TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS application_number_manual_update BOOLEAN DEFAULT false;

-- 3. Consultants tablosuna eksik sütunları ekle
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS certifications TEXT;
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS languages TEXT;
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS has_credentials BOOLEAN DEFAULT false;
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS plain_password VARCHAR(255);
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS profile_photo_filename TEXT;
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- 4. Documents tablosuna eksik sütunları ekle (fileUrl zaten var gibi görünüyor ama kontrol edelim)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS "fileName" VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS "originalFileName" VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS "fileSize" NUMERIC;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS "fileType" VARCHAR(100);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS "clientId" BIGINT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS "clientName" VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS "uploadedDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Tasks ve Task_assignments tabloları zaten var görünüyor

-- 6. İndeksleri oluştur
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_consultant_id ON payments(consultant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_currency ON payments(currency);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_number ON payments(invoice_number);

CREATE INDEX IF NOT EXISTS idx_consultants_username ON consultants(username);
CREATE INDEX IF NOT EXISTS idx_consultants_has_credentials ON consultants(has_credentials);
CREATE INDEX IF NOT EXISTS idx_clients_kullanici_adi ON clients(kullanici_adi);
CREATE INDEX IF NOT EXISTS idx_clients_currency ON clients(currency);

-- 7. Updated_at trigger'ları
CREATE OR REPLACE FUNCTION update_payments_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_payments_updated_at_column();

-- 8. RLS politikaları
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable payments access for authenticated users" ON payments
    FOR ALL USING (auth.role() = 'authenticated');

-- 9. Clients tablosundan payments'a veri transfer et
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

-- 10. Final rapor
SELECT 
    'Production Senkronizasyonu Tamamlandı!' as durum,
    (SELECT COUNT(*) FROM payments) as toplam_ödeme,
    (SELECT COUNT(DISTINCT client_id) FROM payments) as toplam_müşteri,
    (SELECT SUM(amount) FROM payments) as toplam_tutar,
    (SELECT string_agg(DISTINCT currency, ', ') FROM payments) as para_birimleri;

-- 11. Tablo yapılarını kontrol et
SELECT 
    'clients' as tablo,
    COUNT(*) as sutun_sayisi
FROM information_schema.columns 
WHERE table_name = 'clients'
UNION ALL
SELECT 
    'payments' as tablo,
    COUNT(*) as sutun_sayisi
FROM information_schema.columns 
WHERE table_name = 'payments'
UNION ALL
SELECT 
    'consultants' as tablo,
    COUNT(*) as sutun_sayisi
FROM information_schema.columns 
WHERE table_name = 'consultants';
