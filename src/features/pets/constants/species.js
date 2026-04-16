/**
 * Configuración de especies de mascotas.
 * Para agregar una nueva especie, simplemente agrega un objeto al array.
 */
export const SPECIES = [
  {
    id: 'dog',
    name: 'Perro',
    emoji: '🐕',
    avatar: '🐕',
    color: '#FDCB6E',
  },
  {
    id: 'cat',
    name: 'Gato',
    emoji: '🐈',
    avatar: '🐈',
    color: '#A29BFE',
  },
  {
    id: 'rabbit',
    name: 'Conejo',
    emoji: '🐇',
    avatar: '🐇',
    color: '#55EFC4',
  },
];

/**
 * Obtener config de especie por ID
 */
export function getSpecies(speciesId) {
  return SPECIES.find((s) => s.id === speciesId) || SPECIES[SPECIES.length - 1];
}

/**
 * Frecuencias de medicamento disponibles
 */
export const FREQUENCIES = [
  { id: 'daily', name: 'Diario', description: '1 vez al día' },
  { id: 'twice_daily', name: '2 veces al día', description: 'Mañana y noche' },
  { id: 'every_other_day', name: 'Cada 2 días', description: 'Día de por medio' },
  { id: 'weekly', name: 'Semanal', description: '1 vez por semana' },
  { id: 'custom', name: 'Personalizado', description: 'Define tu frecuencia' },
];

/**
 * Reacciones de alimentación disponibles
 */
export const REACTIONS = [
  { id: 'ate_all', name: 'Comió todo', emoji: '😋', color: 'var(--success)' },
  { id: 'ate_little', name: 'Comió poco', emoji: '😐', color: 'var(--warning)' },
  { id: 'didnt_eat', name: 'No comió', emoji: '😾', color: 'var(--text-secondary)' },
  { id: 'vomited', name: 'Vomitó', emoji: '🤮', color: 'var(--danger)' },
];

/**
 * Obtener reacción por ID
 */
export function getReaction(reactionId) {
  return REACTIONS.find((r) => r.id === reactionId) || REACTIONS[0];
}
