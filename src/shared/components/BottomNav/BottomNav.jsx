import { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './BottomNav.css';

const NAV_ITEMS = [
  { path: '/', label: 'Inicio' },
  { path: '/medicamentos', label: 'Meds' },
  { path: '/alimentacion', label: 'Comida' },
  { path: '/salud', label: 'Salud' },
];

export default function BottomNav({ pendingCount = 0 }) {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [pillStyle, setPillStyle] = useState({});

  const activeIndex = NAV_ITEMS.findIndex((item) => item.path === location.pathname);

  useEffect(() => {
    if (containerRef.current && activeIndex >= 0) {
      const buttons = containerRef.current.querySelectorAll('.bottom-nav-item');
      const activeBtn = buttons[activeIndex];
      if (activeBtn) {
        setPillStyle({
          left: `${activeBtn.offsetLeft}px`,
          width: `${activeBtn.offsetWidth}px`,
        });
      }
    }
  }, [activeIndex]);

  if (activeIndex < 0) return null;

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      <div className="bottom-nav-segmented" ref={containerRef}>
        <div className="bottom-nav-pill" style={pillStyle} />
        {NAV_ITEMS.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={item.path}
              className={`bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              {item.path === '/' && pendingCount > 0 && (
                <span className="bottom-nav-badge">{pendingCount}</span>
              )}
              <span className="bottom-nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
