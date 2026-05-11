# LiliBauza Admin — CRM para Terapeutas

Sistema administrativo para Mtra. Liliana Bauza De Casso (psicóloga/psicoterapeuta).
Stack: Next.js 16.2.6 (App Router) + Supabase + Firebase Hosting (SSR via Cloud Functions) + Tailwind CSS.

## Arquitectura

```
/src
  /app
    /admin
      layout.tsx          ← Sidebar + contenedor flex (excluye /admin/login)
      /dashboard          ← KPIs y acciones rápidas
      /pacientes          ← Lista de pacientes
        /[id]             ← Expediente full-page de un paciente (3 tabs)
      /documentos         ← Gestión de documentos y plantillas (3 tabs)
      /tests              ← Tests psicológicos
      /citas              ← Agenda de citas
      /configuracion      ← Branding, logo, membretada, dark mode
    /api
      /logo               ← Sirve logo desde Supabase storage
      /membretada         ← Sirve hoja membretada desde Supabase storage
      /interpretar-test   ← Llama a Claude/AI para interpretar resultados de test
      /enviar-resultados  ← Envía email al paciente con resultados del test
  /components/admin       ← Todos los componentes reutilizables
  /hooks
    useAuth.ts            ← Verifica sesión Supabase, redirige a login si no hay
    useTheme.ts           ← Carga branding (color, logo, dark mode) de Supabase + localStorage
  /lib
    supabaseClient.ts     ← Cliente Supabase
    theme.ts              ← Objeto `colors` global (se actualiza via CSS variables)
```

## Tablas Supabase

| Tabla | Descripción | Campos clave |
|---|---|---|
| `pacientes` | Expediente del paciente | id, terapeuta_id, nombre_completo, email, telefono, fecha_nacimiento, genero, ocupacion, notas, activo, created_at |
| `documentos` | PDFs generados | id, paciente_id, terapeuta_id, titulo, tipo (constancia/receta/diagnostico/archivo), storage_url, activo |
| `plantillas_documentos` | Plantillas de texto para generar docs | id, terapeuta_id, tipo, contenido_base, updated_at |
| `tests` | Definición de tests psicológicos | id, terapeuta_id, nombre, descripcion, preguntas (JSON), interpretacion, es_predefinido |
| `resultados_tests` | Resultados de tests aplicados | id, test_id, paciente_id, respuestas (JSON), puntaje_total, interpretacion, interpretacion_ia, email_paciente, email_enviado |
| `citas` | Agenda de citas | id, paciente_id, paciente_nombre, fecha, hora, tipo, estado (pendiente/confirmada/cancelada/completada) |
| `configuracion_branding` | Branding por terapeuta | terapeuta_id, color_primario, logo_url, membretada_url, nombre_clinica, modo_oscuro |

## Flujo de Autenticación

1. `useAuth()` hook → llama `supabase.auth.getSession()`
2. Sin sesión → redirige a `/admin/login`
3. Con sesión → todas las queries usan `terapeuta_id = session.user.id` (Row Level Security)

## Sistema de Temas

- `useTheme()` hook lee de `localStorage` síncronamente (anti-FOUC via inline script en layout.tsx)
- Luego carga branding de Supabase (`configuracion_branding`) en background
- Aplica CSS variables al DOM (`--color-primary`, `--color-background`, etc.)
- Color default: `#D4A5A5` (rosa Lili)
- El objeto `colors` en `lib/theme.ts` lee esas CSS variables dinámicamente

---

## Módulo: Dashboard (`/admin/dashboard`)

**Propósito:** Vista general con KPIs y acciones rápidas.

**Qué hace:**
- Carga conteos de 4 tablas en paralelo: `pacientes`, `documentos`, `tests`, `citas`
- Muestra 4 StatCards clickeables (navegan a su sección)
- 3 QuickActionButtons: Nuevo Paciente, Nuevo Documento, Crear Test

---

## Módulo: Pacientes (`/admin/pacientes`)

**Propósito:** Lista y gestión de expedientes de pacientes.

