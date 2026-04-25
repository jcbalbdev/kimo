import { useNavigate } from 'react-router-dom';
import gatoIcon from '../../../assets/gatito.webp';
import huskyIcon from '../../../assets/husky.webp';
import conejitoIcon from '../../../assets/conejito.webp';
import './PetSelector.css';

const PET_IMG = { cat: gatoIcon, dog: huskyIcon, rabbit: conejitoIcon };

export default function PetSelector({ pets, currentPetId, onSelect }) {
  const navigate = useNavigate();

  // Always show selector (even with 1 pet, show + to add more)
  return (
    <div className="pet-selector">
      {/* Add pet button — first so it's always visible regardless of list length */}
      <button
        className="pet-selector-add"
        onClick={() => navigate('/onboarding/especie')}
        aria-label="Agregar mascota"
      >
        <div className="pet-selector-bubble pet-selector-bubble-add">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <span className="pet-selector-name">Añadir</span>
      </button>

      {pets.map((pet) => {
        const isActive = pet.id === currentPetId;
        const img = PET_IMG[pet.species] || null;
        return (
          <button
            key={pet.id}
            className={`pet-selector-item ${isActive ? 'pet-selector-item-active' : ''}`}
            onClick={() => onSelect(pet.id)}
            aria-label={`Seleccionar ${pet.name}`}
          >
            <div className="pet-selector-bubble">
              <img
                src={PET_IMG[pet.species] || gatoIcon}
                alt={pet.name}
                className="pet-selector-img"
              />
            </div>
            <span className="pet-selector-name">{pet.name}</span>
          </button>
        );
      })}
    </div>
  );
}

