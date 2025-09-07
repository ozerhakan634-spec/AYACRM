-- Destek Talepleri Tablosu
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    admin_id UUID REFERENCES auth.users(id)
);

-- RLS (Row Level Security) Politikaları
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi destek taleplerini görebilir
CREATE POLICY "Users can view their own support tickets" ON support_tickets
    FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar kendi destek taleplerini oluşturabilir
CREATE POLICY "Users can create their own support tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi destek taleplerini güncelleyebilir (sadece belirli alanlar)
CREATE POLICY "Users can update their own support tickets" ON support_tickets
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin'ler tüm destek taleplerini görebilir
CREATE POLICY "Admins can view all support tickets" ON support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND permission_name = 'settings' 
            AND can_read = true
        )
    );

-- Admin'ler tüm destek taleplerini güncelleyebilir
CREATE POLICY "Admins can update all support tickets" ON support_tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND permission_name = 'settings' 
            AND can_write = true
        )
    );

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
