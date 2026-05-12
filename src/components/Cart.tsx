import React from 'react';
import { FileDown, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, PaymentMode } from '../types';
import { MODE_LABELS } from '../constants';

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
}

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
}: CartProps) {

  const subtotal = items.reduce((sum, item) => {
    const p = getItemPrice(item, mode, syncTerm) ?? 0;
    return sum + p * item.quantity;
  }, 0);

  const isMonthly = mode === 'synchrony';

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
      <div className="px-4 sm:px-5 py-3 space-y-2.5 max-h-[55vh] overflow-y-auto">
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

      {/* Resumen de compra */}
      <div className="px-4 sm:px-5 py-3 bg-slate-50 dark:bg-white/5 border-t border-windmar-blue-light/30 dark:border-white/10 space-y-2.5">
        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
          Resumen de compra
        </p>

        {/* Subtotal */}
        <div className="flex justify-between items-baseline">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
            {isMonthly ? `Subtotal mensual (${syncTerm}m)` : 'Subtotal'}
          </span>
          <span className="text-base font-black font-mono text-slate-900 dark:text-[#e8eaed]">
            {fmt(subtotal)}{isMonthly && <span className="text-xs">/mes</span>}
          </span>
        </div>

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
