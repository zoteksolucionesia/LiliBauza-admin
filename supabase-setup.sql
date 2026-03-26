-- ============================================
-- LiliBauza Database Setup
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

-- Tabla de Configuracion de Branding
CREATE TABLE IF NOT EXISTS configuracion_branding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    terapeuta_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    color_primario TEXT DEFAULT '#D4A5A5',
    modo_oscuro BOOLEAN DEFAULT false,
    logo_url TEXT,
    membretada_url TEXT,
    nombre_clinica TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
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

-- Habilitar RLS (solo si no está habilitado)
DO $$ BEGIN
  ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE resultados_tests ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Eliminar políticas existentes (si existen)
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver pacientes" ON pacientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar pacientes" ON pacientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar pacientes" ON pacientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar pacientes" ON pacientes;

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver documentos" ON documentos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar documentos" ON documentos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar documentos" ON documentos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar documentos" ON documentos;

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver tests" ON tests;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar tests" ON tests;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar tests" ON tests;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar tests" ON tests;

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver citas" ON citas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar citas" ON citas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar citas" ON citas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar citas" ON citas;

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver resultados" ON resultados_tests;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar resultados" ON resultados_tests;
DROP POLICY IF EXISTS "Terapeutas gestionan su propio branding" ON configuracion_branding;

-- Crear políticas para pacientes
CREATE POLICY "Usuarios autenticados pueden ver pacientes"
  ON pacientes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar pacientes"
  ON pacientes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar pacientes"
  ON pacientes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar pacientes"
  ON pacientes FOR DELETE TO authenticated USING (true);

-- Crear políticas para documentos
CREATE POLICY "Usuarios autenticados pueden ver documentos"
  ON documentos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar documentos"
  ON documentos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar documentos"
  ON documentos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar documentos"
  ON documentos FOR DELETE TO authenticated USING (true);

-- Crear políticas para tests
CREATE POLICY "Usuarios autenticados pueden ver tests"
  ON tests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar tests"
  ON tests FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar tests"
  ON tests FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar tests"
  ON tests FOR DELETE TO authenticated USING (true);

-- Crear políticas para citas
-- Políticas de Seguridad (RLS)
DROP POLICY IF EXISTS "Solo veo mis pacientes" ON pacientes;
CREATE POLICY "Solo veo mis pacientes" ON pacientes FOR ALL TO authenticated USING (auth.uid() = terapeuta_id);

DROP POLICY IF EXISTS "Solo veo mis documentos" ON documentos;
CREATE POLICY "Solo veo mis documentos" ON documentos FOR ALL TO authenticated USING (auth.uid() = terapeuta_id);

DROP POLICY IF EXISTS "Solo veo mis resultados" ON resultados_tests;
CREATE POLICY "Solo veo mis resultados" ON resultados_tests FOR ALL TO authenticated USING (auth.uid() = terapeuta_id);

DROP POLICY IF EXISTS "Solo veo mis citas" ON citas;
CREATE POLICY "Solo veo mis citas" ON citas FOR ALL TO authenticated USING (auth.uid() = terapeuta_id);

DROP POLICY IF EXISTS "Solo veo mis tests" ON tests;
CREATE POLICY "Solo veo mis tests" ON tests FOR ALL TO authenticated USING (auth.uid() = terapeuta_id);

DROP POLICY IF EXISTS "Terapeutas gestionan su propio branding" ON configuracion_branding;
CREATE POLICY "Terapeutas gestionan su propio branding" ON configuracion_branding FOR ALL TO authenticated USING (auth.uid() = terapeuta_id);

-- Función para clonar plantillas a nuevos terapeutas
CREATE OR REPLACE FUNCTION clonar_plantillas_base(target_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Clonar tests desde el usuario admin (sería tu cuenta root)
    INSERT INTO tests (nombre, descripcion, preguntas, interpretacion, es_predefinido, terapeuta_id)
    SELECT nombre, descripcion, preguntas, interpretacion, es_predefinido, target_user_id
    FROM tests 
    WHERE terapeuta_id = 'c7a4569c-0c6a-4c91-9556-3c0700000000' -- ID de ejemplo que debes reemplazar
    ON CONFLICT DO NOTHING;

    -- Clonar resultados de ejemplo si fuera necesario
    -- INSERT INTO ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear configuración por defecto
CREATE OR REPLACE FUNCTION public.handle_new_user_branding()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.configuracion_branding (terapeuta_id, color_primario, modo_oscuro)
  VALUES (new.id, '#D4A5A5', false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_branding ON auth.users;

CREATE TRIGGER on_auth_user_created_branding
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_branding();

-- ============================================
-- Datos de prueba (Opcional)
-- ============================================

-- Insertar 3 tests pre-cargados
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
