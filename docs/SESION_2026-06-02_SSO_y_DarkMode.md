# Sesión 2026-06-02 — SSO Portal Zotek + Modo Oscuro + Rotación de Secreto

Documento de hallazgos y soluciones. Toca **dos proyectos**:

- **CRM** — `c:\Users\USUARIO\MisProyectos\LiliBauza-admin` (Next.js 16 SSR en Cloud Run `ssrlilibauzaadmin`, proyecto Firebase `lilibauza-admin`)
- **Portal Zotek** — `C:\Users\USUARIO\ZotekSolucionesIA` (FastAPI sobre Cloud Function Gen2 `api_handler` + Hosting estático, proyecto Firebase `zotek-ia`)

---

## 1. Problema inicial: SSO daba 401 eterno (`Token SSO inválido o expirado`)

El portal Zotek embebido en `/admin/citas` mostraba pantalla de login y `POST /api/auth/sso` devolvía **401**, pese a que el CRM firmaba un JWT y el secreto parecía igual en ambos lados.

### Cómo se diagnosticó

Se firmó un JWT a mano (HS256) con cada secreto candidato y se hizo POST directo al endpoint en vivo para ver cuál aceptaba el backend:

```python
from jose import jwt
token = jwt.encode({'email':'morentinomar@gmail.com','exp':...}, SECRET, algorithm='HS256')
# POST {'sso_token': token} a https://zotek-ia.web.app/api/auth/sso
```

Resultado clave: **el secreto VIEJO (`jjgr3tx64...`) daba 200**, mientras el que estaba en los `.env` (`zotek-crm-sso-shared-secret-2026`) daba 401. Es decir, el runtime servía un secreto distinto al que mostraban los archivos y al que mostraba el `spec` de Cloud Run.

### Causa raíz: **el tráfico de Cloud Run estaba clavado en una revisión vieja**

`api_handler` (Gen2) está respaldado por el servicio Cloud Run `api-handler`. Los redeploys **sí** creaban revisiones nuevas con el secreto correcto, pero **el tráfico nunca migraba**: seguía 100% en `api-handler-00190-pal`, que tenía baked el secreto viejo `jjgr3tx64...`.

```
revisión que servía  : api-handler-00190-pal   (100% tráfico, secreto VIEJO)
revisiones nuevas    : 00191/00192/00195...    (0% tráfico, secreto correcto, Ready=True)
```

`latestReadyRevisionName` reportaba la 00190 aunque existían revisiones más nuevas → Firebase/Cloud Run no estaba promoviendo el tráfico.

### Solución

Redirigir el tráfico explícitamente a la revisión más nueva:

```bash
gcloud run services update-traffic api-handler \
  --project zotek-ia --region us-central1 \
  --to-revisions <revision-mas-nueva>=100
```

Tras esto, el endpoint aceptó el secreto correcto y rechazó el viejo. **El secreto nunca fue el problema de fondo; lo era el enrutamiento de revisiones.**

> ⚠️ **GOTCHA OPERATIVO (recurrente):** En este proyecto, `firebase deploy --only functions` a `zotek-ia` **no migra el tráfico automáticamente** a la nueva revisión de `api-handler`. Después de CADA deploy de functions hay que verificar y, si hace falta, ejecutar el `update-traffic --to-revisions <nueva>=100`. Si tras un deploy "no toma efecto" un cambio de env/código, revisar PRIMERO qué revisión sirve el 100% del tráfico.

Comando de diagnóstico rápido:

```bash
gcloud run services describe api-handler --project zotek-ia --region us-central1 \
  --format="value(status.traffic)"
gcloud run revisions list --service api-handler --project zotek-ia --region us-central1 \
  --sort-by="~metadata.creationTimestamp" --limit=5
```

---

## 2. Rotación del secreto SSO (débil → fuerte)

El secreto compartido era `zotek-crm-sso-shared-secret-2026` (débil y predecible). Como concede acceso al portal, se rotó a un valor aleatorio fuerte.

**Secreto nuevo:** valor aleatorio de 48 bytes generado con
`python -c "import secrets; print(secrets.token_urlsafe(48))"`.

> El valor REAL **no se documenta aquí ni se commitea**: vive solo en los `.env*`
> (gitignored) y en el env de Cloud Run de ambos servicios. Para consultarlo, leer
> `PORTAL_SSO_SECRET` en `LiliBauza-admin/.env.production` o
> `ZotekSolucionesIA/functions/.env`.

### Archivos actualizados (4 `.env` en 2 proyectos)

| Proyecto | Archivo | Uso |
|---|---|---|
| CRM | `.env.production` | `deploy-prod.js` lo inyecta al env de Cloud Run `ssrlilibauzaadmin` |
| Zotek | `functions/.env` | Firebase Gen2 lo bakea al desplegar la función |
| Zotek | `.env` (raíz) | Ejecución local / servicio standalone |

### Hardening adicional en el CRM

`src/app/api/portal-token/route.ts`: se **eliminó el fallback débil hardcodeado**. Antes:

```ts
const SECRET = new TextEncoder().encode(process.env.PORTAL_SSO_SECRET || 'zotek-crm-sso-shared-secret-2026');
```

Ahora, si falta la variable de entorno el endpoint responde **500** en vez de firmar con un secreto conocido:

```ts
const SECRET_RAW = process.env.PORTAL_SSO_SECRET;
const SECRET = SECRET_RAW ? new TextEncoder().encode(SECRET_RAW) : null;
// ... en el handler: if (!SECRET) return 500
```

### Orden de despliegue (para minimizar la ventana de SSO roto)

