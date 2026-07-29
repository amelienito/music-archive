/**
 * MUSIC DISCOVERY V0 — Controller
 * =====================================================
 * UN SEUL SYSTÈME : state machine via showScreen().
 * Les boutons appelle showScreen(target) → un seul point d'entrée.
 * ZÉRO scroll, ZÉRO animation hasardeuse.
 * =====================================================
 */

/* ───────────────────────────────────────────────────
   TRACKS — reprise depuis data.js (banque existante)
   ─────────────────────────────────────────────────── */
const ALL_TRACKS = tracks; // défini par data.js

/* ───────────────────────────────────────────────────
   STATE
   ─────────────────────────────────────────────────── */
let currentState = 'INTRO';
let sessionEncountered = []; // tous les morceaux croisés
let sessionKept = [];        // morceaux gardés
let currentCards = [];      // les 3 tracks affichées
let radioIndex = 0;
let activeListenTrack = null;
let currentHistoryTab = 'encountered';

/* ───────────────────────────────────────────────────
   UTILS
   ─────────────────────────────────────────────────── */
function getThreeTracks() {
  const seen = new Set(sessionEncountered.map(t => t.title));
  const pool = ALL_TRACKS.filter(t => !seen.has(t.title));
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function createCardHTML(track) {
  const safeId = track.title.replace(/[^a-zA-Z0-9]/g, '_');
  return `
    <div class="track-card" data-title="${track.title}" data-artist="${track.artist}">
      <div class="card-cover" id="cover-${safeId}">
        <span class="card-initials">${track.title[0]}</span>
      </div>
      <div class="card-info">
        <p class="card-title">${track.title}</p>
        <p class="card-artist">${track.artist}</p>
        <div class="card-actions">
          <button class="btn-card-listen" data-action="listen-track"
            data-title="${track.title}"
            data-artist="${track.artist}"
            data-link="${track.link}"
            data-note="${track.note || ''}">
            ▶ Écouter
          </button>
          <button class="btn-card-keep" data-action="keep-track-from-card"
            data-title="${track.title}"
            data-artist="${track.artist}">
            ♥
          </button>
        </div>
      </div>
    </div>`;
}

function openListenScreen(track) {
  activeListenTrack = track;
  const safeId = track.title.replace(/[^a-zA-Z0-9]/g, '_');
  document.getElementById('listen-cover').innerHTML =
    `<div class="cover-large"><span class="cover-initials">${track.title[0]}</span></div>`;
  document.getElementById('listen-title').textContent = track.title;
  document.getElementById('listen-artist').textContent = track.artist;
  const noteEl = document.getElementById('listen-note');
  noteEl.textContent = track.note || '';
  noteEl.style.display = track.note ? 'block' : 'none';
  document.getElementById('listen-link').href = track.link;
  showScreen('LISTEN');
}

function renderHistory() {
  const encList = document.getElementById('list-encountered');
  const keptList = document.getElementById('list-kept');
  encList.innerHTML = sessionEncountered.map(t =>
    `<li><span class="hist-title">${t.title}</span><span class="hist-artist">${t.artist}</span></li>`
  ).join('');
  keptList.innerHTML = sessionKept.map(t =>
    `<li><span class="hist-title">${t.title}</span><span class="hist-artist">${t.artist}</span></li>`
  ).join('');
}

const container = document.getElementById('cards-container');

function renderCards() {
  container.innerHTML = currentCards.map(createCardHTML).join('');
  attachCardListeners();
}

function attachCardListeners() {
  container.querySelectorAll('[data-action="listen-track"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const track = ALL_TRACKS.find(t => t.title === btn.dataset.title);
      if (track) {
        if (!sessionEncountered.some(t => t.title === track.title)) {
          sessionEncountered.push(track);
        }
        renderHistory();
        openListenScreen(track);
      }
    });
  });
  container.querySelectorAll('[data-action="keep-track-from-card"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const track = ALL_TRACKS.find(t => t.title === btn.dataset.title);
      if (track && !sessionKept.some(t => t.title === track.title)) {
        sessionKept.push(track);
        renderHistory();
      }
    });
  });
}

/* ───────────────────────────────────────────────────
   SCREEN ROUTING — POINT UNIQUE
   ─────────────────────────────────────────────────── */
