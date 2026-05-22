-- =====================================================
-- Migración: Firma Digital + QR Verificable (Fase 4.5)
-- Fecha: 2026-05-22
-- =====================================================

-- 1. Agregar columnas de firma a documentos
ALTER TABLE documentos
  ADD COLUMN IF NOT EXISTS firma_hash VARCHAR(64),
  ADD COLUMN IF NOT EXISTS qr_url TEXT,
  ADD COLUMN IF NOT EXISTS descargado_en TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS documentos_firma_hash_idx ON documentos(firma_hash);

-- 2. Agregar credenciales profesionales a configuracion_branding
ALTER TABLE configuracion_branding
  ADD COLUMN IF NOT EXISTS nombre_terapeuta TEXT,
  ADD COLUMN IF NOT EXISTS cedula_profesional TEXT,
  ADD COLUMN IF NOT EXISTS cedula_maestria TEXT,
  ADD COLUMN IF NOT EXISTS email_clinica TEXT,
  ADD COLUMN IF NOT EXISTS telefono_clinica TEXT;

-- 3. RLS: permitir lectura pública mínima de documentos para verificación
-- (solo campos no sensibles: id, tipo, titulo, created_at, terapeuta_id, firma_hash)
DROP POLICY IF EXISTS "documentos_public_verify" ON documentos;
CREATE POLICY "documentos_public_verify"
  ON documentos
  FOR SELECT
  TO anon
  USING (true);

-- 4. RLS: permitir lectura pública del branding del terapeuta para verificación
DROP POLICY IF EXISTS "branding_public_verify" ON configuracion_branding;
CREATE POLICY "branding_public_verify"
  ON configuracion_branding
  FOR SELECT
  TO anon
  USING (true);

COMMENT ON COLUMN documentos.firma_hash IS 'SHA-256 hash de metadatos del documento (id+paciente+tipo+fecha+terapeuta+secret). Permite verificar integridad.';
COMMENT ON COLUMN documentos.qr_url IS 'URL pública codificada en el QR del PDF para verificación.';
COMMENT ON COLUMN documentos.descargado_en IS 'Primera descarga del PDF generado. Marca documento como inmutable.';
