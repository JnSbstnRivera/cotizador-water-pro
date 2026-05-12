# CAMBIOS · JNSBSTN

Resumen completo de cambios aplicados al cotizador-agua en la rama `feature/unify-pdf-modal`.

**Autor:** Juan Sebastián Rivera Joven
**Rama:** `feature/unify-pdf-modal`
**Fecha:** mayo de 2026

---

## 1. Stack y limpieza general

### Eliminado
- `src/components/ClientModal.tsx` — componente muerto, nadie lo importaba.
- `src/components/CotizacionModal.tsx` — modal viejo, reemplazado por `PDFModal.tsx`.
- `src/components/DarkModeToggle.tsx` — su lógica vive ahora dentro de `Header.tsx`.
- `netlify.toml` — ambigüedad de deploy. Queda solo Vercel.
- `.env.example` — solo tenía `GEMINI_API_KEY` y `APP_URL` que nunca se usaban.
- Dependencias huérfanas en `package.json`: `@google/genai`, `express`, `dotenv`, `@types/express`, `tsx`.
- `vite.config.ts` simplificado: removido el `define` de `process.env.GEMINI_API_KEY` (jamás usado).

### Bugs arreglados
- **Catch silencioso** en merge de PDFs (antes ignoraba errores).
- **`(e: any)`** en listener de drag-drop → tipado correcto `CustomEvent<{ productId: string }>`.
- **Mapeo confuso** `cal-120-3p → 80GL 3p.pdf` (el archivo decía "80GL" pero era 120) → eliminado con cambio al PDF maestro.
- **`Eco 150 Gl.pdf` de 14.8 MB** → ya no existe, todo viene del maestro de 1.66 MB.
- **Dark mode con `filter: invert`** → reemplazado por estrategia estándar de Tailwind 4 con clase `.dark`.

---

## 2. Logo Windmar Water

URL: `https://i.postimg.cc/PqD3CmtW/WIndmar-water.png`

Aplicado en:
- Splash de inicio (`App.tsx`)
- Header de la app (`Header.tsx`)
- PDF página 1 (`QuoteDocument.tsx`) — tamaño aumentado a `110×56 pt` en header fijo

---

## 3. Paleta Windmar oficial

Tokens definidos en `src/index.css`:

| Token | Hex | Uso |
|---|---|---|
| `--color-windmar-blue` | `#1D429B` | WH AZUL — color principal |
| `--color-windmar-blue-light` | `#A6C3E6` | WH AZUL CLARO — bordes y backgrounds suaves |
| `--color-windmar-blue-dark` | `#21274e` | WH AZUL OSCURO — títulos y oriental |
| `--color-windmar-gold` | `#F89B24` | WH AMARILLO — kiwi, acentos |

Tipografía: **Poppins** (Google Fonts) reemplaza DM Sans.

---

## 4. Header

Replicado del patrón de `cotizador-roofing-pro`:
- Logo `h-14 md:h-16` con hover scale.
- Título `text-xl sm:text-3xl font-black uppercase tracking-tighter` color `windmar-blue-dark`.
- Subtítulo `text-windmar-blue text-sm sm:text-base font-medium`.
- Theme toggle a la derecha con Sun/Moon + chip "TEMA · Claro/Oscuro".
- Layout flex column→row con `gap-6`.

---

## 5. Footer

Nuevo `src/components/Footer.tsx` — 3 columnas estilo roofing-pro:

| Columna | Ícono | Título | Texto |
|---|---|---|---|
| 1 | 🛡 ShieldCheck (windmar-gold) | Garantía Premium | Hasta 10 años cisternas, 5 años equipo, 1 año instalación |
| 2 | 💳 CreditCard (windmar-blue) | Financiamiento Flexible | Cash, Oriental, Synchrony 18/61m, Kiwi |
| 3 | 🔧 Wrench (windmar-blue) | Soporte Local | ventas@windmarhome.com · (787) 395-7766 |

Copyright al fondo: `© 2026 Windmar Home • Todos los derechos reservados`.

---

## 6. ProductCard (grid de productos)

**Antes:** precios en grid, drag&drop, anillo verde + check verde cuando estaba en carrito.
**Ahora:**
- **Sin precios** en las tarjetas del grid.
- **Sin estado seleccionado** — no se pinta verde al agregar.
- **Click simple** suma cantidad (no drag&drop).
- **Hover sutil**: scale 1.02 en la card + scale 1.05 en la imagen.
- Layout: categoría + imagen + nombre + botón `+` azul.

---

## 7. Carrito

### Mode selector dentro del carrito
4 botones en grid 2×2 con paleta Windmar:

| Modo | Chip activo | Texto |
|---|---|---|
| 💵 Cash | `bg-windmar-blue` `#1D429B` | white |
| 🏛 Oriental | `bg-windmar-blue-dark` `#21274e` | white |
| 🏦 Synchrony | `bg-[#8b5cf6]` morado | white |
| 🥝 Kiwi | `bg-windmar-gold` `#F89B24` | white |

Chips inactivos: `bg-slate-100` + `text-slate-600` (texto neutro slate, no se pinta por modo).

