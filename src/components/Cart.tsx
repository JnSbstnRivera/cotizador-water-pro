import React, { useMemo, useState } from 'react';
import { FileDown, Trash2, ChevronDown, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, PaymentMode, AddOn, AddOnCategory } from '../types';
import { MODE_LABELS, ADD_ONS, addOnPriceConIvu } from '../constants';

interface CartProps {
  items: CartItem[];
  mode: PaymentMode;
  setMode: (m: PaymentMode) => void;
  syncTerm: 18 | 61;
  setSyncTerm: (t: 18 | 61) => void;
  downPayment: number;
  setDownPayment: (v: number) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClear: () => void;
  onPDF: () => void;
  // Add-Ons & Upgrades
  addOnQuantities: Record<string, number>;
  onAddOnQtyChange: (next: Record<string, number>) => void;
}

// Orden visual fijo de categorias de add-ons
const ADDON_CATEGORIES: AddOnCategory[] = [
  'Punto de Entrada',
  'Punto de Uso',
  'Cisternas y Bombas',
  'Calentadores Solares',
];

const ADDONS_BY_CATEGORY: Record<AddOnCategory, AddOn[]> = ADDON_CATEGORIES.reduce((acc, cat) => {
  acc[cat] = ADD_ONS.filter(a => a.category === cat);
  return acc;
}, {} as Record<AddOnCategory, AddOn[]>);

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

/**
 * Precio efectivo de un item en el modo activo.
 * Retorna null si el producto no tiene precio disponible en ese modo (ej. RO/POE en Synchrony).
 */
function getItemPrice(item: CartItem, mode: PaymentMode, syncTerm: 18 | 61): number | null {
  const { prices } = item.product;
  if (mode === 'cash' || mode === 'oriental') return prices.cash;
  if (mode === 'kiwi') return prices.synchrony;
  // synchrony
  return syncTerm === 61 ? prices.m61 : prices.m18;
}

/** Mapeo de modo → estilos del chip activo (paleta Windmar + morado para sync). Texto siempre blanco. */
const ACTIVE_PILL: Record<PaymentMode, { bg: string; text: string }> = {
  cash:      { bg: 'bg-windmar-blue',       text: 'text-white' },
  oriental:  { bg: 'bg-windmar-blue-dark',  text: 'text-white' },
  synchrony: { bg: 'bg-[#8b5cf6]',          text: 'text-white' },  // morado
  kiwi:      { bg: 'bg-windmar-gold',       text: 'text-white' },
};

const MODES: { key: PaymentMode; emoji: string }[] = [
  { key: 'cash',      emoji: '💵' },
  { key: 'oriental',  emoji: '🏛' },
  { key: 'synchrony', emoji: '🏦' },
  { key: 'kiwi',      emoji: '🥝' },
];

interface ItemRowProps {
  item: CartItem;
  mode: PaymentMode;
  syncTerm: 18 | 61;
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
}

