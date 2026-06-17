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
import { trackUsage } from './lib/trackUsage';
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
      trackUsage({
        app: 'water',
        consultor: formData.consultor.nombre,
        agente_telefonico: formData.consultor.agenteTelefonico,
        cliente_nombre: formData.cliente.nombre,
        correo_cliente: formData.cliente.correo,
        telefono_cliente: formData.cliente.telefono,
        monto_cotizado: cartSubtotalCash,
        idioma: formData.idioma,
        detalle: {
          items: cart.length,
          unidades: cart.reduce((s, c) => s + c.quantity, 0),
          productos: cart.map(c => c.product.id),
          promoPadre: formData.promoMadres,
          comboRO: hasROAndOther,
        },
      });
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

            {/* Olas de agua fluyendo abajo — 2 capas (azul oscuro detras, azul claro al frente) */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none" style={{ height: 240 }}>
              {/* Capa de atras: azul mas oscuro, mas lenta */}
              <motion.svg
                viewBox="0 0 2400 120"
                preserveAspectRatio="none"
                className="absolute bottom-0 left-0 h-[220px]"
                style={{ width: '200%' }}
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              >
                <path
                  d="M0,60 C200,20 400,100 600,60 C800,20 1000,100 1200,60 C1400,20 1600,100 1800,60 C2000,20 2200,100 2400,60 L2400,120 L0,120 Z"
                  fill="#1D429B"
                  opacity="0.55"
                />
              </motion.svg>
              {/* Capa al frente: azul claro, mas rapida */}
              <motion.svg
                viewBox="0 0 2400 120"
                preserveAspectRatio="none"
                className="absolute bottom-0 left-0 h-[170px]"
                style={{ width: '200%' }}
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 11, repeat: Infinity, ease: 'linear' }}
              >
                <path
                  d="M0,80 C200,40 400,110 600,70 C800,30 1000,100 1200,70 C1400,40 1600,110 1800,70 C2000,30 2200,100 2400,70 L2400,120 L0,120 Z"
                  fill="#A6C3E6"
                  opacity="0.7"
                />
              </motion.svg>
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
