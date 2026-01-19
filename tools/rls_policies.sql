-- =====================================================
-- RLS Policies para user_profiles
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Habilitar RLS en la tabla (si no está habilitado)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes (si las hay) para evitar conflictos
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Política SELECT: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- Política INSERT: Los usuarios pueden crear su propio perfil
CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Política UPDATE: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- =====================================================
-- RLS Policies para user_nutrition (por si acaso)
-- =====================================================

ALTER TABLE user_nutrition ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own nutrition" ON user_nutrition;
DROP POLICY IF EXISTS "Users can insert own nutrition" ON user_nutrition;
DROP POLICY IF EXISTS "Users can update own nutrition" ON user_nutrition;

CREATE POLICY "Users can view own nutrition"
ON user_nutrition FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition"
ON user_nutrition FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition"
ON user_nutrition FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- RLS Policies para weight_history
-- =====================================================

ALTER TABLE weight_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own weight history" ON weight_history;
DROP POLICY IF EXISTS "Users can insert own weight" ON weight_history;

CREATE POLICY "Users can view own weight history"
ON weight_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight"
ON weight_history FOR INSERT
WITH CHECK (auth.uid() = user_id);
