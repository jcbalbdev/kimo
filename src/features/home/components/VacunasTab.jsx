import { useState } from 'react';
import {
  useVaccines,
  generateVacSlots,
  formatVacInterval,
} from '../../vaccines/hooks/useVaccines';
import { useScrollLock } from '../../../shared/hooks/useScrollLock';
import './TabShared.css';
import './VacunasTab.css';

// ── Icons ─────────────────────────────────────────────────

const SyringeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/>
    <path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/>
  </svg>
);

const CheckCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="url(#vcGrad)"/>
    <path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="vcGrad" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#A8E6CF"/><stop offset="1" stopColor="#89CFF0"/>
      </linearGradient>
    </defs>
  </svg>
);

const EmptyCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#d1d1d6" strokeWidth="2"/>
  </svg>
);

// ── Helpers ───────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];

function formatDateES(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatSlotLabel(dateStr, isFirst) {
  const d = new Date(dateStr + 'T12:00:00');
  const label = d.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
  if (isFirst) return `${label} (primera dosis)`;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomStr = tomorrow.toISOString().split('T')[0];
  if (dateStr === today) return `Hoy — ${label}`;
  if (dateStr === tomStr) return `Mañana — ${label}`;
  return label;
}

const VAC_INTERVALS = [
  { label: '21 días', value: 21 },
  { label: '30 días', value: 30 },
  { label: '60 días', value: 60 },
  { label: '90 días', value: 90 },
  { label: '6 meses', value: 180 },
  { label: '1 año',   value: 365 },
];

function DateButton({ value, onChange }) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="tab-date-btn-wrap">
      <button type="button" className="tab-date-btn" onClick={() => setPicking(!picking)}>
        <span>{formatDateES(value)}</span>
        <span className="tab-date-edit">✎</span>
      </button>
      {picking && (
        <input
          className="tab-sheet-input"
          type="date"
          value={value}
          onChange={(e) => { onChange(e.target.value); setPicking(false); }}
          style={{ marginTop: '6px' }}
        />
      )}
    </div>
  );
}

// ── VaccineCard component ─────────────────────────────────

