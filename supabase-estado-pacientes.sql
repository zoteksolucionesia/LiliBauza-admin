-- ============================================
-- Agregar campo de estado a pacientes
-- ============================================

-- Agregar columna de estado (activo/archivado)
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'archivado'));

-- Actualizar pacientes existentes a 'activo'
UPDATE pacientes SET estado = 'activo' WHERE estado IS NULL;
