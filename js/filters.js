import { iconFor } from './icons.js';

/**
 * Builds the tag filter chips inside the given container.
 * Calls onChange(tag, checked) whenever a chip is toggled.
 */
export function buildTagChips(apps, container, onChange) {
  const counts = {};
  for (const app of apps) {
    for (const tag of app.tags) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }

  const sorted = Object.keys(counts).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

  container.innerHTML = '';

  for (const tag of sorted) {
    const label = document.createElement('label');
    label.className = 'tag-chip';
    label.dataset.tag = tag.toLowerCase();

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = tag;
    input.addEventListener('change', () => onChange(tag, input.checked));

    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined tag-icon';
    icon.textContent = iconFor(tag);

    const name = document.createElement('span');
    name.textContent = tag;

    const count = document.createElement('span');
    count.className = 'tag-count';
    count.textContent = counts[tag];

    label.append(input, icon, name, count);
    container.appendChild(label);
  }
}

/** Show/hide tag chips that match a search query */
export function filterChips(container, query) {
  const q = query.toLowerCase();
  for (const chip of container.querySelectorAll('.tag-chip')) {
    chip.style.display = chip.dataset.tag.includes(q) ? '' : 'none';
  }
}

/** Update the filter badge number (hides when count is 0) */
export function updateBadge(el, count) {
  el.textContent = count;
  el.hidden = count === 0;
}

/**
 * Wire up the filter dropdown open/close.
 * Closes on outside click or Escape.
 */
export function setupDropdown(toggleBtn, panel) {
  let open = false;

  function show() {
    panel.hidden = false;
    toggleBtn.classList.add('active');
    open = true;
    requestAnimationFrame(() => {
      document.addEventListener('click', onOutsideClick);
    });
  }

  function hide() {
    panel.hidden = true;
    toggleBtn.classList.remove('active');
    open = false;
    document.removeEventListener('click', onOutsideClick);
  }

  function onOutsideClick(e) {
    if (!panel.contains(e.target) && !toggleBtn.contains(e.target)) {
      hide();
    }
  }

  toggleBtn.addEventListener('click', () => open ? hide() : show());

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && open) hide();
  });

  return { show, hide };
}

/** Uncheck every tag chip in the container */
export function clearTagSelection(container) {
  for (const cb of container.querySelectorAll('input[type="checkbox"]')) {
    cb.checked = false;
  }
}