**Flujo de clics:**
- `Filtro Estado` (Select) → filtra por activo/archivado/todos y recarga
- `Buscar` (SearchBar) → filtra en cliente por nombre o email
- `+ Paciente` (SearchBar) → abre Modal con `PacienteForm` (crear nuevo)
  - Form: nombre, email, teléfono, fecha nacimiento, género, ocupación, notas
  - Guardar → INSERT en `pacientes` con `terapeuta_id`
- Clic en fila / botón `Ver` → `router.push('/admin/pacientes/${id}')` (página completa)

**IMPORTANTE:** La página `/admin/pacientes` tiene un componente `PacienteDetalle` que se abre en modal cuando se llama con un paciente existente, pero el flujo principal navega a la ruta `/admin/pacientes/[id]`.

---

## Módulo: Expediente del Paciente (`/admin/pacientes/[id]`)

**Propósito:** Vista full-page del expediente completo de un paciente.

**Layout:** 3 pestañas con contenido variable.

**Tab 1 — Información General:**
- Columna izquierda (2/3): Form de datos del paciente (vista/edición)
  - `✏️ Editar` → activa modo edición (inputs editables)
  - `💾 Guardar` → UPDATE en `pacientes`
  - `❌ Cancelar` → restaura datos originales
- Columna derecha (1/3): KPIs (tests, documentos, citas), acciones (archivar/reactivar, eliminar)

**Tab 2 — Documentos & Tests:**
- Columna izquierda: Lista de tests aplicados con puntajes
  - Clic en test → Modal con detalles (interpretación IA, respuestas, recomendaciones)
- Columna derecha: Panel de documentos
  - `📎 Adjuntar PDF` → Modal con BulkUpload
  - `Ver` → Modal PDF viewer con iframe
  - `🗑️` → marca `activo: false` (soft delete)

**Tab 3 — Acciones:**
- `📁 Archivar/Reactivar` → toggle `activo` en `pacientes`
- `💾 Respaldar` → genera ZIP con datos JSON + PDFs descargados
- `🗑️ Eliminar Paciente` → Modal confirmación → DELETE en cascada (storage, documentos, tests, citas, paciente)

---

## Módulo: Documentos (`/admin/documentos`)

**Propósito:** Gestión centralizada de todos los documentos y plantillas.

**3 pestañas (Tabs component, full-page sin bordes):**

**Tab Documentos:**
- Tabla: Título, Paciente, Fecha, Acciones
- `+ Nuevo Documento` → Modal `GeneradorDocumentoModal`
  - Seleccionar paciente → seleccionar plantilla → editor Quill → genera PDF con hoja membretada → sube a Supabase Storage → INSERT en `documentos`
- `👁️ Ver` → Modal con iframe PDF viewer + botón Descargar PDF
- `🗑️` → soft delete (`activo: false`), mueve a Papelera

**Tab Plantillas:**
- Tabla: Tipo de Plantilla, Última Actualización, Acciones
- Info box: explica variables dinámicas `[NOMBRE DEL PACIENTE]` y `[FECHA]`
- `+ Nueva Plantilla` → Modal con `PlantillaForm`
  - Campo: Nombre/tipo, Editor Quill con variables dinámicas
  - Guardar → INSERT en `plantillas_documentos`
- `✏️ Editar Plantilla` → mismo Modal pre-cargado → UPDATE en `plantillas_documentos`

**Tab Papelera:**
- Lista documentos con `activo: false`
- `🔄 Restaurar` → UPDATE `activo: true`
- `🗑️` (permanente) → DELETE de DB + borrar de Supabase Storage
- `🗑️ Vaciar Papelera` → elimina todos permanentemente

---

## Módulo: Tests (`/admin/tests`)

**Propósito:** Crear y aplicar tests psicológicos.

**Flujo de clics:**
- `+ Crear Test` → Modal con `TestBuilder`
  - Nombre, descripción, preguntas (tipo: escala/opción múltiple/abierta), interpretación manual
  - INSERT en `tests` con `terapeuta_id`
- Clic en fila / `👁️ Ver` → Modal `TestDetalle` (preguntas, interpretación)
- `📋 Aplicar` → Modal `ApplyTestForm`
  - Seleccionar paciente → responder preguntas → Guardar
  - POST `/api/interpretar-test` → genera interpretación con IA (Claude)
  - INSERT en `resultados_tests`
  - Si hay email → botón `📧 Enviar` → POST `/api/enviar-resultados`
