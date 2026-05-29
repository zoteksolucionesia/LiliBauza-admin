-- =====================================================
-- Migración: Modelo de IA configurable por terapeuta
-- Fecha: 2026-05-29
-- =====================================================
-- Cada terapeuta puede elegir el modelo de IA para interpretar tests.
-- La API key es CENTRAL (del sistema, en GEMINI_API_KEY); el terapeuta
-- solo selecciona el modelo. Por defecto un modelo gratuito de Gemini.
-- =====================================================

ALTER TABLE configuracion_branding
  ADD COLUMN IF NOT EXISTS modelo_ia TEXT DEFAULT 'gemini-2.5-flash-lite';

COMMENT ON COLUMN configuracion_branding.modelo_ia IS 'Modelo de IA elegido por el terapeuta para interpretar tests (ej. gemini-2.5-flash-lite gratuito, gemini-2.5-pro de pago). La API key es central del sistema.';
