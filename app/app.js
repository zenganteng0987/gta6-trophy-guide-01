// Leonida Legend: an offline trophy guide and tracker for Grand Theft Auto VI.
// It loads only data/trophies.json from its own folder, keeps progress in
// localStorage, and never reaches the network.

const STORE_KEY = "leonida-legend-v1";
const KIND_LABELS = {
  story: "Story",
  missable: "Missable",
  collectibles: "Collectibles",
  activities: "Activities",
  online: "Online",
};

// The five-stage road to the platinum, built from the official descriptions.
const ROADMAP = [
  {
    title: "Stage 1 — Chapter 1: play it safe",
    text: "Play the opening mission Gone Fishing and finish Chapter 1. Do the balcony meditation with Lucia before the chapter ends, and keep a manual save from the start of the chapter. There is no mission replay, so saves are your only way back.",
    trophies: [2, 3, 28],
  },
  {
    title: "Stage 2 — Chapters 2 and 3: open Leonida",
    text: "Finish Chapters 2 and 3, switch between Jason and Lucia, and start the free-roam work: scan vehicles and WAiNK spots, try every activity once, win races, play the arcade, and take the side strands as they appear.",
    trophies: [4, 5, 8, 9, 10, 11, 15, 16, 17, 18, 19, 20, 21, 25, 29, 30, 31, 32, 35, 36, 39, 42, 43, 44, 45, 46, 47, 51, 52, 53, 54, 55],
  },
  {
    title: "Stage 3 — Chapter 4 and the finale",
    text: "Finish Chapter 4 and the final mission. Open the bank vaults through the optional mission near the end of the chapter, steal the plane and the tank, and work the robbery trophies while your partner is beside you.",
    trophies: [6, 7, 12, 13, 33, 34, 37, 38, 40, 41, 48, 49, 50],
  },
  {
    title: "Stage 4 — After the credits: the 100% checklist",
    text: "Work the checklist that appears under Progress, Stats, 100% Completion: 300 stunts, 70 of the 80 challenges, 100 WAiNK spots, every bank vault and illegal operation, and the side-character finales for Andy, Kenton, Billy, Randy and Tyrone.",
    trophies: [14, 22, 23, 24, 26, 27],
  },
  {
    title: "Stage 5 — Clean-up and the platinum",
    text: "Sweep up whatever is left, then the platinum, Vice Got a Price!, pops on its own. PowerPyx puts the whole run at about 200 hours.",
    trophies: [1],
  },
];

const state = {
  trophies: [],
  earned: new Set(),
  filter: "all",
  query: "",
  hideSpoilers: false,
  hideEarned: false,
  openGuide: null,
};

const $ = (id) => document.getElementById(id);
const listEl = $("trophyList");
const metaEl = $("listMeta");
const noResultsEl = $("noResults");
const onlineNoteEl = $("onlineNote");

function loadStored() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.earned)) return new Set();
    return new Set(parsed.earned.filter((n) => Number.isInteger(n)));
  } catch (err) {
    return new Set();
  }
}

function saveStored() {
  const payload = { app: "leonida-legend", version: 1, earned: [...state.earned].sort((a, b) => a - b) };
  localStorage.setItem(STORE_KEY, JSON.stringify(payload));
  $("saveNote").textContent = "Progress saved in this browser.";
}

