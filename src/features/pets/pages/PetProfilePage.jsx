import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePets } from '../hooks/usePets';
import { useMedications } from '../../medications/hooks/useMedications';
import { useFeedings } from '../../feedings/hooks/useFeedings';
import { getSpecies } from '../constants/species';
import { formatDate } from '../../../shared/utils/dates';
import PetAvatar from '../components/PetAvatar';
import PetSelector from '../components/PetSelector';
import Button from '../../../shared/components/Button/Button';
import Card from '../../../shared/components/Card/Card';
import { useToast } from '../../../shared/hooks/useToast';
import './PetProfilePage.css';

export default function PetProfilePage() {
  const navigate = useNavigate();
  const { pets, currentPet, selectPet, deletePet } = usePets();
  const { activeMedications } = useMedications(currentPet?.id);
  const { feedings } = useFeedings(currentPet?.id);
  const { addToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!currentPet) return null;

  const species = getSpecies(currentPet.species);

  const handleAddPet = () => {
    navigate('/onboarding/especie');
  };

  const handleDeletePet = async () => {
    await deletePet(currentPet.id);
    setShowDeleteConfirm(false);
    addToast(`${currentPet.name} eliminada`, 'warning');
    if (pets.length <= 1) {
      navigate('/onboarding/especie');
    }
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Mascota</h1>
      </div>

      <PetSelector pets={pets} currentPetId={currentPet.id} onSelect={selectPet} />

      <div className="pet-profile-hero">
        <PetAvatar species={currentPet.species} size="xl" />
        <h2 className="pet-profile-name">{currentPet.name}</h2>
        <p className="pet-profile-species">
          {currentPet.custom_species || species.name}
        </p>
      </div>

      <div className="pet-profile-stats">
        <Card className="pet-stat-card">
          <span className="pet-stat-value">{activeMedications.length}</span>
          <span className="pet-stat-label">Med. activos</span>
        </Card>
        <Card className="pet-stat-card">
          <span className="pet-stat-value">{feedings.length}</span>
          <span className="pet-stat-label">Comidas</span>
        </Card>
        <Card className="pet-stat-card">
          <span className="pet-stat-value">{pets.length}</span>
          <span className="pet-stat-label">Mascotas</span>
        </Card>
      </div>

      <div className="pet-profile-info">
        <Card>
          <div className="pet-info-row">
            <span className="pet-info-label">Registrado</span>
            <span>{formatDate(currentPet.created_at?.split('T')[0])}</span>
          </div>
          <div className="pet-info-row">
            <span className="pet-info-label">Especie</span>
            <span>{species.emoji} {currentPet.custom_species || species.name}</span>
          </div>
        </Card>
      </div>

      <div className="pet-profile-actions">
        <Button variant="secondary" onClick={() => navigate('/hogar')}>
          🏠 Gestionar hogar
        </Button>
        <Button variant="secondary" onClick={handleAddPet}>
          + Agregar otra mascota
        </Button>
        {!showDeleteConfirm ? (
          <Button
            variant="ghost"
            className="pet-delete-btn"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Eliminar mascota
          </Button>
        ) : (
          <div className="pet-delete-confirm animate-fade-in">
            <p>¿Seguro que quieres eliminar a {currentPet.name}? Se perderán todos sus registros.</p>
            <div className="pet-delete-confirm-actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeletePet}
              >
                Sí, eliminar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
