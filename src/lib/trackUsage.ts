/**
 * Telemetría de uso — registra cada generación de PDF en Supabase (app_usage).
 * "Dispara y olvida": si la red o Supabase fallan, NO afecta la generación del PDF.
 */
const SUPABASE_URL = 'https://asatofjxirvqiikybssc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_t75-cI69nNlrwEvk2ED2cQ_eDK-f8aS';

export interface UsageEvent {
  app: string;
  consultor?: string;
  agente_telefonico?: string;
  cliente_nombre?: string;
  correo_cliente?: string;
  telefono_cliente?: string;
  monto_cotizado?: number;
  idioma?: string;
  detalle?: Record<string, unknown>;
}

export function trackUsage(ev: UsageEvent): void {
  try {
    fetch(`${SUPABASE_URL}/rest/v1/app_usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        ...ev,
        evento: 'pdf_generado',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* nunca rompe el flujo de generación del PDF */
  }
}
