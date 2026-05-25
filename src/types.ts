export type Category = 'Calentadores' | 'Cisternas' | 'Sistemas de tratamiento';

// cash y oriental = mismos precios (cash)
// synchrony y kiwi = mismos precios (synchrony/cuotas)
export type PaymentMode = 'cash' | 'synchrony' | 'oriental' | 'kiwi';

export interface Product {
  id: string;
  category: Category;
  name: string;
  personas: string | null;
  description: string;
  imageUrl: string;
  prices: {
    cash: number | null;
    synchrony: number | null;
    m18: number | null;
    m61: number | null;
  };
  synchronySinIvu?: number;
  ivu?: number;
  cashSinIvu?: number;
  ivuCash?: number;
  /**
   * Porcentaje de instalación/servicio sobre el precio sin IVU.
   * Solo aplica a productos elegibles (cisternas) para el Período Libre de IVU CC 26-08.
   * Eco 150 = 0.20 · Eco 500 = 0.15 · Hércules 600 = 0.15.
   * Cuando se activa el toggle CC 26-08: Producto = base × (1 - installPercent) queda exento,
   * Instalación = base × installPercent mantiene 11.5% IVU.
   */
  installPercent?: number;
  /** Multiplicador visual para normalizar tamaño de imagen en el grid. Default = 1 */
  imageScale?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  installments?: 18 | 61;
}

// ─────────────────────────────────────────────────────────────────────────────
// Add-Ons & Upgrades — servicios adicionales (Listado Add-On Windmar Water)
// Los precios NO incluyen IVU; el front suma 11.5% automatico al subtotal.
// ─────────────────────────────────────────────────────────────────────────────
export type AddOnCategory =
  | 'Punto de Entrada'
  | 'Punto de Uso'
  | 'Cisternas y Bombas'
  | 'Calentadores Solares';

export interface AddOn {
  id: string;
  category: AddOnCategory;
  name: string;
  /** Precio SIN IVU (tal como aparece en la lista oficial). */
  priceSinIvu: number;
  /** Notas / descripcion del add-on para el asesor. */
  notes: string;
}

export interface ConsultorInfo {
  nombre: string;
  correo: string;
  telefono: string;
}

export interface ClienteInfo {
  nombre: string;
  correo: string;
  telefono: string;
  direccion: string;
}

export type Idioma = 'es' | 'en';

export interface CotizacionFormData {
  consultor: ConsultorInfo;
  cliente: ClienteInfo;
  selectedModes: PaymentMode[];
  installmentsSync: (18 | 61)[];
  installmentsKiwi: (18 | 61)[];
  idioma: Idioma;
  promoMadres: boolean;
}
