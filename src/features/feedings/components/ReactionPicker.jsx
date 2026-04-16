import { REACTIONS } from '../../pets/constants/species';
import './ReactionPicker.css';

export default function ReactionPicker({ value, onChange }) {
  return (
    <div className="reaction-picker">
      <span className="input-label">¿Cómo comió?</span>
      <div className="reaction-options">
        {REACTIONS.map((reaction) => (
          <button
            key={reaction.id}
            type="button"
            className={`reaction-btn ${value === reaction.id ? 'reaction-btn-active' : ''}`}
            onClick={() => onChange(reaction.id)}
          >
            <span className="reaction-emoji">{reaction.emoji}</span>
            <span className="reaction-label">{reaction.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
