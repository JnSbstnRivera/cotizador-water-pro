import { useState } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { PaymentMode, CotizacionFormData, Idioma } from '../types';
import { isMadresAnnounceActive, isMadresSaleActive, MADRES_DISCOUNT_WATER } from '../lib/promoMadres';

// ─── tipos locales del formulario ───────────────────────────────────────────

interface ClienteForm {
  nombre: string;
  correo: string;
  telefono: string;
  direccion: string;
}

interface ConsultorForm {
  nombre: string;
  correo: string;
  telefono: string;
}

interface PDFModalProps {
  isOpen: boolean;
  isGenerating: boolean;
  onClose: () => void;
  onGenerate: (data: CotizacionFormData) => void;
  /** Modo de pago activo en la app (se preselecciona en el modal) */
  initialMode: PaymentMode;
  /** Plazo Synchrony activo en la app */
  initialSyncTerm: 18 | 61;
  /** Resumen auto: valores ya calculados de carrito/totales para mostrar */
  resumen: Record<string, string>;
  idioma: Idioma;
  onIdiomaChange: (i: Idioma) => void;
  // Descuentos / Promociones — controlados por el modal
  hasSolarBundle: boolean;
  onHasSolarBundleChange: (v: boolean) => void;
  /** Si el carrito tiene RO + otro producto (auto-aplicable) */
  hasROAndOther: boolean;
  promoMadres: boolean;
  onPromoMadresChange: (v: boolean) => void;
  /** Pronto pago — controlado desde el Cart, solo para mostrar en el resumen */
  downPayment: number;
  /** Período libre de IVU CC 26-08 — split Producto/Instalación sobre cisternas */
  ivuExemptCC2608: boolean;
  onIvuExemptCC2608Change: (v: boolean) => void;
  /** Si hay al menos una cisterna en el carrito (habilita el toggle CC 26-08) */
  hasCisternasInCart: boolean;
}

// ─── helper de campo ────────────────────────────────────────────────────────

