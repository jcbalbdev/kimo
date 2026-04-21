import { useFeedings } from '../../feedings/hooks/useFeedings';
import TimePickerInput from '../../../shared/components/TimePicker/TimePickerInput';
import FormSheet from '../../../shared/components/FormSheet/FormSheet';
import { useFormSheet } from '../../../shared/hooks/useFormSheet';
import { EditIcon } from '../../../shared/components/Icons';
import { currentTimeHHMM, formatTime12, formatDayLabel } from '../../../shared/utils/dates';
import './TabShared.css';
import './AlimentosTab.css';

const REACTIONS = [
  { value: 'ate_all',    label: 'Comió todo',  color: 'react-green'  },
  { value: 'ate_little', label: 'Comió poco',  color: 'react-yellow' },
  { value: 'didnt_eat',  label: 'No comió',    color: 'react-red'    },
  { value: 'vomited',    label: 'Vomitó',      color: 'react-purple' },
];

const EMPTY_FORM = { brand: '', amount: '', time: currentTimeHHMM(), reaction: 'ate_all' };

export default function AlimentosTab({ petId }) {
  const { feedings, groupedByDate, addFeeding, updateFeeding } = useFeedings(petId);

  const {
    isOpen: showForm, editId, saving, setSaving,
    form, setForm, openCreate: rawOpenCreate, openEdit: openFormEdit,
    close: closeForm, resetAndClose,
  } = useFormSheet(EMPTY_FORM);

  const openCreate = () => {
    rawOpenCreate();
    // Refresh the time to "now" on each open
    setForm(prev => ({ ...prev, time: currentTimeHHMM() }));
  };

  const openEdit = (f) => {
    const timeHHMM = (f.time || currentTimeHHMM()).substring(0, 5);
    openFormEdit(f.id, {
      brand:    f.brand || '',
      amount:   f.amount || '',
      time:     timeHHMM,
      reaction: f.reaction || 'ate_all',
    });
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

    resetAndClose();
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
                      <EditIcon size={13} />
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

      {/* Form sheet */}
      <FormSheet
        isOpen={showForm}
        onClose={closeForm}
        title={editId ? 'Editar comida' : 'Registrar comida'}
        onSave={handleSave}
        saving={saving}
      >
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
      </FormSheet>
    </div>
  );
}