function VaccineCard({ vaccine, checks, onCheckDose, onEnd, onEdit }) {
  const [open, setOpen]             = useState(false);
  const [confirming, setConfirming] = useState(false);

  const slots    = generateVacSlots(vaccine);
  const isEnded  = !!vaccine.ended_at;
  const todayStr = today;

  const isDoseChecked = (dateStr, isFirst) => {
    if (isFirst) return true;
    return checks.some((c) => c.vaccine_id === vaccine.id && c.scheduled_date === dateStr);
  };

  const isOverdue = (dateStr, isFirst) =>
    !isFirst && dateStr < todayStr && !isDoseChecked(dateStr, false);

  const checkedCount = slots.filter((s) => isDoseChecked(s.dateStr, s.isFirst)).length;
  // First dose doesn't count as "progress" — show completed vs non-first slots
  const nonFirstSlots = slots.filter((s) => !s.isFirst);
  const doneNonFirst  = nonFirstSlots.filter((s) => isDoseChecked(s.dateStr, false)).length;

  return (
    <div className={`vacc-card ${isEnded ? 'vacc-card-ended' : ''}`}>
      {/* ── Header ── */}
      <div className="vacc-header-row">
        <button className="vacc-header" onClick={() => setOpen(!open)}
          style={{ flex: 1, paddingRight: 0 }}>
          <div className="vacc-icon-wrap">
            <SyringeIcon />
          </div>
          <div className="vacc-meta">
            <span className="vacc-name">{vaccine.name}</span>
            <span className="vacc-sub">
              Aplicada: {formatDateES(vaccine.date)}
              {vaccine.interval_days && <> · {formatVacInterval(vaccine.interval_days)}</>}
              {isEnded && ' · Finalizado'}
            </span>
            {nonFirstSlots.length > 0 && (
              <span className="vacc-progress">
                {doneNonFirst}/{nonFirstSlots.length} refuerzos registrados
              </span>
            )}
          </div>
          <span className={`vacc-chevron ${open ? 'vacc-open' : ''}`}>›</span>
        </button>
        <button className="vacc-edit-btn" onClick={() => onEdit(vaccine)} title="Editar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>

      {/* ── Body ── */}
      {open && (
        <div className="vacc-body">
          {slots.length === 0 && (
            <p className="vacc-empty">Sin dosis generadas.</p>
          )}
          <div className="vacc-slots">
            {slots.map((slot, i) => {
              const checked  = isDoseChecked(slot.dateStr, slot.isFirst);
              const overdue  = isOverdue(slot.dateStr, slot.isFirst);
              const isFuture = !slot.isFirst && slot.dateStr > todayStr;

              return (
                <button
                  key={i}
                  className={`vacc-slot ${checked ? 'vacc-slot-done' : ''} ${overdue ? 'vacc-slot-overdue' : ''} ${slot.isFirst ? 'vacc-slot-first' : ''}`}
                  onClick={() => !slot.isFirst && !isFuture && !checked && onCheckDose(vaccine.id, slot.dateStr)}
                  disabled={slot.isFirst || (isFuture && !checked)}
                >
                  <span className="vacc-slot-icon">
                    {checked ? <CheckCircle /> : <EmptyCircle />}
                  </span>
                  <span className="vacc-slot-label">{formatSlotLabel(slot.dateStr, slot.isFirst)}</span>
                  {isFuture && !checked && <span className="vacc-future-badge">Próxima</span>}
                  {overdue && (
                    <span className="vacc-overdue-badge">Vencida</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Overdue notice */}
          {slots.some((s) => isOverdue(s.dateStr, s.isFirst)) && (
            <div className="vacc-overdue-notice">
              Fecha vencida — registra la nueva dosis cuando se la apliques
            </div>
          )}

          {/* Finalize (only for repeating vaccines) */}
          {!isEnded && vaccine.repeats && !confirming && (
            <button className="vacc-end-btn" onClick={() => setConfirming(true)}>
              Finalizar esquema de vacunación
            </button>
          )}

          {confirming && (
            <div className="vacc-confirm">
              <p className="vacc-confirm-text">¿Finalizar el esquema de <strong>{vaccine.name}</strong>?</p>
              <div className="vacc-confirm-row">
                <button className="vacc-confirm-no" onClick={() => setConfirming(false)}>Cancelar</button>
                <button className="vacc-confirm-yes" onClick={() => { setConfirming(false); onEnd(vaccine.id); }}>Sí, finalizar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main VacunasTab ───────────────────────────────────────

export default function VacunasTab({ petId }) {
  const { vaccines, checks, addVaccine, updateVaccine, checkDose, endVaccine, pendingVaccines } =
    useVaccines(petId);

  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({
    name:         '',
    date:         today,
    hasNextDose:  false,
    repeats:      false,
    interval_days: 365,
    intervalCustom: null,
    isCustom:     false,
    notes:        '',
  });
  useScrollLock(showForm);

  const resetForm = () =>
    setForm({ name: '', date: today, hasNextDose: false, repeats: false, interval_days: 365, intervalCustom: null, isCustom: false, notes: '' });

  const openCreate = () => { resetForm(); setEditId(null); setShowForm(true); };

  const openEdit = (vac) => {
    const isCustom = !VAC_INTERVALS.some((p) => p.value === vac.interval_days);
    setForm({
      name:          vac.name || '',
      date:          vac.date || today,
      hasNextDose:   !!vac.interval_days,
      repeats:       vac.repeats || false,
      interval_days: vac.interval_days || 365,
      intervalCustom: isCustom ? String(vac.interval_days) : null,
      isCustom,
      notes:         vac.notes || '',
    });
    setEditId(vac.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    const interval = form.hasNextDose
      ? (form.isCustom ? Number(form.intervalCustom) : form.interval_days)
      : null;

    const payload = {
      name:          form.name.trim(),
      date:          form.date,
      interval_days: interval || null,
      repeats:       form.hasNextDose ? form.repeats : false,
      notes:         form.notes.trim() || null,
    };

    if (editId) {
      await updateVaccine(editId, payload);
    } else {
      await addVaccine(payload);
    }

    resetForm();
    setShowForm(false);
    setEditId(null);
    setSaving(false);
  };

  return (
    <div className="tab-root">
      {/* Overdue alert */}
      {pendingVaccines.length > 0 && (
        <div className="tab-alert-card">
          <span className="tab-alert-icon">⚠️</span>
          <div className="tab-alert-info">
            <span className="tab-alert-title">
              {pendingVaccines.length} vacuna{pendingVaccines.length > 1 ? 's' : ''} con dosis vencida{pendingVaccines.length > 1 ? 's' : ''}
            </span>
            <span className="tab-alert-sub">{pendingVaccines.map((v) => v.name).join(', ')}</span>
          </div>
        </div>
      )}

      {/* Add button */}
      <button className="tab-add-card" onClick={() => { resetForm(); setShowForm(true); }}>
        <span className="tab-add-icon">+</span>
        <span className="tab-add-text">Registrar vacuna</span>
      </button>

      {/* Vaccine accordion cards */}
      {vaccines.map((v) => (
        <VaccineCard
          key={v.id}
          vaccine={v}
          checks={checks}
          onCheckDose={checkDose}
          onEnd={endVaccine}
          onEdit={openEdit}
        />
      ))}

      {/* Bottom sheet */}
      {showForm && (
        <div className="tab-sheet-overlay" onClick={() => setShowForm(false)}>
          <div className="tab-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="tab-sheet-header-row">
              <button className="tab-sheet-back" onClick={() => setShowForm(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <h3 className="tab-sheet-title">{editId ? 'Editar vacuna' : 'Registrar vacuna'}</h3>
            </div>

            <label className="tab-sheet-label">Nombre de la vacuna *</label>
            <input
              className="tab-sheet-input"
              placeholder="Ej: Rabia, Triple felina, Parvovirus"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />

            <label className="tab-sheet-label">Fecha de aplicación</label>
            <DateButton
              value={form.date}
              onChange={(v) => setForm({ ...form, date: v })}
            />

            {/* Next dose section */}
            <div className="vacc-section-header" style={{ marginTop: '16px' }}>
              <span className="tab-sheet-label" style={{ margin: 0 }}>Próxima dosis</span>
              <div className="vacc-toggle-row">
                <button
                  type="button"
                  className={`vacc-toggle-btn ${!form.hasNextDose ? 'vacc-toggle-active' : ''}`}
                  onClick={() => setForm({ ...form, hasNextDose: false })}
                >
                  No programar
                </button>
                <button
                  type="button"
                  className={`vacc-toggle-btn ${form.hasNextDose ? 'vacc-toggle-active' : ''}`}
                  onClick={() => setForm({ ...form, hasNextDose: true })}
                >
                  Programar
                </button>
              </div>
            </div>

            {form.hasNextDose && (
              <>
                <label className="tab-sheet-label">¿Dentro de cuántos días?</label>
                <div className="medf-freq-pills">
                  {VAC_INTERVALS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      className={`medf-pill ${!form.isCustom && form.interval_days === p.value ? 'medf-pill-active' : ''}`}
                      onClick={() => setForm({ ...form, interval_days: p.value, isCustom: false })}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`medf-pill ${form.isCustom ? 'medf-pill-active' : ''}`}
                    onClick={() => setForm({ ...form, isCustom: true })}
                  >
                    Personalizado
                  </button>
                </div>

                {form.isCustom && (
                  <div className="medf-custom-row">
                    <span className="medf-custom-prefix">Cada</span>
                    <input
                      className="tab-sheet-input medf-custom-num"
                      type="number"
                      min="1"
                      placeholder="N"
                      value={form.intervalCustom || ''}
                      onChange={(e) => setForm({ ...form, intervalCustom: e.target.value })}
                    />
                    <span className="medf-custom-prefix">días</span>
                  </div>
                )}

                <label className="tab-sheet-label">¿Se repite?</label>
                <div className="vacc-seg-pair">
                  <button
                    type="button"
                    className={`vacc-seg-btn ${!form.repeats ? 'vacc-seg-active' : ''}`}
                    onClick={() => setForm({ ...form, repeats: false })}
                  >
                    No (una sola dosis)
                  </button>
                  <button
                    type="button"
                    className={`vacc-seg-btn ${form.repeats ? 'vacc-seg-active' : ''}`}
                    onClick={() => setForm({ ...form, repeats: true })}
                  >
                    Sí (se repite)
                  </button>
                </div>
              </>
            )}

            <label className="tab-sheet-label" style={{ marginTop: '14px' }}>Notas (opcional)</label>
            <textarea
              className="tab-sheet-textarea"
              placeholder="Ej: Lote, veterinario, reacciones…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />

            <div className="tab-sheet-actions">
              <button className="tab-sheet-cancel" onClick={() => setShowForm(false)}>Cancelar</button>
              <button
                className="tab-sheet-save"
                onClick={handleSave}
                disabled={saving || !form.name.trim() || (form.hasNextDose && form.isCustom && !form.intervalCustom)}
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
