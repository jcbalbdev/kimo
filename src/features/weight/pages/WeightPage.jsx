import { useState } from 'react';
import { usePets } from '../../pets/hooks/usePets';
import { useWeight } from '../hooks/useWeight';
import { useToast } from '../../../shared/hooks/useToast';
import { formatDate } from '../../../shared/utils/dates';
import WeightChart from '../components/WeightChart';
import Modal from '../../../shared/components/Modal/Modal';
import Button from '../../../shared/components/Button/Button';
import Input from '../../../shared/components/Input/Input';
import Card from '../../../shared/components/Card/Card';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
import './WeightPage.css';

const TREND_MAP = {
  up: { emoji: '📈', label: 'Subiendo', color: 'var(--warning)' },
  down: { emoji: '📉', label: 'Bajando', color: 'var(--info)' },
  stable: { emoji: '➡️', label: 'Estable', color: 'var(--success)' },
};

export default function WeightPage() {
  const { currentPet } = usePets();
  const { weightLogs, lastWeight, trend, addWeightLog, deleteWeightLog } = useWeight(currentPet?.id);
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  if (!currentPet) return null;

  const trendInfo = TREND_MAP[trend];

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!weight) return;
    const { error } = await addWeightLog({
      weight: parseFloat(weight),
      date,
      notes: notes.trim() || null,
    });
    if (!error) {
      setShowForm(false);
      setWeight('');
      setNotes('');
      addToast('Peso registrado ⚖️', 'success');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="weight-header">
        <div>
          <h2 className="section-title">⚖️ Peso</h2>
          <p className="page-subtitle">
            {weightLogs.length > 0 ? `${weightLogs.length} registro${weightLogs.length > 1 ? 's' : ''}` : 'Sin registros'}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>+ Registrar</Button>
      </div>

      {weightLogs.length === 0 ? (
        <EmptyState
          icon="⚖️"
          title="Sin registros"
          text="Registra el peso para seguir la evolución de tu mascota"
          action={<Button size="sm" onClick={() => setShowForm(true)}>Registrar peso</Button>}
        />
      ) : (
        <>
          {/* Current weight */}
          <Card className="weight-current">
            <span className="weight-current-value">{lastWeight.weight} kg</span>
            <span className="weight-current-trend" style={{ color: trendInfo.color }}>
              {trendInfo.emoji} {trendInfo.label}
            </span>
            <span className="weight-current-date">Último: {formatDate(lastWeight.date)}</span>
          </Card>

          {/* Chart */}
          <div className="weight-chart-section">
            <WeightChart data={weightLogs} />
          </div>

          {/* History */}
          <div className="weight-history">
            <h3 className="section-label">Historial</h3>
            <div className="ios-group">
              {[...weightLogs].reverse().map((log) => (
                <div key={log.id} className="ios-group-item weight-history-item">
                  <div className="weight-history-info">
                    <span className="weight-history-val">{log.weight} kg</span>
                    <span className="weight-history-date">{formatDate(log.date)}</span>
                  </div>
                  <button className="weight-history-delete" onClick={() => { deleteWeightLog(log.id); addToast('Registro eliminado', 'warning'); }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Registrar peso">
        <form className="weight-form" onSubmit={handleAdd}>
          <div className="weight-form-row">
            <Input
              label="Peso (kg)"
              type="number"
              step="0.1"
              placeholder="Ej: 8.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              autoFocus
            />
            <Input
              label="Fecha"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Input
            label="Notas"
            placeholder="Algo que anotar..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            hint="Opcional"
          />
          <Button type="submit" disabled={!weight}>Registrar peso</Button>
        </form>
      </Modal>
    </div>
  );
}
