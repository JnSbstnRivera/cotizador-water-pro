import React from 'react';
import {
  Document, Page, View, Text, Image, StyleSheet, Font,
} from '@react-pdf/renderer';
import { CartItem, PaymentMode, ConsultorInfo, ClienteInfo, Idioma } from '../types';
import { MODE_LABELS } from '../constants';
import { MADRES_DISCOUNT_WATER } from '../lib/promoMadres';

// Registra fuente con simbolos meteorologicos (⛈ ⚡ ☁ ☀ ♥ ❄ ☂) para usarla
// en el banner CC 26-08. Helvetica no soporta estos chars; con esta fuente sí.
Font.register({
  family: 'NotoSymbols',
  src: '/fonts/NotoSymbols.ttf',
});

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (v: number) => '$' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const t = (es: string, en: string, idioma: Idioma) => (idioma === 'en' ? en : es);

export interface EffectiveCol {
  key: string;
  label: string;
  shortLabel: string;
  isMonthly: boolean;
  installments?: 18 | 61;
  color: string;
  lightBg: string;
  getPrice: (item: CartItem) => number | null;
}

export function buildEffectiveCols(
  selectedModes: PaymentMode[],
  installmentsSync: (18 | 61)[],
  _installmentsKiwi: (18 | 61)[],
): EffectiveCol[] {
  const cols: EffectiveCol[] = [];

  if (selectedModes.includes('cash')) {
    cols.push({
      key: 'cash', label: 'Cash', shortLabel: 'CASH', isMonthly: false,
      color: '#16a34a', lightBg: '#dcfce7',
      getPrice: (item) => item.product.prices.cash,
    });
  }
  if (selectedModes.includes('oriental')) {
    cols.push({
      key: 'oriental', label: 'Oriental', shortLabel: 'ORIENTAL', isMonthly: false,
      color: '#1D429B', lightBg: '#dbeafe',
      getPrice: (item) => item.product.prices.cash,
    });
  }
  if (selectedModes.includes('synchrony')) {
    const insts: (18 | 61)[] = installmentsSync.length > 0 ? installmentsSync : [18];
    const sorted = [...insts].sort((a, b) => a - b) as (18 | 61)[];
    sorted.forEach(inst => {
      cols.push({
        key: `sync_${inst}`, label: `Synchrony ${inst}m`, shortLabel: `SYNC ${inst}m`,
        isMonthly: true, installments: inst,
        color: '#8b5cf6', lightBg: '#ede9fe',
        getPrice: (item) => inst === 61 ? item.product.prices.m61 : item.product.prices.m18,
      });
    });
  }
  if (selectedModes.includes('kiwi')) {
    cols.push({
      key: 'kiwi', label: 'Kiwi', shortLabel: 'KIWI', isMonthly: false,
      color: '#F89B24', lightBg: '#fef3c7',
      getPrice: (item) => item.product.prices.synchrony,
    });
  }
  return cols;
}

// ─── theme ─────────────────────────────────────────────────────────────────

const NAVY    = '#21274e';  // WH AZUL OSCURO
const BLUE    = '#1D429B';  // WH AZUL
const ORANGE  = '#F89B24';  // WH AMARILLO
const BG      = '#FFFFFF';
const TXT     = '#1e293b';
const MUTED   = '#64748b';
const WHITE   = '#ffffff';
const BORDER  = '#e2e8f0';

