/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProductCard } from './components/ProductCard';
import { Cart } from './components/Cart';
import { PDFModal } from './components/PDFModal';
import { Product, PaymentMode, CartItem, Category, CotizacionFormData, Idioma } from './types';
import { PRODUCTS, MODE_LABELS } from './constants';
import { downloadCotizacionPDF } from './hooks/usePDFCotizacion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });


export default function App() {
  const [mode, setMode] = useState<PaymentMode>('cash');
  const [syncTerm, setSyncTerm] = useState<18 | 61>(18);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all');
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [toast, setToast] = useState<{ msg: string; isError?: boolean } | null>(null);
  const [hasBonus, setHasBonus] = useState(false);
  const [downPayment, setDownPayment] = useState(0);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [idiomaPDF, setIdiomaPDF] = useState<Idioma>('es');
  const [promoMadres, setPromoMadres] = useState(false);
  // Período libre de IVU (Carta Circular 26-08) — split Producto/Instalación en cisternas
  const [ivuExemptCC2608, setIvuExemptCC2608] = useState(false);
  // Firma y Gana — cashback de $500 al cliente por referir (selector independiente)
  const [firmaYGana, setFirmaYGana] = useState(false);
  // Add-Ons & Upgrades — mapa addOnId -> qty (no presente o 0 = no seleccionado)
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>({});

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('wh-theme') === 'dark';
    } catch { return false; }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      try { localStorage.setItem('wh-theme', 'dark'); } catch { /* ignore */ }
    } else {
      root.classList.remove('dark');
      try { localStorage.setItem('wh-theme', 'light'); } catch { /* ignore */ }
    }
  }, [isDarkMode]);

  useEffect(() => {
    const timer = setTimeout(() => setIsSplashVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleDrop = (e: Event) => {
      const ce = e as CustomEvent<{ productId: string }>;
      const productId = ce.detail?.productId;
      if (!productId) return;
      const product = PRODUCTS.find(p => p.id === productId);
      if (product) {
        handleAddToCart(product);
      }
    };
    window.addEventListener('productDropped', handleDrop);
    return () => window.removeEventListener('productDropped', handleDrop);
  }, [mode]); // Re-bind if mode changes to ensure handleAddToCart uses correct mode

  const showToast = (msg: string, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 2200);
  };

  const filteredProducts = useMemo(
    () => PRODUCTS.filter(p => filterCat === 'all' || p.category === filterCat),
    [filterCat],
  );

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`${product.name} agregado ✓`);
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item =>
      item.product.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
    showToast('Producto eliminado');
  };

  const handleClearCart = () => {
    setCart([]);
    showToast('Cotización vaciada');
  };


  const hasRO = cart.some(item => item.product.id === 'trat-ro');
  const hasOtherForPDF = cart.some(item => item.product.id !== 'trat-ro');
  const hasROAndOther = hasRO && hasOtherForPDF;
  const hasCisternasInCart = cart.some(item => item.product.installPercent !== undefined);
  // El toggle CC 26-08 solo tiene efecto si hay cisternas; auto-apaga si se vacía el carrito
  const ivuExemptActive = ivuExemptCC2608 && hasCisternasInCart;

  const handlePDFGenerate = async (formData: CotizacionFormData) => {
    setIsGeneratingPDF(true);
    try {
      await downloadCotizacionPDF(cart, formData, hasBonus, hasROAndOther, downPayment, ivuExemptActive, firmaYGana, addOnQuantities);
      setShowPDFModal(false);
      showToast('PDF descargado correctamente ✓');
    } catch (err) {
      console.error(err);
      showToast('Error al generar el PDF', true);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const cartSubtotalCash = cart.reduce(
    (s, c) => s + (c.product.prices.cash ?? 0) * c.quantity, 0,
  );

  // Ahorro estimado IVU CC 26-08 sobre las cisternas (en modo cash)
  const ivuExemptSavings = ivuExemptActive
    ? cart.reduce((s, c) => {
        const ip = c.product.installPercent;
        const base = c.product.cashSinIvu;
        if (ip === undefined || base === undefined) return s;
        // Ahorro = IVU regular - IVU CC 26-08 = base × 11.5% - base × installPercent × 11.5%
        const ahorro = base * (1 - ip) * 0.115 * c.quantity;
        return s + ahorro;
      }, 0)
    : 0;

  const resumenParaModal: Record<string, string> = {
    [idiomaPDF === 'en' ? 'Items in cart' : 'Productos en carrito']:
      String(cart.reduce((s, c) => s + c.quantity, 0)),
    [idiomaPDF === 'en' ? 'Subtotal (cash)' : 'Subtotal (cash)']: fmt.format(cartSubtotalCash),
    [idiomaPDF === 'en' ? 'Active mode' : 'Modo activo']: MODE_LABELS[mode] || mode,
    ...(hasBonus
      ? { [idiomaPDF === 'en' ? 'Solar Bundle' : 'Solar Bundle']: '−$500.00' }
      : {}),
    ...(firmaYGana
      ? { [idiomaPDF === 'en' ? 'Sign & Win (cashback)' : 'Firma y Gana (cashback)']: '−$500.00' }
      : {}),
    ...(hasROAndOther
      ? { [idiomaPDF === 'en' ? 'RO Bundle' : 'Combo RO']: '−$1,000.00' }
      : {}),
    ...(ivuExemptActive && ivuExemptSavings > 0
      ? { [idiomaPDF === 'en' ? 'IVU exempt' : 'IVU exento']: `−${fmt.format(ivuExemptSavings)}` }
      : {}),
    ...(downPayment > 0
      ? { [idiomaPDF === 'en' ? 'Down Payment' : 'Pronto']: `−${fmt.format(downPayment)}` }
      : {}),
  };

  return (
    <div className="min-h-screen bg-[#F0F4FA] dark:bg-[#0f1215] text-slate-900 dark:text-[#e8eaed] font-sans selection:bg-blue-100 selection:text-blue-900">
      <PDFModal
        isOpen={showPDFModal}
        isGenerating={isGeneratingPDF}
        onClose={() => setShowPDFModal(false)}
        onGenerate={handlePDFGenerate}
        initialMode={mode}
        initialSyncTerm={syncTerm}
        resumen={resumenParaModal}
        idioma={idiomaPDF}
        onIdiomaChange={setIdiomaPDF}
        hasSolarBundle={hasBonus}
        onHasSolarBundleChange={setHasBonus}
        hasROAndOther={hasROAndOther}
        promoMadres={promoMadres}
        onPromoMadresChange={setPromoMadres}
        downPayment={downPayment}
        ivuExemptCC2608={ivuExemptCC2608}
        onIvuExemptCC2608Change={setIvuExemptCC2608}
        hasCisternasInCart={hasCisternasInCart}
        firmaYGana={firmaYGana}
        onFirmaYGanaChange={setFirmaYGana}
      />
      <AnimatePresence>
        {isSplashVisible && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Water Wave Background - More Layers */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
              <motion.div 
                animate={{ 
                  y: [0, -30, 0],
                  rotate: [0, 3, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[-10%] left-[-10%] right-[-10%] h-[70vh] bg-blue-500/30 blur-3xl rounded-[100%]"
              />
              <motion.div 
                animate={{ 
                  y: [0, -40, 0],
                  rotate: [0, -4, 0],
                  scale: [1, 1.15, 1]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[-15%] left-[-20%] right-[-20%] h-[60vh] bg-cyan-400/25 blur-3xl rounded-[100%]"
              />
              <motion.div 
                animate={{ 
                  y: [0, -25, 0],
                  x: [-10, 10, -10]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-[10%] left-[-5%] w-[40vw] h-[40vw] bg-blue-300/10 blur-3xl rounded-full"
              />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative"
              >
                <motion.img 
                  animate={{ 
                    y: [0, -15, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-80 h-80 object-contain drop-shadow-2xl" 
                  src="/windmar-water.png"
                  alt="WindMar Logo" 
                  referrerPolicy="no-referrer" 
                />
              </motion.div>

              <div className="text-center">
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm font-black text-blue-600 uppercase tracking-[0.4em] mb-2"
                >
                  Cargando Cotizador
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent uppercase tracking-widest"
                >
                  Water Pro
                </motion.div>
                
                {/* Loading Bar Container */}
                <div className="mt-8 w-64 mx-auto">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3, ease: "easeInOut" }}
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                {[0, 1, 2].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ 
                      scale: [1, 1.4, 1],
                      opacity: [0.3, 1, 0.3] 
                    }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"
                  />
                ))}
              </div>
            </div>

            {/* Multiple Animated SVG Waves for Depth */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] transform rotate-180">
              <svg className="relative block w-[calc(100%+1.3px)] h-[180px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <motion.path 
                  animate={{ 
                    d: [
                      "M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z",
                      "M321.39,56.44c58,10.79,114.16,30.13,172,41.86,82.39,16.72,168.19,17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z",
                      "M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                    ]
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                  className="fill-blue-600/15"
                ></motion.path>
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] transform rotate-180 opacity-50">
              <svg className="relative block w-[calc(120%+1.3px)] h-[120px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <motion.path 
                  animate={{ 
                    d: [
                      "M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z",
                      "M321.39,56.44c58,10.79,114.16,30.13,172,41.86,82.39,16.72,168.19,17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z",
                      "M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                    ]
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                  className="fill-blue-400/10"
                ></motion.path>
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen p-3 sm:p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
            <main className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {(['all', 'Calentadores', 'Cisternas', 'Sistemas de tratamiento'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCat(cat)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                      filterCat === cat
                        ? 'bg-windmar-blue text-white border-windmar-blue shadow-md shadow-windmar-blue/25'
                        : 'bg-white dark:bg-[#161b22] border-windmar-blue-light/40 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-windmar-blue/40 hover:text-windmar-blue'
                    }`}
                  >
                    {cat === 'all' ? 'Todos' : cat === 'Calentadores' ? '🌡 Calentadores' : cat === 'Cisternas' ? '🏺 Cisternas' : '🔬 Tratamiento'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            </main>

            <aside className="lg:sticky lg:top-4">
              <Cart
                items={cart}
                mode={mode}
                setMode={setMode}
                syncTerm={syncTerm}
                setSyncTerm={setSyncTerm}
                downPayment={downPayment}
                setDownPayment={setDownPayment}
                onUpdateQty={handleUpdateQty}
                onRemoveItem={handleRemoveItem}
                onClear={handleClearCart}
                onPDF={() => setShowPDFModal(true)}
                addOnQuantities={addOnQuantities}
                onAddOnQtyChange={setAddOnQuantities}
              />
            </aside>
          </div>

          <Footer />
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 30, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 30, x: "-50%" }}
            className="fixed bottom-7 left-1/2 z-[500] bg-slate-800 text-white px-5 py-2.5 rounded-full text-[13px] font-semibold flex items-center gap-2 shadow-2xl"
          >
            {toast.isError ? <AlertCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
