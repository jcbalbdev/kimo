import { useState } from 'react';
import Input from '../../../shared/components/Input/Input';
import Button from '../../../shared/components/Button/Button';
import { FREQUENCIES } from '../../pets/constants/species';
import './MedicationForm.css';

export default function MedicationForm({ onSubmit, onCancel, initialData = null }) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    dose: initialData?.dose || '',
    frequency: initialData?.frequency || 'daily',
    custom_frequency: initialData?.custom_frequency || '',
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(form);
  };

  const isValid = form.name.trim().length > 0;

  return (
    <form className="med-form" onSubmit={handleSubmit}>
      <div className="med-form-fields">
        <Input
          label="Nombre del medicamento"
          placeholder="Ej: Apoquel, Desparasitante..."
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          autoFocus
        />

        <Input
          label="Dosis"
          placeholder="Ej: 16mg, 1 pastilla, 2ml..."
          value={form.dose}
          onChange={(e) => handleChange('dose', e.target.value)}
          hint="Opcional"
        />

        <div className="med-form-frequency">
          <span className="input-label">Frecuencia</span>
          <div className="frequency-options">
            {FREQUENCIES.map((freq) => (
              <button
                key={freq.id}
                type="button"
                className={`frequency-pill ${form.frequency === freq.id ? 'frequency-pill-active' : ''}`}
                onClick={() => handleChange('frequency', freq.id)}
              >
                {freq.name}
              </button>
            ))}
          </div>
        </div>

        {form.frequency === 'custom' && (
          <div className="animate-fade-in-up">
            <Input
              label="Frecuencia personalizada"
              placeholder="Ej: Cada 3 días, Lunes y Viernes..."
              value={form.custom_frequency}
              onChange={(e) => handleChange('custom_frequency', e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="med-form-actions">
        <Button type="submit" disabled={!isValid}>
          {initialData ? 'Guardar cambios' : 'Agregar medicamento'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
