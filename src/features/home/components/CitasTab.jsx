import { useAppointments } from '../../appointments/hooks/useAppointments';
import FormSheet from '../../../shared/components/FormSheet/FormSheet';
import { useFormSheet } from '../../../shared/hooks/useFormSheet';
import { EditIcon } from '../../../shared/components/Icons';
import DatePicker from '../../../shared/components/DatePicker/DatePicker';
import { today, formatDateLong } from '../../../shared/utils/dates';
import { CalendarDays } from 'lucide-react';
import TabEmptyState from '../../../shared/components/TabEmptyState/TabEmptyState';
import TabAddButton from '../../../shared/components/TabAddButton/TabAddButton';
import './TabShared.css';
import './VacunasTab.css';

export default function CitasTab({ petId }) {
  const { upcoming, past, addAppointment, updateAppointment } = useAppointments(petId);

  const defaultForm = { title: '', date: today(), vet_name: '', notes: '' };
  const {
    isOpen: showForm, editId, saving, setSaving,
    form, setForm, openCreate, openEdit: openFormEdit,
    close: closeForm, resetAndClose,
  } = useFormSheet(defaultForm);

  const openEdit = (a) => {
    openFormEdit(a.id, {
      title: a.title || '', date: a.date || today(),
      vet_name: a.vet_name || '', notes: a.notes || '',
    });
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

    resetAndClose();
  };

  const allAppointments = [...upcoming, ...past];
  const hasNoAppointments = allAppointments.length === 0;

  return (
    <div className="tab-root">
      {hasNoAppointments ? (
        <TabEmptyState
          icon={<CalendarDays size={32} strokeWidth={1.5} />}
          title="Sin citas aún."
          subtitle="Registra la primera cita médica de tu mascota usando el botón de abajo."
        />
      ) : (
        <>
          {allAppointments.map((a) => (
            <div key={a.id} className="tab-card cita-card">
              <div className="tab-card-body">
                <div className="cita-card-top">
                  <span className="tab-card-title">{a.title}</span>
                  <button className="tab-card-edit-btn" onClick={() => openEdit(a)} title="Editar">
                    <EditIcon />
                  </button>
                </div>
                <span className="tab-card-sub">{formatDateLong(a.date)}</span>
                {a.vet_name && <span className="cita-vet-pill">{a.vet_name}</span>}
                {a.notes && <span className="tab-card-sub cita-notes">{a.notes}</span>}
              </div>
            </div>
          ))}
        </>
      )}

      <TabAddButton label="+ Registrar cita" onClick={openCreate} />

      <FormSheet
        isOpen={showForm}
        onClose={closeForm}
        title={editId ? 'Editar cita' : 'Registrar cita'}
        onSave={handleSave}
        saving={saving}
        saveDisabled={!form.title.trim()}
      >
        <label className="tab-sheet-label">Motivo *</label>
        <input className="tab-sheet-input" placeholder="Ej: Vacuna, revisión, desparasitación"
          value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />

        <label className="tab-sheet-label">Fecha</label>
        <DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} />

        <label className="tab-sheet-label" style={{ marginTop: '14px' }}>Veterinario</label>
        <input className="tab-sheet-input" placeholder="Ej: Dr. González"
          value={form.vet_name} onChange={(e) => setForm({ ...form, vet_name: e.target.value })} />

        <label className="tab-sheet-label">Notas</label>
        <textarea className="tab-sheet-textarea" placeholder="Notas adicionales…"
          value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
      </FormSheet>
    </div>
  );
}