// ─── styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  /**
   * Page padding reserva espacio para header fijo (top) y footer fijo (bottom).
   * El contenido del flujo cae entre estos dos.
   */
  page: {
    backgroundColor: BG, fontFamily: 'Helvetica', fontSize: 9, color: TXT,
    paddingTop: 78, paddingBottom: 78,
  },

  // ─── Header fijo (repetido en cada página) ───
  fixedHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: BG,
    borderBottomWidth: 1, borderBottomColor: ORANGE,
  },
  fixedLogo: { width: 110, height: 56, objectFit: 'contain' },
  fixedHeaderTitle: { color: NAVY, fontFamily: 'Helvetica-Bold', fontSize: 13, letterSpacing: 1 },
  fixedHeaderSub: { color: BLUE, fontSize: 7, letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'right' },

  // ─── Footer fijo (repetido en cada página) ───
  fixedFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: NAVY, paddingHorizontal: 24, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },

  // Meta
  metaRow: {
    paddingHorizontal: 24, paddingVertical: 6,
    flexDirection: 'row', gap: 16, flexWrap: 'wrap',
    backgroundColor: '#f0f6ff', borderTopWidth: 1, borderTopColor: ORANGE,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaLbl: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: NAVY },
  metaVal: { fontSize: 8, color: TXT },

  // Cliente / Consultor
  partyRow: { paddingHorizontal: 24, paddingVertical: 8, flexDirection: 'row', gap: 14 },
  partyCol: { flex: 1, gap: 2 },
  partyTitle: {
    fontFamily: 'Helvetica-Bold', fontSize: 8, color: BLUE,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3,
    borderBottomWidth: 1, borderBottomColor: ORANGE, paddingBottom: 2,
  },
  partyLine: { flexDirection: 'row', gap: 4 },
  partyLbl: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: MUTED, minWidth: 55 },
  partyVal: { fontSize: 7.5, color: TXT, flex: 1 },

  // Modos cotizados (chips overview)
  chipsRow: {
    paddingHorizontal: 24, paddingVertical: 6,
    flexDirection: 'row', gap: 5, flexWrap: 'wrap', alignItems: 'center',
  },
  chipsLbl: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: NAVY },
  chip: {
    paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 10,
    fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: WHITE,
  },

  // Section block (1 columna, full width)
  section: {
    marginHorizontal: 24, marginTop: 8,
    borderRadius: 6, overflow: 'hidden',
    borderWidth: 1, borderColor: BORDER,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7,
  },
  sectionHeaderTitle: { color: WHITE, fontFamily: 'Helvetica-Bold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  sectionHeaderSub: { color: WHITE, fontSize: 8, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Producto: layout horizontal con imagen grande + texto stacked
  trow: {
    flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6,
    alignItems: 'center', gap: 10,
    borderBottomWidth: 0.25, borderBottomColor: '#f1f5f9',
  },
  tdProductImg: { width: 60, height: 60, objectFit: 'contain' },
  tdProductTxt: { flex: 1 },
  tdProductName: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: NAVY, lineHeight: 1.2 },
  tdProductMeta: { fontSize: 7, color: MUTED, marginTop: 1 },
  tdProductPrice: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: NAVY, marginTop: 3 },
  tdNA: { fontSize: 8, color: '#ef4444', fontStyle: 'italic', marginTop: 2 },

  // Section discounts + total
  sectionDiscounts: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderTopWidth: 0.5, borderTopColor: BORDER, gap: 2,
  },
  discountLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  discountLbl: { fontSize: 8.5, color: '#15803d', fontFamily: 'Helvetica-Bold' },
  discountVal: { fontSize: 8.5, color: '#15803d', fontFamily: 'Helvetica-Bold' },

  ivuLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ivuLbl: { fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Bold' },
  ivuVal: { fontSize: 8.5, color: TXT, fontFamily: 'Helvetica-Bold' },

  sectionTotal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: BORDER,
  },
  sectionTotalLbl: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: NAVY, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTotalVal: { fontFamily: 'Helvetica-Bold', fontSize: 15 },

  // Madres banner
  madresBanner: {
    marginHorizontal: 24, marginTop: 10, marginBottom: 4,
    backgroundColor: '#FFEAF3', borderWidth: 1.5, borderColor: '#E84F97',
    borderRadius: 8, padding: 8,
    flexDirection: 'column', alignItems: 'center', gap: 2,
  },
  madresTitle: {
    fontSize: 11, color: '#BE2E71', fontFamily: 'Helvetica-Bold',
    textAlign: 'center', letterSpacing: 0.5,
  },
  madresSub: {
    fontSize: 7.5, color: '#8E2658', textAlign: 'center',
    fontFamily: 'Helvetica', lineHeight: 1.3,
  },

  // CC 26-08 banner (Periodo Libre de IVU)
  cc2608Banner: {
    marginHorizontal: 24, marginTop: 10, marginBottom: 4,
    backgroundColor: '#e0f2fe', borderWidth: 1.5, borderColor: '#0ea5e9',
    borderRadius: 8, padding: 8,
    flexDirection: 'column', gap: 3,
  },
  cc2608Title: {
    fontSize: 11, color: '#075985', fontFamily: 'Helvetica-Bold',
    textAlign: 'center', letterSpacing: 0.5,
  },
  cc2608Emoji: {
    fontFamily: 'NotoSymbols', fontSize: 12, color: '#075985',
  },
  cc2608Sub: {
    fontSize: 7.5, color: '#0c4a6e', textAlign: 'center',
    fontFamily: 'Helvetica', lineHeight: 1.3,
  },
  cc2608Notes: {
    fontSize: 7, color: '#0c4a6e', fontFamily: 'Helvetica',
    lineHeight: 1.3, marginTop: 2, textAlign: 'center',
  },

  // Mini-tabla Excel CC 26-08 (5 filas por cisterna)
  cc2608Table: {
    marginTop: 4, marginLeft: 8, marginRight: 4,
    borderWidth: 1, borderColor: '#0ea5e9', borderRadius: 4,
    overflow: 'hidden',
  },
  cc2608Row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 6, paddingVertical: 2.5,
    borderBottomWidth: 0.5, borderBottomColor: '#bae6fd',
  },
  cc2608RowLast: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 6, paddingVertical: 3,
    backgroundColor: '#fef3c7',
  },
  cc2608RowLbl: {
    fontSize: 7, color: '#0c4a6e', fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase', letterSpacing: 0.3,
  },
  cc2608RowVal: { fontSize: 7.5, color: TXT, fontFamily: 'Helvetica-Bold' },
  cc2608RowValStrike: {
    fontSize: 7, color: MUTED, fontFamily: 'Helvetica',
    textDecoration: 'line-through',
  },
  cc2608RowTotalLbl: {
    fontSize: 8, color: '#7c2d12', fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  cc2608RowTotalVal: {
    fontSize: 9, color: '#7c2d12', fontFamily: 'Helvetica-Bold',
  },
  savingsLine: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 6, paddingVertical: 3, marginTop: 3,
    backgroundColor: '#dcfce7', borderRadius: 4,
  },
  savingsLbl: { fontSize: 7.5, color: '#15803d', fontFamily: 'Helvetica-Bold' },
  savingsVal: { fontSize: 7.5, color: '#15803d', fontFamily: 'Helvetica-Bold' },

  // Footer (texto)
  fSite: { color: WHITE, fontFamily: 'Helvetica-Bold', fontSize: 12 },
  fCol: { gap: 2 },
  fHead: { color: WHITE, fontFamily: 'Helvetica-Bold', fontSize: 7.5, marginBottom: 1 },
  fText: { color: '#93c5fd', fontSize: 7 },
});

