import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../shared/components/Button/Button';
import kimoIcon from '../../../assets/icono.png';
import './WelcomePage.css';

export default function WelcomePage() {
  const navigate = useNavigate();
  const [animating, setAnimating] = useState(false);

  const handleStart = () => {
    setAnimating(true);
    setTimeout(() => navigate('/onboarding/especie'), 300);
  };

  return (
    <div className={`welcome-page ${animating ? 'welcome-page-exit' : ''}`}>
      <div className="welcome-content">
        <div className="welcome-logo-container">
          <div className="welcome-logo welcome-logo-img">
            <img src={kimoIcon} alt="KIMO" className="welcome-logo-cat" />
          </div>
          <div className="welcome-logo-ring" />
          <div className="welcome-logo-ring welcome-logo-ring-2" />
        </div>

        <h1 className="welcome-title">KIMO</h1>
        <p className="welcome-subtitle">
          Cuidar a tu mascota es más fácil cuando todo está en un solo lugar
        </p>

        <div className="welcome-features">
          <div className="welcome-feature animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
            <span>Control de medicamentos</span>
          </div>
          <div className="welcome-feature animate-fade-in-up" style={{ animationDelay: '350ms' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11l19-9-9 19-2-8-8-2z"/>
            </svg>
            <span>Registro de alimentación</span>
          </div>
          <div className="welcome-feature animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span>Racha de cuidado diario</span>
          </div>
        </div>
      </div>

      <div className="welcome-action">
        <Button size="lg" onClick={handleStart}>
          Empezar
        </Button>
      </div>
    </div>
  );
}
