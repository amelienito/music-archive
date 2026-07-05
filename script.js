// ── State ─────────────────────────────────────────────────────────────────────
let activeGroup  = "Tous";
let searchQuery  = "";
const coverCache = {};

// Radio state
let radioIndex   = 0;
let radioActive  = false;

// ── DOM ───────────────────────────────────────────────────────────────────────
const grid       = document.getElementById("grid");
const filtersEl  = document.getElementById("filters");
const emptyEl    = document.getElementById("empty");
const countEl    = document.getElementById("count");
const searchEl   = document.getElementById("search");
const overlay    = document.getElementById("overlay");
const radioBar   = document.getElementById("radioBar");
const radioBtn   = document.getElementById("radioBtn");

// ── Helpers ───────────────────────────────────────────────────────────────────
function getGroups() {
  const seen = new Set();
  tracks.forEach(t => seen.add(t.group));
  return ["Tous", ...seen];
}

const PALETTE = ["#7a6b5a","#5c7a6b","#6b5c7a","#7a5c5c","#5c6b7a","#7a6b5c","#5c7a7a","#7a5c6b"];
function groupColor(group) {
  const list = getGroups().slice(1);
  return PALETTE[list.indexOf(group) % PALETTE.length];
}

function cacheKey(t) { return `${t.artist}||${t.album}`; }

function initials(t) {
  const src = t.title || t.artist || "?";
  return src.trim().split(/\s+/).slice(0,2).map(w => w[0]).join("").toUpperCase();
}

// Extrait l'ID YouTube d'une URL
function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/[?&v=]([a-zA-Z0-9_-]{11})|youtu\.be\/([a-zA-Z0-9_-]{11})/);
  return m ? (m[1] || m[2]) : null;
}

// ── Radio playlist ────────────────────────────────────────────────────────────
// La playlist est définie dans data.js via `const playlist = [...]`
// Si elle n'existe pas, on utilise tous les tracks dans l'ordre.
function getPlaylist() {
  if (typeof playlist !== "undefined" && playlist.length > 0) {
    return playlist.map(title => tracks.find(t => t.title === title)).filter(Boolean);
  }
  return [...tracks];
}

