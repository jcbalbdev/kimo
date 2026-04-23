// ── App-wide constants ────────────────────────────────────────
// Siempre apunta al dominio de producción.
// Usar esta constante en lugar de window.location.origin para
// construir links compartibles — garantiza URLs correctas tanto
// en la PWA como en la APK (donde origin = localhost).
export const APP_URL = 'https://www.kimofriends.app';
