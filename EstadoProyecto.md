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
*Generado y actualizado por Antigravity (IA Coding Assistant) — 29 de Mayo, 2026*

