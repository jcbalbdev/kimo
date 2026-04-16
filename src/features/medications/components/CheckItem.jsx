import './CheckItem.css';

export default function CheckItem({ medication, isChecked, onToggle }) {
  return (
    <button
      className={`check-item ${isChecked ? 'check-item-done' : ''}`}
      onClick={onToggle}
    >
      <div className={`check-box ${isChecked ? 'check-box-checked' : ''}`}>
        {isChecked && (
          <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
            <path
              d="M1 5L5 9L13 1"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div className="check-info">
        <span className={`check-name ${isChecked ? 'check-name-done' : ''}`}>
          {medication.name}
        </span>
        {medication.dose && (
          <span className="check-dose">{medication.dose}</span>
        )}
      </div>
      <div className="check-status">
        {isChecked ? (
          <span className="check-status-done">✅</span>
        ) : (
          <span className="check-status-pending">Pendiente</span>
        )}
      </div>
    </button>
  );
}
