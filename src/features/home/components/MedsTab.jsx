import { useState } from 'react';
import {
  useMedications,
  generateDoseSlots,
  isSlotChecked,
  formatFrequency,
} from '../../medications/hooks/useMedications';
import TimePickerInput from '../../../shared/components/TimePicker/TimePickerInput';
import { useScrollLock } from '../../../shared/hooks/useScrollLock';
import './TabShared.css';
import './MedsTab.css';

// ── Constants ────────────────────────────────────────────────

const FREQ_PRESETS = [
  { label: '4h',    value: 4   },
  { label: '6h',    value: 6   },
  { label: '8h',    value: 8   },
  { label: '12h',   value: 12  },
  { label: '1 día', value: 24  },
  { label: '2 días',value: 48  },
  { label: '3 días',value: 72  },
  { label: '1 sem.', value: 168 },
];

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function getNowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function formatDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function hoursToFormState(hours) {
  const preset = FREQ_PRESETS.find((p) => p.value === Number(hours));
  if (preset) return { interval_hours: Number(hours), isCustom: false, customValue: '', customUnit: 'horas' };
  // custom hours > 24 → show as days
  if (Number(hours) % 24 === 0)
    return { interval_hours: Number(hours), isCustom: true, customValue: String(Number(hours) / 24), customUnit: 'días' };
  return { interval_hours: Number(hours), isCustom: true, customValue: String(hours), customUnit: 'horas' };
}

// ── Edit icon ────────────────────────────────────────────────

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

// ── MedCard ──────────────────────────────────────────────────