// ── Cover art — MusicBrainz ───────────────────────────────────────────────────
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
        const res     = await fetch(`https://musicbrainz.org/ws/2/release/?query=release:${release}+artist:${artist}&limit=1&fmt=json`,
          { headers: { "User-Agent": "MusicArchive/1.0" } });
        if (!res.ok) return;
        const data = await res.json();
        const rel  = data.releases?.[0];
        if (!rel) return;

        const caRes = await fetch(`https://coverartarchive.org/release/${rel.id}/front-500`);
        if (caRes.ok || caRes.redirected) { coverCache[key] = caRes.url; }
        else {
          const rgid = rel["release-group"]?.id;
          if (rgid) {
            const rgRes = await fetch(`https://coverartarchive.org/release-group/${rgid}/front-500`);
            if (rgRes.ok || rgRes.redirected) coverCache[key] = rgRes.url;
          }
        }
      } catch(_) {}
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
    const ph  = wrap.querySelector(".placeholder");
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
    const matchGroup  = activeGroup === "Tous" || t.group === activeGroup;
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || (t.album||"").toLowerCase().includes(q);
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

  const pl = getPlaylist();
  const currentTrack = radioActive ? pl[radioIndex] : null;

  list.forEach((t, i) => {
    const key       = cacheKey(t);
    const manualUrl = t.cover?.trim();
    const cachedUrl = coverCache[key];
    const coverUrl  = manualUrl || cachedUrl || null;
    const color     = groupColor(t.group);
    const isPlaying = currentTrack && t.title === currentTrack.title;

    // durée et délai de flottement uniques par carte
    const dur   = (5 + (i % 5) * 0.7).toFixed(1) + "s";
    const delay = ((i % 7) * 0.4).toFixed(1) + "s";

    const card = document.createElement("div");
    card.className   = "card float" + (isPlaying ? " playing" : "");
    card.dataset.key = key;
    card.style.setProperty("--dur", dur);
    card.style.setProperty("--delay", delay);

    card.innerHTML = `
      <div class="cover-wrap">
        ${coverUrl
          ? `<img src="${coverUrl}" alt="${t.title}" loading="lazy">`
          : `<div class="placeholder" style="background:${color}22;color:${color}">${initials(t)}</div>`
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
let modalPlayerOpen = false;

function openModal(t) {
  const key       = cacheKey(t);
  const manualUrl = t.cover?.trim();
  const cachedUrl = coverCache[key];
  const coverUrl  = manualUrl || cachedUrl || null;
  const color     = groupColor(t.group);

  const mCover  = document.getElementById("mCover");
  const mPh     = document.getElementById("mCoverPlaceholder");
  const mPlayer = document.getElementById("mPlayer");
  const mPWrap  = document.getElementById("mPlayerWrap");
  const mPlayBtn= document.getElementById("mPlayBtn");

  // Reset player
  modalPlayerOpen = false;
  mPlayer.src = "";
  mPWrap.classList.add("hidden");
  mCover.classList.remove("dimmed");
  mPlayBtn.classList.remove("playing");

  if (coverUrl) {
    mCover.src = coverUrl;
    mCover.style.display = "block";
    mPh.style.display = "none";
  } else {
    mCover.style.display = "none";
    mPh.style.display = "flex";
    mPh.textContent = initials(t);
    mPh.style.background = `${color}22`;
    mPh.style.color = color;
  }

  document.getElementById("mTitle").textContent  = t.title;
  document.getElementById("mArtist").textContent = t.artist;
  document.getElementById("mAlbum").textContent  = t.album ? `— ${t.album}` : "";
  document.getElementById("mNote").textContent   = t.note || "";
  document.getElementById("mLink").href          = t.link;
  document.getElementById("mGroup").textContent  = t.group;

  // Bouton play : ouvre l'iframe YouTube si ID détectable, sinon ouvre le lien
  const ytId = extractYouTubeId(t.link);
  mPlayBtn.onclick = () => {
    if (ytId) {
      modalPlayerOpen = !modalPlayerOpen;
      if (modalPlayerOpen) {
        mPlayer.src = `https://www.youtube.com/embed/${ytId}?autoplay=1`;
        mPWrap.classList.remove("hidden");
        mCover.classList.add("dimmed");
        mPlayBtn.classList.add("playing");
      } else {
        mPlayer.src = "";
        mPWrap.classList.add("hidden");
        mCover.classList.remove("dimmed");
        mPlayBtn.classList.remove("playing");
      }
    } else {
      window.open(t.link, "_blank");
    }
  };

  // Bouton "+ radio" : ajoute en tête de playlist et lance
  document.getElementById("mRadioAdd").onclick = () => {
    const pl = getPlaylist();
    const idx = pl.findIndex(x => x.title === t.title);
    radioIndex = idx >= 0 ? idx : 0;
    startRadio();
    closeModal();
  };

  overlay.classList.remove("hidden");
}

function closeModal() {
  const mPlayer = document.getElementById("mPlayer");
  mPlayer.src = "";
  document.getElementById("mPlayerWrap").classList.add("hidden");
  document.getElementById("mCover").classList.remove("dimmed");
  overlay.classList.add("hidden");
}

document.getElementById("close").addEventListener("click", closeModal);
overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

// ── Radio ─────────────────────────────────────────────────────────────────────
function startRadio() {
  radioActive = true;
  radioBtn.classList.add("active");
  updateRadioBar();
  radioBar.classList.remove("hidden");
  renderGrid();
}

function stopRadio() {
  radioActive = false;
  radioBtn.classList.remove("active");
  radioBar.classList.add("hidden");
  renderGrid();
}

function updateRadioBar() {
  const pl = getPlaylist();
  const t  = pl[radioIndex];
  if (!t) return;
  document.getElementById("radioTitle").textContent  = t.title;
  document.getElementById("radioArtist").textContent = t.artist;
  // scrolle la carte visible en vue
  const key  = cacheKey(t);
  const card = document.querySelector(`.card[data-key="${CSS.escape(key)}"]`);
  if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
}

radioBtn.addEventListener("click", () => {
  if (radioActive) stopRadio();
  else startRadio();
});

document.getElementById("radioPrev").addEventListener("click", () => {
  const pl = getPlaylist();
  radioIndex = (radioIndex - 1 + pl.length) % pl.length;
  updateRadioBar();
  renderGrid();
});

document.getElementById("radioNext").addEventListener("click", () => {
  const pl = getPlaylist();
  radioIndex = (radioIndex + 1) % pl.length;
  updateRadioBar();
  renderGrid();
});

document.getElementById("radioOpen").addEventListener("click", () => {
  const pl = getPlaylist();
  const t  = pl[radioIndex];
  if (t) window.open(t.link, "_blank");
});

document.getElementById("radioClose").addEventListener("click", stopRadio);

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
