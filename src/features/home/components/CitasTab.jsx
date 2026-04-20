import { useState } from 'react';
import { useAppointments } from '../../appointments/hooks/useAppointments';
import { useScrollLock } from '../../../shared/hooks/useScrollLock';
import './TabShared.css';
import './VacunasTab.css'; /* re-use DateButton, tab-date-btn styles */

const todayStr = () => new Date().toISOString().split('T')[0];

function formatDateES(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function DateButton({ value, onChange }) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="tab-date-btn-wrap">
      <button type="button" className="tab-date-btn" onClick={() => setPicking(!picking)}>
        <span>{formatDateES(value)}</span>
        <span className="tab-date-edit">✎</span>
      </button>
      {picking && (
        <input className="tab-sheet-input" type="date" value={value}
          onChange={(e) => { onChange(e.target.value); setPicking(false); }}
          style={{ marginTop: '6px' }} />
      )}
    </div>
  );
}

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

export default function CitasTab({ petId }) {
  const { upcoming, past, addAppointment, updateAppointment } = useAppointments(petId);

  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({ title: '', date: todayStr(), vet_name: '', notes: '' });
  useScrollLock(showForm);

  const resetForm = () => setForm({ title: '', date: todayStr(), vet_name: '', notes: '' });

  const openCreate = () => { resetForm(); setEditId(null); setShowForm(true); };

  const openEdit = (a) => {
    setForm({ title: a.title || '', date: a.date || todayStr(), vet_name: a.vet_name || '', notes: a.notes || '' });
    setEditId(a.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      title:    form.title.trim(),
      date:     form.date,
      vet_name: form.vet_name.trim() || null,
      notes:    form.notes.trim() || null,
    };

    if (editId) {
      await updateAppointment(editId, payload);
    } else {
      await addAppointment({ ...payload, status: 'scheduled' });
    }

    setShowForm(false);
    setEditId(null);
    resetForm();
    setSaving(false);
  };

  const allAppointments = [...upcoming, ...past];

  return (
    <div className="tab-root">
      <button className="tab-add-card" onClick={openCreate}>
        <span className="tab-add-icon">+</span>
        <span className="tab-add-text">Registrar cita</span>
      </button>

      {allAppointments.map((a) => (
        <div key={a.id} className="tab-card cita-card">
          <div className="tab-card-body">
            <div className="cita-card-top">
              <span className="tab-card-title">{a.title}</span>
              <button className="tab-card-edit-btn" onClick={() => openEdit(a)} title="Editar">
                <EditIcon />
              </button>
            </div>
            <span className="tab-card-sub">{formatDateES(a.date)}</span>
            {a.vet_name && <span className="cita-vet-pill">{a.vet_name}</span>}
            {a.notes && <span className="tab-card-sub cita-notes">{a.notes}</span>}
          </div>
        </div>
      ))}

      {showForm && (
        <div className="tab-sheet-overlay" onClick={() => setShowForm(false)}>
          <div className="tab-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="tab-sheet-handle" />
            <h3 className="tab-sheet-title">{editId ? 'Editar cita' : 'Registrar cita'}</h3>

            <label className="tab-sheet-label">Motivo *</label>
            <input className="tab-sheet-input" placeholder="Ej: Vacuna, revisión, desparasitación"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />

            <label className="tab-sheet-label">Fecha</label>
            <DateButton value={form.date} onChange={(v) => setForm({ ...form, date: v })} />

            <label className="tab-sheet-label" style={{ marginTop: '14px' }}>Veterinario</label>
            <input className="tab-sheet-input" placeholder="Ej: Dr. González"
              value={form.vet_name} onChange={(e) => setForm({ ...form, vet_name: e.target.value })} />

            <label className="tab-sheet-label">Notas</label>
            <textarea className="tab-sheet-textarea" placeholder="Notas adicionales…"
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />

            <div className="tab-sheet-actions">
              <button className="tab-sheet-cancel" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="tab-sheet-save" onClick={handleSave}
                disabled={saving || !form.title.trim()}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
