/**
 * Promo Día del Padre 2026 — Water
 *
 * Reglas (campaña Día del Padre):
 *   - Vigencia: 18 al 25 de junio de 2026 (anuncio y aplicación en la misma ventana)
 *   - Descuento Water: $500 sobre los productos del carrito
 *   - NO se combinan los $1,000 del Combo RO con los $500 (se aplica solo el mayor)
 *   - Solo ventas en showroom (Roosevelt, Mayagüez, Ponce, Hatillo)
 */

export const MADRES_DISCOUNT_WATER = 500;

const ANNOUNCE_START = new Date('2026-06-18T00:00:00');
const SALE_START     = new Date('2026-06-18T00:00:00');
const SALE_END       = new Date('2026-06-25T23:59:59');

/** ¿Hay que mostrar el banner promo en la app? (1 al 14 de mayo) */
export function isMadresAnnounceActive(now: Date = new Date()): boolean {
  return now >= ANNOUNCE_START && now <= SALE_END;
}

/** ¿Se puede APLICAR el descuento? (7 al 14 de mayo) */
export function isMadresSaleActive(now: Date = new Date()): boolean {
  return now >= SALE_START && now <= SALE_END;
}
