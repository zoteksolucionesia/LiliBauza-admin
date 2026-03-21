-- ============================================
-- LiliBauza - Database Setup Completo
-- Ejecutar en: https://supabase.com/dashboard/project/wxbbmzeoydtygqykkrdk/sql/new
-- ============================================

-- ============================================
-- 1. CREAR TABLAS
-- ============================================

-- Tabla de Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  fecha_nacimiento TEXT,
  genero TEXT DEFAULT 'Femenino',
  ocupacion TEXT,
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notas TEXT
);

-- Tabla de Documentos
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('constancia', 'receta', 'diagnostico')),
  paciente_id UUID REFERENCES pacientes(id),
  paciente_nombre TEXT NOT NULL,
  contenido TEXT,
  fecha_emision TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vigencia DATE,
  codigo_verificacion TEXT UNIQUE,
  notas TEXT
);

-- Tabla de Tests
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  preguntas JSONB DEFAULT '[]'::jsonb,
  interpretacion TEXT,
  es_predefinido BOOLEAN DEFAULT FALSE,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Citas
CREATE TABLE IF NOT EXISTS citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES pacientes(id),
  paciente_nombre TEXT NOT NULL,
  paciente_email TEXT,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  tipo TEXT DEFAULT 'Consulta individual',
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'completada')),
  notas TEXT,
  calendly_id TEXT
);

-- Tabla de Resultados de Tests
CREATE TABLE IF NOT EXISTS resultados_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES tests(id),
  paciente_id UUID REFERENCES pacientes(id),
  paciente_nombre TEXT,
  respuestas JSONB DEFAULT '[]'::jsonb,
  puntaje_total NUMERIC,
  interpretacion TEXT,
  fecha_aplicacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. AGREGAR COLUMNAS FALTANTES (si la tabla ya existe)
-- ============================================

ALTER TABLE tests ADD COLUMN IF NOT EXISTS interpretacion TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS notas TEXT;

-- ============================================
-- 3. HABILITAR RLS
-- ============================================

ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_tests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. ELIMINAR POLÍTICAS EXISTENTES
-- ============================================

-- Pacientes
DROP POLICY IF EXISTS "auth_users_select_pacientes" ON pacientes;
DROP POLICY IF EXISTS "auth_users_insert_pacientes" ON pacientes;
DROP POLICY IF EXISTS "auth_users_update_pacientes" ON pacientes;
DROP POLICY IF EXISTS "auth_users_delete_pacientes" ON pacientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver pacientes" ON pacientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar pacientes" ON pacientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar pacientes" ON pacientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar pacientes" ON pacientes;

-- Documentos
DROP POLICY IF EXISTS "auth_users_select_documentos" ON documentos;
DROP POLICY IF EXISTS "auth_users_insert_documentos" ON documentos;
DROP POLICY IF EXISTS "auth_users_update_documentos" ON documentos;
DROP POLICY IF EXISTS "auth_users_delete_documentos" ON documentos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver documentos" ON documentos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar documentos" ON documentos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar documentos" ON documentos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar documentos" ON documentos;

-- Tests
DROP POLICY IF EXISTS "auth_users_select_tests" ON tests;
DROP POLICY IF EXISTS "auth_users_insert_tests" ON tests;
DROP POLICY IF EXISTS "auth_users_update_tests" ON tests;
DROP POLICY IF EXISTS "auth_users_delete_tests" ON tests;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver tests" ON tests;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar tests" ON tests;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar tests" ON tests;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar tests" ON tests;

-- Citas
DROP POLICY IF EXISTS "auth_users_select_citas" ON citas;
DROP POLICY IF EXISTS "auth_users_insert_citas" ON citas;
DROP POLICY IF EXISTS "auth_users_update_citas" ON citas;
DROP POLICY IF EXISTS "auth_users_delete_citas" ON citas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver citas" ON citas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar citas" ON citas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar citas" ON citas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar citas" ON citas;

-- Resultados Tests
DROP POLICY IF EXISTS "auth_users_select_resultados" ON resultados_tests;
DROP POLICY IF EXISTS "auth_users_insert_resultados" ON resultados_tests;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver resultados" ON resultados_tests;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar resultados" ON resultados_tests;

-- ============================================
-- 5. CREAR POLÍTICAS
-- ============================================

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

-- Tests
CREATE POLICY "auth_users_select_tests" ON tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_users_insert_tests" ON tests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_users_update_tests" ON tests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_users_delete_tests" ON tests FOR DELETE TO authenticated USING (true);

-- Citas
CREATE POLICY "auth_users_select_citas" ON citas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_users_insert_citas" ON citas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_users_update_citas" ON citas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_users_delete_citas" ON citas FOR DELETE TO authenticated USING (true);

