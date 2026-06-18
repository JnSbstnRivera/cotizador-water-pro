# 💧 COTIZADOR WATER PRO

Cotizador web de **sistemas de agua** (filtros, purificación, calentadores) para el equipo comercial de **Windmar Home PR**. Complementa la oferta solar con productos de hogar: arma la cotización con carrito y genera un PDF profesional listo para el cliente.

## ✨ Características

- **Catálogo de productos** de agua con tarjetas y carrito de cotización.
- **Arrastrar y soltar** productos al carrito (drag-drop tipado).
- **Generación de PDF** de la cotización con `@react-pdf/renderer` y `pdf-lib`, dentro de un modal unificado (`PDFModal` + `QuoteDocument`).
- **Modo oscuro** integrado en el `Header` (estrategia estándar de Tailwind 4 con clase `.dark`).
- PDFs servidos desde un archivo maestro liviano (sin assets pesados duplicados).
- Interfaz en **español**, iconografía `lucide-react` y animaciones con `motion`.

## 🛠️ Stack

- **Framework**: React 19 + Vite 6
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS 4 (plugin `@tailwindcss/vite`)
- **PDF**: `@react-pdf/renderer` + `pdf-lib`
- **UI/animación**: `lucide-react`, `motion`
- **Deploy**: Vercel (SPA con rewrites a `index.html`)

## 🚀 Setup local

```bash
npm install
npm run dev
```

La app corre en `http://localhost:3000`. No requiere variables de entorno para funcionar.

## 🔑 Variables de entorno

No se utilizan variables de entorno en tiempo de ejecución. El proyecto es una SPA estática.

## 📜 Scripts

- `npm run dev` — servidor de desarrollo (Vite, puerto 3000).
- `npm run build` — build de producción a `dist/`.
- `npm run preview` — sirve el build localmente.
- `npm run lint` — chequeo de tipos con `tsc --noEmit`.

## 🌐 Deploy

- **Vercel**, configurado en `vercel.json`: `installCommand: npm install`, `buildCommand: npm run build`, `outputDirectory: dist`, con rewrite SPA de `/(.*)` a `/index.html`.

## 🙌 Créditos
Proyecto creado originalmente por **DilanSba**. Transferido a **JnSbstnRivera** para su mantenimiento continuo (DilanSba ahora lidera otra área).

## 📄 Licencia

Propietario — Windmar Home PR. Uso interno.
