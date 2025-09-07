-- GEÇİCİ: Tüm Tablolar için RLS'yi Devre Dışı Bırakma (SADECE TEST İÇİN!)
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Tüm tablolar için RLS'yi devre dışı bırak
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE consultants DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;

-- Mevcut policy'leri kaldır
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON documents;

DROP POLICY IF EXISTS "Users can view assigned or created tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update assigned or created tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their created tasks" ON tasks;

DROP POLICY IF EXISTS "Users can view their task assignments" ON task_assignments;
DROP POLICY IF EXISTS "Authorized users can create assignments" ON task_assignments;
DROP POLICY IF EXISTS "Authorized users can update assignments" ON task_assignments;
DROP POLICY IF EXISTS "Authorized users can delete assignments" ON task_assignments;

-- RLS durumunu kontrol et
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('documents', 'tasks', 'task_assignments', 'clients', 'consultants', 'payments', 'support_tickets', 'company_settings') 
  AND schemaname = 'public'
ORDER BY tablename;

-- Uyarı mesajı
SELECT 'RLS geçici olarak devre dışı bırakıldı. SADECE TEST İÇİN!' AS warning;