-- Resultados Tests
CREATE POLICY "auth_users_select_resultados" ON resultados_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_users_insert_resultados" ON resultados_tests FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- 6. INSERTAR TESTS PRE-CARGADOS
-- ============================================

INSERT INTO tests (nombre, descripcion, preguntas, interpretacion, es_predefinido) VALUES
('ASRS - Escala de Autoevaluación para TDAH en Adultos',
 'Test para detectar síntomas de Trastorno por Déficit de Atención e Hiperactividad',
 '[{"id":"1","texto":"¿Con qué frecuencia deja los proyectos a medias una vez que ha terminado la parte difícil?","tipo":"escala","puntaje_min":0,"puntaje_max":4},{"id":"2","texto":"¿Con qué frecuencia tiene dificultades para organizar las tareas y actividades que debe realizar?","tipo":"escala","puntaje_min":0,"puntaje_max":4},{"id":"3","texto":"¿Con qué frecuencia olvida citas u obligaciones?","tipo":"escala","puntaje_min":0,"puntaje_max":4},{"id":"4","texto":"¿Con qué frecuencia evita o pospone tareas que requieren mucho esfuerzo mental?","tipo":"escala","puntaje_min":0,"puntaje_max":4},{"id":"5","texto":"¿Con qué frecuencia mueve las manos o los pies cuando tiene que permanecer sentado?","tipo":"escala","puntaje_min":0,"puntaje_max":4},{"id":"6","texto":"¿Con qué frecuencia se siente inquieto o nervioso?","tipo":"escala","puntaje_min":0,"puntaje_max":4}]',
 '0-6: Bajo riesgo | 7-12: Riesgo moderado | 13-24: Alto riesgo de TDAH',
 true),

('GAD-7 - Escala de Ansiedad Generalizada',
 'Evaluación del trastorno de ansiedad generalizada',
 '[{"id":"1","texto":"¿Sentirse nervioso, ansioso o con los nervios de punta?","tipo":"escala","puntaje_min":0,"puntaje_max":3},{"id":"2","texto":"¿No ser capaz de parar o controlar la preocupación?","tipo":"escala","puntaje_min":0,"puntaje_max":3},{"id":"3","texto":"¿Preocuparse demasiado por diferentes cosas?","tipo":"escala","puntaje_min":0,"puntaje_max":3},{"id":"4","texto":"¿Tener problemas para relajarse?","tipo":"escala","puntaje_min":0,"puntaje_max":3},{"id":"5","texto":"¿Estar tan inquieto que es difícil estar sentado?","tipo":"escala","puntaje_min":0,"puntaje_max":3},{"id":"6","texto":"¿Sentirse temeroso como si algo terrible fuera a suceder?","tipo":"escala","puntaje_min":0,"puntaje_max":3},{"id":"7","texto":"¿Sentirse fácilmente molesto o irritable?","tipo":"escala","puntaje_min":0,"puntaje_max":3}]',
 '0-4: Ansiedad mínima | 5-9: Ansiedad leve | 10-14: Ansiedad moderada | 15-21: Ansiedad severa',
 true),

('AQ-10 - Cuestionario de Cociente de Espectro Autista',
 'Evaluación breve de rasgos del espectro autista',
 '[{"id":"1","texto":"Me fijo mucho en los patrones o números que veo a mi alrededor","tipo":"escala","puntaje_min":0,"puntaje_max":2},{"id":"2","texto":"Me resulta fácil leer entre líneas cuando alguien me habla","tipo":"escala","puntaje_min":0,"puntaje_max":2,"invertida":true},{"id":"3","texto":"Suelo notar sonidos que otros no perciben","tipo":"escala","puntaje_min":0,"puntaje_max":2},{"id":"4","texto":"Me resulta fácil hacer varias cosas a la vez","tipo":"escala","puntaje_min":0,"puntaje_max":2,"invertida":true},{"id":"5","texto":"Cuando hablo, no siempre es fácil para los demás entenderme","tipo":"escala","puntaje_min":0,"puntaje_max":2},{"id":"6","texto":"Me fascinan las fechas","tipo":"escala","puntaje_min":0,"puntaje_max":2},{"id":"7","texto":"Me resulta difícil entender las intenciones de otras personas","tipo":"escala","puntaje_min":0,"puntaje_max":2},{"id":"8","texto":"No me molesta que las cosas no estén en orden","tipo":"escala","puntaje_min":0,"puntaje_max":2,"invertida":true},{"id":"9","texto":"Me resulta fácil entender los sentimientos de los demás","tipo":"escala","puntaje_min":0,"puntaje_max":2,"invertida":true},{"id":"10","texto":"Me resulta difícil hacer amigos","tipo":"escala","puntaje_min":0,"puntaje_max":2}]',
 '0-5: Bajo rasgo | 6-7: Rasgo moderado | 8-10: Alto rasgo de espectro autista',
 true)

ON CONFLICT DO NOTHING;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