function gradeWord(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function isSpoilerHidden(trophy) {
  return state.hideSpoilers && trophy.kind === "story" && !state.earned.has(trophy.id);
}

function visibleTrophies() {
  return state.trophies.filter((trophy) => {
    if (state.filter === "missable" && !trophy.missable) return false;
    if (state.filter === "online") return false;
    if (state.filter !== "all" && state.filter !== "missable" && trophy.kind !== state.filter) return false;
    if (state.hideEarned && state.earned.has(trophy.id)) return false;
    if (state.query) {
      const hay = (trophy.name + " " + trophy.description).toLowerCase();
      if (!hay.includes(state.query)) return false;
    }
    return true;
  });
}

function trophyCard(trophy) {
  const earned = state.earned.has(trophy.id);
  const spoiler = isSpoilerHidden(trophy);
  const li = document.createElement("li");
  li.className = "trophy" + (earned ? " earned" : "");
  li.dataset.trophyId = String(trophy.id);

  const head = document.createElement("div");
  head.className = "trophy-head";

  const check = document.createElement("input");
  check.type = "checkbox";
  check.className = "trophy-check";
  check.checked = earned;
  check.setAttribute("aria-label", "Mark " + trophy.name + " as earned");
  check.addEventListener("change", () => {
    if (check.checked) state.earned.add(trophy.id);
    else state.earned.delete(trophy.id);
    saveStored();
    render();
  });
  head.appendChild(check);

  const title = document.createElement("div");
  title.className = "trophy-title";
  const name = document.createElement("h3");
  name.className = "trophy-name";
  name.textContent = spoiler ? "Hidden trophy" : trophy.name;
  title.appendChild(name);
  const desc = document.createElement("p");
  if (spoiler) {
    desc.className = "trophy-hidden-note";
    desc.textContent = "A story trophy. Earn it to reveal its name and description.";
  } else {
    desc.className = "trophy-desc";
    desc.textContent = trophy.description;
  }
  title.appendChild(desc);
  head.appendChild(title);

  const grade = document.createElement("span");
  grade.className = "grade grade-" + trophy.grade;
  grade.textContent = gradeWord(trophy.grade);
  head.appendChild(grade);
  li.appendChild(head);

  const tags = document.createElement("div");
  tags.className = "tag-row";
  const kindTag = document.createElement("span");
  kindTag.className = "tag";
  kindTag.textContent = KIND_LABELS[trophy.kind] || trophy.kind;
  tags.appendChild(kindTag);
  const stageTag = document.createElement("span");
  stageTag.className = "tag";
  stageTag.textContent = "Stage " + trophy.stage;
  tags.appendChild(stageTag);
  if (trophy.hidden) {
    const hiddenTag = document.createElement("span");
    hiddenTag.className = "tag tag-hidden";
    hiddenTag.textContent = "Hidden on PS5";
    tags.appendChild(hiddenTag);
  }
  if (trophy.missable) {
    const missTag = document.createElement("span");
    missTag.className = "tag tag-missable";
    missTag.textContent = "Missable — do it in Chapter 1";
    tags.appendChild(missTag);
  }
  li.appendChild(tags);

  if (!spoiler) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "guide-toggle";
    const open = state.openGuide === trophy.id;
    toggle.textContent = open ? "Hide guide" : "Show guide";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.addEventListener("click", () => {
      state.openGuide = open ? null : trophy.id;
      render();
    });
    li.appendChild(toggle);

    if (open) {
      const body = document.createElement("div");
      body.className = "guide-body";
      const guideText = document.createElement("p");
      guideText.textContent = trophy.guide;
      body.appendChild(guideText);
      const sources = document.createElement("p");
      sources.className = "guide-sources";
      const strong = document.createElement("strong");
      strong.textContent = "Sources: ";
      sources.appendChild(strong);
      sources.appendChild(document.createTextNode(trophy.sources.join(", ")));
      body.appendChild(sources);
      li.appendChild(body);
    }
  }

  return li;
}

function renderRoadmap() {
  const list = $("roadmapList");
  list.textContent = "";
  for (const stage of ROADMAP) {
    const li = document.createElement("li");
    const count = document.createElement("span");
    count.className = "stage-count";
    const done = stage.trophies.filter((id) => state.earned.has(id)).length;
    count.textContent = done + " / " + stage.trophies.length + " earned";
    li.appendChild(count);
    const title = document.createElement("h3");
    title.textContent = stage.title;
    li.appendChild(title);
    const text = document.createElement("p");
    text.textContent = stage.text;
    li.appendChild(text);
    list.appendChild(li);
  }
}

