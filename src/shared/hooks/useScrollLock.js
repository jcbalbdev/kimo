/**
 * useScrollLock
 *
 * Prevents iOS Safari from scrolling the background page while a bottom sheet
 * is open. Uses a non-passive 'touchmove' listener on the document so we can
 * call preventDefault() — the only technique that actually stops iOS scroll.
 *
 * Any touch that originates INSIDE an element with class "tab-sheet" is
 * allowed through so the sheet content can scroll normally.
 *
 * @param {boolean} isActive  - Whether the sheet is currently open
 */
import { useEffect } from 'react';

export function useScrollLock(isActive) {
  useEffect(() => {
    if (!isActive) return;

    const prevent = (e) => {
      // Allow scroll inside the sheet itself
      if (e.target.closest?.('.tab-sheet')) return;
      e.preventDefault();
    };

    // Must be { passive: false } — otherwise preventDefault() is silently ignored
    document.addEventListener('touchmove', prevent, { passive: false });

    return () => {
      document.removeEventListener('touchmove', prevent);
    };
  }, [isActive]);
}
