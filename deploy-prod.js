const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ruta al archivo .env.production
const envPath = path.join(__dirname, '.env.production');

let envVars = {};

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const firstEquals = line.indexOf('=');
    if (firstEquals === -1) return;
    const key = line.substring(0, firstEquals).trim();
    const value = line.substring(firstEquals + 1).trim();
    
    // Solo tomamos variables de servidor (que no empiezan con NEXT_PUBLIC_)
    if (key && !key.startsWith('NEXT_PUBLIC_')) {
      // Remover comillas opcionales que envuelvan el valor
      let cleanValue = value;
      if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) || 
          (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
        cleanValue = cleanValue.substring(1, cleanValue.length - 1);
      }
      envVars[key] = cleanValue;
    }
  });
} else {
  console.warn('⚠️ No se encontró el archivo .env.production');
}

// Configurar proveedor por defecto si no existe
if (!envVars.AI_PROVIDER) {
  envVars.AI_PROVIDER = 'gemini';
}

console.log('🚀 Iniciando despliegue de Firebase...');
try {
  // Usar npx para asegurar el ejecutable local de firebase-tools si existe
  execSync('npx firebase deploy', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Error durante firebase deploy:', error.message);
  process.exit(1);
}

const envPairs = Object.entries(envVars)
  .map(([key, value]) => `${key}=${value}`)
  .join(',');

if (envPairs) {
  console.log('⚙️ Sincronizando variables de entorno en Cloud Run...');
  try {
    const gcloudCmd = `gcloud run services update ssrlilibauzaadmin --region us-central1 --project lilibauza-admin --update-env-vars "${envPairs}"`;
    console.log(`Invocando gcloud para inyectar: ${Object.keys(envVars).join(', ')}`);
    execSync(gcloudCmd, { stdio: 'inherit' });
    console.log('✅ Despliegue y configuración completados con éxito.');
  } catch (error) {
    console.error('❌ Error al actualizar variables en Cloud Run.');
    console.error('Asegúrate de estar autenticado en gcloud y tener acceso al proyecto.');
    console.error(error.message);
    process.exit(1);
  }
} else {
  console.log('ℹ️ No se encontraron variables de servidor en .env.production para inyectar.');
}
