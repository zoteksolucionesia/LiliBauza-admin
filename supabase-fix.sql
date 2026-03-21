-- ============================================
-- PASO 1: Arreglar la tabla tests existente
-- ============================================

-- Agregar columnas faltantes a la tabla tests
ALTER TABLE tests ADD COLUMN IF NOT EXISTS interpretacion TEXT;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS es_predefinido BOOLEAN DEFAULT FALSE;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS preguntas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Si existe la columna scoring, hacer que acepte NULL o poner un valor por defecto
ALTER TABLE tests ALTER COLUMN scoring DROP NOT NULL;

-- ============================================
-- PASO 2: Insertar los 3 tests pre-cargados
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
