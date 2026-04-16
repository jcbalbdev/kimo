import { useState } from 'react';
import { useAppointments } from '../hooks/useAppointments';
import { usePets } from '../../pets/hooks/usePets';
import { useToast } from '../../../shared/hooks/useToast';
import { formatDate } from '../../../shared/utils/dates';
import AppointmentForm from '../components/AppointmentForm';
import Modal from '../../../shared/components/Modal/Modal';
import Button from '../../../shared/components/Button/Button';
import Card from '../../../shared/components/Card/Card';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
import './AppointmentsPage.css';

const STATUS_MAP = {
  scheduled: { label: 'Agendada', color: 'var(--info)', bg: 'var(--info-bg)' },
  completed: { label: 'Completada', color: 'var(--success)', bg: 'var(--success-bg)' },
  cancelled: { label: 'Cancelada', color: 'var(--text-tertiary)', bg: 'var(--bg-input)' },
};

export default function AppointmentsPage() {
  const { currentPet } = usePets();
  const { upcoming, past, addAppointment, updateAppointment, deleteAppointment } = useAppointments(currentPet?.id);
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);

  if (!currentPet) return null;

  const handleAdd = async (formData) => {
    const { error } = await addAppointment(formData);
    if (!error) {
      setShowForm(false);
      addToast('Cita agendada 📅', 'success');
    }
  };

  const handleComplete = async (id) => {
    await updateAppointment(id, { status: 'completed' });
    addToast('Cita marcada como completada ✅', 'success');
  };

  const handleCancel = async (id) => {
    await updateAppointment(id, { status: 'cancelled' });
    addToast('Cita cancelada', 'warning');
  };

  return (
    <div className="animate-fade-in">
      <div className="appt-header">
        <div>
          <h2 className="section-title">📅 Citas veterinarias</h2>
          <p className="page-subtitle">
            {upcoming.length > 0 ? `${upcoming.length} próxima${upcoming.length > 1 ? 's' : ''}` : 'Sin citas'}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>+ Agendar</Button>
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          icon="📅"
          title="Sin citas"
          text="Agenda la próxima visita al veterinario"
          action={<Button size="sm" onClick={() => setShowForm(true)}>Agendar cita</Button>}
        />
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="appt-section">
              <h3 className="section-label">Próximas</h3>
              <div className="ios-group stagger-children">
                {upcoming.map((appt) => (
                  <div key={appt.id} className="ios-group-item appt-card">
                    <div className="appt-card-main">
                      <div className="appt-card-info">
                        <span className="appt-card-title">{appt.title}</span>
                        <span className="appt-card-date">
                          {formatDate(appt.date)}
                          {appt.time && ` · ${appt.time.slice(0, 5)}`}
                        </span>
                        {appt.vet_name && (
                          <span className="appt-card-vet">🩺 {appt.vet_name}</span>
                        )}
                      </div>
                      <div className="appt-card-actions">
                        <button className="appt-action-btn appt-action-done" onClick={() => handleComplete(appt.id)}>✓</button>
                        <button className="appt-action-btn appt-action-cancel" onClick={() => handleCancel(appt.id)}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div className="appt-section">
              <h3 className="section-label">Historial</h3>
              <div className="ios-group">
                {past.map((appt) => {
                  const status = STATUS_MAP[appt.status] || STATUS_MAP.scheduled;
                  return (
                    <div key={appt.id} className="ios-group-item appt-card appt-card-past">
                      <div className="appt-card-main">
                        <div className="appt-card-info">
                          <span className="appt-card-title">{appt.title}</span>
                          <span className="appt-card-date">{formatDate(appt.date)}</span>
                        </div>
                        <span className="appt-status-badge" style={{ color: status.color, background: status.bg }}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Agendar cita">
        <AppointmentForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