function showScreen(target) {
  // Masquer tout
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById('panel-history').classList.add('hidden');

  // Topbar visible après l'intro
  const topbar = document.getElementById('topbar');
  topbar.classList.toggle('hidden', target === 'INTRO');

  switch (target) {
    case 'INTRO':
      document.getElementById('screen-intro').classList.remove('hidden');
      currentState = 'INTRO';
      break;

    case 'CHOIX':
      document.getElementById('screen-choix').classList.remove('hidden');
      currentState = 'CHOIX';
      break;

    case 'DISCOVER_TYPE':
      document.getElementById('screen-discover-type').classList.remove('hidden');
      currentState = 'DISCOVER_TYPE';
      break;

    case 'QUESTIONNAIRE':
      document.getElementById('screen-questionnaire').classList.remove('hidden');
      currentState = 'QUESTIONNAIRE';
      break;

    case 'SELECTION':
      // Générer 3 tracks si vide
      if (currentCards.length === 0) currentCards = getThreeTracks();
      renderCards();
      document.getElementById('screen-selection').classList.remove('hidden');
      currentState = 'SELECTION';
      break;

    case 'LISTEN':
      document.getElementById('screen-listen').classList.remove('hidden');
      currentState = 'LISTEN';
      break;

    case 'RADIO':
      renderRadio();
      document.getElementById('screen-radio').classList.remove('hidden');
      currentState = 'RADIO';
      break;

    case 'HISTORY':
      renderHistory();
      document.getElementById('panel-history').classList.remove('hidden');
      currentState = 'HISTORY';
      break;

    default:
      console.warn('showScreen: unknown target', target);
  }
}

/* ───────────────────────────────────────────────────
   RADIO
   ─────────────────────────────────────────────────── */
function renderRadio() {
  const playlistTracks = playlist.map(name => ALL_TRACKS.find(t => t.title === name)).filter(Boolean);
  const track = playlistTracks[radioIndex % playlistTracks.length] || ALL_TRACKS[0];
  document.getElementById('radio-cover').innerHTML =
    `<div class="cover-large"><span class="cover-initials">${track.title[0]}</span></div>`;
  document.getElementById('radio-title').textContent = track.title;
  document.getElementById('radio-artist').textContent = track.artist;
  document.getElementById('radio-link').href = track.link;
}

/* ───────────────────────────────────────────────────
   EVENT DELEGATION — UN SEUL attaché sur body
   ─────────────────────────────────────────────────── */
document.body.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;

  switch (action) {
    case 'enter':
      showScreen('CHOIX');
      break;

    case 'choix-découvrir':
      showScreen('DISCOVER_TYPE');
      break;

    case 'choix-écouter':
      radioIndex = 0;
      showScreen('RADIO');
      break;

    case 'choix-jouer':
      // désactivé en V0
      break;

    case 'discover-trust':
      currentCards = getThreeTracks();
      showScreen('SELECTION');
      break;

    case 'discover-personalize':
      showScreen('QUESTIONNAIRE');
      break;

    case 'start-selection':
      currentCards = getThreeTracks();
      showScreen('SELECTION');
      break;

    case 'more-cards':
      currentCards = getThreeTracks();
      renderCards();
      break;

    case 'listen-track': {
      const track = ALL_TRACKS.find(t => t.title === btn.dataset.title);
      if (track) {
        if (!sessionEncountered.some(t => t.title === track.title)) {
          sessionEncountered.push(track);
        }
        renderHistory();
        openListenScreen(track);
      }
      break;
    }

    case 'keep-track':
      if (activeListenTrack && !sessionKept.some(t => t.title === activeListenTrack.title)) {
        sessionKept.push(activeListenTrack);
        renderHistory();
      }
      break;

    case 'keep-track-from-card': {
      const track = ALL_TRACKS.find(t => t.title === btn.dataset.title);
      if (track && !sessionKept.some(t => t.title === track.title)) {
        sessionKept.push(track);
        renderHistory();
      }
      break;
    }

    case 'back-to-choix':
      showScreen('CHOIX');
      break;

    case 'back-to-selection':
      showScreen('SELECTION');
      break;

    case 'open-history':
      showScreen('HISTORY');
      break;

    case 'close-history':
      document.getElementById('panel-history').classList.add('hidden');
      break;

    case 'open-radio':
      radioIndex = 0;
      showScreen('RADIO');
      break;

    case 'radio-prev':
      radioIndex = (radioIndex - 1 + playlist.length) % playlist.length;
      renderRadio();
      break;

    case 'radio-next':
      radioIndex = (radioIndex + 1) % playlist.length;
      renderRadio();
      break;
  }
});

/* ───────────────────────────────────────────────────
   INIT
   ─────────────────────────────────────────────────── */
showScreen('INTRO');
