-- =====================================================
-- DESTEK TALEPLERİ SİSTEMİ KURULUMU
-- =====================================================

-- 1. DESTEK TALEPLERİ TABLOSU OLUŞTURMA
-- =====================================================

-- Destek Talepleri Tablosu
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- auth.users referansını kaldırdık
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
    admin_id UUID -- auth.users referansını kaldırdık
);

-- RLS'yi devre dışı bırak (custom auth sistemi kullandığımız için)
ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);

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

-- 2. TASK ASSIGNMENTS TABLOSUNA IS_READ SÜTUNU EKLEME
-- =====================================================

-- Task assignments tablosuna is_read sütunu ekleme
ALTER TABLE task_assignments 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Mevcut kayıtlar için is_read değerini false olarak ayarla
UPDATE task_assignments 
SET is_read = FALSE 
WHERE is_read IS NULL;

-- Sütunun NULL olmamasını sağla
ALTER TABLE task_assignments 
ALTER COLUMN is_read SET NOT NULL;

-- İndeks ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_task_assignments_is_read 
ON task_assignments(is_read);

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

-- is_read sütununun eklendiğini kontrol et
SELECT 'task_assignments.is_read sütunu eklendi' as durum 
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_assignments' AND column_name = 'is_read'
);

-- Tablo yapısını göster
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'support_tickets' 
ORDER BY ordinal_position;
