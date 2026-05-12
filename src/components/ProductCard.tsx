import React from 'react';
import { Product } from '../types';
import { Users, Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  /** Mantenido por compatibilidad — ya no afecta visual */
  isInCart?: boolean;
}

const categoryClass = (cat: string) => {
  switch (cat) {
    case 'Calentadores':            return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'Cisternas':               return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'Sistemas de tratamiento': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    default:                        return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <button
      type="button"
      onClick={() => onAddToCart(product)}
      className="group w-full text-left bg-white dark:bg-[#161b22] border border-windmar-blue-light/30 dark:border-white/10 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col
        hover:shadow-lg hover:scale-[1.02] hover:border-windmar-blue/40"
    >
      {/* Top bar: categoría + personas */}
      <div className="p-3 sm:p-4 pb-0 flex items-center justify-between gap-2">
        <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${categoryClass(product.category)}`}>
          {product.category}
        </span>
        {product.personas && (
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
            <Users className="w-3 h-3" />
            {product.personas}
          </span>
        )}
      </div>

      {/* Imagen */}
      <div className="h-28 sm:h-36 flex items-center justify-center p-3">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-bold text-lg">W</div>
        )}
      </div>

      {/* Footer: nombre + botón agregar */}
      <div className="p-3 sm:p-4 pt-1 flex items-center justify-between gap-2 border-t border-windmar-blue-light/20 dark:border-white/5">
        <h3 className="text-[13px] sm:text-[15px] font-bold text-slate-900 dark:text-[#e8eaed] leading-tight">
          {product.name}
        </h3>

        <span className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center bg-windmar-blue text-white shadow-md shadow-windmar-blue/25 transition-transform group-hover:scale-105">
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </span>
      </div>
    </button>
  );
};
