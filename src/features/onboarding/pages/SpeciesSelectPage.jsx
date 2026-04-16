import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SPECIES } from '../../pets/constants/species';
import gatitoIcon from '../../../assets/gatito.webp';
import huskyIcon from '../../../assets/husky.webp';
import conejitoIcon from '../../../assets/conejito.webp';
import Input from '../../../shared/components/Input/Input';
import './SpeciesSelectPage.css';

const ChevronLeftIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export default function SpeciesSelectPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [customSpecies, setCustomSpecies] = useState('');

  const SPECIES_IMG = {
    dog: huskyIcon,
    cat: gatitoIcon,
    rabbit: conejitoIcon,
    other: gatitoIcon, // Usa gatito como placeholder para "Otro"
  };

  const handleSelect = (speciesId) => {
    setSelected(speciesId);
    if (speciesId !== 'other') {
      setTimeout(() => {
        navigate('/onboarding/nombre', {
          state: { species: speciesId, customSpecies: null },
        });
      }, 350);
    }
  };

  const handleContinueOther = () => {
    if (customSpecies.trim()) {
      navigate('/onboarding/nombre', {
        state: { species: 'other', customSpecies: customSpecies.trim() },
      });
    }
  };

  return (
    <div className="species-page">
      {/* ── Back button ── */}
      <button className="species-back-btn" onClick={() => navigate(-1)}>
        <ChevronLeftIcon />
      </button>

      <div className="species-header">
        <h1 className="species-title">¿Qué mascota tienes?</h1>
        <p className="species-subtitle">
          Toca tu mascota para continuar
        </p>
      </div>

      <div className="species-grid stagger-children">
        {SPECIES.map((species) => {
          const img = SPECIES_IMG[species.id];
          return (
            <button
              key={species.id}
              className={`species-card ${selected === species.id ? 'species-card-selected' : ''}`}
              onClick={() => handleSelect(species.id)}
            >
              <div className="species-card-visual">
                <img
                  src={img}
                  alt={species.name}
                  className="species-card-img"
                />
              </div>
              <span className="species-card-name">{species.name}</span>
            </button>
          );
        })}
      </div>

      {selected === 'other' && (
        <div className="species-custom animate-fade-in-up">
          <Input
            label="¿Qué tipo de mascota es?"
            placeholder="Ej: Hámster, Ave, Tortuga..."
            value={customSpecies}
            onChange={(e) => setCustomSpecies(e.target.value)}
            autoFocus
          />
          <button
            className={`species-continue-btn ${customSpecies.trim() ? 'species-continue-btn-active' : ''}`}
            onClick={handleContinueOther}
            disabled={!customSpecies.trim()}
          >
            Continuar →
          </button>
        </div>
      )}
    </div>
  );
}
