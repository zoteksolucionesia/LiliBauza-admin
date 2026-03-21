-- ============================================
-- Arreglar tabla pacientes - Agregar columnas faltantes
-- ============================================

-- Agregar columnas faltantes a la tabla pacientes
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS fecha_nacimiento TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS genero TEXT DEFAULT 'Femenino';
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS ocupacion TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS notas TEXT;

-- ============================================
-- Arreglar tabla documentos - Agregar columnas faltantes
-- ============================================

ALTER TABLE documentos ADD COLUMN IF NOT EXISTS paciente_id UUID;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS paciente_nombre TEXT;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS contenido TEXT;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS fecha_emision TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS vigencia DATE;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS codigo_verificacion TEXT UNIQUE;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS notas TEXT;

-- ============================================
-- Arreglar tabla citas - Agregar columnas faltantes
-- ============================================

ALTER TABLE citas ADD COLUMN IF NOT EXISTS paciente_id UUID;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS paciente_nombre TEXT NOT NULL DEFAULT '';
ALTER TABLE citas ADD COLUMN IF NOT EXISTS paciente_email TEXT;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS fecha DATE;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS hora TIME;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'Consulta individual';
ALTER TABLE citas ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente';
ALTER TABLE citas ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS calendly_id TEXT;

-- ============================================
-- Habilitar RLS
-- ============================================

ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_tests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Eliminar y recrear políticas
-- ============================================

DROP POLICY IF EXISTS "auth_users_select_pacientes" ON pacientes;
DROP POLICY IF EXISTS "auth_users_insert_pacientes" ON pacientes;
DROP POLICY IF EXISTS "auth_users_update_pacientes" ON pacientes;
DROP POLICY IF EXISTS "auth_users_delete_pacientes" ON pacientes;

DROP POLICY IF EXISTS "auth_users_select_documentos" ON documentos;
DROP POLICY IF EXISTS "auth_users_insert_documentos" ON documentos;
DROP POLICY IF EXISTS "auth_users_update_documentos" ON documentos;
DROP POLICY IF EXISTS "auth_users_delete_documentos" ON documentos;

DROP POLICY IF EXISTS "auth_users_select_citas" ON citas;
DROP POLICY IF EXISTS "auth_users_insert_citas" ON citas;
DROP POLICY IF EXISTS "auth_users_update_citas" ON citas;
DROP POLICY IF EXISTS "auth_users_delete_citas" ON citas;

DROP POLICY IF EXISTS "auth_users_select_resultados" ON resultados_tests;
DROP POLICY IF EXISTS "auth_users_insert_resultados" ON resultados_tests;

-- Pacientes
CREATE POLICY "auth_users_select_pacientes" ON pacientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_users_insert_pacientes" ON pacientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_users_update_pacientes" ON pacientes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_users_delete_pacientes" ON pacientes FOR DELETE TO authenticated USING (true);

-- Documentos
CREATE POLICY "auth_users_select_documentos" ON documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_users_insert_documentos" ON documentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_users_update_documentos" ON documentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_users_delete_documentos" ON documentos FOR DELETE TO authenticated USING (true);

-- Citas
CREATE POLICY "auth_users_select_citas" ON citas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_users_insert_citas" ON citas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_users_update_citas" ON citas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_users_delete_citas" ON citas FOR DELETE TO authenticated USING (true);

-- Resultados Tests
CREATE POLICY "auth_users_select_resultados" ON resultados_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_users_insert_resultados" ON resultados_tests FOR INSERT TO authenticated WITH CHECK (true);
