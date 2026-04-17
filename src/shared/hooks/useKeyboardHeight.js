/**
 * useKeyboardHeight
 *
 * Tracks the iOS virtual keyboard height using the Visual Viewport API
 * and writes it as a CSS custom property on <html>:
 *   --keyboard-h: <number>px
 *
 * On iOS, the keyboard overlays the fixed layout viewport without
 * resizing it.  window.visualViewport.height reflects the truly
 * visible area, so the difference between the two is the keyboard height.
 *
 * On Android / desktop the keyboard resizes the viewport normally, so
 * the difference is 0 and the variable stays at 0px — harmless.
 */
import { useEffect } from 'react';

export function useKeyboardHeight() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return; // SSR or very old browser — bail safely

    const update = () => {
      // offsetTop handles the case where the viewport also scrolled up
      const kh = Math.max(
        0,
        window.innerHeight - vv.height - (vv.offsetTop ?? 0),
      );
      document.documentElement.style.setProperty('--keyboard-h', `${kh}px`);
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update(); // initialize on mount

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      // Reset when unmounted (navigation away)
      document.documentElement.style.setProperty('--keyboard-h', '0px');
    };
  }, []);
}
