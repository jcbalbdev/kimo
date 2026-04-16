import './StreakBadge.css';

export default function StreakBadge({ current = 0, best = 0, showBest = false }) {
  if (current === 0 && !showBest) return null;

  return (
    <div className="streak-badge">
      <svg className="streak-flame" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 2C9.81 2 8 3.81 8 6c0 1.81 1.03 3.4 2.54 4.21C9.59 11.5 9 13.18 9 15c0 3.31 2.69 6 6 6s6-2.69 6-6c0-2.22-1.21-4.16-3-5.22V6c0-2.21-1.79-4-4-4H12zm0 2h.01C13.11 4 14 4.9 14 6v.67A5.99 5.99 0 0 1 21 13c0 3.31-2.69 6-6 6s-6-2.69-6-6c0-1.55.59-2.96 1.55-4.03A4.001 4.001 0 0 1 8 6c0-1.1.9-2 2-2z"/>
      </svg>
      <span className="streak-count">{current}</span>
      {showBest && best > 0 && (
        <span className="streak-best">Mejor: {best}</span>
      )}
    </div>
  );
}