function Field({
  label, value, onChange, type = 'text', colSpan = 1, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  colSpan?: 1 | 2;
  placeholder?: string;
}) {
  return (
    <div style={{ gridColumn: colSpan === 2 ? 'span 2' : 'span 1' }}>
      <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', border: '1px solid #d0d9ef', borderRadius: 8,
          padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

// ─── modal ──────────────────────────────────────────────────────────────────

const MODES: { key: PaymentMode; label: string }[] = [
  { key: 'cash',      label: '💵 Cash' },
  { key: 'oriental',  label: '🏛 Oriental' },
  { key: 'synchrony', label: '🏦 Synchrony' },
  { key: 'kiwi',      label: '🥝 Kiwi' },
];

const INSTALMENTS: (18 | 61)[] = [18, 61];

export function PDFModal({
  isOpen, isGenerating, onClose, onGenerate,
  initialMode, initialSyncTerm, resumen, idioma, onIdiomaChange,
  hasSolarBundle, onHasSolarBundleChange,
  hasROAndOther,
  promoMadres, onPromoMadresChange,
  downPayment,
  ivuExemptCC2608, onIvuExemptCC2608Change, hasCisternasInCart,
}: PDFModalProps) {

  const [cliente, setCliente] = useState<ClienteForm>({
    nombre: '', correo: '', telefono: '', direccion: '',
  });
  const [consultor, setConsultor] = useState<ConsultorForm>({
    nombre: '', correo: '', telefono: '',
  });
  const [selectedModes, setSelectedModes] = useState<PaymentMode[]>([initialMode]);
  const [installmentsSync, setInstallmentsSync] = useState<(18 | 61)[]>([initialSyncTerm]);
  const [promosOpen, setPromosOpen] = useState(true);
  const [madresCardOpen, setMadresCardOpen] = useState(true);
  const [error, setError] = useState('');

  const showSyncInstalments = selectedModes.includes('synchrony');
  const madresAnnounce = isMadresAnnounceActive();
  const madresApply    = isMadresSaleActive();

  const toggleMode = (m: PaymentMode) => {
    setSelectedModes(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  const toggleInst = (i: 18 | 61) => {
    setInstallmentsSync(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  };

  const handleGenerate = () => {
    if (!cliente.nombre.trim() || !consultor.nombre.trim()) {
      setError(idioma === 'en'
        ? 'Customer name and consultant name are required.'
        : 'Nombre del cliente y consultor son requeridos.');
      return;
    }
    if (selectedModes.length === 0) {
      setError(idioma === 'en'
        ? 'Select at least one payment mode.'
        : 'Selecciona al menos un modo de pago.');
      return;
    }
    if (selectedModes.includes('synchrony') && installmentsSync.length === 0) {
      setError(idioma === 'en'
        ? 'Select at least one Synchrony term.'
        : 'Selecciona al menos un plazo Synchrony.');
      return;
    }
    setError('');
    onGenerate({
      consultor: { nombre: consultor.nombre, correo: consultor.correo, telefono: consultor.telefono },
      cliente:   { nombre: cliente.nombre, correo: cliente.correo, telefono: cliente.telefono, direccion: cliente.direccion },
      selectedModes,
      installmentsSync: selectedModes.includes('synchrony') ? installmentsSync : [],
      installmentsKiwi: [],
      idioma,
      promoMadres: promoMadres && madresApply,
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: 16,
    }}>
      <div style={{
        background: 'white', borderRadius: 16, width: '100%', maxWidth: 640,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #e8eef7',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={22} color="#1a56c4" />
            <span style={{ fontSize: 17, fontWeight: 700, color: '#1a56c4' }}>
              {idioma === 'en' ? 'Water Quote' : 'Cotización Water'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', borderRadius: 20, overflow: 'hidden', border: '1.5px solid #1a56c4' }}>
              {(['es', 'en'] as const).map(lang => (
                <button key={lang} onClick={() => onIdiomaChange(lang)} style={{
                  padding: '4px 12px', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', border: 'none',
                  background: idioma === lang ? '#1a56c4' : 'white',
                  color:      idioma === lang ? 'white'   : '#1a56c4',
                  transition: 'all 0.15s',
                }}>
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
              <X size={22} color="#888" />
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* CLIENTE */}
          <section>
            <div style={{
              fontSize: 13, fontWeight: 700, color: '#1a56c4',
              borderBottom: '2px solid #F89B24', paddingBottom: 4, marginBottom: 12,
            }}>
              {idioma === 'en' ? 'Customer Information' : 'Datos del Cliente'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field
                label={idioma === 'en' ? 'Full name *' : 'Nombre completo *'}
                value={cliente.nombre}
                onChange={v => setCliente({ ...cliente, nombre: v })}
                colSpan={2}
              />
              <Field
                label={idioma === 'en' ? 'Address' : 'Dirección'}
                value={cliente.direccion}
                onChange={v => setCliente({ ...cliente, direccion: v })}
                colSpan={2}
              />
              <Field
                label={idioma === 'en' ? 'Phone' : 'Teléfono'}
                value={cliente.telefono}
                onChange={v => setCliente({ ...cliente, telefono: v })}
              />
              <Field
                label="Email"
                value={cliente.correo}
                onChange={v => setCliente({ ...cliente, correo: v })}
                type="email"
              />
            </div>
          </section>

          {/* CONSULTOR */}
          <section>
            <div style={{
              fontSize: 13, fontWeight: 700, color: '#1a56c4',
              borderBottom: '2px solid #F89B24', paddingBottom: 4, marginBottom: 12,
            }}>
              {idioma === 'en' ? 'Consultant Information' : 'Datos del Consultor'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field
                label={idioma === 'en' ? 'Consultant name *' : 'Nombre del Consultor *'}
                value={consultor.nombre}
                onChange={v => setConsultor({ ...consultor, nombre: v })}
                colSpan={2}
              />
              <Field
                label="Email"
                value={consultor.correo}
                onChange={v => setConsultor({ ...consultor, correo: v })}
                type="email"
              />
              <Field
                label={idioma === 'en' ? 'Phone' : 'Teléfono'}
                value={consultor.telefono}
                onChange={v => setConsultor({ ...consultor, telefono: v })}
              />
            </div>
          </section>

          {/* MODOS DE PAGO */}
          <section>
            <div style={{
              fontSize: 13, fontWeight: 700, color: '#1a56c4',
              borderBottom: '2px solid #F89B24', paddingBottom: 4, marginBottom: 12,
            }}>
              {idioma === 'en' ? 'Payment Modes (multi-select)' : 'Modos de Pago (selección múltiple)'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MODES.map(m => {
                const active = selectedModes.includes(m.key);
                return (
                  <button
                    key={m.key}
                    onClick={() => toggleMode(m.key)}
                    style={{
                      padding: '7px 14px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer',
                      border: `2px solid ${active ? '#1a56c4' : '#d0d9ef'}`,
                      background: active ? '#1a56c4' : 'white',
                      color: active ? 'white' : '#333',
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {showSyncInstalments && (
              <div style={{
                marginTop: 14,
                padding: 12,
                background: '#f5f3ff',
                border: '1.5px solid #7c3aed',
                borderRadius: 10,
              }}>
                <div style={{
                  fontSize: 12, color: '#5b21b6', marginBottom: 8, fontWeight: 800,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  🏦 {idioma === 'en' ? 'Synchrony — select term(s)' : 'Synchrony — selecciona plazo(s)'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {INSTALMENTS.map(i => {
                    const active = installmentsSync.includes(i);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleInst(i)}
                        style={{
                          flex: 1,
                          padding: '10px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                          border: `2px solid ${active ? '#7c3aed' : '#d0d9ef'}`,
                          background: active ? '#7c3aed' : 'white',
                          color: active ? 'white' : '#333',
                          fontWeight: active ? 700 : 500,
                        }}
                      >
                        {i} {idioma === 'en' ? 'months' : 'meses'}
                      </button>
                    );
                  })}
                </div>
                {installmentsSync.length === 0 && (
                  <p style={{ fontSize: 11, color: '#e74c3c', marginTop: 6, marginBottom: 0 }}>
                    {idioma === 'en' ? 'Pick at least one Synchrony term.' : 'Selecciona al menos un plazo Synchrony.'}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* PROMOCIONES DISPONIBLES — patrón loan/lease */}
          <section style={{ border: '1.5px solid #d0d9ef', borderRadius: 12, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setPromosOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', cursor: 'pointer',
                background: 'linear-gradient(90deg, #fff7fb 0%, #f3fbf6 100%)',
                border: 'none', borderBottom: promosOpen ? '1.5px solid #d0d9ef' : 'none',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1a56c4', display: 'flex', alignItems: 'center', gap: 8 }}>
                🎁 {idioma === 'en' ? 'Available promotions & discounts' : 'Promociones disponibles'}
              </span>
              <span style={{ fontSize: 11, color: '#777', display: 'flex', alignItems: 'center', gap: 4 }}>
                {hasSolarBundle && (
                  <span style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                    ☀ Solar
                  </span>
                )}
                {hasROAndOther && (
                  <span style={{ background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                    💧 RO
                  </span>
                )}
                {ivuExemptCC2608 && hasCisternasInCart && (
                  <span style={{ background: '#0ea5e9', color: 'white', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                    ⛈️ CC 26-08
                  </span>
                )}
                {promoMadres && madresApply && (
                  <span style={{ background: '#E84F97', color: 'white', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                    ❤ Madres
                  </span>
                )}
                {downPayment > 0 && (
                  <span style={{ background: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                    💰 ${downPayment}
                  </span>
                )}
                <span style={{ marginLeft: 4 }}>{promosOpen ? '▴' : '▾'}</span>
              </span>
            </button>

            {promosOpen && (
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Solar Bundle */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  background: hasSolarBundle ? '#ecfdf5' : 'white',
                  border: `2px solid ${hasSolarBundle ? '#10b981' : '#d0d9ef'}`,
                }}>
                  <input
                    type="checkbox"
                    checked={hasSolarBundle}
                    onChange={e => onHasSolarBundleChange(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: '#10b981' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: hasSolarBundle ? '#065f46' : '#1a56c4' }}>
                      ☀️💧 {idioma === 'en' ? 'Solar + Water Bundle' : 'Solar + Water Bundle'}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#666', marginTop: 2 }}>
                      {idioma === 'en'
                        ? 'Apply −$500 (Sign & Win / Referral program)'
                        : 'Aplica −$500 (Firma y Gana · Referidos)'}
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: hasSolarBundle ? '#10b981' : '#94a3b8' }}>−$500</span>
                </label>

                {/* Período libre de IVU CC 26-08 — solo cisternas */}
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  cursor: hasCisternasInCart ? 'pointer' : 'not-allowed',
                  opacity: hasCisternasInCart ? 1 : 0.55,
                  background: (ivuExemptCC2608 && hasCisternasInCart) ? '#e0f2fe' : 'white',
                  border: `2px solid ${(ivuExemptCC2608 && hasCisternasInCart) ? '#0ea5e9' : '#d0d9ef'}`,
                }}>
                  <input
                    type="checkbox"
                    checked={ivuExemptCC2608 && hasCisternasInCart}
                    disabled={!hasCisternasInCart}
                    onChange={e => onIvuExemptCC2608Change(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: '#0ea5e9', marginTop: 2 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 12.5, fontWeight: 800,
                      color: (ivuExemptCC2608 && hasCisternasInCart) ? '#075985' : '#1a56c4',
                    }}>
                      ⛈️ {idioma === 'en' ? 'IVU-free Period · CC 26-08' : 'Período Libre de IVU · CC 26-08'}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#666', marginTop: 2, lineHeight: 1.4 }}>
                      {idioma === 'en'
                        ? <>Hurricane-prep IVU exemption (May 22–25, 2026). 11.5% IVU applies <b>only</b> on the installation portion of cisterns.</>
                        : <>Exención de IVU por preparación de huracanes (22-25 mayo 2026). El 11.5% se aplica <b>solo</b> sobre la porción de instalación de las cisternas.</>}
                    </div>
                    {!hasCisternasInCart && (
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' }}>
                        {idioma === 'en'
                          ? 'Add a cistern to the cart to enable.'
                          : 'Agrega una cisterna al carrito para habilitar.'}
                      </div>
                    )}
                    {ivuExemptCC2608 && hasCisternasInCart && (
                      <div style={{
                        fontSize: 10, color: '#075985', marginTop: 6, padding: 6,
                        background: '#f0f9ff', borderRadius: 6, border: '1px dashed #7dd3fc',
                      }}>
                        ⚠️ {idioma === 'en' ? 'Operational requirements:' : 'Requisitos operativos:'}<br/>
                        • {idioma === 'en' ? 'Process the sale via VASS' : 'Gestionar la venta a través de VASS'}<br/>
                        • {idioma === 'en' ? '100% down payment when signing' : 'Pronto del 100% al firmar el Acuerdo'}<br/>
                        • {idioma === 'en' ? 'Complete documentation within May 22–25' : 'Documentación completa dentro del 22-25 de mayo'}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 800,
                    color: (ivuExemptCC2608 && hasCisternasInCart) ? '#0ea5e9' : '#94a3b8',
                    textAlign: 'right',
                  }}>
                    {idioma === 'en' ? 'IVU split' : 'IVU split'}
                  </span>
                </label>

                {/* RO Bundle — informativo (auto) */}
                {hasROAndOther && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: '#eff6ff', border: '2px solid #3b82f6',
                  }}>
                    <span style={{ fontSize: 18 }}>💧</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1e40af' }}>
                        {idioma === 'en' ? 'RO Bundle (auto-applied)' : 'Combo RO (auto-aplicado)'}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#666', marginTop: 2 }}>
                        {idioma === 'en'
                          ? 'Carrying RO + another product → $1,000 off on RO.'
                          : 'Llevas RO + otro producto → $1,000 de descuento en RO.'}
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#3b82f6' }}>−$1,000</span>
                  </div>
                )}

                {/* Madres — solo en vigencia */}
                {madresAnnounce && (
                  <div style={{
                    border: `2px solid ${promoMadres && madresApply ? '#E84F97' : '#F8B8D4'}`,
                    borderRadius: 10, overflow: 'hidden',
                    background: 'linear-gradient(135deg, #FFEAF3 0%, #FFF5FA 100%)',
                  }}>
                    <button type="button" onClick={() => setMadresCardOpen(o => !o)}
                      style={{
                        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer',
                        fontSize: 12.5, fontWeight: 800, color: '#BE2E71',
                      }}>
                      <span>❤️ {idioma === 'en' ? "Mother's Day 2026 — Water" : 'Mes de las Madres 2026 — Water'} ❤️</span>
                      <span>{madresCardOpen ? '▴' : '▾'}</span>
                    </button>
                    {madresCardOpen && (
                      <div style={{ padding: '0 12px 12px' }}>
                        <p style={{ fontSize: 11, color: '#8E2658', marginBottom: 10, lineHeight: 1.4 }}>
                          {idioma === 'en'
                            ? <>Valid <b>May 7–14, 2026</b> · <b>$500</b> off any product · in-showroom only.</>
                            : <>Vigente <b>7 al 14 de mayo 2026</b> · <b>$500</b> en cualquier producto · solo showroom.</>}
                        </p>
                        {!madresApply ? (
                          <p style={{ fontSize: 11, color: '#999', fontStyle: 'italic', padding: '8px 0', margin: 0 }}>
                            {idioma === 'en'
                              ? 'Activation window opens May 7, 2026.'
                              : 'La ventana de aplicación abre el 7 de mayo de 2026.'}
                          </p>
                        ) : (
                          <label style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                            background: promoMadres ? '#E84F97' : 'white',
                            border: `2px solid ${promoMadres ? '#E84F97' : '#F8B8D4'}`,
                          }}>
                            <input
                              type="checkbox"
                              checked={promoMadres}
                              onChange={e => onPromoMadresChange(e.target.checked)}
                              style={{ width: 18, height: 18, accentColor: '#E84F97' }}
                            />
                            <span style={{ fontSize: 12, fontWeight: 700, color: promoMadres ? 'white' : '#BE2E71' }}>
                              {idioma === 'en'
                                ? <>Apply <u>−${MADRES_DISCOUNT_WATER.toFixed(2)}</u> Mother's Day discount</>
                                : <>Aplicar descuento Madres <u>−${MADRES_DISCOUNT_WATER.toFixed(2)}</u></>}
                            </span>
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </section>

          {/* RESUMEN */}
          {Object.keys(resumen).length > 0 && (
            <section>
              <div style={{
                fontSize: 13, fontWeight: 700, color: '#1a56c4',
                borderBottom: '2px solid #F89B24', paddingBottom: 4, marginBottom: 12,
              }}>
                {idioma === 'en' ? 'Quote Summary' : 'Resumen de Cotización'}
              </div>
              <div style={{ background: '#ebf3ff', borderRadius: 10, padding: '12px 16px' }}>
                {Object.entries(resumen).map(([k, v], i) => (
                  <div key={k} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '5px 0',
                    borderTop: i > 0 ? '1px solid #c5d4ef' : 'none',
                  }}>
                    <span style={{ fontSize: 12, color: '#555' }}>{k}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0d2050' }}>{v}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {error && (
            <p style={{ fontSize: 12, color: '#e74c3c', background: '#fde8e8', padding: '8px 12px', borderRadius: 8 }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          padding: '16px 24px', borderTop: '1px solid #e8eef7',
        }}>
          <button
            onClick={onClose}
            disabled={isGenerating}
            style={{
              padding: '9px 20px', borderRadius: 8, border: '1px solid #d0d9ef',
              background: 'white', color: '#555', fontSize: 13, cursor: 'pointer',
            }}
          >
            {idioma === 'en' ? 'Cancel' : 'Cancelar'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              padding: '9px 20px', borderRadius: 8, border: 'none',
              background: isGenerating ? '#93b3e8' : '#1a56c4',
              color: 'white', fontSize: 13, fontWeight: 700,
              cursor: isGenerating ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <Download size={16} />
            {isGenerating
              ? (idioma === 'en' ? 'Generating PDF...' : 'Generando PDF...')
              : (idioma === 'en' ? 'Download PDF' : 'Descargar PDF')}
          </button>
        </div>
      </div>
    </div>
  );
}