### Sync term selector (global)
Aparece con animación cuando Synchrony está activo. Botones 18m/61m con `bg-[#8b5cf6]` activo.

### Tarjetas de producto en el carrito
- **Sin flip 3D** (decisión revertida — todo visible directo).
- Layout horizontal: imagen 56×56 + categoría/nombre/precio/controles.
- Precio en línea con breakdown:
  - **Cash/Oriental**: `$3,201.17 · Sin IVU $2,871.00 · IVU $330.17`
  - **Synchrony**: `$203.80/mes · Financiado $3,668.35 · IVU $378.35`
  - **Kiwi**: `$3,668.35 · Sin IVU $3,290.00 · IVU $378.35`
- Si producto no tiene precio en ese modo → mensaje rojo "No disponible en {modo}".

### Resumen de compra (parte baja del cart)
- Subtotal en el modo activo.
- **Pronto pago** (input numérico) — antes vivía en el modal, se movió al carrito como parte del resumen.
- Si pronto > 0: línea **"Total con pronto"** en azul Windmar.
- Nota italic: *"Bundles y promociones se aplican al generar el PDF."*

### Eliminados del carrito
- ❌ Botón Copiar (eliminado).
- ❌ Botón WhatsApp (eliminado).
- ❌ Toggle Solar Bundle (movido al modal).
- ❌ Info Combo RO (movido al modal — auto-aplicable).
- ❌ Banner Madres (movido al modal).
- ❌ Drag handlers (drag&drop removido del grid).

---

## 8. Modal de generación de PDF (`PDFModal.tsx`)

Nuevo componente basado en patrón loan/lease/roofing-pro:

### Estructura
- **Header**: ícono FileText + título "Cotización Water" + **toggle EN/ES** + cerrar.
- **Datos del Cliente**: Nombre*, Dirección, Teléfono, Email.
- **Datos del Consultor**: Nombre*, Email, Teléfono.
- **Modos de Pago (multi-select)**: chips Cash, Oriental, Synchrony, Kiwi.
- **Plazos Synchrony** (si aplica): caja morada con botones 18m / 61m.
- **Promociones disponibles** (acordeón colapsable):
  - ☀️💧 **Solar Bundle** — checkbox. −$500.
  - 💧 **Combo RO** — auto-aplicado si el carrito tiene RO + otro producto. −$1,000 informativo.
  - ❤️ **Mes de las Madres 2026** — checkbox. Solo visible 1–14 mayo, aplicable 7–14 mayo. −$500.
- **Resumen de cotización** (auto-generado desde el carrito).
- **Footer**: Cancelar / Descargar PDF.

### Sincronización
- `idiomaPDF` controlado por el modal (afecta textos del modal + textos del PDF).
- `promoMadres` sincronizado bidireccionalmente con la app.
- `hasSolarBundle` y `downPayment` se controlan desde el cart o el modal indistintamente.

---

## 9. PDF — `QuoteDocument.tsx`

### Tamaño de página
**Letter (8.5×11 in / 612×792 pt)** — coincide con las brochures del PDF maestro. Antes era A4, ahora todas las páginas tienen el mismo tamaño.

### Header fijo
- Repite en cada página vía `position: 'absolute', top: 0` + prop `fixed`.
- Logo `110×56` + título "COTIZACIÓN FORMAL" + número + fecha.
- Borde inferior naranja `#F89B24`.

### Footer fijo
- Repite en cada página vía `position: 'absolute', bottom: 0` + prop `fixed`.
- Fondo navy `#21274e` con 3 columnas: windmar.com / Contáctanos / Dirección.
- Siempre al fondo, nunca a la mitad.

### Cuerpo (fluye entre header y footer)

1. **Meta row**: No. WW-XXX · Fecha · Vigencia 30 días (banda azul claro con borde naranja).
2. **Cliente + Consultor**: dos bloques side-by-side con título azul subrayado en naranja.
3. **Modos cotizados** (chips): un chip por modo único — Synchrony aparece **1 sola vez** sin duplicar, los meses específicos viven en el header de cada sección.
4. **Secciones por modo** (una columna, full-width):
   - Header de sección con color del modo:
     - 💵 Cash → verde `#16a34a`
     - 🏛 Oriental → azul `#1D429B`
     - 🏦 Synchrony 18m / 61m → morado `#8b5cf6`
     - 🥝 Kiwi → ámbar `#F89B24`
   - Lista de productos con **imagen 60×60 pt** + nombre + categoría + cantidad + precio total.
   - Productos sin precio en ese modo → texto rojo "N/A en este modo".
   - IVU breakdown (Subtotal sin IVU + IVU 11.5%) para Cash/Oriental/Kiwi.
   - Descuentos aplicados (Solar Bundle, Combo RO, Madres, Pronto pago) — prorrateados por término en Synchrony.
   - Total final en color del modo, con fondo claro del mismo color.
   - `wrap={false}` → si una sección no cabe, salta entera a la siguiente página.
