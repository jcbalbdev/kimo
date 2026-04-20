import { useState } from 'react';
import { useFeedings } from '../../feedings/hooks/useFeedings';
import TimePickerInput from '../../../shared/components/TimePicker/TimePickerInput';
import { useScrollLock } from '../../../shared/hooks/useScrollLock';
import './TabShared.css';
import './AlimentosTab.css';

const REACTIONS = [
  { value: 'ate_all',    label: 'Comió todo',  color: 'react-green'  },
  { value: 'ate_little', label: 'Comió poco',  color: 'react-yellow' },
  { value: 'didnt_eat',  label: 'No comió',    color: 'react-red'    },
  { value: 'vomited',    label: 'Vomitó',      color: 'react-purple' },
];

function getNowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function formatTime12(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`;
}

function formatDayLabel(dateStr) {
  const todayStr  = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
  if (dateStr === todayStr)  return 'Hoy';
  if (dateStr === yesterday) return 'Ayer';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const EMPTY_FORM = { brand: '', amount: '', time: getNowHHMM(), reaction: 'ate_all' };

export default function AlimentosTab({ petId }) {
  const { feedings, groupedByDate, addFeeding, updateFeeding } = useFeedings(petId);

  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  useScrollLock(showForm);

  const openCreate = () => { setForm({ ...EMPTY_FORM, time: getNowHHMM() }); setEditId(null); setShowForm(true); };

  const openEdit = (f) => {
    const timeHHMM = (f.time || getNowHHMM()).substring(0, 5);
    setForm({
      brand:    f.brand || '',
      amount:   f.amount || '',
      time:     timeHHMM,
      reaction: f.reaction || 'ate_all',
    });
    setEditId(f.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      brand:    form.brand.trim() || null,
      amount:   form.amount.trim() || null,
      reaction: form.reaction,
      time:     form.time + ':00',
    };

    if (editId) {
      await updateFeeding(editId, payload);
    } else {
      await addFeeding(payload);
    }

    setShowForm(false);
    setEditId(null);
    setSaving(false);
  };

  // Sort dates descending (newest first)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="tab-root">
      <button className="tab-add-card" onClick={openCreate}>
        <span className="tab-add-icon">+</span>
        <span className="tab-add-text">Registrar comida</span>
      </button>

      {/* Feedings grouped by day */}
      {sortedDates.map((date) => {
        const dayItems = groupedByDate[date]; // already newest-time-first from DB
        return (
          <div key={date}>
            {/* Day separator */}
            <div className="tab-day-header">
              <div className="tab-day-line" />
              <span className="tab-day-label">{formatDayLabel(date)}</span>
              <div className="tab-day-line" />
            </div>

            {dayItems.map((f) => {
              const r = REACTIONS.find((r) => r.value === f.reaction) || REACTIONS[1];
              return (
                <div key={f.id} className="tab-card alim-card">
                  <div className="tab-card-row">
                    <div className="tab-card-info">
                      <span className="tab-card-title">{f.brand || 'Comida'}</span>
                      {f.amount && <span className="tab-card-sub">{f.amount}</span>}
                    </div>
                    <div className="alim-card-right">
                      <span className={`alim-reaction-badge ${r.color}`}>{r.label}</span>
                      {f.time && <span className="tab-card-time">{formatTime12(f.time)}</span>}
                    </div>
                    <button className="alim-edit-btn" onClick={() => openEdit(f)}>
                      <EditIcon />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {feedings.length === 0 && (
        <p className="tab-empty-hint">Aún no hay registros de comida</p>
      )}

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
              <h3 className="tab-sheet-title">{editId ? 'Editar comida' : 'Registrar comida'}</h3>
            </div>

            <label className="tab-sheet-label">Marca / Alimento</label>
            <input className="tab-sheet-input" placeholder="Ej: Royal Canin, pollo a la plancha"
              value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} autoFocus />

            <label className="tab-sheet-label">Cantidad</label>
            <input className="tab-sheet-input" placeholder="Ej: 100g, 1 taza"
              value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />

            <label className="tab-sheet-label">Hora</label>
            <TimePickerInput value={form.time} onChange={(val) => setForm({ ...form, time: val })} />

            <label className="tab-sheet-label" style={{ marginTop: '14px' }}>¿Cómo reaccionó?</label>
            <div className="alim-reaction-pills">
              {REACTIONS.map((r) => (
                <button key={r.value} type="button"
                  className={`alim-pill ${r.color} ${form.reaction === r.value ? 'alim-pill-active' : ''}`}
                  onClick={() => setForm({ ...form, reaction: r.value })}>
                  {r.label}
                </button>
              ))}
            </div>

            <div className="tab-sheet-actions">
              <button className="tab-sheet-cancel" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="tab-sheet-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