- `🗑️` (solo tests no predefinidos) → DELETE en `tests`

**Tests predefinidos:** Se cargan con `es_predefinido = true` (visibles para todos los terapeutas).

---

## Módulo: Citas (`/admin/citas`)

**Propósito:** Gestión de agenda de citas.

**Flujo de clics:**
- Stats: citas próximas, total citas
- `Buscar` → filtra por nombre o email del paciente
- `Filtro Estado` → todos/pendiente/confirmada/cancelada/completada
- `+ Agendar Cita` → Modal `CitaForm`
  - Seleccionar paciente, fecha, hora, tipo, estado inicial
  - INSERT en `citas`
- Acciones por fila:
  - `Confirmar` (si pendiente) → UPDATE `estado: confirmada`
  - `Cancelar` (si no cancelada/completada) → confirm() → UPDATE `estado: cancelada`
  - `Completar` (si confirmada) → UPDATE `estado: completada`

---

## Módulo: Configuración (`/admin/configuracion`)

**Propósito:** Personalización del branding y preferencias de interfaz.

**Flujo de clics:**
- `Nombre de la Clínica` → input texto
- `Logo Personalizado` → file input → preview inmediato
- `Hoja Membretada` → file input → se usa como fondo en PDFs generados
- `Color Primario` → color picker + input hex
- Presets de color → selección rápida (Rosa Lili, Azul, Verde, Púrpura, Gris, Naranja)
- `Guardar y Aplicar` → sube logo/membretada a Storage `branding/`, UPDATE `configuracion_branding`, aplica CSS variables al DOM
- Toggle Dark Mode → toggle inmediato + UPDATE `modo_oscuro` en Supabase

---

## Componentes Clave

| Componente | Propósito |
|---|---|
| `Sidebar` | Navegación lateral, logo terapeuta, dark mode toggle, logout |
| `Header` | Título + subtítulo de cada página, con botón "back" opcional |
| `DataTable` | Tabla genérica con columnas customizables, acciones por fila, mensaje vacío |
| `Modal` | Contenedor modal flotante, tamaños: sm/md/lg/xl |
| `Tabs` + `TabPanel` | Pestañas sin bordes/modal, full-page |
| `GeneradorDocumentoModal` | Flujo completo de generación de documento PDF con plantilla + membretada |
| `ConfirmModal` | Modal de confirmación para acciones destructivas |
| `NotificationManager` | Notificaciones toast (success/error/info) |
| `SearchBar` | Barra de búsqueda + botón "Agregar" |
| `EditorRico` | Editor Quill rich text para plantillas |
| `BulkUpload` | Subida múltiple de PDFs a Supabase Storage |
| `FileUpload` | Subida individual de archivo |

---

## APIs Internas

| Ruta | Método | Propósito |
|---|---|---|
| `/api/interpretar-test` | POST | Llama a IA (Claude) para interpretar resultados, devuelve texto |
| `/api/enviar-resultados` | POST | Envía email al paciente con resultados del test |
| `/api/logo` | GET | Sirve logo del terapeuta desde Supabase Storage |
| `/api/membretada` | GET | Sirve imagen de hoja membretada desde Supabase Storage |

---

## Notas de Diseño

- **Tema dinámico:** Todo el sistema de colores usa CSS variables (`--color-primary`, etc.). El objeto `colors` en `lib/theme.ts` lee esas variables. Cambiar el color en configuración afecta TODA la UI.
- **Anti-FOUC:** Inline script en `layout.tsx` aplica el tema del localStorage ANTES del primer paint del navegador.
- **Soft delete:** Los documentos no se borran directamente; se marcan `activo: false` y van a la Papelera. Eliminación permanente borra de DB y Storage.
- **Multi-tenancy:** Cada query filtra por `terapeuta_id = session.user.id`. RLS de Supabase lo refuerza a nivel DB.
- **Generación de PDFs:** Usa `jsPDF` + `pdf-lib` + imagen base64 de la hoja membretada (`HOJA_MEMBRETADA_BASE64`). El PDF se sube al bucket `documentos` de Supabase Storage.
- **Tabs component:** No usar con altura fija ni bordes de contenedor — es full-page sin restricciones visuales.
