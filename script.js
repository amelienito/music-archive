// ── State ─────────────────────────────────────────────────────────────────────
let activeGroup  = "Tous";
let searchQuery  = "";
const coverCache = {}; // "Artist||Album" → url | null

// ── DOM ───────────────────────────────────────────────────────────────────────
const grid      = document.getElementById("grid");
const filtersEl = document.getElementById("filters");
const emptyEl   = document.getElementById("empty");
const countEl   = document.getElementById("count");
const searchEl  = document.getElementById("search");
const overlay   = document.getElementById("overlay");

// ── Groups ────────────────────────────────────────────────────────────────────
function getGroups() {
  const seen = new Set();
  tracks.forEach(t => seen.add(t.group));
  return ["Tous", ...seen];
}

// Couleurs douces sur fond beige
const PALETTE = ["#8b7355","#6b8c6b","#7a6b8c","#8c6b6b","#5c7a8c","#8c7a5c","#6b7a8c","#8c6b7a"];
function groupColor(group) {
  const list = getGroups().slice(1);
  return PALETTE[list.indexOf(group) % PALETTE.length];
}

function cacheKey(t) { return `${t.artist}||${t.album}`; }

function initials(t) {
  const src = t.title || t.artist || "?";
  return src.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// ── Cover art — MusicBrainz + Cover Art Archive ───────────────────────────────
let fetchQueue = Promise.resolve();

async function fetchCover(track) {
  const key = cacheKey(track);
  if (coverCache[key] !== undefined) return;
  coverCache[key] = null;

  fetchQueue = fetchQueue
    .then(() => new Promise(r => setTimeout(r, 300)))
    .then(async () => {
      try {
        const artist  = encodeURIComponent((track.artist || "").split(/[,&(]/)[0].trim());
        const release = encodeURIComponent(track.album.trim());
        const url     = `https://musicbrainz.org/ws/2/release/?query=release:${release}+artist:${artist}&limit=1&fmt=json`;
        const res     = await fetch(url, { headers: { "User-Agent": "MusicArchive/1.0" } });
        if (!res.ok) return;
        const data    = await res.json();
        const rel     = data.releases?.[0];
        if (!rel) return;

        // Essai 1 : release directe
        const caRes = await fetch(`https://coverartarchive.org/release/${rel.id}/front-500`);
        if (caRes.ok || caRes.redirected) {
          coverCache[key] = caRes.url;
        } else {
          // Essai 2 : release-group
          const rgid = rel["release-group"]?.id;
          if (rgid) {
            const rgRes = await fetch(`https://coverartarchive.org/release-group/${rgid}/front-500`);
            if (rgRes.ok || rgRes.redirected) coverCache[key] = rgRes.url;
          }
        }
      } catch (_) {}
      updateCardCover(track);
    });
}

function updateCardCover(track) {
  const key = cacheKey(track);
  const url = coverCache[key];
  if (!url) return;
  document.querySelectorAll(`.card[data-key="${CSS.escape(key)}"]`).forEach(card => {
    const wrap = card.querySelector(".cover-wrap");
    if (wrap.querySelector("img")) return;
    const ph = wrap.querySelector(".placeholder");
    const img = document.createElement("img");
    img.src = url; img.alt = track.title; img.loading = "lazy";
    wrap.insertBefore(img, ph);
    if (ph) ph.remove();
  });
}

// ── Filter ────────────────────────────────────────────────────────────────────
function filtered() {
  const q = searchQuery.toLowerCase();
  return tracks.filter(t => {
    const matchGroup = activeGroup === "Tous" || t.group === activeGroup;
    const matchSearch = !q ||
      t.title.toLowerCase().includes(q)  ||
      t.artist.toLowerCase().includes(q) ||
      (t.album || "").toLowerCase().includes(q);
    return matchGroup && matchSearch;
  });
}

// ── Render filters ────────────────────────────────────────────────────────────
function renderFilters() {
  filtersEl.innerHTML = "";
  getGroups().forEach(g => {
    const btn = document.createElement("button");
    btn.className = "pill" + (activeGroup === g ? " active" : "");
    btn.textContent = g;
    btn.onclick = () => { activeGroup = g; renderFilters(); renderGrid(); };
    filtersEl.appendChild(btn);
  });
}

// ── Render grid ───────────────────────────────────────────────────────────────
function renderGrid() {
  const list = filtered();
  grid.innerHTML = "";
  countEl.textContent = list.length + " titre" + (list.length !== 1 ? "s" : "");
  emptyEl.style.display = list.length ? "none" : "block";

  list.forEach(t => {
    const key       = cacheKey(t);
    const manualUrl = t.cover?.trim();
    const cachedUrl = coverCache[key];
    const coverUrl  = manualUrl || cachedUrl || null;
    const color     = groupColor(t.group);

    const card = document.createElement("div");
    card.className  = "card";
    card.dataset.key = key;

    card.innerHTML = `
      <div class="cover-wrap">
        ${coverUrl
          ? `<img src="${coverUrl}" alt="${t.title}" loading="lazy">`
          : `<div class="placeholder" style="background:${color}18;color:${color}">${initials(t)}</div>`
        }
        <div class="cover-overlay">
          <div class="ov-title">${t.title}</div>
          <div class="ov-artist">${t.artist}</div>
        </div>
      </div>
      <div class="card-title">${t.title}</div>
      <div class="card-artist">${t.artist}</div>
    `;

    card.addEventListener("click", () => openModal(t));
    grid.appendChild(card);

    if (!manualUrl && coverCache[key] === undefined) fetchCover(t);
  });
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal(t) {
  const key       = cacheKey(t);
  const manualUrl = t.cover?.trim();
  const cachedUrl = coverCache[key];
  const coverUrl  = manualUrl || cachedUrl || null;
  const color     = groupColor(t.group);

  const mCover = document.getElementById("mCover");
  const mPh    = document.getElementById("mCoverPlaceholder");

  if (coverUrl) {
    mCover.src = coverUrl;
    mCover.style.display = "block";
    mPh.style.display = "none";
  } else {
    mCover.style.display = "none";
    mPh.style.display = "flex";
    mPh.textContent = initials(t);
    mPh.style.background = `${color}18`;
    mPh.style.color = color;
    document.querySelector(".modal-cover-area").style.background = `${color}18`;
  }

  document.getElementById("mTitle").textContent  = t.title;
  document.getElementById("mArtist").textContent = t.artist;
  document.getElementById("mAlbum").textContent  = t.album ? `— ${t.album}` : "";
  document.getElementById("mNote").textContent   = t.note || "";
  document.getElementById("mLink").href          = t.link;
  document.getElementById("mGroup").textContent  = t.group;

  overlay.classList.remove("hidden");
}

function closeModal() { overlay.classList.add("hidden"); }

document.getElementById("close").addEventListener("click", closeModal);
overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

// ── Search ────────────────────────────────────────────────────────────────────
searchEl.addEventListener("input", () => {
  searchQuery = searchEl.value;
  activeGroup = "Tous";
  renderFilters();
  renderGrid();
});

// ── Init ──────────────────────────────────────────────────────────────────────
renderFilters();
renderGrid();
