-- Production Ortamı Düzeltme Script'i
-- aya-crm-production için

-- 1. RLS Politikalarını Düzelt
-- Clients tablosu için RLS
DROP POLICY IF EXISTS "Users can view clients" ON clients;
DROP POLICY IF EXISTS "Users can insert clients" ON clients;
DROP POLICY IF EXISTS "Users can update clients" ON clients;
DROP POLICY IF EXISTS "Users can delete clients" ON clients;

CREATE POLICY "Users can view clients" ON clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert clients" ON clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update clients" ON clients
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete clients" ON clients
    FOR DELETE USING (auth.role() = 'authenticated');

-- Consultants tablosu için RLS
DROP POLICY IF EXISTS "Users can view consultants" ON consultants;
DROP POLICY IF EXISTS "Users can insert consultants" ON consultants;
DROP POLICY IF EXISTS "Users can update consultants" ON consultants;
DROP POLICY IF EXISTS "Users can delete consultants" ON consultants;

CREATE POLICY "Users can view consultants" ON consultants
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert consultants" ON consultants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update consultants" ON consultants
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete consultants" ON consultants
    FOR DELETE USING (auth.role() = 'authenticated');

-- Tasks tablosu için RLS
DROP POLICY IF EXISTS "Users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;

CREATE POLICY "Users can view tasks" ON tasks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert tasks" ON tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update tasks" ON tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete tasks" ON tasks
    FOR DELETE USING (auth.role() = 'authenticated');

-- Task Assignments tablosu için RLS
DROP POLICY IF EXISTS "Users can view task_assignments" ON task_assignments;
DROP POLICY IF EXISTS "Users can insert task_assignments" ON task_assignments;
DROP POLICY IF EXISTS "Users can update task_assignments" ON task_assignments;
DROP POLICY IF EXISTS "Users can delete task_assignments" ON task_assignments;

CREATE POLICY "Users can view task_assignments" ON task_assignments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert task_assignments" ON task_assignments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update task_assignments" ON task_assignments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete task_assignments" ON task_assignments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Documents tablosu için RLS
DROP POLICY IF EXISTS "Users can view documents" ON documents;
DROP POLICY IF EXISTS "Users can insert documents" ON documents;
DROP POLICY IF EXISTS "Users can update documents" ON documents;
DROP POLICY IF EXISTS "Users can delete documents" ON documents;

CREATE POLICY "Users can view documents" ON documents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert documents" ON documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update documents" ON documents
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete documents" ON documents
    FOR DELETE USING (auth.role() = 'authenticated');

-- Payments tablosu için RLS
DROP POLICY IF EXISTS "Users can view payments" ON payments;
DROP POLICY IF EXISTS "Users can insert payments" ON payments;
DROP POLICY IF EXISTS "Users can update payments" ON payments;
DROP POLICY IF EXISTS "Users can delete payments" ON payments;

CREATE POLICY "Users can view payments" ON payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert payments" ON payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update payments" ON payments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete payments" ON payments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Support Tickets tablosu için RLS
DROP POLICY IF EXISTS "Users can view support_tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can insert support_tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update support_tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can delete support_tickets" ON support_tickets;

CREATE POLICY "Users can view support_tickets" ON support_tickets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert support_tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update support_tickets" ON support_tickets
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete support_tickets" ON support_tickets
    FOR DELETE USING (auth.role() = 'authenticated');

-- Company Settings tablosu için RLS
DROP POLICY IF EXISTS "Users can view company_settings" ON company_settings;
DROP POLICY IF EXISTS "Users can insert company_settings" ON company_settings;
DROP POLICY IF EXISTS "Users can update company_settings" ON company_settings;
DROP POLICY IF EXISTS "Users can delete company_settings" ON company_settings;

CREATE POLICY "Users can view company_settings" ON company_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert company_settings" ON company_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update company_settings" ON company_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete company_settings" ON company_settings
    FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Storage Bucket'ları Kontrol Et
-- Documents bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Profile photos bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Company logos bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS Politikalarını Düzelt
-- Storage objects için genel politika
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (bucket_id IN ('documents', 'profile-photos', 'company-logos'));

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND bucket_id IN ('documents', 'profile-photos', 'company-logos'));

DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
CREATE POLICY "Authenticated users can update" ON storage.objects
    FOR UPDATE USING (auth.role() = 'authenticated' AND bucket_id IN ('documents', 'profile-photos', 'company-logos'));

DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
CREATE POLICY "Authenticated users can delete" ON storage.objects
    FOR DELETE USING (auth.role() = 'authenticated' AND bucket_id IN ('documents', 'profile-photos', 'company-logos'));

-- 4. Eksik Sütunları Kontrol Et
-- Task assignments tablosunda read_at sütunu
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'task_assignments' AND column_name = 'read_at') THEN
        ALTER TABLE task_assignments ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 5. Test Verisi Ekle (Opsiyonel)
-- Eğer tablolar boşsa test verisi ekle
INSERT INTO company_settings (company_name, company_email, company_phone, company_address)
VALUES ('AYA Journey CRM', 'info@ayajourney.com', '+90 212 555 0123', 'İstanbul, Türkiye')
ON CONFLICT DO NOTHING;

-- Başarı mesajı
SELECT 'Production ortamı başarıyla düzeltildi!' as message;
