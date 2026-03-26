-- ============================================
-- Multi-Tenancy & Custom Branding Setup
-- ============================================

-- 1. Crear tabla de configuración por terapeuta (inquilino)
CREATE TABLE IF NOT EXISTS configuracion_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terapeuta_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  color_primario TEXT DEFAULT '#C19A9A', -- Rosa palo original
  logo_url TEXT,
  nombre_comercial TEXT,
  modo_oscuro BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Añadir terapeuta_id a las tablas existentes
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS terapeuta_id UUID REFERENCES auth.users(id);
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS terapeuta_id UUID REFERENCES auth.users(id);
ALTER TABLE tests ADD COLUMN IF NOT EXISTS terapeuta_id UUID REFERENCES auth.users(id);
ALTER TABLE plantillas_documentos ADD COLUMN IF NOT EXISTS terapeuta_id UUID REFERENCES auth.users(id);
ALTER TABLE citas ADD COLUMN IF NOT EXISTS terapeuta_id UUID REFERENCES auth.users(id);
ALTER TABLE resultados_tests ADD COLUMN IF NOT EXISTS terapeuta_id UUID REFERENCES auth.users(id);

-- 3. Habilitar RLS en la nueva tabla
ALTER TABLE configuracion_branding ENABLE ROW LEVEL SECURITY;

-- 4. Actualizar Políticas de RLS para aislamiento total
-- Cada terapeuta solo ve/edita lo suyo basado en su auth.uid()

-- Política para configuración de branding
DROP POLICY IF EXISTS "Inquilinos ven su propio branding" ON configuracion_branding;
CREATE POLICY "Inquilinos ven su propio branding" ON configuracion_branding
FOR ALL USING (terapeuta_id = auth.uid());

-- Actualizar políticas de Pacientes
DROP POLICY IF EXISTS "Aislamiento de pacientes por terapeuta" ON pacientes;
CREATE POLICY "Aislamiento de pacientes por terapeuta" ON pacientes
FOR ALL TO authenticated USING (terapeuta_id = auth.uid()) WITH CHECK (terapeuta_id = auth.uid());

-- Actualizar políticas de Documentos
DROP POLICY IF EXISTS "Aislamiento de documentos por terapeuta" ON documentos;
CREATE POLICY "Aislamiento de documentos por terapeuta" ON documentos
FOR ALL TO authenticated USING (terapeuta_id = auth.uid()) WITH CHECK (terapeuta_id = auth.uid());

-- Actualizar políticas de Tests (Los predefinidos los ven todos, los suyos solo ellos)
DROP POLICY IF EXISTS "Aislamiento de tests por terapeuta" ON tests;
CREATE POLICY "Aislamiento de tests por terapeuta" ON tests
FOR ALL TO authenticated USING (terapeuta_id = auth.uid() OR es_predefinido = TRUE) WITH CHECK (terapeuta_id = auth.uid());

-- Actualizar políticas de Citas
DROP POLICY IF EXISTS "Aislamiento de citas por terapeuta" ON citas;
CREATE POLICY "Aislamiento de citas por terapeuta" ON citas
FOR ALL TO authenticated USING (terapeuta_id = auth.uid()) WITH CHECK (terapeuta_id = auth.uid());

-- Actualizar políticas de Resultados
DROP POLICY IF EXISTS "Aislamiento de resultados por terapeuta" ON resultados_tests;
CREATE POLICY "Aislamiento de resultados por terapeuta" ON resultados_tests
FOR ALL TO authenticated USING (terapeuta_id = auth.uid()) WITH CHECK (terapeuta_id = auth.uid());

-- Actualizar políticas de Plantillas
DROP POLICY IF EXISTS "Aislamiento de plantillas por terapeuta" ON plantillas_documentos;
CREATE POLICY "Aislamiento de plantillas por terapeuta" ON plantillas_documentos
FOR ALL TO authenticated USING (terapeuta_id = auth.uid()) WITH CHECK (terapeuta_id = auth.uid());

-- 5. Trigger para crear configuración de branding al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user_branding()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.configuracion_branding (terapeuta_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_branding();
