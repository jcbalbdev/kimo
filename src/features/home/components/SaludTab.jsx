import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import FormSheet from '../../../shared/components/FormSheet/FormSheet';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import { useScrollLock } from '../../../shared/hooks/useScrollLock';
import { formatDateDMY } from '../../../shared/utils/dates';
import './SaludTab.css';

const TYPE_LABEL  = { allergy: 'Alergia',    chronic: 'Enfermedad' };
const TYPE_CLASS  = { allergy: 'salud-type-allergy', chronic: 'salud-type-chronic' };
const STATUS_LABEL = { active: 'Activa', resolved: 'Resuelta' };
const STATUS_CLASS = { active: 'salud-status-active', resolved: 'salud-status-resolved' };

const EMPTY_FORM = {
  record_type: 'allergy',
  name: '',
  status: 'active',
  start_date: '',
  end_date: '',
  notes: '',
};

export default function SaludTab({ petId }) {
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showSheet, setShowSheet]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData]     = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const fetchConditions = useCallback(async () => {
    if (!petId) return;
    setLoading(true);
    const { data } = await supabase
      .from('pet_medical_conditions')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false });
    setConditions(data || []);
    setLoading(false);
  }, [petId]);

  useScrollLock(showSheet);

  useEffect(() => { fetchConditions(); }, [fetchConditions]);

  const openSheet = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        record_type: item.record_type,
        name:        item.name,
        status:      item.status,
        start_date:  item.start_date || '',
        end_date:    item.end_date || '',
        notes:       item.notes || '',
      });
    } else {
      setEditingId(null);
      setFormData(EMPTY_FORM);
    }
    setShowSheet(true);
  };

  const closeSheet = () => {
    setShowSheet(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      // If user manually sets to 'active', clear the end_date
      if (name === 'status' && value === 'active') {
        next.end_date = '';
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    
    const payload = {
      pet_id:      petId,
      record_type: formData.record_type,
      name:        formData.name.trim(),
      status:      formData.status,
      start_date:  formData.start_date  || null,
      end_date:    formData.status === 'active' ? null : (formData.end_date || null),
      notes:       formData.notes.trim() || null,
    };

    let error;
    if (editingId) {
      const res = await supabase.from('pet_medical_conditions').update(payload).eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase.from('pet_medical_conditions').insert([payload]);
      error = res.error;
    }

    if (!error) { await fetchConditions(); closeSheet(); }
    setSaving(false);
  };

  const confirmDelete = (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const { error } = await supabase.from('pet_medical_conditions').delete().eq('id', deletingId);
    if (!error) {
      setConditions(prev => prev.filter(c => c.id !== deletingId));
    }
    setDeletingId(null);
  };

  return (
    <div className="salud-root">

      {/* ── List ── */}
      {loading ? (
        <div className="salud-empty">Cargando…</div>
      ) : conditions.length === 0 ? (
        <div className="salud-empty">
          <div className="salud-empty-icon" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <p>Sin registros médicos aún.</p>
          <span>Agrega alergias o enfermedades crónicas usando el botón de abajo.</span>
        </div>
      ) : (
        <div className="salud-list">
          {conditions.map(item => (
            <div key={item.id} className="salud-card" onClick={() => openSheet(item)}>
              <div className="salud-card-top">
                <div className="salud-card-header">
                  {/* Type + Status badges */}
                  <div className="salud-card-badges">
                    <span className={`salud-badge ${TYPE_CLASS[item.record_type]}`}>
                      {TYPE_LABEL[item.record_type]}
                    </span>
                    <span className={`salud-badge ${STATUS_CLASS[item.status]}`}>
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>
                  <h4 className="salud-card-title">{item.name}</h4>
                </div>
                <button
                  className="salud-card-del-btn"
                  onClick={(e) => confirmDelete(e, item.id)}
                  aria-label="Eliminar"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>

              {(item.start_date || item.end_date) && (
                <p className="salud-card-dates">
                  {item.start_date ? `Desde ${formatDateDMY(item.start_date)}` : ''}
                  {item.start_date && item.end_date ? ' · ' : ''}
                  {item.end_date ? `Hasta ${formatDateDMY(item.end_date)}` : ''}
                  {!item.end_date && item.status === 'active' ? ' · Actual' : ''}
                </p>
              )}

              {item.notes && (
                <p className="salud-card-notes">{item.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Single add button ── */}
      <button className="salud-add-btn" onClick={() => openSheet(null)} id="salud-add-btn">
        + Agregar alergia o enfermedad
      </button>

      {/* ══════════ Form Sheet ══════════ */}
      <FormSheet
        isOpen={showSheet}
        onClose={closeSheet}
        title={editingId ? 'Editar registro' : 'Nuevo registro'}
        onSave={handleSave}
        saving={saving}
        saveDisabled={!formData.name.trim()}
      >
        <div className="salud-form">

          {/* Tipo */}
          <label className="salud-label">Tipo</label>
          <div className="salud-seg-control">
            <button type="button"
              className={`salud-seg-btn ${formData.record_type === 'allergy' ? 'active' : ''}`}
              onClick={() => setFormData(p => ({ ...p, record_type: 'allergy' }))}>
              Alergia
            </button>
            <button type="button"
              className={`salud-seg-btn ${formData.record_type === 'chronic' ? 'active' : ''}`}
              onClick={() => setFormData(p => ({ ...p, record_type: 'chronic' }))}>
              Enfermedad
            </button>
          </div>

          {/* Nombre */}
          <label className="salud-label">Nombre</label>
          <input
            className="salud-input"
            type="text"
            name="name"
            autoFocus
            placeholder={
              formData.record_type === 'allergy'
                ? 'Ej. Pollo, Picadura de pulga, Polen…'
                : 'Ej. Diabetes, Hipotiroidismo…'
            }
            value={formData.name}
            onChange={handleChange}
            maxLength={80}
          />

          {/* Estado */}
          <label className="salud-label">Estado</label>
          <div className="salud-seg-control">
            <button type="button"
              className={`salud-seg-btn ${formData.status === 'active' ? 'active' : ''}`}
              onClick={() => setFormData(p => ({ ...p, status: 'active' }))}>
              Activa
            </button>
            <button type="button"
              className={`salud-seg-btn ${formData.status === 'resolved' ? 'active' : ''}`}
              onClick={() => setFormData(p => ({ ...p, status: 'resolved' }))}>
              Resuelta / Curada
            </button>
          </div>

          {/* Fechas */}
          <div className={`salud-form-row ${formData.status === 'active' ? 'salud-form-row-single' : ''}`}>
            <div>
              <label className="salud-label">Fecha inicio (opcional)</label>
              <input className="salud-input" type="date"
                name="start_date" value={formData.start_date} onChange={handleChange} />
            </div>
            {formData.status === 'resolved' && (
              <div>
                <label className="salud-label">Fecha fin (opcional)</label>
                <input className="salud-input" type="date"
                  name="end_date" value={formData.end_date} onChange={handleChange} />
              </div>
            )}
          </div>

          {/* Notas */}
          <label className="salud-label">Notas adicionales (opcional)</label>
          <textarea className="salud-textarea" name="notes"
            placeholder="Ej. Tratamiento actual, síntomas a vigilar…"
            value={formData.notes} onChange={handleChange} rows={3} />

        </div>
      </FormSheet>

      {/* ══════════ Delete Confirm Dialog ══════════ */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="¿Eliminar registro?"
        message="Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />

    </div>
  );
}