function MedCard({ med, checks, onCheckSlot, onEnd, onEdit }) {
  const [open, setOpen]             = useState(false);
  const [confirming, setConfirming] = useState(false);

  const slots     = generateDoseSlots(med).reverse(); // newest first
  const checkedCount = slots.filter((s) => isSlotChecked(s, checks, med.id)).length;
  const isEnded   = !!med.ended_at;
  const now       = new Date();

  return (
    <div className={`medc-card ${isEnded ? 'medc-card-ended' : ''}`}>
      {/* ── Header ── */}
      <div className="medc-header-row">
        <button className="medc-header" onClick={() => setOpen(!open)}>
          <div className="medc-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></div>
          <div className="medc-meta">
            <span className="medc-name">{med.name}</span>
            <span className="medc-sub">
              {med.dose && <>{med.dose} · </>}
              {formatFrequency(med.interval_hours)}
              {isEnded && ' · Finalizado'}
            </span>
            {(med.start_date || med.end_date) && (
              <span className="medc-dates">
                {med.start_date && <>Inicio: {formatDate(med.start_date)}</>}
                {med.end_date   && <> · Fin: {formatDate(med.end_date)}</>}
              </span>
            )}
            {slots.length > 0 && (
              <span className="medc-progress">{checkedCount}/{slots.length} dosis registradas</span>
            )}
          </div>
          <span className={`medc-chevron ${open ? 'medc-open' : ''}`}>›</span>
        </button>
        {/* Edit button */}
        <button className="medc-edit-btn" onClick={(e) => { e.stopPropagation(); onEdit(med); }} title="Editar">
          <EditIcon />
        </button>
      </div>

      {/* ── Body ── */}
      {open && (
        <div className="medc-body">
          {slots.length === 0 && (
            <p className="medc-empty">Sin dosis generadas.</p>
          )}

          <div className="medc-slots">
            {slots.map((slot, i) => {
              const checked  = isSlotChecked(slot, checks, med.id);
              const isFuture = slot > now;
              const isOverdue = !checked && slot < now;

              return (
                <button
                  key={i}
                  className={`medc-slot ${checked ? 'medc-slot-done' : ''} ${isFuture ? 'medc-slot-future' : ''}`}
                  onClick={() => !isFuture && onCheckSlot(med.id, slot)}
                  disabled={isFuture}
                >
                  <span className="medc-slot-circle">
                    {checked
                      ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="url(#mg)"/><path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#A8E6CF"/><stop offset="1" stopColor="#89CFF0"/></linearGradient></defs></svg>
                      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#d1d1d6" strokeWidth="2"/></svg>
                    }
                  </span>
                  <span className="medc-slot-label">
                    {slot.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {', '}
                    {slot.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                  {isFuture && <span className="medc-future-badge">Próxima</span>}
                </button>
              );
            })}
          </div>

          {!isEnded && !confirming && (
            <button className="medc-end-btn" onClick={() => setConfirming(true)}>
              Finalizar tratamiento
            </button>
          )}

          {confirming && (
            <div className="medc-confirm">
              <p className="medc-confirm-text">¿Finalizar el tratamiento de <strong>{med.name}</strong>?</p>
              <div className="medc-confirm-row">
                <button className="medc-confirm-no" onClick={() => setConfirming(false)}>Cancelar</button>
                <button className="medc-confirm-yes" onClick={() => { setConfirming(false); onEnd(med.id); }}>Sí, finalizar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main MedsTab ─────────────────────────────────────────────

export default function MedsTab({ petId }) {
  const {
    activeMedications, endedMedications, checks,
    addMedication, updateMedication, checkSlot, endMedication,
  } = useMedications(petId);

  const [showForm, setShowForm]   = useState(false);
  const [editId,   setEditId]     = useState(null);   // null = create mode
  const [saving,   setSaving]     = useState(false);
  useScrollLock(showForm);
  const [form, setForm] = useState({
    name: '', dose: '', start_time: getNowHHMM(),
    start_date: getTodayISO(), end_date: '', hasEndDate: false,
    interval_hours: 24, isCustom: false, customValue: '', customUnit: 'horas',
  });

  const resetForm = () =>
    setForm({ name: '', dose: '', start_time: getNowHHMM(), start_date: getTodayISO(), end_date: '', hasEndDate: false, interval_hours: 24, isCustom: false, customValue: '', customUnit: 'horas' });

  const openCreate = () => { resetForm(); setEditId(null); setShowForm(true); };

  const openEdit = (med) => {
    const freqState = hoursToFormState(med.interval_hours || 24);
    const hasEnd = !!med.end_date;
    setForm({
      name:       med.name || '',
      dose:       med.dose || '',
      start_time: (med.start_time || '08:00:00').substring(0, 5),
      start_date: med.start_date || getTodayISO(),
      end_date:   med.end_date || '',
      hasEndDate: hasEnd,
      ...freqState,
    });
    setEditId(med.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    const hours = form.isCustom
      ? Number(form.customValue) * (form.customUnit === 'días' ? 24 : 1)
      : form.interval_hours;

    const payload = {
      name:           form.name.trim(),
      dose:           form.dose.trim() || null,
      start_time:     form.start_time + ':00',
      interval_hours: hours || 24,
      start_date:     form.start_date || getTodayISO(),
      end_date:       form.hasEndDate && form.end_date ? form.end_date : null,
    };

    if (editId) {
      await updateMedication(editId, payload);
    } else {
      await addMedication(payload);
    }

    setShowForm(false);
    setEditId(null);
    resetForm();
    setSaving(false);
  };

  const MedForm = (
    <div className="tab-sheet-overlay" onClick={() => setShowForm(false)}>
      <div className="tab-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="tab-sheet-handle" />
        <h3 className="tab-sheet-title">{editId ? 'Editar medicamento' : 'Nuevo medicamento'}</h3>

        <label className="tab-sheet-label">Nombre *</label>
        <input className="tab-sheet-input" placeholder="Ej: Amoxicilina" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />

        <label className="tab-sheet-label">Dosis</label>
        <input className="tab-sheet-input" placeholder="Ej: 250mg, 1 pastilla, 5ml" value={form.dose}
          onChange={(e) => setForm({ ...form, dose: e.target.value })} />

        <label className="tab-sheet-label">Hora de inicio</label>
        <TimePickerInput value={form.start_time} onChange={(val) => setForm({ ...form, start_time: val })} />

        <label className="tab-sheet-label">Fecha de inicio *</label>
        <input className="tab-sheet-input" type="date" value={form.start_date}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })} />

        <div className="medf-enddate-row">
          <label className="medf-enddate-toggle">
            <input type="checkbox" checked={form.hasEndDate}
              onChange={(e) => setForm({ ...form, hasEndDate: e.target.checked, end_date: '' })} />
            <span>Tiene fecha de fin del tratamiento</span>
          </label>
        </div>

        {form.hasEndDate && (
          <>
            <label className="tab-sheet-label">Fecha de fin</label>
            <input className="tab-sheet-input" type="date" value={form.end_date}
              min={form.start_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </>
        )}

        <label className="tab-sheet-label">Frecuencia</label>
        <div className="medf-freq-pills">
          {FREQ_PRESETS.map((p) => (
            <button key={p.value} type="button"
              className={`medf-pill ${!form.isCustom && form.interval_hours === p.value ? 'medf-pill-active' : ''}`}
              onClick={() => setForm({ ...form, interval_hours: p.value, isCustom: false })}>
              {p.label}
            </button>
          ))}
          <button type="button"
            className={`medf-pill ${form.isCustom ? 'medf-pill-active' : ''}`}
            onClick={() => setForm({ ...form, isCustom: true })}>
            Otra
          </button>
        </div>

        {form.isCustom && (
          <div className="medf-custom-row">
            <span className="medf-custom-prefix">Cada</span>
            <input className="tab-sheet-input medf-custom-num" type="number" min="1" placeholder="N"
              value={form.customValue}
              onChange={(e) => setForm({ ...form, customValue: e.target.value })} />
            <button type="button"
              className={`medf-pill ${form.customUnit === 'horas' ? 'medf-pill-active' : ''}`}
              onClick={() => setForm({ ...form, customUnit: 'horas' })}>horas</button>
            <button type="button"
              className={`medf-pill ${form.customUnit === 'días' ? 'medf-pill-active' : ''}`}
              onClick={() => setForm({ ...form, customUnit: 'días' })}>días</button>
          </div>
        )}

        <div className="tab-sheet-actions">
          <button className="tab-sheet-cancel" onClick={() => setShowForm(false)}>Cancelar</button>
          <button className="tab-sheet-save" onClick={handleSave}
            disabled={saving || !form.name.trim() || (form.isCustom && !form.customValue)}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="tab-root">
      <button className="tab-add-card" onClick={openCreate}>
        <span className="tab-add-icon">+</span>
        <span className="tab-add-text">Agregar medicamento</span>
      </button>

      {activeMedications.map((med) => (
        <MedCard key={med.id} med={med} checks={checks}
          onCheckSlot={checkSlot} onEnd={endMedication} onEdit={openEdit} />
      ))}

      {endedMedications.length > 0 && (
        <details className="medc-ended-section">
          <summary className="medc-ended-summary">
            Tratamientos finalizados ({endedMedications.length})
          </summary>
          {endedMedications.map((med) => (
            <MedCard key={med.id} med={med} checks={checks}
              onCheckSlot={checkSlot} onEnd={endMedication} onEdit={openEdit} />
          ))}
        </details>
      )}

      {showForm && MedForm}
    </div>
  );
}
