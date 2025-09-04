-- =====================================================
-- SUPPORT_TICKETS TABLOSUNDA USER_ID TİPİNİ DÜZELTME
-- =====================================================

-- Önce mevcut tabloyu sil (eğer varsa)
DROP TABLE IF EXISTS support_tickets CASCADE;

-- Destek Talepleri Tablosu (düzeltilmiş user_id tipi ile)
CREATE TABLE support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT NOT NULL, -- consultants.id ile uyumlu
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    admin_response TEXT,
    admin_id BIGINT -- consultants.id ile uyumlu
);

-- RLS'yi devre dışı bırak (custom auth sistemi kullandığımız için)
ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY;

-- İndeksler
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);

-- Otomatik updated_at güncellemesi için trigger
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_support_tickets_updated_at();

-- =====================================================
-- DEĞİŞİKLİKLERİ ONAYLA
-- =====================================================

COMMIT;

-- =====================================================
-- KONTROL SORGULARI
-- =====================================================

-- Destek talepleri tablosunun oluşturulduğunu kontrol et
SELECT 'support_tickets tablosu oluşturuldu' as durum 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets');

-- Tablo yapısını göster
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'support_tickets' 
ORDER BY ordinal_position;