const ItemRow: React.FC<ItemRowProps> = ({ item, mode, syncTerm, onUpdateQty, onRemoveItem }) => {
  const price       = getItemPrice(item, mode, syncTerm);
  const unavailable = price == null;
  const isMonthly   = mode === 'synchrony';
  const isCash      = mode === 'cash' || mode === 'oriental';

  return (
    <div className="bg-white dark:bg-[#161b22] rounded-xl border border-windmar-blue-light/30 dark:border-white/10 p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 bg-slate-50 dark:bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
          <img
            src={item.product.imageUrl}
            alt={item.product.name}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-full object-contain"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
            {item.product.category}
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-[#e8eaed] leading-tight truncate">
            {item.product.name}
          </p>

          {/* Precio en línea — texto neutro */}
          {unavailable ? (
            <p className="text-[11px] mt-1 text-red-500 italic">
              No disponible en {MODE_LABELS[mode]}
            </p>
          ) : (
            <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              <span className="text-sm font-bold text-slate-900 dark:text-[#e8eaed]">
                {fmt(price!)}{isMonthly && '/mes'}
              </span>
              {isCash && item.product.cashSinIvu != null && (
                <> · Sin IVU <b>{fmt(item.product.cashSinIvu)}</b> · IVU <b>{fmt(item.product.ivuCash ?? 0)}</b></>
              )}
              {isMonthly && item.product.prices.synchrony != null && (
                <>
                  {' · Financiado '}<b>{fmt(item.product.prices.synchrony)}</b>
                  {item.product.ivu != null && <> · IVU <b>{fmt(item.product.ivu)}</b></>}
                </>
              )}
              {mode === 'kiwi' && item.product.synchronySinIvu != null && (
                <> · Sin IVU <b>{fmt(item.product.synchronySinIvu)}</b> · IVU <b>{fmt(item.product.ivu ?? 0)}</b></>
              )}
            </div>
          )}

          {/* Controles cantidad + eliminar */}
          <div className="flex items-center gap-1.5 mt-2">
            <button
              onClick={() => onUpdateQty(item.product.id, -1)}
              className="w-6 h-6 rounded-md bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-bold leading-none"
            >−</button>
            <span className="text-xs font-bold w-5 text-center text-slate-900 dark:text-[#e8eaed]">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQty(item.product.id, 1)}
              className="w-6 h-6 rounded-md bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-bold leading-none"
            >+</button>
            <button
              onClick={() => onRemoveItem(item.product.id)}
              className="ml-auto w-6 h-6 rounded-md bg-red-50 dark:bg-red-900/30 hover:bg-red-100 text-red-600 flex items-center justify-center"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function Cart({
  items, mode, setMode, syncTerm, setSyncTerm,
  downPayment, setDownPayment,
  onUpdateQty, onRemoveItem, onClear, onPDF,
  addOnQuantities, onAddOnQtyChange,
}: CartProps) {

  const [addOnsOpen, setAddOnsOpen] = useState(false);

  const productsSubtotal = items.reduce((sum, item) => {
    const p = getItemPrice(item, mode, syncTerm) ?? 0;
    return sum + p * item.quantity;
  }, 0);

  const isMonthly = mode === 'synchrony';

  // Bundle RO: $1,000 descuento si lleva Reverse Osmosis (trat-ro) + otro producto
  // y RO tiene precio en el modo activo (RO no tiene precio en synchrony m18/m61)
  const hasROInCart = items.some(it => it.product.id === 'trat-ro');
  const hasOtherProductInCart = items.some(it => it.product.id !== 'trat-ro');
  const roItem = items.find(it => it.product.id === 'trat-ro');
  const roHasPriceInMode = roItem ? getItemPrice(roItem, mode, syncTerm) != null : false;
  const RO_BUNDLE_DISCOUNT = 1000;
  const showROBundleDiscount = hasROInCart && hasOtherProductInCart && roHasPriceInMode;
  const roBundleDiscount = showROBundleDiscount ? RO_BUNDLE_DISCOUNT : 0;

  // Add-Ons: subtotal con IVU (los precios en la lista son SIN IVU)
  const addOnsSubtotal = useMemo(() => {
    return ADD_ONS.reduce((sum, a) => {
      const qty = addOnQuantities[a.id] || 0;
      return sum + addOnPriceConIvu(a.priceSinIvu) * qty;
    }, 0);
  }, [addOnQuantities]);

  // Cantidad total de add-ons seleccionados (para badge del acordeon)
  const addOnsSelectedCount = useMemo(
    () => Object.values(addOnQuantities).reduce((s, q) => s + (q > 0 ? 1 : 0), 0),
    [addOnQuantities],
  );

  // Add-ons NO se suman al monthly (siempre van como cargo unico)
  // RO Bundle aplica sobre productos (no sobre add-ons)
  const productsAfterRoBundle = Math.max(0, productsSubtotal - roBundleDiscount);
  const subtotal = isMonthly
    ? productsAfterRoBundle
    : productsAfterRoBundle + addOnsSubtotal;

  const updateAddOn = (id: string, delta: number) => {
    const curr = addOnQuantities[id] || 0;
    const next = Math.max(0, curr + delta);
    const updated = { ...addOnQuantities };
    if (next === 0) delete updated[id]; else updated[id] = next;
    onAddOnQtyChange(updated);
  };
  const toggleAddOn = (id: string) => {
    const curr = addOnQuantities[id] || 0;
    if (curr > 0) {
      const updated = { ...addOnQuantities };
      delete updated[id];
      onAddOnQtyChange(updated);
    } else {
      onAddOnQtyChange({ ...addOnQuantities, [id]: 1 });
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-[#161b22] rounded-2xl p-6 text-center border-2 border-dashed border-windmar-blue-light/40 dark:border-white/10">
        <p className="text-base font-bold text-slate-600 dark:text-slate-300">El carrito está vacío</p>
        <p className="text-xs text-slate-400 mt-1">Agrega productos del catálogo</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#161b22] rounded-2xl overflow-hidden shadow-xl border border-windmar-blue-light/30 dark:border-white/10">
      {/* Header — siempre azul Windmar */}
      <div className="bg-windmar-blue px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
        <h2 className="text-white font-black text-base sm:text-lg tracking-wide">
          Carrito ({items.length})
        </h2>
        <button
          onClick={onClear}
          className="text-white/80 hover:text-white text-xs sm:text-sm font-medium transition-colors"
        >
          Limpiar
        </button>
      </div>

      {/* Mode selector */}
      <div className="px-4 sm:px-5 pt-3 sm:pt-4 pb-2">
        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">
          Modo de pago
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {MODES.map(m => {
            const active = mode === m.key;
            const pill = ACTIVE_PILL[m.key];
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  active
                    ? `${pill.bg} ${pill.text} shadow-md`
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {m.emoji} {MODE_LABELS[m.key]}
              </button>
            );
          })}
        </div>

        {/* Sync term selector */}
        <AnimatePresence>
          {isMonthly && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5">
                Plazo Synchrony
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {([18, 61] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setSyncTerm(n)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      syncTerm === n
                        ? 'bg-[#8b5cf6] text-white shadow-md'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {n} meses
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Items */}
      <div className="px-4 sm:px-5 py-3 space-y-2.5 max-h-[40vh] overflow-y-auto">
        {items.map(item => (
          <ItemRow
            key={item.product.id}
            item={item}
            mode={mode}
            syncTerm={syncTerm}
            onUpdateQty={onUpdateQty}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </div>

      {/* Add-Ons & Upgrades — acordeon */}
      <div className="border-t border-windmar-blue-light/30 dark:border-white/10">
        <button
          type="button"
          onClick={() => setAddOnsOpen(o => !o)}
          className="w-full px-4 sm:px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-windmar-blue" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Add-Ons &amp; Upgrades
            </span>
            {addOnsSelectedCount > 0 && (
              <span className="bg-windmar-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {addOnsSelectedCount}
              </span>
            )}
          </span>
          <span className="flex items-center gap-2">
            {addOnsSubtotal > 0 && (
              <span className="text-xs font-mono font-bold text-windmar-blue dark:text-windmar-blue-light">
                +{fmt(addOnsSubtotal)}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${addOnsOpen ? 'rotate-180' : ''}`}
            />
          </span>
        </button>

        <AnimatePresence initial={false}>
          {addOnsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-5 pb-3 max-h-[40vh] overflow-y-auto space-y-3">
                <p className="text-[10px] italic text-slate-400 leading-relaxed">
                  Precios mostrados con IVU 11.5% incluido. Lista oficial sin IVU; ver tabla interna para detalle.
                </p>

                {ADDON_CATEGORIES.map(cat => (
                  <div key={cat} className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-windmar-blue-dark dark:text-windmar-blue-light">
                      {cat}
                    </p>
                    {ADDONS_BY_CATEGORY[cat].map(addOn => {
                      const qty = addOnQuantities[addOn.id] || 0;
                      const selected = qty > 0;
                      const precioConIvu = addOnPriceConIvu(addOn.priceSinIvu);
                      const isFree = addOn.priceSinIvu === 0;
                      return (
                        <div
                          key={addOn.id}
                          className={`rounded-lg border p-2.5 transition-colors ${
                            selected
                              ? 'border-windmar-blue bg-windmar-blue/5 dark:bg-windmar-blue/15'
                              : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1215]'
                          }`}
                        >
                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleAddOn(addOn.id)}
                              className="mt-0.5 w-4 h-4 accent-windmar-blue cursor-pointer flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-[#e8eaed] leading-tight">
                                  {addOn.name}
                                </span>
                                <span className={`text-xs font-mono font-bold whitespace-nowrap ${
                                  isFree
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-windmar-blue dark:text-windmar-blue-light'
                                }`}>
                                  {isFree ? 'Sin cargo' : fmt(precioConIvu)}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                {addOn.notes}
                              </p>
                            </div>
                          </label>
                          {selected && !isFree && (
                            <div className="mt-2 flex items-center gap-1.5 pl-6">
                              <button
                                type="button"
                                onClick={() => updateAddOn(addOn.id, -1)}
                                className="w-6 h-6 rounded-md bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-bold leading-none"
                              >
                                −
                              </button>
                              <span className="text-xs font-bold w-5 text-center text-slate-900 dark:text-[#e8eaed]">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateAddOn(addOn.id, 1)}
                                className="w-6 h-6 rounded-md bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-bold leading-none"
                              >
                                +
                              </button>
                              <span className="ml-auto text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                Subt. {fmt(precioConIvu * qty)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Resumen de compra */}
      <div className="px-4 sm:px-5 py-3 bg-slate-50 dark:bg-white/5 border-t border-windmar-blue-light/30 dark:border-white/10 space-y-2.5">
        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
          Resumen de compra
        </p>

        {/* Subtotal — desglosado si hay add-ons o RO bundle */}
        {(addOnsSubtotal > 0 || showROBundleDiscount) ? (
          <>
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {isMonthly ? `Productos (${syncTerm}m)` : 'Productos'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                {fmt(productsSubtotal)}{isMonthly && <span className="text-[10px]">/mes</span>}
              </span>
            </div>
            {showROBundleDiscount && (
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <span className="text-[9px]">💧</span>
                  Combo RO (sin IVU)
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  −{fmt(RO_BUNDLE_DISCOUNT)}
                </span>
              </div>
            )}
            {addOnsSubtotal > 0 && (
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Add-ons (cargo unico)
                </span>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  +{fmt(addOnsSubtotal)}
                </span>
              </div>
            )}
            {isMonthly && addOnsSubtotal > 0 && (
              <p className="text-[9px] italic text-slate-400 -mt-1">
                Los add-ons se cobran como cargo unico aparte de las cuotas.
              </p>
            )}
            <div className="flex justify-between items-baseline pt-1 border-t border-slate-200 dark:border-white/5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isMonthly ? `Subtotal mensual (${syncTerm}m)` : 'Subtotal'}
              </span>
              <span className="text-base font-black font-mono text-slate-900 dark:text-[#e8eaed]">
                {fmt(subtotal)}{isMonthly && <span className="text-xs">/mes</span>}
              </span>
            </div>
          </>
        ) : (
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {isMonthly ? `Subtotal mensual (${syncTerm}m)` : 'Subtotal'}
            </span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-[#e8eaed]">
              {fmt(subtotal)}{isMonthly && <span className="text-xs">/mes</span>}
            </span>
          </div>
        )}

        {/* Pronto pago input */}
        <div className="flex items-center gap-2">
          <label htmlFor="downPayment" className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
            💰 Pronto pago:
          </label>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
            <input
              id="downPayment"
              type="number"
              min={0}
              value={downPayment || ''}
              onChange={e => setDownPayment(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-full bg-white dark:bg-[#0f1215] border border-windmar-blue-light/40 dark:border-white/10 rounded-lg pl-6 pr-2 py-1.5 text-xs font-bold text-slate-900 dark:text-[#e8eaed] outline-none focus:border-windmar-blue focus:ring-1 focus:ring-windmar-blue/30"
            />
          </div>
        </div>

        {/* Total a pagar */}
        {downPayment > 0 && (
          <div className="flex justify-between items-baseline pt-2 border-t border-windmar-blue-light/30 dark:border-white/10">
            <span className="text-xs uppercase tracking-widest font-bold text-windmar-blue dark:text-windmar-blue-light">
              {isMonthly ? `Mensual con pronto (${syncTerm}m)` : 'Total con pronto'}
            </span>
            <span className="text-lg font-black font-mono text-windmar-blue-dark dark:text-white">
              {fmt(Math.max(0, subtotal - (isMonthly ? downPayment / syncTerm : downPayment)))}
              {isMonthly && <span className="text-xs">/mes</span>}
            </span>
          </div>
        )}

        <p className="text-[10px] text-slate-400 italic">
          Bundles y promociones se aplican al generar el PDF.
        </p>
      </div>

      {/* PDF button */}
      <div className="px-4 sm:px-5 py-4">
        <button
          onClick={onPDF}
          className="w-full bg-windmar-blue hover:bg-windmar-blue-dark active:scale-[0.98] text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-windmar-blue/25"
        >
          <FileDown className="w-4 h-4" />
          Generar Cotización PDF
        </button>
      </div>
    </div>
  );
}
