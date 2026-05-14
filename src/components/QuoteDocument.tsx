import React from 'react';
import {
  Document, Page, View, Text, Image, StyleSheet,
} from '@react-pdf/renderer';
import { CartItem, PaymentMode, ConsultorInfo, ClienteInfo, Idioma } from '../types';
import { MODE_LABELS } from '../constants';
import { MADRES_DISCOUNT_WATER } from '../lib/promoMadres';

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
  /** Kept for API compatibility — not used in section layout */
  primarySyncTerm?: 18 | 61;
}

const LOGO = 'https://i.postimg.cc/PqD3CmtW/WIndmar-water.png';

// ─── ModeSection ───────────────────────────────────────────────────────────

interface ModeSectionProps {
  col: EffectiveCol;
  items: CartItem[];
  hasSolarBundle: boolean;
  hasROBundle: boolean;
  downPayment: number;
  promoMadres: boolean;
  idioma: Idioma;
}

const ModeSection: React.FC<ModeSectionProps> = ({
  col, items, hasSolarBundle, hasROBundle, downPayment, promoMadres, idioma,
}) => {
  // Calculo del subtotal de la sección (suma de price × qty)
  let subtotal = 0;
  const rows = items.map(item => {
    const unitPrice = col.getPrice(item);
    const lineTotal = (unitPrice ?? 0) * item.quantity;
    if (unitPrice != null) subtotal += lineTotal;
    return { item, unitPrice, lineTotal };
  });

  // Descuentos aplicables a esta sección
  const inst = col.installments ?? 18;
  const div = col.isMonthly ? inst : 1;

  /**
   * Descuentos pre-IVU: Solar Bundle, RO Bundle, Promo Madres.
   * Se aplican a la base SIN IVU; luego se re-agrega IVU sobre el monto reducido.
   * Esto hace que el cliente vea el valor pre-IVU ($500, $1000) y la IVU recalculada
   * automáticamente refleja el ahorro adicional ($X × 11.5%) sin mostrarlo como línea aparte.
   */
  const preIvuDiscounts: { lbl: string; val: number }[] = [];

  if (hasSolarBundle) {
    preIvuDiscounts.push({
      lbl: idioma === 'en' ? 'Solar Bundle (pre-tax)' : 'Solar Bundle (sin IVU)',
      val: 500 / div,
    });
  }
  // RO Bundle: solo si RO tiene precio en este modo (evita dividir por null en sync)
  const roItem = items.find(i => i.product.id === 'trat-ro');
  const roHasPrice = roItem != null && col.getPrice(roItem) != null;
  if (hasROBundle && roHasPrice) {
    preIvuDiscounts.push({
      lbl: idioma === 'en' ? 'RO Bundle (pre-tax)' : 'Combo RO (sin IVU)',
      val: 1000 / div,
    });
  }
  if (promoMadres) {
    // Comunicado oficial: $500 SIN IVU. Se aplica pre-tax: cliente ve −$500
    // y el ahorro real (incluyendo IVU 11.5%) se refleja automáticamente en el total.
    preIvuDiscounts.push({
      lbl: idioma === 'en' ? "Mother's 2026 (pre-tax)" : 'Promo Madres 2026 (sin IVU)',
      val: MADRES_DISCOUNT_WATER / div,
    });
  }

  // Pronto pago = pago en efectivo POST-IVU (no aplica el ahorro de IVU)
  const postIvuDiscounts: { lbl: string; val: number }[] = [];
  if (downPayment > 0) {
    postIvuDiscounts.push({
      lbl: idioma === 'en' ? 'Down Payment' : 'Pronto pago',
      val: downPayment / div,
    });
  }

  const totalPreIvuDisc  = preIvuDiscounts.reduce((s, d) => s + d.val, 0);
  const totalPostIvuDisc = postIvuDiscounts.reduce((s, d) => s + d.val, 0);

  const IVU_RATE = 0.115;

  /**
   * Cálculo del total:
   * - Modos no-mensuales (cash/oriental/kiwi): subtotal INCLUYE IVU.
   *   Descuentos pre-IVU se aplican a la base sin IVU, luego se re-agrega IVU.
   *   Down payment se resta del total con IVU.
   * - Modos mensuales (sync 18/61): cuota incluye IVU baked in.
   *   Descuentos pre-IVU se prorratean directamente sobre la cuota (sin recalc IVU).
   */
  let totalFinal: number;
  if (col.isMonthly) {
    totalFinal = Math.max(0, subtotal - totalPreIvuDisc - totalPostIvuDisc);
  } else {
    const subtotalSinIvu = subtotal / (1 + IVU_RATE);
    const finalSinIvu    = Math.max(0, subtotalSinIvu - totalPreIvuDisc);
    const withIvu        = finalSinIvu * (1 + IVU_RATE);
    totalFinal           = Math.max(0, withIvu - totalPostIvuDisc);
  }

  // Lista unificada de descuentos para renderizar (pre-IVU primero, luego pronto pago)
  const discounts = [...preIvuDiscounts, ...postIvuDiscounts];

  /**
   * IVU breakdown — RECOMPUTADO sobre el total final (post-todos los descuentos)
   * para que los números siempre cuadren: sinIVU + IVU = totalFinal.
   * Solo aplica a modos no-mensuales (cash / oriental / kiwi).
   */
  const sinIvu = !col.isMonthly ? totalFinal / (1 + IVU_RATE) : 0;
  const ivu    = !col.isMonthly ? totalFinal - sinIvu          : 0;

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
      {rows.map(({ item, unitPrice, lineTotal }) => (
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
              <Text style={s.tdProductPrice}>
                {fmt(lineTotal)}{col.isMonthly && t('/mes', '/mo', idioma)}
                <Text style={{ fontSize: 6.5, color: MUTED, fontFamily: 'Helvetica' }}>
                  {item.quantity > 1 && ` (${fmt(unitPrice)}${col.isMonthly ? '/mes' : ''} c/u)`}
                </Text>
              </Text>
            )}
          </View>
        </View>
      ))}

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
            <Text style={s.ivuLbl}>{t('IVU 11.5%', 'Tax 11.5%', idioma)}</Text>
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
}) => {
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
