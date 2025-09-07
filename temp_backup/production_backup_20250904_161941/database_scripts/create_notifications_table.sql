-- Bildirim Sistemi Tablosu Oluşturma
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Notifications tablosunu oluştur
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  category VARCHAR(50) NOT NULL, -- 'task', 'client', 'support', 'system'
  related_id BIGINT, -- İlgili kaydın ID'si (task_id, client_id, support_ticket_id)
  related_type VARCHAR(50), -- İlgili kaydın tipi ('task', 'client', 'support_ticket')
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- İndeksler oluştur
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);

-- RLS aktif et
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS politikaları
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "System can create notifications" ON notifications
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Bildirim fonksiyonları
-- Görev atandığında bildirim oluştur
CREATE OR REPLACE FUNCTION create_task_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Yeni görev atandığında bildirim oluştur
  IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to != OLD.assigned_to THEN
    INSERT INTO notifications (user_id, title, message, type, category, related_id, related_type)
    VALUES (
      NEW.assigned_to,
      'Yeni Görev Atandı',
      'Size yeni bir görev atandı: ' || NEW.title,
      'info',
      'task',
      NEW.id,
      'task'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Müşteri atandığında bildirim oluştur
CREATE OR REPLACE FUNCTION create_client_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Yeni müşteri atandığında bildirim oluştur
  IF NEW.consultant_id IS NOT NULL AND NEW.consultant_id != OLD.consultant_id THEN
    INSERT INTO notifications (user_id, title, message, type, category, related_id, related_type)
    VALUES (
      NEW.consultant_id,
      'Yeni Müşteri Atandı',
      'Size yeni bir müşteri atandı: ' || NEW.name,
      'success',
      'client',
      NEW.id,
      'client'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Destek talebi güncellendiğinde bildirim oluştur
CREATE OR REPLACE FUNCTION create_support_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Destek talebi durumu değiştiğinde bildirim oluştur
  IF NEW.status != OLD.status THEN
    INSERT INTO notifications (user_id, title, message, type, category, related_id, related_type)
    VALUES (
      NEW.user_id,
      'Destek Talebi Güncellendi',
      'Destek talebinizin durumu güncellendi: ' || 
      CASE 
        WHEN NEW.status = 'resolved' THEN 'Çözüldü'
        WHEN NEW.status = 'in_progress' THEN 'İşleme Alındı'
        WHEN NEW.status = 'closed' THEN 'Kapatıldı'
        ELSE NEW.status
      END,
      'info',
      'support',
      NEW.id,
      'support_ticket'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ları oluştur
DROP TRIGGER IF EXISTS trigger_task_notification ON tasks;
CREATE TRIGGER trigger_task_notification
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_task_notification();

DROP TRIGGER IF EXISTS trigger_client_notification ON clients;
CREATE TRIGGER trigger_client_notification
  AFTER UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION create_client_notification();

DROP TRIGGER IF EXISTS trigger_support_notification ON support_tickets;
CREATE TRIGGER trigger_support_notification
  AFTER UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION create_support_notification();

-- Test verisi ekle
INSERT INTO notifications (user_id, title, message, type, category, related_id, related_type)
VALUES 
(1, 'Hoş Geldiniz', 'Sisteme başarıyla giriş yaptınız', 'success', 'system', NULL, NULL),
(1, 'Test Bildirimi', 'Bu bir test bildirimidir', 'info', 'system', NULL, NULL);

-- Başarı mesajı
SELECT 'Bildirim sistemi başarıyla oluşturuldu!' AS status;
