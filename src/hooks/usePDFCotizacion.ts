import { pdf } from '@react-pdf/renderer';
import { PDFDocument } from 'pdf-lib';
import React from 'react';
import { CartItem, CotizacionFormData, Category, Idioma } from '../types';
import { QuoteDocument, buildEffectiveCols, QuoteDocumentProps } from '../components/QuoteDocument';

/**
 * Mapeo de páginas del PDF maestro (Windmar_Water_Cotizacion_{ES,EN}.pdf).
 * Las páginas son 0-indexed para pdf-lib.
 * EN y ES comparten la misma estructura de páginas (14 páginas cada uno).
 */
const PRODUCT_PAGE_MAP: Record<string, number> = {
  'cal-80-1p':    0,  // Pág 1 — Calentador Soltek 80/1
  'cal-80-2p':    1,  // Pág 2 — Calentador Soltek 80/2
  'cal-120-3p':   2,  // Pág 3 — Calentador Soltek 120/3
  'cal-120-4p':   3,  // Pág 4 — Calentador Soltek 120/4
  'cis-eco-500':  5,  // Pág 6 — Cisterna Ecowater 500
  'cis-herc-600': 6,  // Pág 7 — Cisterna Hércules 600
  'cis-eco-150':  7,  // Pág 8 — Cisterna Ecowater 150
  'trat-poe':     9,  // Pág 10 — Suavizador POE (Water Care CSPRC1054)
  'trat-ro':     11,  // Pág 12 — Reverse Osmosis
};

/** Una página de marketing por categoría, mostrada UNA sola vez después de los productos de esa categoría. */
const CATEGORY_MARKETING_PAGE: Record<Category, number> = {
  'Calentadores':            4,  // Pág 5
  'Cisternas':               8,  // Pág 9
  'Sistemas de tratamiento': 10, // Pág 11 (Water Care marketing — sirve para POE y RO)
};

/** Page 14 (index 13) en el PDF maestro está en blanco — no se incluye. */

async function fetchMasterBytes(idioma: Idioma): Promise<Uint8Array | null> {
  const filename = idioma === 'en' ? 'Master_Cotizacion_EN.pdf' : 'Master_Cotizacion_ES.pdf';
  try {
    // Cache-bust agresivo: timestamp unico en la URL fuerza al CDN de Vercel
    // a tratar cada request como nueva, sin servir copia cacheada en el edge.
    // cache: 'no-store' tambien impide al navegador guardar la respuesta.
    const bust = Date.now();
    const res = await fetch(`/${filename}?v=${bust}`, { cache: 'no-store' });
    if (!res.ok) {
      console.error(`Master PDF fetch failed: ${res.status} ${res.statusText}`);
      return null;
    }
    return new Uint8Array(await res.arrayBuffer());
  } catch (e) {
    console.error('Master PDF fetch error:', e);
    return null;
  }
}

/**
 * Calcula la lista ordenada de índices de página a extraer del PDF maestro.
 * Orden: por cada categoría con productos en el carrito → páginas de producto (orden carrito, dedupe)
 *        → UNA página de marketing de esa categoría al final del bloque.
 */
function buildPageList(items: CartItem[]): number[] {
  const categoryOrder: Category[] = ['Calentadores', 'Cisternas', 'Sistemas de tratamiento'];
  const pages: number[] = [];

  for (const category of categoryOrder) {
    const inCategory = items.filter(item => item.product.category === category);
    if (inCategory.length === 0) continue;

    // Páginas de producto (dedupe preservando orden del carrito)
    const seen = new Set<number>();
    for (const item of inCategory) {
      const pageIdx = PRODUCT_PAGE_MAP[item.product.id];
      if (pageIdx === undefined || seen.has(pageIdx)) continue;
      seen.add(pageIdx);
      pages.push(pageIdx);
    }

    // Página de marketing de la categoría (una sola vez, al final del bloque)
    const marketingIdx = CATEGORY_MARKETING_PAGE[category];
    if (marketingIdx !== undefined) pages.push(marketingIdx);
  }

  return pages;
}

export async function downloadCotizacionPDF(
  items: CartItem[],
  formData: CotizacionFormData,
  hasSolarBundle: boolean,
  hasROBundle: boolean,
  downPayment: number,
  ivuExemptCC2608: boolean = false,
  firmaYGana: boolean = false,
  addOnQuantities: Record<string, number> = {},
): Promise<void> {
  const { consultor, cliente, selectedModes, installmentsSync, installmentsKiwi, idioma, promoMadres } = formData;

  const quoteNumber = `WW-${Date.now().toString(36).toUpperCase()}`;
  const date = new Date().toLocaleDateString(idioma === 'en' ? 'en-US' : 'es-PR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const effectiveCols = buildEffectiveCols(selectedModes, installmentsSync, installmentsKiwi);

  // Plazo primario para Synchrony (menor plazo seleccionado o 18 por default)
  const primarySyncTerm: 18 | 61 =
    selectedModes[0] === 'synchrony' && installmentsSync.length > 0
      ? ([...installmentsSync].sort((a, b) => a - b)[0] as 18 | 61)
      : 18;

  // 1. Generar página 1 (cotización formal) con @react-pdf/renderer
  const docProps: QuoteDocumentProps = {
    items, hasSolarBundle, hasROBundle, downPayment,
    consultor, cliente, quoteNumber, date, effectiveCols, idioma,
    promoMadres, primarySyncTerm, ivuExemptCC2608, firmaYGana,
    addOnQuantities,
  };
  const quoteElement = React.createElement(QuoteDocument, docProps);
  const quoteBlob = await pdf(quoteElement).toBlob();
  const quoteBytes = new Uint8Array(await quoteBlob.arrayBuffer());

  // 2. Construir documento merged
  const mergedDoc = await PDFDocument.create();

  // Página 1: cotización generada
  const quotePdf = await PDFDocument.load(quoteBytes);
  const quotePages = await mergedDoc.copyPages(quotePdf, quotePdf.getPageIndices());
  quotePages.forEach(p => mergedDoc.addPage(p));

  // 3. Extraer páginas del PDF maestro según productos en carrito
  const pageList = buildPageList(items);
  if (pageList.length > 0) {
    const masterBytes = await fetchMasterBytes(idioma);
    if (!masterBytes) {
      throw new Error(`No se pudo cargar el PDF maestro (${idioma.toUpperCase()}).`);
    }
    const masterPdf = await PDFDocument.load(masterBytes, { ignoreEncryption: true });
    const totalMasterPages = masterPdf.getPageCount();

    // Validar índices (defensa contra cambios futuros del maestro)
    const validPages = pageList.filter(i => i >= 0 && i < totalMasterPages);
    if (validPages.length !== pageList.length) {
      console.warn(`Algunas páginas del maestro están fuera de rango (max=${totalMasterPages})`);
    }

    const copied = await mergedDoc.copyPages(masterPdf, validPages);
    copied.forEach(p => mergedDoc.addPage(p));
  }

  // 4. Descargar
  const finalBytes = await mergedDoc.save();
  const blob = new Blob([finalBytes], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `Cotizacion-Water-${quoteNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
}
