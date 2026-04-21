/**
 * Utilidades de fecha para MiKimo
 */

/**
 * Retorna la fecha de hoy en formato YYYY-MM-DD
 */
export function today() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Retorna la hora actual en formato HH:MM
 */
export function currentTime() {
  return new Date().toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Formatea una fecha ISO a formato legible: "13 abr 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formatea una fecha a formato corto: "13 abr"
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Formatea una hora: "08:30"
 */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr;
}

/**
 * Retorna si una fecha es hoy
 */
export function isToday(dateStr) {
  return dateStr === today();
}

/**
 * Retorna la fecha de ayer en formato YYYY-MM-DD
 */
export function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Retorna fecha relativa: "Hoy", "Ayer", o la fecha formateada
 */
export function relativeDate(dateStr) {
  if (dateStr === today()) return 'Hoy';
  if (dateStr === yesterday()) return 'Ayer';
  return formatDate(dateStr);
}

/**
 * Retorna los últimos N días como array de strings YYYY-MM-DD
 */
export function lastNDays(n) {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

/**
 * Calcula días entre dos fechas
 */
export function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  return Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Retorna la hora actual en formato HH:MM (24h)
 * Used by medication and feeding forms.
 */
export function currentTimeHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Formatea fecha ISO a dd/mm/yyyy
 * Used by MedsTab, SaludTab for compact date display.
 */
export function formatDateDMY(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Formatea fecha ISO a formato largo en español: "13 de abril de 2026"
 * Used by CitasTab, VacunasTab.
 */
export function formatDateLong(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

/**
 * Formatea fecha ISO a formato corto en español: "13 abr 2026" (short month)
 * Used by VacunasTab.
 */
export function formatDateShortES(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/**
 * Formatea hora HH:MM:SS a formato 12h: "8:30 AM"
 * Used by AlimentosTab.
 */
export function formatTime12(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Formatea fecha como day label: "Hoy", "Ayer", or "lunes, 13 de abril"
 * Used by AlimentosTab for grouped feeding views.
 */
export function formatDayLabel(dateStr) {
  if (dateStr === today()) return 'Hoy';
  if (dateStr === yesterday()) return 'Ayer';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}
