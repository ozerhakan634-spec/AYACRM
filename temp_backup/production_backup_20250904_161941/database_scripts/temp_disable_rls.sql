-- GEÇİCİ: RLS'yi devre dışı bırak (SADECE TEST İÇİN!)
-- Üretim ortamında ASLA kullanmayın!

-- RLS'yi geçici olarak devre dışı bırak
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments DISABLE ROW LEVEL SECURITY;

-- Mevcut policy'leri kaldır
DROP POLICY IF EXISTS "Users can view assigned or created tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update assigned or created tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their created tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view their task assignments" ON task_assignments;
DROP POLICY IF EXISTS "Authorized users can create assignments" ON task_assignments;
DROP POLICY IF EXISTS "Authorized users can update assignments" ON task_assignments;
DROP POLICY IF EXISTS "Authorized users can delete assignments" ON task_assignments;

-- Test için herkese erişim ver (GÜVENLİ DEĞİL!)
-- SADECE TEST AŞAMASINDA KULLANIN!

SELECT 'RLS geçici olarak devre dışı bırakıldı. SADECE TEST İÇİN!' AS warning;
