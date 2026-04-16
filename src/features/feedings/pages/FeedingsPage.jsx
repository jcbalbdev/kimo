import { useState } from 'react';
import { usePets } from '../../pets/hooks/usePets';
import { useFeedings } from '../hooks/useFeedings';
import { useToast } from '../../../shared/hooks/useToast';
import { getReaction } from '../../pets/constants/species';
import { relativeDate } from '../../../shared/utils/dates';
import FeedingForm from '../components/FeedingForm';
import Modal from '../../../shared/components/Modal/Modal';
import Button from '../../../shared/components/Button/Button';
import Card from '../../../shared/components/Card/Card';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
import './FeedingsPage.css';

export default function FeedingsPage() {
  const { currentPet } = usePets();
  const { feedings, addFeeding, deleteFeeding } = useFeedings(currentPet?.id);
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);

  if (!currentPet) return null;

  const handleAdd = async (formData) => {
    await addFeeding(formData);
    setShowForm(false);
    addToast('Alimentación registrada 🍽️', 'success');
  };

  const handleDelete = async (feedId) => {
    await deleteFeeding(feedId);
    addToast('Registro eliminado', 'warning');
  };

  // Agrupar por fecha
  const groupedFeedings = feedings.reduce((groups, feeding) => {
    const date = feeding.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(feeding);
    return groups;
  }, {});

  const dateGroups = Object.entries(groupedFeedings);

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="feeds-header">
          <div>
            <h1 className="page-title">Alimentación</h1>
            <p className="page-subtitle">
              {feedings.length > 0
                ? `${feedings.length} registro${feedings.length > 1 ? 's' : ''}`
                : 'Sin registros'}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            + Registrar
          </Button>
        </div>
      </div>

      {feedings.length === 0 ? (
        <EmptyState
          icon="🍽️"
          title="Sin registros"
          text="Registra qué come tu mascota y cómo reacciona para detectar patrones"
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
              Registrar alimentación
            </Button>
          }
        />
      ) : (
        <div className="feeds-timeline">
          {dateGroups.map(([date, items]) => (
            <div key={date} className="feeds-day">
              <h3 className="feeds-day-title">{relativeDate(date)}</h3>
              <div className="feeds-day-items stagger-children">
                {items.map((feeding) => {
                  const reaction = getReaction(feeding.reaction);
                  return (
                    <Card key={feeding.id} className="feed-card">
                      <div className="feed-card-main">
                        <span
                          className="feed-reaction-dot"
                          style={{ background: reaction.color }}
                        />
                        <div className="feed-card-info">
                          <div className="feed-card-top">
                            <span className="feed-reaction-emoji">
                              {reaction.emoji}
                            </span>
                            <span className="feed-reaction-name">
                              {reaction.name}
                            </span>
                            <span className="feed-time">{feeding.time?.slice(0, 5)}</span>
                          </div>
                          {(feeding.brand || feeding.amount) && (
                            <p className="feed-detail">
                              {[feeding.brand, feeding.amount]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          )}
                          {feeding.notes && (
                            <p className="feed-notes">{feeding.notes}</p>
                          )}
                        </div>
                        <button
                          className="feed-delete-btn"
                          onClick={() => handleDelete(feeding.id)}
                          aria-label="Eliminar"
                        >
                          ✕
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Registrar alimentación"
      >
        <FeedingForm
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