5. **Banner Madres** (si promo activa):
   - Banner rosa `#FFEAF3` con borde `#E84F97`.
   - Título `♥ ♥ Promo Mes de las Madres 2026 ♥ ♥`.
   - 3 líneas: título / descripción del descuento / showrooms (Roosevelt · Mayagüez · Ponce · Hatillo).
6. **Páginas del maestro**: después de la página de cotización, se anexan páginas del maestro según los productos en el carrito.

### Lógica de páginas del maestro
- 2 PDFs maestros en `public/`:
  - `Master_Cotizacion_ES.pdf` (1.66 MB)
  - `Master_Cotizacion_EN.pdf` (1.84 MB)
- Reemplazan los 9 brochures sueltos anteriores (~17.6 MB total) → ahorro de ~14 MB.
- Mapeo en `src/hooks/usePDFCotizacion.ts`:

| Página | Producto |
|---|---|
| 0 | Calentador Soltek 80/1 |
| 1 | Calentador Soltek 80/2 |
| 2 | Calentador Soltek 120/3 |
| 3 | Calentador Soltek 120/4 |
| 4 | **Marketing Calentadores** (compartida) |
| 5 | Cisterna Ecowater 500 |
| 6 | Cisterna Hércules 600 |
| 7 | Cisterna Ecowater 150 |
| 8 | **Marketing Cisternas** (compartida) |
| 9 | Suavizador POE |
| 10 | **Marketing Water Care** (compartida) |
| 11 | Reverse Osmosis |
| 12 | **Marketing RO** (compartida) |

- Por cada categoría con productos en el carrito → páginas de producto + 1 página de marketing al final.
- Idioma del PDF (ES/EN) decide qué maestro se carga.

---

## 10. Promo Mes de las Madres 2026 — Water

Nuevo archivo `src/lib/promoMadres.ts`:

```typescript
export const MADRES_DISCOUNT_WATER = 500;
isMadresAnnounceActive() // 1–14 mayo 2026
isMadresSaleActive()     // 7–14 mayo 2026 (ventana de venta)
```

- Banner en el modal **solo durante la vigencia** (anuncia desde 1 de mayo).
- Checkbox de aplicar el descuento **solo en ventana de venta** (7–14 mayo). Antes de eso muestra "Próximamente".
- Disclaimer en el PDF cuando promo activa: "Válido del 7 al 14 de mayo, solo en showroom con cliente citado (Roosevelt, Mayagüez, Ponce, Hatillo)".
- Banner en la app eliminado (decisión del usuario) — la lógica vive solo en el modal y el PDF.

---

## 11. Dark mode

- Reemplazado el hack `filter: invert(1) hue-rotate(180deg)` por estrategia estándar de Tailwind 4.
- `@custom-variant dark (&:where(.dark, .dark *))` en `index.css`.
- State persistido en `localStorage 'wh-theme'`.
- Toggle visual: Sun/Moon Lucide + animación Framer Motion + chip "TEMA · Claro/Oscuro".

---

## 12. TypeScript

### Nuevos tipos
- `Idioma = 'es' | 'en'` en `types.ts`.
- `CotizacionFormData` incluye ahora `idioma` y `promoMadres`.

### Removed
- `CartItem.installments` (per-item) ya no se usa — reemplazado por `syncTerm` global en App.
- Funciones huérfanas en `App.tsx`: `handleCopyQuote`, `handleWhatsApp`, `getCartItemPrice` (movidas al Cart).

---

## 13. Build status

- TypeScript: limpio (`tsc --noEmit` → exit 0).
- Vite build: exitoso en ~5 segundos.
- Bundle: 2.25 MB (gzip 781 KB) — sin cambios significativos respecto al original.

---

## 14. Archivos nuevos

- `src/components/Footer.tsx`
- `src/components/PDFModal.tsx`
- `src/lib/promoMadres.ts`
- `public/Master_Cotizacion_ES.pdf`
- `public/Master_Cotizacion_EN.pdf`
- `CAMBIOS-JNSBSTN-README.md` (este archivo)

## 15. Archivos eliminados

- `.env.example`
- `netlify.toml`
- `src/components/ClientModal.tsx`
- `src/components/CotizacionModal.tsx`
- `src/components/DarkModeToggle.tsx`
- `public/80GL 1p.pdf` / `80GL 2p.pdf` / `80GL 3p.pdf` / `80GL 4p.pdf`
- `public/Eco 150 Gl.pdf` / `Eco 500 Gl.pdf` / `Herc 600 Gl.pdf`
- `public/Reverse Osmosis.pdf` / `Suavizador POE.pdf`

## 16. Archivos modificados

- `package.json`
- `vite.config.ts`
- `src/App.tsx`
- `src/index.css`
- `src/types.ts`
- `src/hooks/usePDFCotizacion.ts`
- `src/components/Header.tsx`
- `src/components/ProductCard.tsx`
- `src/components/Cart.tsx`
- `src/components/QuoteDocument.tsx`

---

## Comandos para probar localmente

```powershell
cd "C:\dev\Call Center\cotizador-agua"
npm install
npm run dev     # → http://localhost:3000
npm run build   # producción
```
