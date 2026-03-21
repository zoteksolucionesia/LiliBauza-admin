-- Verificar columnas existentes en documentos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documentos' 
ORDER BY ordinal_position;
