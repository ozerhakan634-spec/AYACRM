-- Tüm Tablolar İçin RLS Devre Dışı Bırakma ve Geniş Politikalar
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Tüm tablolar için RLS'yi devre dışı bırak
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE consultants DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;

-- 2. Tüm mevcut politikaları temizle
-- Clients
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can create their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
DROP POLICY IF EXISTS "Admins can update all clients" ON clients;
DROP POLICY IF EXISTS "Admins can delete all clients" ON clients;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON clients;

-- Consultants
DROP POLICY IF EXISTS "Users can view their own consultant profile" ON consultants;
DROP POLICY IF EXISTS "Users can update their own consultant profile" ON consultants;
DROP POLICY IF EXISTS "Admins can view all consultants" ON consultants;
DROP POLICY IF EXISTS "Admins can update all consultants" ON consultants;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON consultants;

-- Tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON tasks;

-- Task Assignments
DROP POLICY IF EXISTS "Users can view their own task assignments" ON task_assignments;
DROP POLICY IF EXISTS "Users can create their own task assignments" ON task_assignments;
DROP POLICY IF EXISTS "Users can update their own task assignments" ON task_assignments;
DROP POLICY IF EXISTS "Users can delete their own task assignments" ON task_assignments;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON task_assignments;

-- Documents
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON documents;

-- Payments
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can create their own payments" ON payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON payments;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON payments;

-- Support Tickets
DROP POLICY IF EXISTS "Users can view their own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create their own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update their own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can delete their own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update all support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON support_tickets;

-- Notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Company Settings
DROP POLICY IF EXISTS "Admins can view company settings" ON company_settings;
DROP POLICY IF EXISTS "Admins can update company settings" ON company_settings;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON company_settings;

-- 3. Geniş politikalar oluştur (eğer RLS aktifse)
-- Clients
CREATE POLICY "Enable all operations for authenticated users" ON clients
FOR ALL USING (auth.role() = 'authenticated');

-- Consultants
CREATE POLICY "Enable all operations for authenticated users" ON consultants
FOR ALL USING (auth.role() = 'authenticated');

-- Tasks
CREATE POLICY "Enable all operations for authenticated users" ON tasks
FOR ALL USING (auth.role() = 'authenticated');

-- Task Assignments
CREATE POLICY "Enable all operations for authenticated users" ON task_assignments
FOR ALL USING (auth.role() = 'authenticated');

-- Documents
CREATE POLICY "Enable all operations for authenticated users" ON documents
FOR ALL USING (auth.role() = 'authenticated');

-- Payments
CREATE POLICY "Enable all operations for authenticated users" ON payments
FOR ALL USING (auth.role() = 'authenticated');

-- Support Tickets
CREATE POLICY "Enable all operations for authenticated users" ON support_tickets
FOR ALL USING (auth.role() = 'authenticated');

-- Notifications
CREATE POLICY "Enable all operations for authenticated users" ON notifications
FOR ALL USING (auth.role() = 'authenticated');

-- Company Settings
CREATE POLICY "Enable all operations for authenticated users" ON company_settings
FOR ALL USING (auth.role() = 'authenticated');

-- 4. RLS durumunu kontrol et
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('clients', 'consultants', 'tasks', 'task_assignments', 'documents', 'payments', 'support_tickets', 'notifications', 'company_settings')
  AND schemaname = 'public'
ORDER BY tablename;

-- 5. Mevcut politikaları kontrol et
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('clients', 'consultants', 'tasks', 'task_assignments', 'documents', 'payments', 'support_tickets', 'notifications', 'company_settings')
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Test verisi ekle
INSERT INTO clients (name, email, phone, consultant_id)
VALUES (
  'Test Müşteri - RLS Testi',
  'test@example.com',
  '555-1234',
  NULL
) ON CONFLICT DO NOTHING;

-- 7. Başarı mesajı
SELECT 'Tüm tablolar için RLS devre dışı bırakıldı ve geniş politikalar oluşturuldu!' AS status;
