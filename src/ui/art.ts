import type { Kind, Topping } from '../core/types';

export const KIND_COLORS: Record<Kind, { fill: string; edge: string; name: string }> = {
  rice: { fill: '#FBF7EE', edge: '#D3C7AC', name: 'rice' },
  tamago: { fill: '#F6C945', edge: '#D9A514', name: 'tamago' },
  salmon: { fill: '#F59479', edge: '#D9684C', name: 'salmon' },
  tofu: { fill: '#F1E3C4', edge: '#CDB98F', name: 'tofu' },
  sausage: { fill: '#E0584B', edge: '#B23A2F', name: 'sausage' },
  carrot: { fill: '#F28A2E', edge: '#C9661A', name: 'carrot' },
};

export const TOPPING_NAMES: Record<Exclude<Topping, '.'>, string> = {
  S: 'salmon',
  E: 'edamame',
  N: 'nori',
};

/** A topping drawn on food. */
export function toppingSvg(t: Topping): string {
  switch (t) {
    case 'S':
      return `<svg viewBox="0 0 40 40" aria-hidden="true"><g transform="rotate(-20 20 20)"><rect x="6" y="12" width="28" height="16" rx="8" fill="#F38B6B" stroke="#D9684C" stroke-width="1"/><path d="M15 13l-3 14M21 13l-3 14M27 13l-3 14" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".75"/></g></svg>`;
    case 'E':
      return `<svg viewBox="0 0 40 40" aria-hidden="true"><g transform="rotate(-20 20 20)"><rect x="5" y="13" width="30" height="14" rx="7" fill="#4E9A49"/><circle cx="12" cy="20" r="4.5" fill="#8FD47F"/><circle cx="20" cy="20" r="4.5" fill="#8FD47F"/><circle cx="28" cy="20" r="4.5" fill="#8FD47F"/></g></svg>`;
    case 'N':
      return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="7" y="13" width="26" height="14" rx="3" fill="#2E3B34"/><path d="M13 15v10M20 15v10M27 15v10" stroke="#4D6157" stroke-width="1.5"/></svg>`;
    default:
      return '';
  }
}

/** The faint outline in the box that shows which topping a cell needs. */
export function ghostSvg(t: Topping): string {
  switch (t) {
    case 'S':
      return `<svg viewBox="0 0 40 40" aria-hidden="true"><g transform="rotate(-20 20 20)"><rect x="6" y="12" width="28" height="16" rx="8" fill="rgba(243,139,107,.22)" stroke="#FFB49C" stroke-width="2.5" stroke-dasharray="4 3"/></g></svg>`;
    case 'E':
      return `<svg viewBox="0 0 40 40" aria-hidden="true"><g transform="rotate(-20 20 20)"><rect x="5" y="13" width="30" height="14" rx="7" fill="rgba(95,175,90,.22)" stroke="#A6E59A" stroke-width="2.5" stroke-dasharray="4 3"/><circle cx="12" cy="20" r="3" fill="#A6E59A"/><circle cx="20" cy="20" r="3" fill="#A6E59A"/><circle cx="28" cy="20" r="3" fill="#A6E59A"/></g></svg>`;
    case 'N':
      return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="7" y="13" width="26" height="14" rx="3" fill="rgba(255,255,255,.12)" stroke="#E8EEF0" stroke-width="2.5" stroke-dasharray="4 3"/></svg>`;
    default:
      return '';
  }
}

const STAR_PATH = 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z';

export function starSvg(on: boolean, size = 24): string {
  const fill = on ? '#F2B705' : 'none';
  const stroke = on ? '#B98A00' : '#8A9A95';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`;
}

const icon = (paths: string, size = 22) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const ICONS = {
  back: icon('<path d="M15 18l-6-6 6-6"/>', 26),
  undo: icon('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
  restart: icon('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'),
  check: icon('<path d="M5 12l5 5 9-10"/>', 16),
  lock: icon('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', 24),
  next: icon('<path d="M9 18l6-6-6-6"/>'),
};
