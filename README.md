# 🔐 LiliBauza - Dashboard Administrativo

**Sistema de gestión para la Mtra. Liliana Bauza - Psicóloga Clínica**

---

## 📋 Descripción

Este es el sistema administrativo privado diseñado para:
- Gestionar expedientes de pacientes
- Administrar documentos (constancias, recetas, diagnósticos)
- Crear y aplicar tests psicológicos en línea
- Generar reportes con interpretación de IA
- Enviar resultados por email a pacientes

**URL de Producción:** lilibauza-admin.web.app (pendiente de configurar)  
**Acceso:** Solo con login (autenticado con Supabase)

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Edita el archivo `.env.local` con tus credenciales de Supabase:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wxbbmzeoydtygqykkrdk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_API_KEY_AQUI

# Obtén tu API Key en:
# https://supabase.com/dashboard/project/wxbbmzeoydtygqykkrdk/settings/api
```

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
```

El dashboard estará disponible en: `http://localhost:3001/admin/login`

### 4. Build para producción

```bash
npm run build
```

### 5. Deploy a Firebase

```bash
firebase deploy --only hosting
```

---

## 📁 Estructura del Proyecto

```
LiliBauza-Admin/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx      ← Dashboard principal
│   │   │   ├── login/
│   │   │   │   └── page.tsx      ← Login de administrador
│   │   │   ├── pacientes/        ← ✅ Lista, alta y expediente
│   │   │   ├── documentos/       ← ✅ Constancias, recetas, diagnósticos
│   │   │   ├── tests/            ← ✅ Test Builder + Tests ilimitados
│   │   │   └── citas/            ← ✅ Gestión de appointments
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── supabaseClient.ts     ← Cliente de Supabase
│   │   └── utils.ts              ← Utilidades
│   ├── hooks/
│   │   └── useTheme.ts           ← Hook para temas
│   ├── types/
│   │   └── theme.ts              ← Tipos de temas
│   └── components/
│       └── admin/                ← ✅ Componentes reutilizables
│           ├── DataTable.tsx     ← Tabla de datos
│           ├── SearchBar.tsx     ← Búsqueda + botón nuevo
│           ├── Modal.tsx         ← Modal genérico
│           ├── Button.tsx        ← Botones con variantes
│           ├── Input.tsx         ← Input con label/error
│           ├── Select.tsx        ← Select con label/error
│           └── TextArea.tsx      ← TextArea con label/error
├── package.json
├── next.config.ts
├── firebase.json
├── .firebaserc
└── .env.local
```

---

## 🗄️ Base de Datos (Supabase)

### Tablas Creadas

| Tabla | Propósito |
|-------|-----------|
| `pacientes` | Registro de pacientes |
| `documentos` | Constancias, recetas, diagnósticos |
| `plantillas` | Plantillas de documentos |
| `tests` | Tests psicológicos configurados |
| `resultados_tests` | Resultados de tests aplicados |
| `citas` | Integración con Calendly |
| `configuracion` | Configuración general |

### Script SQL

El script de configuración está en: `../documentacion/supabase-database-setup.sql`

Para ejecutarlo:
1. Ve a https://supabase.com/dashboard/project/wxbbmzeoydtygqykkrdk
2. SQL Editor → New Query
3. Copia y pega el contenido del archivo
4. Click en "Run"

---

## 🔐 Autenticación

### Primer Registro

1. Ve a `http://localhost:3001/admin/login`
2. Ingresa tu email y contraseña
3. Click en "Crear cuenta"
4. Verifica tu email en Supabase

### Login Posterior

1. Ingresa email y contraseña
2. Click en "Iniciar Sesión"
3. Serás redirigido al dashboard

---

## 📊 Funcionalidades

### ✅ Completadas

- [x] Login con Supabase Auth
- [x] Dashboard con estadísticas
- [x] Base de datos configurada
- [x] 3 plantillas pre-cargadas
- [x] 3 tests pre-cargados (ASRS, GAD-7, AQ-10)
- [x] **Lista de pacientes** - Alta, edición y expediente digital
- [x] **Lista de documentos** - Generador de constancias, recetas y diagnósticos
- [x] **Test Builder** - Crear tests ilimitados con preguntas personalizadas
- [x] **Gestión de citas** - Agendar, confirmar, cancelar y completar citas

### ⏳ Pendientes

- [ ] Generación de PDFs con QR de validación
- [ ] Envío de emails con resultados
- [ ] Módulo de consulta pública de resultados
- [ ] Integración con Mercado Pago (tests en línea con pago)
- [ ] Interpretación automática con IA

---

## 🎨 Características

### Tema

- Usa la paleta **Palo de Rosa** por defecto
- Sin selector de colores (solo admin)
- Diseño limpio y profesional

### Seguridad

- Row Level Security (RLS) habilitado
- Solo usuarios autenticados pueden acceder
- Datos encriptados en tránsito

---

## 🛠️ Tecnologías

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Next.js | 16.x | Framework React |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 3.x | Estilos |
| Supabase | 2.x | Base de datos + Auth |
| Framer Motion | 11.x | Animaciones |
| Firebase | 10.x | Hosting |

---

## 📈 Roadmap

### ✅ Fase 1: Gestión de Pacientes - COMPLETADA
- [x] Lista de pacientes
- [x] Alta de nuevos pacientes
- [x] Expediente digital por paciente

### ✅ Fase 2: Gestión de Documentos - COMPLETADA
- [x] Lista de documentos
- [x] Generador de constancias
- [x] Generador de recetas
- [x] Generador de diagnósticos

### ✅ Fase 3: Tests Psicológicos - COMPLETADA
- [x] Test Builder (crear tests ilimitados)
- [x] Lista de tests (predefinidos + personalizados)
- [x] Vista de detalles de tests

### ⏳ Fase 4: Tests en Línea con Pago
- [ ] Integración con Mercado Pago
- [ ] Tests en línea para pacientes
- [ ] Interpretación automática con IA
- [ ] Envío de resultados por email

### ⏳ Fase 5: Módulo Público
- [ ] Página de consulta de resultados
- [ ] Búsqueda por email + código QR
- [ ] Vista de resultados para pacientes

### ⏳ Fase 6: Documentos con Validación
- [ ] Generación de PDFs
- [ ] Códigos QR de validación

---

## 📞 Soporte

**Desarrollador:** Zotek Soluciones IA  
**Email:** zoteksolucionesia@gmail.com  
**GitHub:** https://github.com/zoteksolucionesia/LiliBauza

---

## 🎯 Accesos Rápidos

| Módulo | URL |
|--------|-----|
| Login | `/admin/login` |
| Dashboard | `/admin/dashboard` |
| Pacientes | `/admin/pacientes` |
| Documentos | `/admin/documentos` |
| Tests | `/admin/tests` |
| Citas | `/admin/citas` |

---

*Última actualización: 20 de marzo de 2026*
