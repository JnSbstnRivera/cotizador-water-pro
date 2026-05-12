/**
 * Promo Mes de las Madres 2026 — Water
 *
 * Reglas extraídas del comunicado oficial (José Alicea, 04/30/2026):
 *   - Anuncia desde: 1 de mayo de 2026
 *   - Vender solo del: 7 al 14 de mayo de 2026
 *   - Descuento Water: $500 sobre cualquier producto del carrito
 *   - Solo ventas en showroom (Roosevelt, Mayagüez, Ponce, Hatillo)
 */

export const MADRES_DISCOUNT_WATER = 500;

const ANNOUNCE_START = new Date('2026-05-01T00:00:00');
const SALE_START     = new Date('2026-05-07T00:00:00');
const SALE_END       = new Date('2026-05-14T23:59:59');

/** ¿Hay que mostrar el banner promo en la app? (1 al 14 de mayo) */
export function isMadresAnnounceActive(now: Date = new Date()): boolean {
  return now >= ANNOUNCE_START && now <= SALE_END;
}

/** ¿Se puede APLICAR el descuento? (7 al 14 de mayo) */
export function isMadresSaleActive(now: Date = new Date()): boolean {
  return now >= SALE_START && now <= SALE_END;
}
