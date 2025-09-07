-- Görevler tablosu için SQL yapısı
-- Bu dosya Supabase'de tasks tablosunu oluşturmak için kullanılacak

-- Tasks tablosunu oluştur
CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    category VARCHAR(50) DEFAULT 'general',
    created_by VARCHAR(255),
    created_by_user_id BIGINT,
    client_id BIGINT,
    client_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Görev atamalarını yönetmek için ayrı tablo
CREATE TABLE IF NOT EXISTS task_assignments (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    consultant_id BIGINT NOT NULL,
    consultant_name VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by_user_id BIGINT,
    UNIQUE(task_id, consultant_id)
);

-- Indexes oluştur
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by_user_id ON tasks(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);

-- Task assignments için indexes
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_consultant_id ON task_assignments(consultant_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_at ON task_assignments(assigned_at);

-- Updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Eğer status 'completed' olarak değiştirilirse completed_at'i güncelle
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    
    -- Eğer status 'completed' dışında bir değere değiştirilirse completed_at'i sıfırla
    IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_tasks_updated_at();

-- RLS (Row Level Security) politikaları
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Görevler için RLS politikaları
-- Kullanıcılar sadece kendilerine atanan veya oluşturdukları görevleri görebilir
CREATE POLICY "Users can view assigned or created tasks" ON tasks
    FOR SELECT
    USING (
        created_by_user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM task_assignments 
            WHERE task_assignments.task_id = tasks.id 
            AND task_assignments.consultant_id = auth.uid()
        )
    );

-- Kullanıcılar atanan veya oluşturdukları görevleri güncelleyebilir
CREATE POLICY "Users can update assigned or created tasks" ON tasks
    FOR UPDATE
    USING (
        created_by_user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM task_assignments 
            WHERE task_assignments.task_id = tasks.id 
            AND task_assignments.consultant_id = auth.uid()
        )
    );

-- Kullanıcılar görev oluşturabilir
CREATE POLICY "Users can create tasks" ON tasks
    FOR INSERT
    WITH CHECK (created_by_user_id = auth.uid());

-- Kullanıcılar kendi oluşturdukları görevleri silebilir
CREATE POLICY "Users can delete their created tasks" ON tasks
    FOR DELETE
    USING (created_by_user_id = auth.uid());

-- Task assignments için RLS politikaları
-- Kullanıcılar sadece kendi atamalarını görebilir
CREATE POLICY "Users can view their task assignments" ON task_assignments
    FOR SELECT
    USING (consultant_id = auth.uid() OR assigned_by_user_id = auth.uid());

-- Sadece yetkili kullanıcılar atama yapabilir
CREATE POLICY "Authorized users can create assignments" ON task_assignments
    FOR INSERT
    WITH CHECK (assigned_by_user_id = auth.uid());

-- Sadece yetkili kullanıcılar atamayı güncelleyebilir
CREATE POLICY "Authorized users can update assignments" ON task_assignments
    FOR UPDATE
    USING (assigned_by_user_id = auth.uid());

-- Sadece yetkili kullanıcılar atamayı silebilir
CREATE POLICY "Authorized users can delete assignments" ON task_assignments
    FOR DELETE
    USING (assigned_by_user_id = auth.uid());

-- Admin kullanıcılar tüm görevlere erişebilir (eğer admin tablosu varsa)
-- CREATE POLICY "Admins can manage all tasks" ON tasks
--     FOR ALL
--     USING (EXISTS (
--         SELECT 1 FROM admin_users 
--         WHERE admin_users.user_id = auth.uid()
--     ));

-- Demo veri ekleme (isteğe bağlı)
-- INSERT INTO tasks (title, description, due_date, priority, status, assigned_to, category, created_by) VALUES
-- ('Müşteri dosyası hazırlama', 'Ahmet Yılmaz için vize başvuru dosyasını hazırlayın', '2024-01-20', 'high', 'pending', 'Mehmet Kaya', 'document', 'Admin'),
-- ('Randevu takibi', 'Yarın ki randevular için müşterileri arayın', '2024-01-18', 'medium', 'in_progress', 'Ayşe Demir', 'communication', 'Admin'),
-- ('Ödeme takibi', 'Bekleyen ödemeleri kontrol edin ve müşterileri bilgilendirin', '2024-01-19', 'high', 'completed', 'Fatma Şen', 'finance', 'Admin'),
-- ('Vize sonucu kontrolü', 'Geçen hafta başvurusu yapılan vize sonuçlarını kontrol edin', '2024-01-21', 'medium', 'pending', 'Murat Özkan', 'tracking', 'Admin');

-- Task kategorileri için enum (isteğe bağlı)
-- CREATE TYPE task_category AS ENUM ('general', 'document', 'communication', 'finance', 'tracking', 'appointment', 'follow_up');
-- ALTER TABLE tasks ALTER COLUMN category TYPE task_category USING category::task_category;

COMMENT ON TABLE tasks IS 'Kullanıcı/danışman görevlerini takip etmek için kullanılan tablo';
COMMENT ON COLUMN tasks.title IS 'Görevin başlığı';
COMMENT ON COLUMN tasks.description IS 'Görevin detaylı açıklaması';
COMMENT ON COLUMN tasks.due_date IS 'Görevin bitiş tarihi';
COMMENT ON COLUMN tasks.priority IS 'Görevin öncelik seviyesi (low, medium, high)';
COMMENT ON COLUMN tasks.status IS 'Görevin durumu (pending, in_progress, completed, cancelled)';
COMMENT ON COLUMN tasks.category IS 'Görevin kategorisi';
COMMENT ON COLUMN tasks.assigned_to IS 'Görevi atanan kişinin adı';
COMMENT ON COLUMN tasks.assigned_to_user_id IS 'Görevi atanan kullanıcının ID si';
COMMENT ON COLUMN tasks.created_by IS 'Görevi oluşturan kişinin adı';
COMMENT ON COLUMN tasks.created_by_user_id IS 'Görevi oluşturan kullanıcının ID si';
COMMENT ON COLUMN tasks.client_id IS 'İlgili müşterinin ID si (varsa)';
COMMENT ON COLUMN tasks.client_name IS 'İlgili müşterinin adı (varsa)';
COMMENT ON COLUMN tasks.completed_at IS 'Görevin tamamlandığı tarih';
