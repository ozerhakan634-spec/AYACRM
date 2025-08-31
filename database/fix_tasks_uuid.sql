-- UUID uyumlu tasks tablosu düzeltmesi
-- Supabase Auth sistemi UUID kullandığı için tablolarımızı ona uygun hale getiriyoruz

-- Önce mevcut tabloları sil (eğer varsa)
DROP TABLE IF EXISTS task_assignments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

-- Tasks tablosunu UUID ile yeniden oluştur
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    category VARCHAR(50) DEFAULT 'general',
    created_by VARCHAR(255),
    created_by_user_id UUID REFERENCES auth.users(id), -- UUID olarak değiştirdik
    client_id BIGINT,
    client_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Task assignments tablosunu UUID ile oluştur
CREATE TABLE task_assignments (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    consultant_id UUID NOT NULL REFERENCES auth.users(id), -- UUID olarak değiştirdik
    consultant_name VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by_user_id UUID REFERENCES auth.users(id), -- UUID olarak değiştirdik
    UNIQUE(task_id, consultant_id)
);

-- Indexes oluştur
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_by_user_id ON tasks(created_by_user_id);
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_tasks_category ON tasks(category);

-- Task assignments için indexes
CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_consultant_id ON task_assignments(consultant_id);
CREATE INDEX idx_task_assignments_assigned_at ON task_assignments(assigned_at);

-- Updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Eğer status 'completed' olarak değiştirilirse completed_at'i güncelle
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
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

-- Görevler için RLS politikaları - UUID uyumlu
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

-- Task assignments için RLS politikaları - UUID uyumlu
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

-- Başarılı mesajı
SELECT 'Tasks tabloları başarıyla UUID uyumlu olarak oluşturuldu!' AS status;
