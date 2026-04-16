import { useState } from 'react';
import Input from '../../../shared/components/Input/Input';
import Button from '../../../shared/components/Button/Button';
import ReactionPicker from './ReactionPicker';
import './FeedingForm.css';

export default function FeedingForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    brand: '',
    amount: '',
    reaction: 'ate_all',
    notes: '',
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="feeding-form" onSubmit={handleSubmit}>
      <div className="feeding-form-fields">
        <Input
          label="Marca / Tipo de alimento"
          placeholder="Ej: Royal Canin, pollo hervido..."
          value={form.brand}
          onChange={(e) => handleChange('brand', e.target.value)}
          autoFocus
        />

        <Input
          label="Cantidad"
          placeholder="Ej: 1 taza, 200g, medio plato..."
          value={form.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
        />

        <ReactionPicker
          value={form.reaction}
          onChange={(val) => handleChange('reaction', val)}
        />

        <Input
          label="Notas"
          placeholder="Algo que quieras anotar..."
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          textarea
          hint="Opcional"
        />
      </div>

      <div className="feeding-form-actions">
        <Button type="submit">
          Registrar alimentación
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
