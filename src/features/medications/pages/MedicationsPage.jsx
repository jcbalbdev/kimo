import { useState, useEffect } from 'react';
import { usePets } from '../../pets/hooks/usePets';
import { useMedications } from '../hooks/useMedications';
import { useToast } from '../../../shared/hooks/useToast';
import { FREQUENCIES } from '../../pets/constants/species';
import { formatDate } from '../../../shared/utils/dates';
import CheckItem from '../components/CheckItem';
import MedicationForm from '../components/MedicationForm';
import Modal from '../../../shared/components/Modal/Modal';
import Button from '../../../shared/components/Button/Button';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
import Card from '../../../shared/components/Card/Card';
import './MedicationsPage.css';

export default function MedicationsPage() {
  const { currentPet } = usePets();
  const {
    activeMedications,
    inactiveMedications,
    addMedication,
    toggleCheck,
    isTakenToday,
    deleteMedication,
    updateMedication,
    getCheckHistory,
  } = useMedications(currentPet?.id);
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [viewingMed, setViewingMed] = useState(null);
  const [checkHistory, setCheckHistory] = useState([]);

  if (!currentPet) return null;

  const handleAdd = async (formData) => {
    await addMedication(formData);
    setShowForm(false);
    addToast('Medicamento agregado', 'success');
  };

  const handleToggle = async (medId) => {
    await toggleCheck(medId);
    const wasTaken = isTakenToday(medId);
    if (!wasTaken) {
      addToast('¡Medicamento registrado! 💊', 'success');
    }
  };

  const handleDeactivate = async (medId) => {
    await updateMedication(medId, { is_active: false });
    setViewingMed(null);
    addToast('Medicamento desactivado', 'info');
  };

  const handleReactivate = async (medId) => {
    await updateMedication(medId, { is_active: true });
    addToast('Medicamento reactivado', 'success');
  };

  const handleDelete = async (medId) => {
    await deleteMedication(medId);
    setViewingMed(null);
    addToast('Medicamento eliminado', 'warning');
  };

  const handleViewMed = async (med) => {
    setViewingMed(med);
    const history = await getCheckHistory(med.id);
    setCheckHistory(history);
  };

  const getFrequencyLabel = (freq) => {
    const found = FREQUENCIES.find((f) => f.id === freq);
    return found?.name || freq;
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="meds-header">
          <div>
            <h1 className="page-title">Medicamentos</h1>
            <p className="page-subtitle">
              {activeMedications.length > 0
                ? `${activeMedications.length} activo${activeMedications.length > 1 ? 's' : ''}`
                : 'Sin medicamentos activos'}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            + Agregar
          </Button>
        </div>
      </div>

      {activeMedications.length === 0 ? (
        <EmptyState
          icon="💊"
          title="Sin medicamentos"
          text="Agrega los medicamentos de tu mascota para llevar un control diario"
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
              Agregar medicamento
            </Button>
          }
        />
      ) : (
        <div className="meds-list stagger-children">
          {activeMedications.map((med) => (
            <div key={med.id} className="med-item-wrapper">
              <CheckItem
                medication={med}
                isChecked={isTakenToday(med.id)}
                onToggle={() => handleToggle(med.id)}
              />
              <button
                className="med-detail-btn"
                onClick={() => handleViewMed(med)}
                aria-label="Ver detalle"
              >
                ›
              </button>
            </div>
          ))}
        </div>
      )}

      {inactiveMedications.length > 0 && (
        <div className="meds-inactive">
          <h3 className="section-label">Inactivos</h3>
          {inactiveMedications.map((med) => (
            <Card key={med.id} className="med-inactive-card">
              <div className="med-inactive-info">
                <span className="med-inactive-name">{med.name}</span>
                {med.dose && <span className="med-inactive-dose">{med.dose}</span>}
              </div>
              <button
                className="med-reactivate-btn"
                onClick={() => handleReactivate(med.id)}
              >
                Reactivar
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Agregar medicamento */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Nuevo medicamento"
      >
        <MedicationForm
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {/* Modal: Detalle de medicamento */}
      <Modal
        isOpen={!!viewingMed}
        onClose={() => setViewingMed(null)}
        title={viewingMed?.name}
      >
        {viewingMed && (
          <div className="med-detail">
            {viewingMed.dose && (
              <div className="med-detail-row">
                <span className="med-detail-label">Dosis</span>
                <span>{viewingMed.dose}</span>
              </div>
            )}
            <div className="med-detail-row">
              <span className="med-detail-label">Frecuencia</span>
              <span>{getFrequencyLabel(viewingMed.frequency)}</span>
            </div>
            {viewingMed.custom_frequency && (
              <div className="med-detail-row">
                <span className="med-detail-label">Detalle</span>
                <span>{viewingMed.custom_frequency}</span>
              </div>
            )}

            {checkHistory.length > 0 && (
              <div className="med-history">
                <h4 className="section-label">Últimos registros</h4>
                <div className="med-history-list">
                  {checkHistory.slice(0, 10).map((check) => (
                    <div key={check.id} className="med-history-item">
                      <span>✅ {formatDate(check.date)}</span>
                      <span className="med-history-time">
                        {check.profiles?.display_name || ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="med-detail-actions">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDeactivate(viewingMed.id)}
              >
                Desactivar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(viewingMed.id)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
