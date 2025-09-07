-- Şirket ayarları tablosu oluştur (Basit versiyon)
CREATE TABLE IF NOT EXISTS company_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string',
  category VARCHAR(50) DEFAULT 'company',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeks oluştur
CREATE INDEX IF NOT EXISTS idx_company_settings_key ON company_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_company_settings_category ON company_settings(category);

-- Varsayılan şirket ayarlarını ekle
INSERT INTO company_settings (setting_key, setting_value, setting_type, category, description) VALUES
('company_name', 'Vize Danismanlık Ltd. Sti.', 'string', 'company', 'Company name'),
('company_email', 'info@vizedanismanlik.com', 'string', 'company', 'Company email'),
('company_phone', '+90 212 555 0123', 'string', 'company', 'Company phone'),
('company_address', 'Bagdat Caddesi No:123, Kadikoy/Istanbul', 'string', 'company', 'Company address'),
('company_website', 'www.vizedanismanlik.com', 'string', 'company', 'Company website'),
('company_tax_number', '1234567890', 'string', 'company', 'Company tax number'),
('company_logo_url', null, 'string', 'company', 'Company logo URL')
ON CONFLICT (setting_key) DO NOTHING;
