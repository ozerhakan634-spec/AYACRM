-- Basit görev sistemi - BIGINT ID'ler ile (mevcut auth sistemi uyumlu)
-- UUID yerine BIGINT kullanarak mevcut sisteminizle uyumlu

-- Önce mevcut tabloları temizle
DROP TABLE IF EXISTS task_assignments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

-- Tasks tablosunu BIGINT ID'ler ile oluştur
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    category VARCHAR(50) DEFAULT 'general',
    created_by VARCHAR(255),
    created_by_user_id BIGINT, -- Mevcut consultant ID sisteminizle uyumlu
    client_id BIGINT,
    client_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Task assignments tablosunu BIGINT ID'ler ile oluştur
CREATE TABLE task_assignments (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    consultant_id BIGINT NOT NULL, -- Consultants tablosundaki ID
    consultant_name VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by_user_id BIGINT, -- Atayan kişinin ID'si
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

-- RLS'yi şimdilik devre dışı bırak (basit erişim için)
-- Üretim ortamında aktifleştirilebilir
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Demo test verisi
INSERT INTO tasks (title, description, due_date, priority, status, created_by, created_by_user_id, category) VALUES 
('Test Görevi 1', 'Bu bir test görevidir', '2024-02-01', 'high', 'pending', 'Test User', 1, 'document'),
('Test Görevi 2', 'İkinci test görevi', '2024-02-05', 'medium', 'in_progress', 'Test User', 1, 'communication');

-- Demo atama verisi (consultant ID 1'e ata)
INSERT INTO task_assignments (task_id, consultant_id, consultant_name, assigned_by_user_id) VALUES 
(1, 1, 'Test Danışman', 1),
(2, 1, 'Test Danışman', 1);

-- Başarılı mesajı
SELECT 'Tasks tabloları başarıyla BIGINT uyumlu olarak oluşturuldu!' AS status;

-- Kontrol sorgusu
SELECT 
    t.id,
    t.title,
    t.status,
    t.priority,
    array_agg(ta.consultant_name) as assigned_consultants
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
GROUP BY t.id, t.title, t.status, t.priority
ORDER BY t.id;
