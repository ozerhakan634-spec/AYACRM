-- Şirket ayarları tablosu oluştur
CREATE TABLE IF NOT EXISTS company_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL, -- Ayar anahtarı (company_name, email, phone, vb.)
  setting_value TEXT, -- Ayar değeri
  setting_type VARCHAR(50) DEFAULT 'string', -- Veri türü: string, number, boolean, json
  category VARCHAR(50) DEFAULT 'company', -- Kategori: company, system, appearance, notifications
  description TEXT, -- Ayar açıklaması
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Güncelleme zamanı için trigger
CREATE TRIGGER update_company_settings_updated_at 
  BEFORE UPDATE ON company_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- İndeks oluştur
CREATE INDEX idx_company_settings_key ON company_settings(setting_key);
CREATE INDEX idx_company_settings_category ON company_settings(category);

-- Varsayılan şirket ayarlarını ekle
INSERT INTO company_settings (setting_key, setting_value, setting_type, category, description) VALUES
('company_name', 'Vize Danismanlık Ltd. Sti.', 'string', 'company', 'Sirket adi'),
('company_email', 'info@vizedanismanlik.com', 'string', 'company', 'Sirket e-posta adresi'),
('company_phone', '+90 212 555 0123', 'string', 'company', 'Sirket telefon numarasi'),
('company_address', 'Bagdat Caddesi No:123, Kadikoy/Istanbul', 'string', 'company', 'Sirket adresi'),
('company_website', 'www.vizedanismanlik.com', 'string', 'company', 'Sirket web sitesi'),
('company_tax_number', '1234567890', 'string', 'company', 'Sirket vergi numarasi'),
('company_logo_url', null, 'string', 'company', 'Sirket logo URL adresi')
ON CONFLICT (setting_key) DO NOTHING;

-- Log mesajı
SELECT 'Company settings tablosu başarıyla oluşturuldu ve varsayılan veriler eklendi!' as message;
