-- AI Eğitim Tabloları

-- Eğitim örnekleri tablosu
CREATE TABLE IF NOT EXISTS ai_training_examples (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  accuracy_score FLOAT DEFAULT 0.0
);

-- Kullanıcı geri bildirimleri tablosu  
CREATE TABLE IF NOT EXISTS ai_feedback (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  ai_answer TEXT NOT NULL,
  user_feedback VARCHAR(20) NOT NULL, -- 'good', 'bad', 'partial'
  correct_answer TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  processed BOOLEAN DEFAULT false,
  user_id INTEGER -- Opsiyonel: hangi kullanıcı geri bildirim verdi
);

-- AI performans metrikleri
CREATE TABLE IF NOT EXISTS ai_performance_metrics (
  id SERIAL PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  total_questions INTEGER DEFAULT 0,
  good_feedback INTEGER DEFAULT 0,
  bad_feedback INTEGER DEFAULT 0,
  average_response_time FLOAT DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Öğrenme geçmişi tablosu
CREATE TABLE IF NOT EXISTS ai_learning_history (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL, -- 'example_added', 'feedback_processed', 'model_updated'
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- İndeksler (performans için)
CREATE INDEX IF NOT EXISTS idx_training_examples_question ON ai_training_examples USING gin(to_tsvector('turkish', question));
CREATE INDEX IF NOT EXISTS idx_training_examples_category ON ai_training_examples(category);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON ai_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_processed ON ai_feedback(processed);

-- Başlangıç eğitim örnekleri
INSERT INTO ai_training_examples (question, answer, category) VALUES
('bu ay kaç randevu var', 'Bu ay toplam **{count} randevu** bulunuyor. {details}', 'appointments'),
('bu ay randevuları listele', 'Bu ayki randevular: {appointment_list}', 'appointments'),
('toplam gelir ne kadar', 'Toplam gelir **{total_revenue} TL**. Aktif müşterilerden **{active_revenue} TL**, eski müşterilerden **{old_revenue} TL**.', 'finance'),
('bekleyen ödemeler', 'Toplam **{count} bekleyen ödeme** var: {payment_list}', 'finance'),
('en çok müşterisi olan danışman', '**{consultant_name}** en çok müşteriye sahip (**{client_count} müşteri**).', 'consultants'),
('danışman performansı', 'Danışman performansları: {consultant_stats}', 'consultants'),
('müşteri sayısı', 'Toplam **{total_clients} müşteri** var. **{active_clients} aktif**, **{inactive_clients} pasif**.', 'clients'),
('vize türü dağılımı', 'En çok başvurulan vize türleri: {visa_distribution}', 'analysis'),
('aylık trend', '{month} ayında {trend_description}', 'analysis'),
('randevu durumu', 'Yaklaşan randevular: {upcoming_appointments}', 'appointments')
ON CONFLICT (question) DO NOTHING;

-- Örnek geri bildirimler
INSERT INTO ai_feedback (question, ai_answer, user_feedback, correct_answer) VALUES
('bu ay kaç randevu var', 'Bu ay 5 randevu var', 'bad', 'Bu ay toplam **8 randevu** bulunuyor. 3 tanesi tamamlandı, 5 tanesi yaklaşıyor.'),
('toplam gelir', '250000 TL gelir var', 'partial', 'Toplam gelir **347.500 TL**. Aktif müşterilerden **280.000 TL**, eski müşterilerden **67.500 TL** elde edilmiş.')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE ai_training_examples IS 'AI sisteminin öğrendiği soru-cevap örnekleri';
COMMENT ON TABLE ai_feedback IS 'Kullanıcı geri bildirimleri ve AI performans değerlendirmesi';
COMMENT ON TABLE ai_performance_metrics IS 'AI sisteminin günlük performans metrikleri';
COMMENT ON TABLE ai_learning_history IS 'AI öğrenme sürecinin geçmişi';
