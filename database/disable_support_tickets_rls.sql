-- =====================================================
-- DESTEK TALEPLERİ RLS'Yİ DEVRE DIŞI BIRAKMA
-- =====================================================

-- RLS'yi devre dışı bırak (custom auth sistemi kullandığımız için)
ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- DEĞİŞİKLİKLERİ ONAYLA
-- =====================================================

COMMIT;
