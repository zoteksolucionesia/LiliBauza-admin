-- =====================================================
-- Migración: Plantillas compartidas entre terapeutas
-- Fecha: 2026-05-29
-- =====================================================
-- Objetivo: que las plantillas base (constancia, receta, diagnóstico)
-- estén disponibles para TODOS los terapeutas del CRM, replicando el
-- mismo mecanismo `es_predefinido` que ya usan los tests.
-- =====================================================

-- 1. Agregar columna es_predefinido (igual que en `tests`)
ALTER TABLE plantillas_documentos
  ADD COLUMN IF NOT EXISTS es_predefinido BOOLEAN DEFAULT FALSE;

-- 2. Marcar las plantillas base actuales como predefinidas (globales).
--    Tras la consolidación, las 3 plantillas pertenecen a la cuenta
--    morentinomar (9e15bd5d). Se vuelven visibles para todos.
UPDATE plantillas_documentos SET es_predefinido = TRUE;

-- 3. Actualizar RLS: cada terapeuta ve SUS plantillas + las predefinidas,
--    pero solo puede crear/editar/borrar las suyas (WITH CHECK por terapeuta).
--    Mismo patrón que la policy de `tests`.
DROP POLICY IF EXISTS "Aislamiento de plantillas por terapeuta" ON plantillas_documentos;
CREATE POLICY "Aislamiento de plantillas por terapeuta" ON plantillas_documentos
  FOR ALL TO authenticated
  USING (terapeuta_id = auth.uid() OR es_predefinido = TRUE)
  WITH CHECK (terapeuta_id = auth.uid());

COMMENT ON COLUMN plantillas_documentos.es_predefinido IS 'Si TRUE, la plantilla es global y visible para todos los terapeutas (no editable por otros). Mismo mecanismo que tests.es_predefinido.';
