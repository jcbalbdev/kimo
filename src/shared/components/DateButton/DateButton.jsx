import { useState } from 'react';
import { formatDateShortES } from '../../utils/dates';

/**
 * A button that displays a formatted date and toggles a native date picker.
 * Previously duplicated in CitasTab and VacunasTab.
 */
export default function DateButton({ value, onChange }) {
  const [picking, setPicking] = useState(false);

  return (
    <div className="tab-date-btn-wrap">
      <button type="button" className="tab-date-btn" onClick={() => setPicking(!picking)}>
        <span>{formatDateShortES(value)}</span>
        <span className="tab-date-edit">✎</span>
      </button>
      {picking && (
        <input
          className="tab-sheet-input"
          type="date"
          value={value}
          onChange={(e) => { onChange(e.target.value); setPicking(false); }}
          style={{ marginTop: '6px' }}
        />
      )}
    </div>
  );
}