1. Deploy de Zotek (`firebase deploy --only functions,hosting --project zotek-ia`).
2. **Migrar tráfico** a la revisión nueva de `api-handler` (paso obligatorio, ver gotcha arriba).
3. Actualizar el env del Cloud Run del CRM (rápido, cierra la ventana en segundos):
   ```bash
   gcloud run services update ssrlilibauzaadmin --region us-central1 --project lilibauza-admin \
     --update-env-vars "PORTAL_SSO_SECRET=<nuevo>"
   ```
4. Redeploy completo del CRM para enviar el código (`route.ts` + `page.tsx`).

### Verificación

Con un JWT firmado por cada secreto contra el endpoint en vivo:

```
NUEVO (fuerte)     -> 200 OK
intermedio débil   -> 401   (zotek-crm-sso-shared-secret-2026)
original           -> 401   (jjgr3tx64...)
```

> ⚠️ Importante: al redeployar el CRM con Firebase web frameworks, Cloud Run puede **resetear las variables de entorno** que no estén en la config de Firebase. Por eso `deploy-prod.js` re-inyecta el env con `gcloud run services update --update-env-vars` DESPUÉS del `firebase deploy`. Si se despliega el CRM por otra vía, re-aplicar `PORTAL_SSO_SECRET` después.

---

## 3. Modo oscuro del CRM → se propaga al portal embebido (en vivo)

**Pedido:** que al alternar modo oscuro en el CRM, el portal embebido también cambie.

### Estado previo

El CRM ya pasaba `?theme=dark|light` y `?accent=<hex>` en la URL del iframe, y el portal **ya los leía en la carga inicial** (`portal.js` init). El problema: si el usuario alternaba el modo oscuro con el portal **ya cargado**, el iframe no se enteraba (no se recarga).

### Solución: `postMessage` en vivo (cross-origin)

**CRM** — `src/app/admin/citas/page.tsx`:
- `useRef` al iframe + función `postBrandToPortal()` que envía `{ type: 'zotek-brand', theme, accent }` al origin del portal.
- Un `MutationObserver` sobre `<html>` (filtra `class` y `style`) detecta el toggle de modo oscuro / cambio de acento y reenvía al iframe en vivo.
- También se envía en `onLoad` del iframe.

```ts
win.postMessage({ type: "zotek-brand", theme, accent }, "https://zotek-ia.web.app");
```

**Portal** — `www/portal/portal.js` (sección de tema):
- Listener `message` que **valida el origin** (`https://lilibauza-admin.web.app`) y aplica `applyTheme(theme)` + `--primary` (acento).

```js
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://lilibauza-admin.web.app') return;
  const d = event.data;
  if (!d || d.type !== 'zotek-brand') return;
  if (d.theme === 'light' || d.theme === 'dark') applyTheme(d.theme);
  if (typeof d.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(d.accent))
    document.documentElement.style.setProperty('--primary', d.accent);
});
```

El degradado violeta-cian de **fondo** del SaaS se mantiene a propósito (identidad de Zotek); solo se heredan modo claro/oscuro y acento.

### ⚠️ Bug encontrado y corregido: doble dominio de Firebase en el check de origin

En el primer intento, el toggle de modo oscuro **cambiaba el CRM pero NO el portal embebido**. Causa: el listener del portal validaba el origin **solo** contra `https://lilibauza-admin.web.app`, pero Firebase Hosting sirve el CRM en **dos dominios** (`*.web.app` y `*.firebaseapp.com`). Cuando el `postMessage` llegaba desde el otro dominio, el portal lo descartaba **en silencio**.

**Solución:** allowlist con ambos orígenes en `www/portal/portal.js`:

```js
const CRM_ORIGINS = [
  'https://lilibauza-admin.web.app',
  'https://lilibauza-admin.firebaseapp.com',
];
window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'zotek-brand') return;
  console.log('[brand] mensaje recibido de', event.origin, data);   // diagnóstico
  if (!CRM_ORIGINS.includes(event.origin)) {
    console.warn('[brand] origin no permitido, ignorado:', event.origin);
    return;
  }
  ...
});
```

**Lección:** en cualquier validación de `event.origin` para `postMessage` cross-origin con Firebase Hosting, hay que aceptar AMBOS dominios (`.web.app` y `.firebaseapp.com`), y un dominio propio si lo hubiera. Un check de origin demasiado estricto falla en silencio (no hay error visible).

> Nota: se dejaron `console.log/console.warn` de diagnóstico en el listener. Son inofensivos; se pueden quitar en una limpieza posterior si molesta el ruido en consola.

---

## 4. Estado final

- ✅ SSO funciona con secreto **fuerte**; secretos viejos rechazados.
- ✅ Modo oscuro/acento del CRM se propaga al portal en la carga y **en vivo** al alternar (verificado por el usuario en ambas apps).
- ✅ Tráfico de `api-handler` apuntando a la revisión nueva con el secreto correcto.
- ✅ Check de origin del portal corregido para aceptar ambos dominios de Firebase.

### Archivos modificados

**CRM (`LiliBauza-admin`)**
- `.env.production` — secreto nuevo
- `src/app/api/portal-token/route.ts` — sin fallback débil, 500 si falta env
- `src/app/admin/citas/page.tsx` — `postMessage` de tema/acento en vivo

**Zotek (`ZotekSolucionesIA`)**
- `functions/.env` — secreto nuevo
- `.env` (raíz) — secreto nuevo
- `www/portal/portal.js` — listener `message` para tema/acento en vivo

### Pendiente / a vigilar

- Entender **por qué** el tráfico de `api-handler` no migra solo tras un deploy (posible pin manual de tráfico). Mientras no se resuelva, recordar el paso manual de `update-traffic` tras cada deploy de functions de Zotek.
