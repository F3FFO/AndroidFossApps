const STORAGE_KEY = 'afa-theme';

export function init() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = saved || (prefersDark ? 'dark' : 'light');
}

export function toggle() {
  const root = document.documentElement;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem(STORAGE_KEY, next);
}
