export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'dart_theme';

/**
 * Retrieve saved theme preference.
 * Defaults strictly to 'light' for first-time visitors as specified in requirements.
 */
export function getSavedTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark') return 'dark';
    return 'light';
  } catch {
    return 'light';
  }
}

/**
 * Apply theme to document element class and attributes.
 */
export function applyThemeToDOM(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }
}

/**
 * Persist theme choice in localStorage.
 */
export function saveTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
}

/**
 * Smoothly toggle theme outward in a radial circular wave from the trigger button
 * using the View Transitions API when available, honoring prefers-reduced-motion,
 * with an instant or smooth CSS transition fallback for unsupported browsers.
 */
export async function toggleThemeWithTransition(
  currentTheme: Theme,
  triggerEl?: HTMLElement | null,
  clickCoords?: { x: number; y: number } | null
): Promise<Theme> {
  const nextTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const supportsViewTransitions =
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    typeof (document as any).startViewTransition === 'function';

  // If user requests reduced motion or the browser does not support View Transitions,
  // apply directly (CSS transition on surfaces handles smooth color easing).
  if (prefersReducedMotion || !supportsViewTransitions) {
    applyThemeToDOM(nextTheme);
    saveTheme(nextTheme);
    return nextTheme;
  }

  // Calculate coordinates (x, y) of the origin for the radial wave
  let x = window.innerWidth / 2;
  let y = 30;

  if (clickCoords && clickCoords.x > 0 && clickCoords.y > 0) {
    x = clickCoords.x;
    y = clickCoords.y;
  } else if (triggerEl) {
    const rect = triggerEl.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  }

  // Radius to the furthest corner of the viewport
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  try {
    const transition = (document as any).startViewTransition(() => {
      applyThemeToDOM(nextTheme);
      saveTheme(nextTheme);
    });

    await transition.ready;

    // Animate the incoming theme from 0 radius to full screen radius
    const animation = document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 450,
        easing: 'ease-out',
        pseudoElement: '::view-transition-new(root)',
      }
    );

    await animation.finished;
    await transition.finished;
  } catch {
    // If anything fails in the experimental API, ensure the theme is safely applied
    applyThemeToDOM(nextTheme);
    saveTheme(nextTheme);
  }

  return nextTheme;
}
