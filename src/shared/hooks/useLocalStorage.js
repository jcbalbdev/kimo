import { useState, useEffect } from 'react';

/**
 * Hook genérico de persistencia en localStorage.
 * Cuando migres a Supabase, reemplaza la implementación interna
 * sin cambiar la interfaz del hook.
 *
 * @param {string} key - Clave de localStorage
 * @param {*} initialValue - Valor por defecto
 * @returns {[any, Function]} - [value, setValue]
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
