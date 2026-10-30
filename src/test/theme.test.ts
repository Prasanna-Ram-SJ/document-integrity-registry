import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSavedTheme,
  applyThemeToDOM,
  saveTheme,
  toggleThemeWithTransition,
  THEME_STORAGE_KEY,
} from '../utils/theme';

describe('Theme management utility', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to light theme for first-time visitors when localStorage is empty', () => {
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    const theme = getSavedTheme();
    expect(theme).toBe('light');
  });

  it('retrieves saved dark theme from localStorage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(getSavedTheme()).toBe('dark');
  });

  it('retrieves saved light theme from localStorage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(getSavedTheme()).toBe('light');
  });

  it('applies dark theme to DOM element classes and attributes', () => {
    applyThemeToDOM('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('applies light theme to DOM element classes and attributes', () => {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');

    applyThemeToDOM('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('persists theme choice in localStorage', () => {
    saveTheme('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    saveTheme('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('toggles from light to dark theme and updates storage and DOM', async () => {
    const next = await toggleThemeWithTransition('light');
    expect(next).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles from dark to light theme and updates storage and DOM', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    applyThemeToDOM('dark');

    const next = await toggleThemeWithTransition('dark');
    expect(next).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('honors prefers-reduced-motion by switching immediately without throwing', async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const next = await toggleThemeWithTransition('light');
    expect(next).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    window.matchMedia = originalMatchMedia;
  });
});
