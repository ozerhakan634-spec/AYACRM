-- Hızlı tasks tablosu kurulumu
-- Bu basit sürüm acil test için kullanılabilir

-- Ana tasks tablosu
CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    category VARCHAR(50) DEFAULT 'general',
    created_by VARCHAR(255),
    created_by_user_id BIGINT,
    client_id BIGINT,
    client_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task assignments tablosu
CREATE TABLE IF NOT EXISTS task_assignments (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    consultant_id BIGINT NOT NULL,
    consultant_name VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, consultant_id)
);

-- Basit RLS aktifleştirme
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Test için geçici olarak herkese erişim ver (GÜVENLİ DEĞİL!)
-- SADECE TEST İÇİN! Sonra silin!
CREATE POLICY "temp_allow_all_tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "temp_allow_all_assignments" ON task_assignments FOR ALL USING (true);

-- Test verisi
INSERT INTO tasks (title, description, due_date, priority, status, created_by, created_by_user_id) VALUES 
('Test Görevi', 'Bu bir test görevidir', '2024-02-01', 'medium', 'pending', 'Test User', 1);
