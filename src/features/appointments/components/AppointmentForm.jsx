import { useState } from 'react';
import Input from '../../../shared/components/Input/Input';
import Button from '../../../shared/components/Button/Button';
import './AppointmentForm.css';

export default function AppointmentForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    vet_name: '',
    vet_location: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    notes: '',
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    onSubmit({
      ...form,
      title: form.title.trim(),
      time: form.time || null,
      vet_name: form.vet_name.trim() || null,
      vet_location: form.vet_location.trim() || null,
      notes: form.notes.trim() || null,
    });
  };

  return (
    <form className="appt-form" onSubmit={handleSubmit}>
      <div className="appt-form-fields">
        <Input
          label="Motivo de la cita"
          placeholder="Ej: Vacuna, Control, Desparasitación..."
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          autoFocus
        />
        <Input
          label="Veterinario"
          placeholder="Nombre del veterinario"
          value={form.vet_name}
          onChange={(e) => handleChange('vet_name', e.target.value)}
          hint="Opcional"
        />
        <Input
          label="Ubicación"
          placeholder="Dirección del consultorio"
          value={form.vet_location}
          onChange={(e) => handleChange('vet_location', e.target.value)}
          hint="Opcional"
        />
        <div className="appt-form-row">
          <Input
            label="Fecha"
            type="date"
            value={form.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
          <Input
            label="Hora"
            type="time"
            value={form.time}
            onChange={(e) => handleChange('time', e.target.value)}
            hint="Opcional"
          />
        </div>
        <Input
          label="Notas"
          placeholder="Algo que quieras recordar..."
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          textarea
          hint="Opcional"
        />
      </div>
      <div className="appt-form-actions">
        <Button type="submit" disabled={!form.title.trim() || !form.date}>
          Agendar cita
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        )}
      </div>
    </form>
  );
}
