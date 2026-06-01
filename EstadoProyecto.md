# Estado del Proyecto - LiliBauza Admin (CRM para Terapeutas)

Este documento contiene un resumen detallado del estado actual del desarrollo, la arquitectura del sistema, la base de datos y las características clave implementadas en la plataforma **LiliBauza Admin**.

## 📌 Información General
*   **Nombre del Proyecto:** LiliBauza Admin (CRM para Terapeutas)
*   **Cliente Principal:** Mtra. Liliana Bauza De Casso (Psicóloga / Psicoterapeuta)
*   **Objetivo:** SaaS administrativo multi-inquilino para psicoterapeutas que facilita la gestión de expedientes clínicos, aplicación de pruebas con interpretación de IA, agendamiento de citas y generación de documentos personalizados.
*   **URL de Producción:** [https://lilibauza-admin.web.app](https://lilibauza-admin.web.app)
*   **Rama de Git Actual:** `feat/paciente-expediente-fullpage`

---

## 🛠️ Stack Tecnológico
*   **Framework Principal:** Next.js 16.2.6 (App Router)
*   **Librería UI:** React 19.2.3 & Framer Motion (para transiciones suaves).
*   **Estilos:** Tailwind CSS con PostCSS.
*   **Base de Datos y Auth:** Supabase (PostgreSQL, Storage Buckets, Row Level Security).
*   **Integraciones de Terceros:**
    *   **Anthropic SDK (Claude API):** Interpretación automática e inteligente de resultados de tests psicológicos.
    *   **Resend API:** Envío automatizado de resultados e informes directamente a los correos de los pacientes.
*   **Generación e Interacción con Archivos:**
    *   `jsPDF` y `pdf-lib` para crear constancias, recetas y diagnósticos en formato PDF con la membretada dinámica.
    *   `jszip` y `file-saver` para empaquetar expedientes en formato comprimido ZIP.

---

## 🎨 Sistema de Branding y Temas Dinámicos
Una de las innovaciones del proyecto es su motor de temas adaptativos:
1.  **Conversión HSL:** A partir de un único color hexadecimal elegido por el terapeuta en configuración, el backend/frontend calcula dinámicamente toda la paleta de colores (claros, oscuros y acentuados) usando un algoritmo de conversión HSL en `src/types/theme.ts`.
2.  **Prevención de Parpadeo (Anti-FOUC):** Se inyecta un script inline en `src/app/layout.tsx` que carga de `localStorage` el tema configurado y lo aplica antes del primer renderizado visual del navegador.
3.  **Persistencia:** La configuración de branding (colores, logo de la clínica, hoja membretada) se guarda en Supabase (`configuracion_branding`) y se cachea localmente en el cliente para navegación instantánea.

---

## 📊 Arquitectura de Base de Datos (Supabase Schema)
Las tablas principales creadas en la base de datos de Supabase son:

*   **`pacientes`**: Almacena los expedientes clínicos del paciente.
*   **`documentos`**: Registro de archivos subidos y documentos PDF generados.
*   **`plantillas_documentos`**: Plantillas en texto enriquecido (editor Quill) con variables dinámicas como `[NOMBRE DEL PACIENTE]` y `[FECHA]`.
*   **`tests`**: Catálogo de pruebas aplicables por el terapeuta (incluye predefinidos y personalizados).
*   **`resultados_tests`**: Respuestas, puntuación final e interpretaciones generadas por IA o introducidas manualmente.
*   **`citas`**: Registro de la agenda clínica y su estado (pendiente, confirmada, cancelada, completada).
*   **`configuracion_branding`**: Configuración visual específica del terapeuta.

*Nota: Todas las consultas a la base de datos están protegidas mediante políticas de RLS vinculadas a `terapeuta_id = auth.uid()`.*

---

## 📂 Archivos Críticos del Proyecto
| Ruta del Archivo | Propósito / Funcionalidad |
| :--- | :--- |
| `src/hooks/useTheme.ts` | Hook que orquesta la persistencia local y sincronización del branding con Supabase. |
| `src/types/theme.ts` | Algoritmos de conversión de color HSL y generación de paletas. |
| `src/app/layout.tsx` | Layout raíz donde se inyecta el script inline anti-FOUC. |
| `src/lib/theme.ts` | Objeto de referencia para las variables CSS aplicadas en la interfaz. |
| `src/app/admin/pacientes/page.tsx` | Contiene el código de descarga masiva ZIP y borrado en cascada. |
| `supabase-setup.sql` | Definición completa de tablas, tipos y disparadores iniciales de la base de datos. |

---

## 🚀 Siguientes Pasos del Desarrollo
1.  **Optimización de Carga:** Monitorear el rendimiento de la carga de logos de alta resolución en la cabecera.
2.  **Módulo de Documentos:** Agregar más variables dinámicas y soporte para múltiples firmas digitales en plantillas.
3.  **Sincronización de Calendario:** (Opcional) Evaluar la integración de calendarios externos como Google Calendar o la automatización de llamadas con VAPI.

---

## 🧩 Refactorizaciones e Hitos Previos (hasta Mar–May 2026)

Hitos consolidados de fases anteriores del desarrollo:

*   **Sistema de temas adaptativo (modo oscuro):** generación de paletas claras/oscuras desde un solo color hex (HSL), persistencia en `localStorage`, anti-FOUC. Se eliminaron **todos los colores hardcodeados** (p. ej. el rosa `#D4A5A5`) de componentes como `FileUpload`, `DataTable`, `Tabs` y `Button`.
*   **Gestión de pacientes y seguridad:** respaldo de expedientes en `.zip` (`jszip` + `file-saver`); **eliminación atómica** que limpia base de datos y Storage de Supabase de forma segura; sustitución de `alert()` por notificaciones Toast y modales de confirmación con advertencias del historial clínico.
*   **Limpieza de interfaz:** se removió el logo genérico "Terhfam" del Sidebar (exclusividad del logo del terapeuta); mejoras de visibilidad de carpetas/documentos en modo oscuro.

---

## 🗓️ Bitácora de Sesiones

### Sesión 2026-05-29 — Recuperación de acceso, firma QR, consolidación de cuentas, tests y plantillas compartidas
*   **Hilo (thread ID):** `6ce995b9-277c-4ae4-b70c-ebb2d40ea2d4`
*   **Rama:** `feat/paciente-expediente-fullpage`
*   **Commits:** `75b7e7a` (firma digital/QR), `7dc5bd3` (reset password), `62ab8d1` (fix QR hash), `f8f0327` (tests + plantillas), `d59398e` (editar tests + PDF de resultados), `d7291ab` (IA configurable Gemini/Anthropic), `adc57d1` (modelo IA por terapeuta), `76fd57e` (fix modelos Gemini 2.5)

**1. Acceso bloqueado ("Credenciales no válidas" con todos los usuarios)**
*   Diagnóstico: las API keys de Supabase eran válidas (probadas contra `/auth/v1/token`: devolvían `400 invalid_credentials`, no `401`). La config de Auth era correcta. El usuario `morentinomar@gmail.com` estaba confirmado y no baneado, pero su `updated_at` era posterior al último login → la **contraseña había sido cambiada** (desde la Mac).
*   Solución: reset de contraseña vía Admin API de Supabase (`PUT /auth/v1/admin/users/{id}`). Nota técnica: las nuevas `service_role` keys (`sb_secret_…`) rechazan User-Agent de navegador; se usó `User-Agent: node`.

**2. Página de reset de contraseña (faltaba en la app)**
*   Nueva ruta [src/app/admin/reset-password/page.tsx](src/app/admin/reset-password/page.tsx): dos modos (solicitar enlace / escribir nueva contraseña vía evento `PASSWORD_RECOVERY`).
*   Enlace "¿Olvidaste tu contraseña?" agregado al login; layout excluye la ruta del sidebar.
*   Requisito de config: el **Site URL** de Supabase debía apuntar a producción (estaba en `localhost`) — corregido por el usuario.

**3. Fix de verificación QR ("Firma inválida")**
*   Causa: el hash se firmaba con `Date.toISOString()` (`…Z`) pero Supabase devolvía `created_at` como `…+00:00`. Los strings diferían → hash no coincidía.
*   Solución (commit `62ab8d1`, traído de `main`): canonizar la fecha con `new Date(meta.fecha).toISOString()` dentro de `computarHash()` en [src/lib/firma.ts](src/lib/firma.ts). Solo afecta documentos nuevos.

**4. Consolidación multi-cuenta**
*   Los datos estaban repartidos entre 3 cuentas. Se consolidó TODO en la cuenta activa `morentinomar@gmail.com` (`9e15bd5d`): plantillas, branding, pacientes, documentos y tests (incluidos registros huérfanos sin `terapeuta_id`).
*   **Mapa de cuentas:**
    | Email | UUID | Rol |
    | :--- | :--- | :--- |
    | morentinomar@gmail.com | `9e15bd5d` | Cuenta activa (hace de terapeuta en pruebas) |
    | lilibauza@gmail.com | `756de755` | Cuenta real de la terapeuta (futuro) |
    | zoteksolucionesia@gmail.com | `5a768c76` | Cuenta de desarrollo/agencia |

**5. Tests predefinidos ahora se pueden responder**
*   Bug: `ApplyTestForm` solo renderizaba inputs si la pregunta tenía campo `tipo`. Los predefinidos (ASRS, GAD-7, AQ-10) usan `{id, texto, opciones:[{texto, valor}]}` sin `tipo` → no se renderizaban inputs.
*   Solución en [src/app/admin/tests/page.tsx](src/app/admin/tests/page.tsx): `opcionesNormalizadas()` unifica formatos; el render usa botones (escala), radios (opciones) o textarea (abierta); `calcularPuntaje()` suma respuestas numéricas.
*   15 de 16 tests marcados `es_predefinido = true` (compartidos). Único privado: "Test de prueba".

**6. Plantillas compartidas con copy-on-edit**
*   Migración [supabase/migrations/20260529_plantillas_compartidas.sql](supabase/migrations/20260529_plantillas_compartidas.sql): columna `es_predefinido` + RLS `USING (terapeuta_id = auth.uid() OR es_predefinido = TRUE)`.
*   Las plantillas base son globales (todos las ven); editar una global **crea una copia privada** del terapeuta (no modifica la base). El generador prefiere la copia propia; el tab muestra badge **Global/Propia**.

**7. Branding/QR de Liliana**
*   Branding replicado a la cuenta `lilibauza@gmail.com` (`756de755`) para que el sello sea idéntico cuando ella se active.
*   Aclaración: las credenciales (`nombre_terapeuta`, cédulas) **no entran en el hash de firma** → dejarlas vacías no invalida el QR; solo se omite la sección "Profesional firmante".

**8. Edición de tests con copy-on-edit**
*   Botón "✏️ Editar" en cada test (commit `d59398e`). Editar un test predefinido crea una **copia privada** del terapeuta; editar uno propio lo actualiza en sitio.
*   `TestBuilder` ahora soporta **opciones con valor numérico** (formato Likert), para que las preguntas agregadas sumen al puntaje. Modo edición precarga el test (con `key` para forzar remount).

**9. Resultado del test: vista en pantalla + descarga PDF**
*   Pantalla de resultado muestra el **detalle de respuestas** por pregunta.
*   Botón "⬇️ Descargar PDF" genera el resultado (datos, puntaje, respuestas, interpretación) con `jsPDF`, client-side, sin servicios externos.

**Hallazgo — Interpretación "por IA":**
*   La etiqueta "🤖 Interpretación generada por IA" es **meramente informativa/fija**; no garantiza que la IA haya corrido.
*   `ANTHROPIC_API_KEY` **no está configurada en producción** → el código cae al fallback `test.interpretacion` (interpretación manual).
*   Los tests recién marcados como predefinidos (ASRS v1.1, GAD-7 Ansiedad Generalizada, AQ-10 Autismo Screening) tienen `interpretacion` **vacía** → por eso la interpretación sale en blanco. Los duplicados antiguos sí la tienen.

**10. Interpretación de tests con proveedor de IA configurable (commit `d7291ab`)**
*   Se reescribió el endpoint [interpretar-test/route.ts](src/app/api/interpretar-test/route.ts) para soportar **dos proveedores** vía variable de entorno `AI_PROVIDER` (`gemini` | `anthropic`).
*   **Gemini** vía `@google/generative-ai` (instalado, `^0.24.1`), con `GEMINI_API_KEY` y `GEMINI_MODEL`.
*   **Anthropic** vía SDK existente (`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`).
*   Se envolvió todo en **try/catch global**: ante fallo o key ausente devuelve **JSON de error** (antes una excepción no capturada hacía que Next devolviera HTML → el cliente reventaba con "Failed to execute json"). Ahora el cliente cae limpio al fallback de interpretación manual.
*   Decisión de privacidad documentada: el endpoint **no envía el nombre del paciente** al LLM (solo nombre del test, preguntas, respuestas y puntaje). Esto mitiga el riesgo del tier gratuito de Gemini (donde Google puede usar los datos).

**11. Modelo de IA configurable POR TERAPEUTA con key central (commit `adc57d1`)**
*   **Modelo de costo elegido:** key **central** del sistema (la paga el dueño/Zotek); cada terapeuta solo **elige el modelo**.
*   **Migración** [20260529_modelo_ia_por_terapeuta.sql](supabase/migrations/20260529_modelo_ia_por_terapeuta.sql): columna `modelo_ia` en `configuracion_branding`.
*   El **endpoint** lee `modelo_ia` del terapeuta dueño del test e **infiere el proveedor** por el nombre del modelo (`gemini*` → Gemini, `claude*` → Anthropic); si no hay, usa el del entorno.
*   **UI** en `/admin/configuracion`: selector de modelo + aviso ("el sistema usa modelos gratuitos de Gemini; para interpretaciones más precisas, elige un modelo de pago").

**12. Fix: modelos Gemini 2.0 bloqueados → migrar a 2.5 (commit `76fd57e`)**
*   **Síntoma:** tras configurar Gemini, al aplicar el GAD-7 seguía saliendo la interpretación **manual por rangos**, no la de IA.
*   **Diagnóstico (probando la API de Gemini directamente):** el modelo por defecto `gemini-2.0-flash-lite` devuelve **`404 — "no longer available to new users"`**. La key es nueva, así que ese modelo (y `gemini-2.0-flash`) están **bloqueados**.
*   **Modelos que SÍ funcionan con la key:** `gemini-2.5-flash-lite` (gratis), `gemini-2.5-flash` (gratis), `gemini-2.5-pro` (de pago). (La cuenta tiene acceso incluso a Gemini 3.x, pero se eligió 2.5 por estabilidad.)
*   **Correcciones:** se actualizó el `modelo_ia` de ambas cuentas en BD a `gemini-2.5-flash-lite`; se cambiaron los defaults del endpoint, la UI (opciones del selector) y la migración; el "modelo de pago" pasó de Gemini 1.5 Pro → **Gemini 2.5 Pro**.

**13. Configuración de variables de entorno en producción (Cloud Run)**
*   **Hallazgo crítico de infraestructura:** en este stack (Next.js sobre Firebase Functions 2ª gen = Cloud Run), las variables del **servidor** (no `NEXT_PUBLIC_*`) **no** se propagan desde los archivos `.env` al runtime de la función. Por eso `ANTHROPIC_API_KEY`/`GEMINI_API_KEY` no estaban disponibles.
*   **Solución aplicada:** inyectar las variables directo en el servicio Cloud Run:
    ```
    gcloud run services update ssrlilibauzaadmin --region us-central1 \
      --project lilibauza-admin \
      --update-env-vars AI_PROVIDER=gemini,GEMINI_API_KEY=***
    ```
*   **⚠️ Problema de persistencia SOLUCIONADO:** cada `firebase deploy` **borraba** estas variables del servicio. Para solucionar esto permanentemente, se debe realizar el despliegue ejecutando únicamente `npm run deploy`.
*   Servicio: `ssrlilibauzaadmin` · región `us-central1` · proyecto `lilibauza-admin`. gcloud autenticado como `morentinomar@gmail.com` (proyecto activo `zotek-ia`, por eso se usa `--project` explícito).

**Notas sobre la API key de Gemini:**
*   La suscripción "PRO" (Gemini Advanced / Google One) **NO aplica** a la API de desarrollador; la API tiene su propio tier gratuito, igual para cualquier cuenta de Google.
*   Recomendación: crear la key central con la cuenta del negocio (`zoteksolucionesia@gmail.com`) para centralizar facturación futura.

**14. Automatización del despliegue y persistencia de variables (2026-05-29)**
*   Se creó [deploy-prod.js](file:///c:/Users/USUARIO/MisProyectos/LiliBauza-admin/deploy-prod.js), un script en Node.js que lee automáticamente las variables de servidor (como `GEMINI_API_KEY`, `AI_PROVIDER`, etc.) desde el archivo `.env.production` (gitignorado) y ejecuta consecutivamente `firebase deploy` y `gcloud run services update` para inyectarlas de nuevo en Cloud Run de forma transparente.
*   Se agregó el script `"deploy"` en [package.json](file:///c:/Users/USUARIO/MisProyectos/LiliBauza-admin/package.json) para correr el despliegue con `npm run deploy` de manera obligatoria para produccion.
*   El usuario rotó la clave `GEMINI_API_KEY` de producción guardándola de forma segura en su archivo `.env.production` local.

**Pendientes abiertos:**
*   🔒 Rotar la `service_role` key de Supabase usada en la sesión anterior.
*   (Opcional) En Supabase: `ALTER TABLE configuracion_branding ALTER COLUMN modelo_ia SET DEFAULT 'gemini-2.5-flash-lite';` para que terapeutas nuevos nazcan con un modelo válido.
*   (Opcional) Configurar `RESEND_API_KEY` para habilitar envío de resultados por email (conviene robustecer ese endpoint con try/catch como se hizo con interpretar-test).
*   (Opcional) Ajustar la etiqueta "Interpretación generada por IA" para distinguir IA real vs fallback manual.
*   (Opcional) Llenar credenciales profesionales de Liliana en `/admin/configuracion`.
*   (Opcional) Definir si un admin puede editar la plantilla/test base global desde la UI (hoy solo vía DB).

---

### Sesión 2026-06-01 (14:05) — Integración del portal Zotek en Citas con SSO
*   **Hilo (thread ID):** `6ce995b9-277c-4ae4-b70c-ebb2d40ea2d4` (continuación)
*   **Rama:** `feat/paciente-expediente-fullpage`
*   **Commits:** CRM `b9059ea` · Portal `c267561` (repo Zotek, rama `feature/admin-client-tabs-ui`)

**Contexto y decisión de producto**
*   La gestión de **citas, leads y horarios** vive **100% en el portal SaaS de Zotek** (`zotek-ia.web.app/portal`), cuyo backend usa otro proyecto Supabase (`bjtqcnecyknwgieijqgh`), **distinto** del CRM (`wxbbmzeoydtygqykkrdk`).
*   El CRM **no registra nada** de citas: la pestaña `/admin/citas` ahora **embebe el portal** en un iframe; se eliminó la agenda nativa.
*   Requisito del usuario: el terapeuta ya autenticado en el CRM **no debe volver a loguearse** en el portal (sin doble login), siempre que no comprometa la seguridad de ninguno de los dos sistemas.

**1. Embed del portal (Fase 1)**
*   [src/app/admin/citas/page.tsx](src/app/admin/citas/page.tsx) reescrito: iframe a `https://zotek-ia.web.app/portal/`, con `sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"`, altura `calc(100vh - 140px)`. Se verificó que el portal **no** envía `X-Frame-Options`/CSP que bloqueen el iframe.
*   Fallback: si no hay token SSO, abre el portal normal (pedirá su propio login).

**2. SSO sin doble login (Fase 2)**
*   **Diseño seguro:** token JWT HS256 **de corta duración (120 s)** firmado con un secreto **COMPARTIDO** `PORTAL_SSO_SECRET`, **distinto** del `SECRET_KEY` interno del portal. Identidad por **email**. Se descartó la opción insegura de "email en la URL".
*   **CRM** — nuevo endpoint [src/app/api/portal-token/route.ts](src/app/api/portal-token/route.ts): valida la sesión Supabase del terapeuta (`getUser()`), firma `{ email, exp: now+120 }` y lo devuelve. El iframe lo recibe vía `?sso=<token>`.
*   **Portal** — nuevo endpoint `POST /api/auth/sso` en `functions/src/main.py`: decodifica el token con `PORTAL_SSO_SECRET`, resuelve rol (admin si está en `ADMIN_EMAILS_EXTRA`, si no `client`), busca el cliente por email y emite el `access_token` interno normal. `www/portal/portal.js` detecta `?sso=` en `init()` (ahora `async`), llama al endpoint, guarda el token en `localStorage` y entra directo al dashboard, limpiando el query string con `replaceState`.

**3. Infra / despliegue**
*   `PORTAL_SSO_SECRET` documentado en [.env.example](.env.example) e inyectado en Cloud Run vía `npm run deploy` (revisión `ssrlilibauzaadmin-00043-69h`). En el portal va en su `functions/.env` (debe usar **fin de línea LF**; un CRLF en esa línea rompió el parseo).

**4. Bug resuelto durante las pruebas**
*   Tres fallos encadenados: (a) `Add-Content` concatenó el secreto sin salto de línea; (b) CRLF en la línea del secreto; (c) **falso negativo**: mi prueba en PowerShell usó `Get-Date -UFormat %s` (hora **local**, UTC-6), generando un `exp` ~6 h en el pasado → "Signature has expired". El código real del CRM usa `Date.now()` (UTC) y funciona. Verificado: `morentinomar@gmail.com` entra como **admin** sin login.

**Verificación E2E:** `https://lilibauza-admin.web.app/admin/citas` carga el **dashboard del portal directamente**, sin pedir login (confirmado por el usuario).

**Pendientes / hallazgos:**
*   `lilibauza@gmail.com` **no está registrado como cliente** en el SaaS → `403`. Cuando Liliana use su email, hay que darla de alta en el portal.
*   🔒 `PORTAL_SSO_SECRET` quedó visible en el chat de la sesión → conviene **rotarlo** (cambiarlo idéntico en ambos `.env` y redesplegar).
*   🎨 Integración visual del portal embebido → **implementada** (ver sesión 14:14).

---

### Sesión 2026-06-01 (14:14) — Integración visual del portal embebido (acento CRM + fondo SaaS)
*   **Rama:** `feat/paciente-expediente-fullpage`
*   **Repos tocados:** CRM (`LiliBauza-admin`) y Portal (`ZotekSolucionesIA`, frontend `www/portal`).

**Decisión de diseño (autorizada por el usuario):** separar el color por su función:
*   **Acentos / elementos interactivos** (botones, nav activo, foco, KPIs, Horarios) → **color de branding del terapeuta del CRM** → el portal se siente parte del CRM.
*   **Fondos / degradados / cabeceras** → **estética violeta-cian del SaaS** (`#7c3aed` → `#0891b2`) del rediseño de `/cita/` de la semana pasada.
*   Alcance: la paleta violeta-cian es **global** (también en el portal standalone); el acento del CRM solo aplica **al embeber**. El tema (claro/oscuro) del portal embebido **sigue al del CRM**.

**Cambio en el CRM** ([src/app/admin/citas/page.tsx](src/app/admin/citas/page.tsx)):
*   El iframe ahora pasa `accent=<color>` (leído de la CSS var `--color-primary`, hex del branding) y `theme=<dark|light>` (según `documentElement.classList.contains('dark')`). Se añade tanto al URL con SSO como al de fallback.

**Cambios en el Portal** (documentados en detalle en su `Bitacora.md`): `portal.css` (paleta `--primary` `#6C63FF`→`#7c3aed`, `--accent-cyan`, `--brand-gradient`, `--primary-dim` con `color-mix`, fondo SaaS sutil), `index.html` (`#6C63FF` inline → `var(--primary)`), `portal.js` (`init()` lee `?accent`/`?theme`).

**No** toca backend ni el flujo SSO. Pendiente de **desplegar** el CRM: `npm run deploy` (el portal ya se desplegó, ver abajo).

---

### Sesión 2026-06-01 (15:32) — Estilo del portal alineado a la marca real Zotek (lado portal; CRM sin cambios nuevos)
*   **Contexto:** tras la integración visual (14:14), el usuario comparó el portal con el **landing** `zotek-ia.web.app` y no coincidían. El trabajo de afinado fue **en el repo del portal** (`ZotekSolucionesIA`), documentado en detalle en su `Bitacora.md` (entrada 15:32). Aquí solo se registra lo relevante para el CRM.
*   **Hallazgo importante:** la confusión inicial era porque **los cambios del portal no estaban desplegados** — el usuario veía la versión vieja. El portal se desplegó con `firebase deploy --only hosting` (proyecto `zotek-ia`).
*   **Correcciones de estilo en el portal:** paleta a los tokens exactos del landing (`www/style.css`): fondo slate `#0f172a`, **acento CYAN `#00e5ff`** (no violeta), **botones claros** (no violetas), **blobs** cyan/violeta difuminados de fondo (glassmorphism), y **efecto "linterna"** (luz que sigue el cursor) en las tarjetas.
*   **Impacto en el CRM:** **ninguno nuevo de código.** Sigue vigente lo del 14:14: `src/app/admin/citas/page.tsx` pasa `accent=<--color-primary>` y `theme=<dark|light>` al iframe. Nota de interacción: el portal ahora usa **botones claros** (ya no se tiñen con el acento del CRM); el acento del CRM sí tiñe **nav/links/iconos** del portal embebido, mientras que **el fondo violeta-cian de Zotek se mantiene** siempre.
*   **Pendiente CRM:** desplegar con `npm run deploy` para que el iframe pase `accent`/`theme` en producción (hoy el portal standalone ya luce la marca Zotek; el embed tomará el acento del terapeuta tras este deploy).

---
*Generado y actualizado por Antigravity (IA Coding Assistant) — 29 de Mayo, 2026*
*Actualizado por Claude Code (Opus 4.8) — 1 de Junio, 2026, 15:32*

