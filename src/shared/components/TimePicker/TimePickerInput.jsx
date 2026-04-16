import './TimePickerInput.css';

function getNowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * AM/PM time picker.
 * - value: "HH:MM" string (24h internally)
 * - onChange: called with new "HH:MM" string
 */
export default function TimePickerInput({ value, onChange }) {
  const hhmm = value || getNowHHMM();
  const [hStr, mStr] = hhmm.split(':');
  const hour24 = Number(hStr) || 0;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  const minute = mStr || '00';

  const emit = (h12, min, ap) => {
    let h = Number(h12);
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    onChange(`${String(h).padStart(2, '0')}:${min}`);
  };

  const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
  const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <div className="tpi-root">
      {/* Hour */}
      <select
        className="tpi-select"
        value={hour12}
        onChange={(e) => emit(e.target.value, minute, ampm)}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>

      <span className="tpi-colon">:</span>

      {/* Minute */}
      <select
        className="tpi-select tpi-select-min"
        value={minute}
        onChange={(e) => emit(hour12, e.target.value, ampm)}
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      {/* AM / PM toggle */}
      <button
        type="button"
        className={`tpi-ampm ${ampm === 'PM' ? 'tpi-ampm-pm' : ''}`}
        onClick={() => emit(hour12, minute, ampm === 'AM' ? 'PM' : 'AM')}
      >
        {ampm}
      </button>
    </div>
  );
}
