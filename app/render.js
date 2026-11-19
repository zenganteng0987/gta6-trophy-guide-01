// Rendering for the guide: trophy cards carrying the official name, description and
// grade next to our own guide text and its cited sources, the roadmap stages with the
// trophies in the order to earn them, and the spoiler shield that masks unearned
// story trophies. All DOM is built with textContent, never by injecting markup.

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function kindLabel(kind) {
  const labels = {
    story: 'Story',
    collectibles: 'Collectibles',
    activities: 'Activities',
    platinum: 'Platinum',
  };
  return labels[kind] ?? kind;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function sourceLinks(sources) {
  const line = el('p', 'sources');
  line.append('Sources: ');
  sources.forEach((source, i) => {
    if (i > 0) line.append(' · ');
    const a = document.createElement('a');
    a.href = source.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = source.name;
    line.append(a);
  });
  return line;
}

// One trophy card. `view` carries the saved progress, the spoiler setting, which
// guides are open, and the callbacks that record a tick or a count.
export function buildTrophyCard(trophy, view) {
  const earned = view.progress.earned.has(trophy.name);
  const masked =
    view.spoilerOn && trophy.kind === 'story' && !earned;

  const card = el('article', `card grade-${trophy.grade}${earned ? ' is-earned' : ''}`);
  card.id = `trophy-${trophy.id}`;
  card.dataset.name = trophy.name;

  const head = el('div', 'card-head');
  const earnLabel = el('label', 'earn');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned;
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => view.onToggleEarned(trophy.name, box.checked));
  earnLabel.append(box, ' Earned');
  head.append(earnLabel);
  head.append(el('span', `badge badge-${trophy.grade}`, gradeLabel(trophy.grade)));
  head.append(el('span', 'tag', kindLabel(trophy.kind)));
  if (trophy.missable) head.append(el('span', 'tag tag-missable', '⚠ Missable'));
  if (trophy.hidden) head.append(el('span', 'tag tag-hidden', 'Hidden on PlayStation'));
  head.append(el('span', 'tag tag-stage', `Roadmap stage ${trophy.stage}`));
  card.append(head);

  if (masked) {
    card.append(el('h3', 'trophy-name masked', 'Hidden story trophy'));
    card.append(
      el(
        'p',
        'trophy-desc masked',
        'Spoiler shield is on: this story trophy\u2019s name and description stay hidden until you earn it and tick it here.',
      ),
    );
  } else {
    card.append(el('h3', 'trophy-name', trophy.name));
    card.append(el('p', 'trophy-desc', `\u201C${trophy.description}\u201D`));
  }

  if (trophy.count) card.append(buildCountRow(trophy, view));

  const toggle = el(
    'button',
    'guide-toggle',
    view.openGuides.has(trophy.name) ? 'Hide guide & sources ▴' : 'Guide & sources ▾',
  );
  toggle.type = 'button';
  const guideBox = buildGuideBox(trophy, masked);
  guideBox.hidden = !view.openGuides.has(trophy.name);
  toggle.addEventListener('click', () => {
    const open = guideBox.hidden;
    guideBox.hidden = !open;
    toggle.textContent = open ? 'Hide guide & sources ▴' : 'Guide & sources ▾';
    if (open) view.openGuides.add(trophy.name);
    else view.openGuides.delete(trophy.name);
  });
  card.append(toggle, guideBox);
  return card;
}

function buildCountRow(trophy, view) {
  const row = el('p', 'count-row');
  const current = view.progress.counts.get(trophy.name) ?? 0;
  row.append(el('span', 'count-label', 'Your progress: '));
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.step = '1';
  input.value = String(current);
  input.setAttribute('aria-label', `Your count for ${trophy.name}`);
  input.addEventListener('change', () => {
    const n = Number(input.value);
    view.onCountChange(trophy.name, Number.isFinite(n) && n > 0 ? n : 0);
  });
  row.append(input);
  row.append(
    el('span', 'count-target', ` / ${trophy.count.toLocaleString('en-US')} ${trophy.unit ?? ''}`),
  );
  if (current >= trophy.count) row.append(el('span', 'count-done', ' — target reached, tick it earned'));
  return row;
}

function buildGuideBox(trophy, masked) {
  const box = el('div', 'guide');
  if (masked) {
    box.append(
      el('p', 'guide-text', 'Guide hidden by the spoiler shield until this trophy is earned.'),
    );
    return box;
  }
  box.append(el('p', 'guide-text', trophy.guide));
  if (Array.isArray(trophy.steps) && trophy.steps.length) {
    const list = el('ol', 'steps');
    for (const step of trophy.steps) list.append(el('li', '', step));
    box.append(list);
  }
  if (Array.isArray(trophy.sources) && trophy.sources.length) {
    box.append(sourceLinks(trophy.sources));
  }
  return box;
}

export function renderTrophyList(container, trophies, view) {
  container.replaceChildren();
  for (const trophy of trophies) container.append(buildTrophyCard(trophy, view));
}

// The roadmap: one card per stage, its summary, and the stage's trophies as chips
// in official order. Clicking a chip jumps to that trophy's card.
export function renderRoadmap(container, roadmap, trophies, onSelectTrophy) {
  container.replaceChildren();
  for (const stage of roadmap) {
    const card = el('article', 'stage-card');
    const head = el('div', 'stage-head');
    head.append(el('span', 'stage-number', `Stage ${stage.stage}`));
    head.append(el('h3', 'stage-title', stage.title));
    head.append(el('span', 'stage-hours', stage.hours));
    card.append(head);
    card.append(el('p', 'stage-text', stage.text));
    const chips = el('div', 'stage-chips');
    for (const trophy of trophies.filter((t) => t.stage === stage.stage)) {
      const chip = el(
        'button',
        `chip-trophy${trophy.missable ? ' chip-missable' : ''}`,
        trophy.missable ? `${trophy.name} ⚠` : trophy.name,
      );
      chip.type = 'button';
      chip.addEventListener('click', () => onSelectTrophy(trophy.name));
      chips.append(chip);
    }
    card.append(chips);
    container.append(card);
  }
}