function renderProgress() {
  const total = state.trophies.length;
  const done = state.earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  $("progressText").textContent = done + " of " + total + " earned";
  $("progressPct").textContent = pct + "%";
  $("progressFill").style.width = pct + "%";
  const counts = ["platinum", "gold", "silver", "bronze"]
    .map((grade) => {
      const all = state.trophies.filter((t) => t.grade === grade).length;
      const got = state.trophies.filter((t) => t.grade === grade && state.earned.has(t.id)).length;
      return gradeWord(grade) + " " + got + "/" + all;
    })
    .join(" · ");
  $("gradeCounts").textContent = counts;
  $("miniProgress").textContent = done + " of " + total + " earned · " + pct + "% to the platinum";
}

function render() {
  renderProgress();
  renderRoadmap();
  onlineNoteEl.hidden = state.filter !== "online";
  const shown = visibleTrophies();
  listEl.textContent = "";
  for (const trophy of shown) listEl.appendChild(trophyCard(trophy));
  noResultsEl.hidden = shown.length > 0;
  const shownCount = shown.length;
  const earnedShown = shown.filter((t) => state.earned.has(t.id)).length;
  metaEl.textContent =
    "Showing " + shownCount + " of " + state.trophies.length + " trophies" +
    (shownCount ? " (" + earnedShown + " earned in this view)" : "") + ".";
}

function exportProgress() {
  const payload = {
    app: "leonida-legend",
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "leonida-legend-progress.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  $("saveNote").textContent = "Progress exported to a file.";
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const ids = Array.isArray(parsed.earned) ? parsed.earned : parsed;
      if (!Array.isArray(ids)) throw new Error("not a progress file");
      const valid = new Set(state.trophies.map((t) => t.id));
      state.earned = new Set(ids.filter((n) => Number.isInteger(n) && valid.has(n)));
      saveStored();
      render();
      $("saveNote").textContent = "Progress imported: " + state.earned.size + " trophies earned.";
    } catch (err) {
      $("saveNote").textContent = "That file is not a Leonida Legend progress export.";
    }
  };
  reader.readAsText(file);
}

function readDeepLinks() {
  const params = new URLSearchParams(window.location.search);
  const filter = params.get("filter");
  if (filter && ["all", "story", "missable", "collectibles", "activities", "online"].includes(filter)) {
    state.filter = filter;
  }
  if (params.get("spoilers") === "on") state.hideSpoilers = true;
  const open = Number(params.get("open"));
  if (Number.isInteger(open)) state.openGuide = open;
  const earned = params.get("earned");
  if (earned) {
    const valid = new Set(state.trophies.map((t) => t.id));
    for (const part of earned.split(",")) {
      const id = Number(part.trim());
      if (Number.isInteger(id) && valid.has(id)) state.earned.add(id);
    }
    saveStored();
  }
}

function syncControls() {
  document.querySelectorAll("#filterRow .filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === state.filter);
  });
  $("spoilerToggle").checked = state.hideSpoilers;
  $("hideEarnedToggle").checked = state.hideEarned;
}

async function start() {
  const response = await fetch("data/trophies.json");
  const data = await response.json();
  state.trophies = data.trophies;
  state.earned = loadStored();

  document.querySelectorAll("#filterRow .filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filter = btn.dataset.filter;
      syncControls();
      render();
    });
  });
  $("searchBox").addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    render();
  });
  $("spoilerToggle").addEventListener("change", (event) => {
    state.hideSpoilers = event.target.checked;
    render();
  });
  $("hideEarnedToggle").addEventListener("change", (event) => {
    state.hideEarned = event.target.checked;
    render();
  });
  $("exportBtn").addEventListener("click", exportProgress);
  $("importFile").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) importProgress(file);
    event.target.value = "";
  });
  $("resetBtn").addEventListener("click", () => {
    state.earned = new Set();
    saveStored();
    render();
    $("saveNote").textContent = "Progress reset.";
  });

  readDeepLinks();
  syncControls();
  render();
}

start();
