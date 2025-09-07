-- Consultants tablosuna auth_user_id kolonu ekleme
-- Bu kolon danışmanları Supabase Auth kullanıcıları ile ilişkilendirir

-- Auth user ID kolonu ekle
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_consultants_auth_user_id ON consultants(auth_user_id);

-- Mevcut danışmanlar için auth user oluşturma (isteğe bağlı)
-- Bu kısım manuel yapılmalı veya başka bir script ile

COMMENT ON COLUMN consultants.auth_user_id IS 'Supabase Auth sistemindeki kullanıcının UUID si';
