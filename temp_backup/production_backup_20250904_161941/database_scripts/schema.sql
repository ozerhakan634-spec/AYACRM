-- CRM Veritabanı Şeması

-- Müşteriler tablosu (CRM arayüzü için güncellenmiş)
CREATE TABLE clients (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255), -- Müşteri adı
  company_name VARCHAR(255), -- Şirket adı
  contact_person VARCHAR(255), -- İletişim kişisi
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  industry VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  visa_type VARCHAR(100), -- Vize türü
  country VARCHAR(100), -- Ülke
  application_number VARCHAR(100), -- DS/BAŞVURU NO
  passport_number VARCHAR(100), -- Pasaport numarası
  tc_kimlik_no VARCHAR(20), -- TC kimlik numarası
  kullanici_adi VARCHAR(100), -- Kullanıcı adı
  dogum_tarihi DATE, -- Doğum tarihi
  appointment_date DATE, -- Randevu tarihi
  appointment_time TIME, -- Randevu saati
  seyahat_amaci VARCHAR(100), -- Seyahat amacı
  notes TEXT, -- Notlar
  guvenlik_soru1 TEXT, -- Güvenlik sorusu 1
  guvenlik_cevap1 TEXT, -- Güvenlik cevabı 1
  guvenlik_soru2 TEXT, -- Güvenlik sorusu 2
  guvenlik_cevap2 TEXT, -- Güvenlik cevabı 2
  guvenlik_soru3 TEXT, -- Güvenlik sorusu 3
  guvenlik_cevap3 TEXT, -- Güvenlik cevabı 3
  consultant_id INTEGER, -- Danışman ID (consultants tablosu ile ilişki)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Danışmanlar tablosu (CRM arayüzü için güncellenmiş)
CREATE TABLE consultants (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL, -- Tam ad
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  specialty VARCHAR(100), -- Uzmanlık alanı
  rating DECIMAL(3,1) DEFAULT 5.0, -- Puan
  location VARCHAR(100), -- Konum
  experience VARCHAR(100), -- Deneyim
  education TEXT, -- Eğitim bilgileri
  certifications TEXT, -- Sertifikalar
  languages TEXT, -- Konuştuğu diller
  notes TEXT, -- Notlar
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dokümanlar tablosu (Documents.jsx ile uyumlu)
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL, -- Belge adı
  type VARCHAR(50) DEFAULT 'identity', -- Belge türü: identity, education, employment, financial, medical
  description TEXT, -- Belge açıklaması
  fileName VARCHAR(255), -- Storage'da saklanan dosya adı
  originalFileName VARCHAR(255), -- Orijinal dosya adı
  fileSize DECIMAL(10,2), -- Dosya boyutu (MB)
  fileType VARCHAR(100), -- Dosya MIME türü
  fileUrl TEXT, -- Dosya public URL'i
  status VARCHAR(50) DEFAULT 'pending', -- Durum: pending, verified, rejected, expired
  clientId BIGINT REFERENCES clients(id) ON DELETE CASCADE, -- Müşteri ID
  clientName VARCHAR(255), -- Müşteri adı (denormalize edilmiş)
  consultant_id BIGINT REFERENCES consultants(id) ON DELETE SET NULL,
  uploadedDate TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Yüklenme tarihi
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Finans tablosu
CREATE TABLE finance (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  consultant_id BIGINT REFERENCES consultants(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TRY',
  transaction_type VARCHAR(50) NOT NULL, -- 'income', 'expense'
  description TEXT,
  transaction_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Takvim tablosu
CREATE TABLE calendar (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  consultant_id BIGINT REFERENCES consultants(id) ON DELETE SET NULL,
  event_type VARCHAR(50), -- 'meeting', 'call', 'deadline'
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Raporlar tablosu
CREATE TABLE reports (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  report_type VARCHAR(50), -- 'monthly', 'quarterly', 'annual'
  generated_by BIGINT REFERENCES consultants(id) ON DELETE SET NULL,
  report_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_consultants_email ON consultants(email);
CREATE INDEX idx_documents_clientId ON documents(clientId);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_finance_client_id ON finance(client_id);
CREATE INDEX idx_finance_transaction_date ON finance(transaction_date);
CREATE INDEX idx_calendar_event_date ON calendar(event_date);
CREATE INDEX idx_calendar_client_id ON calendar(client_id);

-- Güncelleme zamanı için trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Her tablo için trigger oluştur
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultants_updated_at BEFORE UPDATE ON consultants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_finance_updated_at BEFORE UPDATE ON finance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_updated_at BEFORE UPDATE ON calendar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