// ─── component ────────────────────────────────────────────────────────────

export interface QuoteDocumentProps {
  items: CartItem[];
  hasSolarBundle: boolean;
  hasROBundle: boolean;
  downPayment: number;
  consultor: ConsultorInfo;
  cliente: ClienteInfo;
  quoteNumber: string;
  date: string;
  effectiveCols: EffectiveCol[];
  idioma: Idioma;
  promoMadres: boolean;
  /** Período Libre de IVU CC 26-08: split Producto/Instalación en cisternas */
  ivuExemptCC2608?: boolean;
  /** Firma y Gana — cashback $500 al cliente por referir (independiente de Solar Bundle) */
  firmaYGana?: boolean;
  /** Kept for API compatibility — not used in section layout */
  primarySyncTerm?: 18 | 61;
}

const LOGO = '/windmar-water.png';

// ─── ModeSection ───────────────────────────────────────────────────────────

interface ModeSectionProps {
  col: EffectiveCol;
  items: CartItem[];
  hasSolarBundle: boolean;
  hasROBundle: boolean;
  downPayment: number;
  promoMadres: boolean;
  idioma: Idioma;
  ivuExemptCC2608: boolean;
  firmaYGana: boolean;
}

const ModeSection: React.FC<ModeSectionProps> = ({
  col, items, hasSolarBundle, hasROBundle, downPayment, promoMadres, idioma, ivuExemptCC2608, firmaYGana,
}) => {
  const IVU_RATE = 0.115;
  const inst = col.installments ?? 18;
  const div = col.isMonthly ? inst : 1;

  /**
   * Por item calculamos:
   *  - unitBaseSinIvu: base SIN IVU del producto (usar synchronySinIvu/cashSinIvu si existen,
   *    para evitar drift de centavos por round-trip de floating point)
   *  - ivuMult: 1.0 normal, installPercent si la cisterna aplica CC 26-08
   *  - eligibleCC2608: si esta linea aplica el split (cisterna con installPercent definido)
   */
  const rows = items.map(item => {
    const unitPrice = col.getPrice(item);
    const lineTotalCatalog = (unitPrice ?? 0) * item.quantity;
    let baseSinIvuLine = 0;
    let unitBaseSinIvu = 0;
    let ivuMult = 1;
    let eligibleCC2608 = false;
    let catalogTotalFinPerUnit = 0;
    if (unitPrice != null) {
      if (col.isMonthly || col.key === 'kiwi') {
        unitBaseSinIvu = item.product.synchronySinIvu
          ?? ((col.isMonthly ? unitPrice * inst : unitPrice) / (1 + IVU_RATE));
      } else {
        unitBaseSinIvu = item.product.cashSinIvu ?? (unitPrice / (1 + IVU_RATE));
      }
      baseSinIvuLine = unitBaseSinIvu * item.quantity;
      // Total con IVU del catalogo FIN per unit (referencia para preservar el factor de
      // interes en Synchrony m18/m61: la mensualidad de catalogo / catalog_total_fin es
      // la razon implicita; aplicandola al new_total_CC obtenemos new_monthly correcto).
      catalogTotalFinPerUnit = (item.product.synchronySinIvu ?? unitBaseSinIvu) * (1 + IVU_RATE);
      if (ivuExemptCC2608 && item.product.installPercent !== undefined) {
        ivuMult = item.product.installPercent;
        eligibleCC2608 = true;
      }
    }
    const effectiveUnitTotal = unitBaseSinIvu * (1 + ivuMult * IVU_RATE);
    const effectiveLineTotal = effectiveUnitTotal * item.quantity;

    // Mensualidad efectiva por unidad (solo modos monthly).
    // Para CC 26-08: catalogMonthly * (effectiveUnitTotal / catalogTotalFinPerUnit) -> ceil al $
    // Para non-CC: la mensualidad de catalogo (no cambia)
    let effectiveMonthlyPerUnit = 0;
    if (col.isMonthly && unitPrice != null) {
      if (eligibleCC2608 && catalogTotalFinPerUnit > 0) {
        const rawMonthly = unitPrice * (effectiveUnitTotal / catalogTotalFinPerUnit);
        effectiveMonthlyPerUnit = Math.ceil(rawMonthly);
      } else {
        effectiveMonthlyPerUnit = unitPrice;
      }
    }

    return {
      item,
      unitPrice,
      lineTotalCatalog,
      baseSinIvuLine,
      unitBaseSinIvu,
      ivuMult,
      eligibleCC2608,
      effectiveUnitTotal,
      effectiveLineTotal,
      catalogTotalFinPerUnit,
      effectiveMonthlyPerUnit,
    };
  });

  const subtotalSinIvu = rows.reduce((s, r) => s + r.baseSinIvuLine, 0);

  // Descuentos pre-IVU (siempre en valor FULL, no /div, para math correcta)
  const preIvuFull: { lbl: string; val: number }[] = [];
  if (hasSolarBundle) {
    preIvuFull.push({
      lbl: idioma === 'en' ? 'Solar Bundle (pre-tax)' : 'Solar Bundle (sin IVU)',
      val: 500,
    });
  }
  if (firmaYGana) {
    preIvuFull.push({
      lbl: idioma === 'en' ? 'Sign & Win cashback (pre-tax)' : 'Firma y Gana cashback (sin IVU)',
      val: 500,
    });
  }
  const roItem = items.find(i => i.product.id === 'trat-ro');
  const roHasPrice = roItem != null && col.getPrice(roItem) != null;
  if (hasROBundle && roHasPrice) {
    preIvuFull.push({
      lbl: idioma === 'en' ? 'RO Bundle (pre-tax)' : 'Combo RO (sin IVU)',
      val: 1000,
    });
  }
  if (promoMadres) {
    preIvuFull.push({
      lbl: idioma === 'en' ? "Mother's 2026 (pre-tax)" : 'Promo Madres 2026 (sin IVU)',
      val: MADRES_DISCOUNT_WATER,
    });
  }
  const totalPreIvuDiscFull = preIvuFull.reduce((s, d) => s + d.val, 0);

  // Reparto proporcional del descuento sobre la base sin IVU de cada item
  const discRatio = subtotalSinIvu > 0
    ? Math.min(1, totalPreIvuDiscFull / subtotalSinIvu)
    : 0;

  // Suma total con IVU recomputado por item según ivuMult
  let totalWithIvuPreDownPayment = 0;
  let finalSinIvuTotal = 0;
  let finalIvuTotal = 0;
  for (const r of rows) {
    const effBase = r.baseSinIvuLine * (1 - discRatio);
    const itemIvu = effBase * r.ivuMult * IVU_RATE;
    totalWithIvuPreDownPayment += effBase + itemIvu;
    finalSinIvuTotal += effBase;
    finalIvuTotal += itemIvu;
  }

  // Para modos monthly: sumar las mensualidades efectivas por unidad x cantidad.
  // Las cisternas CC 26-08 usan formula con factor de interes preservado + ceil al $.
  // Items no-elegibles usan la mensualidad de catalogo (mismo comportamiento previo).
  let totalMonthlyPreDownPayment = 0;
  if (col.isMonthly) {
    for (const r of rows) {
      totalMonthlyPreDownPayment += r.effectiveMonthlyPerUnit * r.item.quantity;
    }
  }

  // Post-IVU: down payment
  let totalFinal: number;
  if (col.isMonthly) {
    totalFinal = Math.max(
      0,
      totalMonthlyPreDownPayment - (totalPreIvuDiscFull / inst) - (downPayment / inst),
    );
  } else {
    totalFinal = Math.max(0, totalWithIvuPreDownPayment - downPayment);
  }

  // Para mostrar en líneas: dividimos por div en modo mensual
  const preIvuDiscounts = preIvuFull.map(d => ({ lbl: d.lbl, val: d.val / div }));
  const postIvuDiscounts: { lbl: string; val: number }[] = [];
  if (downPayment > 0) {
    postIvuDiscounts.push({
      lbl: idioma === 'en' ? 'Down Payment' : 'Pronto pago',
      val: downPayment / div,
    });
  }
  const discounts = [...preIvuDiscounts, ...postIvuDiscounts];

  // IVU breakdown solo para non-monthly. CC 26-08 cambia la etiqueta
  const hasCC2608Item = rows.some(r => r.eligibleCC2608);
  const sinIvu = !col.isMonthly ? finalSinIvuTotal : 0;
  const ivu    = !col.isMonthly ? finalIvuTotal    : 0;
  const ivuLabel = hasCC2608Item
    ? (idioma === 'en' ? 'IVU 11.5% (only on installation)' : 'IVU 11.5% (solo sobre instalación)')
    : (idioma === 'en' ? 'Tax 11.5%' : 'IVU 11.5%');

  return (
    <View style={s.section} wrap={false}>
      {/* Section header */}
      <View style={[s.sectionHeader, { backgroundColor: col.color }]}>
        <Text style={s.sectionHeaderTitle}>{col.label}</Text>
        <Text style={s.sectionHeaderSub}>
          {col.isMonthly
            ? t(`a ${col.installments} meses`, `${col.installments}m plan`, idioma)
            : t('contado', 'one-time', idioma)}
        </Text>
      </View>

      {/* Product rows — compactas */}
      {rows.map(({ item, unitPrice, lineTotalCatalog, baseSinIvuLine, ivuMult, eligibleCC2608, effectiveLineTotal, effectiveMonthlyPerUnit }) => {
        // Para cisternas con CC 26-08 mostramos el precio AJUSTADO (no el catálogo)
        // Monthly: usa effectiveMonthlyPerUnit (formula con factor de interes + ceil)
        // No-monthly: usa effectiveLineTotal (total con IVU recalculado por split)
        const displayLineTotal = eligibleCC2608
          ? (col.isMonthly ? effectiveMonthlyPerUnit * item.quantity : effectiveLineTotal)
          : lineTotalCatalog;
        const displayUnitPrice = item.quantity > 0 ? displayLineTotal / item.quantity : displayLineTotal;
        const cc2608Producto = eligibleCC2608 ? baseSinIvuLine * (1 - ivuMult) : 0;
        const cc2608Instal   = eligibleCC2608 ? baseSinIvuLine * ivuMult       : 0;
        const cc2608Ivu      = eligibleCC2608 ? cc2608Instal * IVU_RATE         : 0;
        const cc2608Savings  = eligibleCC2608 ? (lineTotalCatalog - displayLineTotal) : 0;
        return (
          <View key={item.product.id} style={s.trow}>
            {item.product.imageUrl && (
              <Image src={item.product.imageUrl} style={s.tdProductImg} />
            )}
            <View style={s.tdProductTxt}>
              <Text style={s.tdProductName}>{item.product.name}</Text>
              <Text style={s.tdProductMeta}>
                {item.product.category} · ×{item.quantity}
              </Text>
              {unitPrice == null ? (
                <Text style={s.tdNA}>
                  {t('N/A en este modo', 'N/A in this mode', idioma)}
                </Text>
              ) : (
                <>
                  <Text style={s.tdProductPrice}>
                    {fmt(displayLineTotal)}{col.isMonthly && t('/mes', '/mo', idioma)}
                    <Text style={{ fontSize: 6.5, color: MUTED, fontFamily: 'Helvetica' }}>
                      {item.quantity > 1 && ` (${fmt(displayUnitPrice)}${col.isMonthly ? '/mes' : ''} c/u)`}
                    </Text>
                  </Text>
                  {/* Para modos monthly: mini-nota con el ahorro per-mes */}
                  {eligibleCC2608 && col.isMonthly && unitPrice != null && unitPrice > effectiveMonthlyPerUnit && (
                    <View style={s.savingsLine}>
                      <Text style={s.savingsLbl}>
                        {t('Ahorras vs. IVU regular', 'You save vs. regular IVU', idioma)}
                      </Text>
                      <Text style={s.savingsVal}>
                        −{fmt((unitPrice - effectiveMonthlyPerUnit) * item.quantity)}{t('/mes', '/mo', idioma)}
                      </Text>
                    </View>
                  )}
                  {/* Solo nota de ahorro vs IVU regular (sin mini-tabla para evitar repetir valores) */}
                  {eligibleCC2608 && !col.isMonthly && cc2608Savings > 0.01 && (
                    <View style={s.savingsLine}>
                      <Text style={s.savingsLbl}>
                        {t('Ahorras vs. IVU regular', 'You save vs. regular IVU', idioma)}
                      </Text>
                      <Text style={s.savingsVal}>−{fmt(cc2608Savings)}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        );
      })}

      {/* Descuentos — primero, para que el IVU se recalcule sobre el monto final */}
      {discounts.length > 0 && (
        <View style={s.sectionDiscounts}>
          {discounts.map((d, i) => (
            <View key={i} style={s.discountLine}>
              <Text style={s.discountLbl}>{d.lbl}</Text>
              <Text style={s.discountVal}>
                −{fmt(d.val)}{col.isMonthly && t('/mes', '/mo', idioma)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* IVU breakdown (solo cash/oriental/kiwi) — recalculado sobre el total final */}
      {!col.isMonthly && totalFinal > 0 && (
        <View style={s.sectionDiscounts}>
          <View style={s.ivuLine}>
            <Text style={s.ivuLbl}>{t('Subtotal sin IVU', 'Subtotal (no tax)', idioma)}</Text>
            <Text style={s.ivuVal}>{fmt(sinIvu)}</Text>
          </View>
          <View style={s.ivuLine}>
            <Text style={s.ivuLbl}>{ivuLabel}</Text>
            <Text style={s.ivuVal}>{fmt(ivu)}</Text>
          </View>
        </View>
      )}

      {/* Section total */}
      <View style={[s.sectionTotal, { backgroundColor: col.lightBg }]}>
        <Text style={s.sectionTotalLbl}>
          {col.isMonthly
            ? t(`Total ${col.installments}m`, `Total ${col.installments}m`, idioma)
            : t('Total con IVU', 'Total with tax', idioma)}
        </Text>
        <Text style={[s.sectionTotalVal, { color: col.color }]}>
          {fmt(totalFinal)}{col.isMonthly && t('/mes', '/mo', idioma)}
        </Text>
      </View>
    </View>
  );
};

// ─── main component ───────────────────────────────────────────────────────

export const QuoteDocument: React.FC<QuoteDocumentProps> = ({
  items, hasSolarBundle, hasROBundle, downPayment,
  consultor, cliente, quoteNumber, date, effectiveCols, idioma, promoMadres,
  ivuExemptCC2608 = false,
  firmaYGana = false,
}) => {
  // Solo activamos el banner si hay cisternas en el carrito Y el flag esta on
  const hasCisternasInCart = items.some(it => it.product.installPercent !== undefined);
  const cc2608Active = ivuExemptCC2608 && hasCisternasInCart;
  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* HEADER FIJO — se repite en cada página */}
        <View style={s.fixedHeader} fixed>
          <Image src={LOGO} style={s.fixedLogo} />
          <View>
            <Text style={s.fixedHeaderTitle}>
              {t('COTIZACIÓN FORMAL', 'FORMAL QUOTE', idioma)}
            </Text>
            <Text style={s.fixedHeaderSub}>
              {t('No.', 'No.', idioma)} {quoteNumber} · {date}
            </Text>
          </View>
        </View>

        {/* META */}
        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Text style={s.metaLbl}>{t('Cotización No.', 'Quote No.', idioma)}</Text>
            <Text style={s.metaVal}>{quoteNumber}</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLbl}>{t('Fecha:', 'Date:', idioma)}</Text>
            <Text style={s.metaVal}>{date}</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLbl}>{t('Vigencia:', 'Valid for:', idioma)}</Text>
            <Text style={s.metaVal}>{t('30 días', '30 days', idioma)}</Text>
          </View>
        </View>

        {/* PARTIES */}
        <View style={s.partyRow}>
          <View style={s.partyCol}>
            <Text style={s.partyTitle}>{t('Consultor', 'Consultant', idioma)}</Text>
            <View style={s.partyLine}>
              <Text style={s.partyLbl}>{t('Nombre:', 'Name:', idioma)}</Text>
              <Text style={s.partyVal}>{consultor.nombre || '—'}</Text>
            </View>
            <View style={s.partyLine}>
              <Text style={s.partyLbl}>{t('Teléfono:', 'Phone:', idioma)}</Text>
              <Text style={s.partyVal}>{consultor.telefono || '—'}</Text>
            </View>
            <View style={s.partyLine}>
              <Text style={s.partyLbl}>{t('Correo:', 'Email:', idioma)}</Text>
              <Text style={s.partyVal}>{consultor.correo || '—'}</Text>
            </View>
          </View>
          <View style={s.partyCol}>
            <Text style={s.partyTitle}>{t('Cliente', 'Customer', idioma)}</Text>
            <View style={s.partyLine}>
              <Text style={s.partyLbl}>{t('Nombre:', 'Name:', idioma)}</Text>
              <Text style={s.partyVal}>{cliente.nombre || '—'}</Text>
            </View>
            <View style={s.partyLine}>
              <Text style={s.partyLbl}>{t('Teléfono:', 'Phone:', idioma)}</Text>
              <Text style={s.partyVal}>{cliente.telefono || '—'}</Text>
            </View>
            <View style={s.partyLine}>
              <Text style={s.partyLbl}>{t('Correo:', 'Email:', idioma)}</Text>
              <Text style={s.partyVal}>{cliente.correo || '—'}</Text>
            </View>
            <View style={s.partyLine}>
              <Text style={s.partyLbl}>{t('Dirección:', 'Address:', idioma)}</Text>
              <Text style={s.partyVal}>{cliente.direccion || '—'}</Text>
            </View>
          </View>
        </View>

        {/* MODES OVERVIEW — una sola chip por modo (synchrony no se repite por término) */}
        <View style={s.chipsRow}>
          <Text style={s.chipsLbl}>{t('Modos cotizados:', 'Quoted modes:', idioma)}</Text>
          {(() => {
            const seen = new Set<string>();
            const uniqueChips: { key: string; label: string; color: string }[] = [];
            effectiveCols.forEach(col => {
              const baseKey = col.isMonthly ? 'synchrony' : col.key;
              if (seen.has(baseKey)) return;
              seen.add(baseKey);
              uniqueChips.push({
                key: baseKey,
                label: MODE_LABELS[baseKey] || baseKey,
                color: col.color,
              });
            });
            return uniqueChips.map(c => (
              <Text key={c.key} style={[s.chip, { backgroundColor: c.color }]}>
                {c.label}
              </Text>
            ));
          })()}
        </View>

        {/* Banner CC 26-08 — vigente cuando hay cisternas + toggle activo */}
        {cc2608Active && (
          <View style={s.cc2608Banner} wrap={false}>
            <Text style={s.cc2608Title}>
              <Text style={s.cc2608Emoji}>⛈</Text>
              {'  '}
              {t(
                'PERÍODO LIBRE DE IVU',
                'IVU-FREE PERIOD',
                idioma,
              )}
              {'  '}
              <Text style={s.cc2608Emoji}>⛈</Text>
            </Text>
            <Text style={s.cc2608Sub}>
              {t(
                'Vigente 22-25 de mayo 2026 · Exención de IVU sobre el producto en cisternas para preparación de huracanes',
                'Valid May 22–25, 2026 · IVU exempt on product portion of cisterns for hurricane prep',
                idioma,
              )}
            </Text>
            <Text style={s.cc2608Notes}>
              {t(
                'Solo cualifica si: la venta se procesa por VASS · pronto 100% al firmar · documentación completa dentro del período',
                'Qualifies only if: sale processed via VASS · 100% down payment at signing · full documentation within the period',
                idioma,
              )}
            </Text>
          </View>
        )}

        {/* SECCIONES POR MODO — una columna, filas full-width */}
        {effectiveCols.map(col => (
          <ModeSection
            key={col.key}
            col={col}
            items={items}
            hasSolarBundle={hasSolarBundle}
            hasROBundle={hasROBundle}
            downPayment={downPayment}
            promoMadres={promoMadres}
            idioma={idioma}
            ivuExemptCC2608={cc2608Active}
            firmaYGana={firmaYGana}
          />
        ))}

        {/* Madres — banner con corazones (sólo cuando promo activa) */}
        {promoMadres && (
          <View style={s.madresBanner} wrap={false}>
            <Text style={s.madresTitle}>
              {t(
                '♥ ♥ Promo Mes de las Madres 2026 ♥ ♥',
                "♥ ♥ Mother's Day Promo 2026 ♥ ♥",
                idioma,
              )}
            </Text>
            <Text style={s.madresSub}>
              {t(
                `Descuento de $${MADRES_DISCOUNT_WATER} aplicado · Vigente del 7 al 14 de mayo 2026 · Solo en showroom con cliente citado`,
                `$${MADRES_DISCOUNT_WATER} discount applied · Valid May 7–14, 2026 · In-showroom only with scheduled customer`,
                idioma,
              )}
            </Text>
            <Text style={s.madresSub}>
              Roosevelt · Mayagüez · Ponce · Hatillo
            </Text>
          </View>
        )}

        {/* FOOTER FIJO — se repite en cada página, siempre al fondo */}
        <View style={s.fixedFooter} fixed>
          <Text style={s.fSite}>windmar.com</Text>
          <View style={s.fCol}>
            <Text style={s.fHead}>{t('Contáctanos', 'Contact us', idioma)}</Text>
            <Text style={s.fText}>ventas@windmarhome.com</Text>
            <Text style={s.fText}>(787) 395-7766</Text>
          </View>
          <View style={s.fCol}>
            <Text style={s.fHead}>{t('Dirección', 'Address', idioma)}</Text>
            <Text style={s.fText}>1255 Avenida F.D. Roosevelt,</Text>
            <Text style={s.fText}>San Juan, 00920, Puerto Rico.</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
