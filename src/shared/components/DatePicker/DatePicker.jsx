import { useState, useEffect, useRef } from 'react';
import './DatePicker.css';

const DAYS_ES   = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

/** Parse 'YYYY-MM-DD' safely without timezone shift */
function parseISO(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Format Date → 'YYYY-MM-DD' */
function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Format 'YYYY-MM-DD' → '13 abr 2026' */
function formatDisplay(iso) {
  if (!iso) return 'Seleccionar fecha';
  const d = parseISO(iso);
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * KimoDatePicker
 *
 * Props:
 *  value      string   'YYYY-MM-DD'
 *  onChange   fn       called with 'YYYY-MM-DD'
 *  max        string   'YYYY-MM-DD' — optional upper bound
 *  min        string   'YYYY-MM-DD' — optional lower bound
 *  label      string   placeholder text when no date selected
 */
export default function DatePicker({ value, onChange, max, min, label }) {
  const [open, setOpen]     = useState(false);
  const ref                 = useRef(null);

  const today   = new Date();
  const parsed  = parseISO(value);

  // Calendar cursor state (independent from value)
  const [cursor, setCursor] = useState(() => ({
    year:  parsed ? parsed.getFullYear()  : today.getFullYear(),
    month: parsed ? parsed.getMonth()     : today.getMonth(),
  }));

  // Sync cursor when value changes externally
  useEffect(() => {
    if (parsed) setCursor({ year: parsed.getFullYear(), month: parsed.getMonth() });
  }, [value]); // eslint-disable-line

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Build grid (6 rows × 7 cols)
  const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    return (day >= 1 && day <= daysInMonth) ? day : null;
  });

  const pick = (day) => {
    if (!day) return;
    const iso = toISO(new Date(cursor.year, cursor.month, day));
    if (max && iso > max) return;
    if (min && iso < min) return;
    onChange(iso);
    setOpen(false);
  };

  const prevMonth = () => setCursor(c => {
    const m = c.month === 0 ? 11 : c.month - 1;
    const y = c.month === 0 ? c.year - 1 : c.year;
    return { year: y, month: m };
  });

  const nextMonth = () => setCursor(c => {
    const m = c.month === 11 ? 0 : c.month + 1;
    const y = c.month === 11 ? c.year + 1 : c.year;
    return { year: y, month: m };
  });

  const isSelected = (day) => {
    if (!day || !parsed) return false;
    return parsed.getFullYear() === cursor.year
      && parsed.getMonth()     === cursor.month
      && parsed.getDate()      === day;
  };

  const isToday = (day) => {
    if (!day) return false;
    return today.getFullYear() === cursor.year
      && today.getMonth()     === cursor.month
      && today.getDate()      === day;
  };

  const isDisabled = (day) => {
    if (!day) return true;
    const iso = toISO(new Date(cursor.year, cursor.month, day));
    if (max && iso > max) return true;
    if (min && iso < min) return true;
    return false;
  };

  return (
    <div className="kdp-wrap" ref={ref}>
      {/* Trigger button */}
      <button
        type="button"
        className={`kdp-trigger ${open ? 'kdp-trigger-open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className={`kdp-trigger-label ${value ? 'kdp-trigger-has-value' : ''}`}>
          {value ? formatDisplay(value) : (label || 'Seleccionar fecha')}
        </span>
        <svg
          className={`kdp-chevron ${open ? 'kdp-chevron-up' : ''}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div className="kdp-panel">
          {/* Header */}
          <div className="kdp-header">
            <button type="button" className="kdp-nav-btn" onClick={prevMonth} aria-label="Mes anterior">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span className="kdp-month-label">
              {MONTHS_ES[cursor.month]} {cursor.year}
            </span>
            <button type="button" className="kdp-nav-btn" onClick={nextMonth} aria-label="Mes siguiente">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          {/* Day column headers */}
          <div className="kdp-grid kdp-grid-headers">
            {DAYS_ES.map(d => (
              <span key={d} className="kdp-day-header">{d}</span>
            ))}
          </div>

          {/* Cells */}
          <div className="kdp-grid">
            {cells.map((day, i) => (
              <button
                key={i}
                type="button"
                className={[
                  'kdp-cell',
                  !day          ? 'kdp-cell-empty'    : '',
                  isSelected(day) ? 'kdp-cell-selected' : '',
                  isToday(day)  && !isSelected(day) ? 'kdp-cell-today' : '',
                  isDisabled(day) ? 'kdp-cell-disabled' : '',
                ].join(' ')}
                onClick={() => pick(day)}
                disabled={isDisabled(day)}
                tabIndex={day ? 0 : -1}
                aria-label={day ? `${day} ${MONTHS_ES[cursor.month]} ${cursor.year}` : undefined}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="kdp-footer">
            <button
              type="button"
              className="kdp-clear-btn"
              onClick={() => { onChange(''); setOpen(false); }}
            >
              Borrar
            </button>
            <button
              type="button"
              className="kdp-today-btn"
              onClick={() => {
                onChange(toISO(today));
                setCursor({ year: today.getFullYear(), month: today.getMonth() });
                setOpen(false);
              }}
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
