// ============================================================
// MUSIC DISCOVERY — SCRIPT.JS
// ============================================================

// ─── Minimal internal data (no data.js dependency) ──────────

const INTERNAL_TRACKS = [
  { id: 1, title: "Do I Wanna Know?", artist: "Arctic Monkeys", duration: 272, album: "AM", cover: null },
  { id: 2, title: "Teardrop", artist: "Massive Attack", duration: 330, album: "Mezzanine", cover: null },
  { id: 3, title: "Midnight City", artist: "M83", duration: 243, album: "Hurry Up, We're Dreaming", cover: null },
  { id: 4, title: "Intro", artist: "The xx", duration: 137, album: "xx", cover: null },
  { id: 5, title: "Intro", artist: "M83", duration: 152, album: "M83", cover: null },
];

const INTERNAL_QUEUE = [
  { artist: "M83", track: "Intro" },
  { artist: "The xx", track: "Intro" },
];

// ─── State ──────────────────────────────────────────────────

const state = {
  isPlaying: false,
  currentTrackIndex: 0,
  progress: 0,
  volume: 0.8,
  isMuted: false,
  isRadioOpen: false,
  isPlayerExpanded: false,
  radioPlaying: false,
};

// ─── Elements ───────────────────────────────────────────────

const introScreen  = document.querySelector('.intro-screen');
const startBtn     = document.querySelector('.intro-content button, .intro-content .primary-button');
const playerFixed  = document.querySelector('.player-fixed');
const playerCover  = document.querySelector('.player-cover');
const playerArtist = document.querySelector('.player-artist');
const playerTrack  = document.querySelector('.player-track');
const playBtn      = document.querySelector('.player-btn--play');
const expandBtn    = document.querySelector('.player-btn--expand');
const progressFill = document.querySelector('.player-progress-fill');
const volumeSlider = document.querySelector('.volume-slider');
const muteBtn      = document.querySelector('.player-btn[aria-label="Muet"]');

const radioPanel   = document.querySelector('.radio-panel');
const closeRadio   = document.querySelector('.close-radio');
const radioPlayBtn = document.querySelector('.radio-btn--play');
const radioNextBtn = document.querySelector('.radio-btn--next');
const radioSkipBtn = document.querySelector('.radio-btn--skip');
const radioArtist  = document.querySelector('.radio-artist');
const radioTrack   = document.querySelector('.radio-track');

const momentCards  = document.querySelectorAll('.moment-card');
const directionBtns = document.querySelectorAll('.btn-direction');
const suggestionCards = document.querySelectorAll('.suggestion-card');

const menuToggle   = document.querySelector('.menu-toggle');

// ─── Utilities ──────────────────────────────────────────────

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getCurrentTrack() {
  return INTERNAL_TRACKS[state.currentTrackIndex] || INTERNAL_TRACKS[0];
}

function updatePlayerUI() {
  const track = getCurrentTrack();
  if (playerArtist) playerArtist.textContent = track.artist;
  if (playerTrack)  playerTrack.textContent  = track.title;
  if (playBtn) playBtn.textContent = state.isPlaying ? '⏸' : '▶';
  if (progressFill) progressFill.style.width = `${state.progress}%`;
}

function updateRadioUI() {
  const queue = INTERNAL_QUEUE;
  if (radioArtist) radioArtist.textContent = 'Arctic Monkeys';
  if (radioTrack)  radioTrack.textContent  = 'Do I Wanna Know?';
  if (radioPlayBtn) radioPlayBtn.textContent = state.radioPlaying ? '⏸' : '▶';
  // Render queue list
  const queueList = document.querySelector('.queue-list');
  if (queueList) {
    queueList.innerHTML = queue.map((item, i) => `
      <li class="queue-item">
        <span class="queue-num">${i + 1}</span>
        <span class="queue-track">${item.track}</span>
        <span class="queue-artist">${item.artist}</span>
      </li>
    `).join('');
  }
}

// ─── Intro ──────────────────────────────────────────────────

if (startBtn && introScreen) {
  startBtn.addEventListener('click', () => {
    introScreen.classList.add('hidden');
    initAudio();
  });
}

// ─── Audio (simulated) ──────────────────────────────────────

let audioTimer = null;

function initAudio() {
  state.isPlaying = true;
  state.progress = 0;
  updatePlayerUI();
  audioTimer = setInterval(() => {
    const track = getCurrentTrack();
    state.progress += (100 / track.duration);
    if (state.progress >= 100) {
      nextTrack();
    }
    updatePlayerUI();
  }, 500);
}

function togglePlay() {
  state.isPlaying = !state.isPlaying;
  if (state.isPlaying && !audioTimer) initAudio();
  if (!state.isPlaying && audioTimer) {
    clearInterval(audioTimer);
    audioTimer = null;
  }
  updatePlayerUI();
}

function nextTrack() {
  state.currentTrackIndex = (state.currentTrackIndex + 1) % INTERNAL_TRACKS.length;
  state.progress = 0;
  updatePlayerUI();
}

if (playBtn) playBtn.addEventListener('click', togglePlay);
if (expandBtn && playerFixed) {
  expandBtn.addEventListener('click', () => {
    state.isPlayerExpanded = !state.isPlayerExpanded;
    playerFixed.classList.toggle('player-fixed--expanded', state.isPlayerExpanded);
  });
}

// ─── Progress bar interaction ──────────────────────────────

const progressBar = document.querySelector('.player-progress-bar');
if (progressBar) {
  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    state.progress = Math.max(0, Math.min(100, ratio * 100));
    updatePlayerUI();
  });
}

// ─── Volume ─────────────────────────────────────────────────

if (volumeSlider) {
  volumeSlider.style.width = `${state.volume * 100}%`;
  const volumeWrap = document.querySelector('.volume-slider-wrap');
  if (volumeWrap) {
    volumeWrap.addEventListener('click', (e) => {
      const rect = volumeWrap.getBoundingClientRect();
      state.volume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      state.isMuted = false;
      volumeSlider.style.width = `${state.volume * 100}%`;
    });
  }
}

if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    state.isMuted = !state.isMuted;
    muteBtn.textContent = state.isMuted ? '🔇' : '🔊';
  });
}

// ─── Radio panel ────────────────────────────────────────────

if (document.querySelector('.btn-radio')) {
  document.querySelector('.btn-radio').addEventListener('click', () => {
    state.isRadioOpen = true;
    if (radioPanel) radioPanel.classList.remove('hidden');
    updateRadioUI();
  });
}

if (closeRadio) {
  closeRadio.addEventListener('click', () => {
    state.isRadioOpen = false;
    if (radioPanel) radioPanel.classList.add('hidden');
  });
}

if (radioPlayBtn) {
  radioPlayBtn.addEventListener('click', () => {
    state.radioPlaying = !state.radioPlaying;
    updateRadioUI();
  });
}

if (radioNextBtn) {
  radioNextBtn.addEventListener('click', () => {
    if (INTERNAL_QUEUE.length > 0) {
      INTERNAL_QUEUE.shift();
      updateRadioUI();
    }
  });
}

if (radioSkipBtn) {
  radioSkipBtn.addEventListener('click', () => {
    if (INTERNAL_QUEUE.length > 0) {
      INTERNAL_QUEUE.shift();
      updateRadioUI();
    }
  });
}

// ─── Moments grid ───────────────────────────────────────────

momentCards.forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.moment-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
  });
});

// ─── Direction / branching choices ──────────────────────────

directionBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const direction = btn.closest('.direction-card');
    const isAsc = direction && direction.classList.contains('direction-card--ascending');
    const directionText = isAsc ? 'Monter' : 'Descendre';
    const nextSection = document.querySelector('#moments, #suggestions');
    if (nextSection) nextSection.scrollIntoView({ behavior: 'smooth' });
  });
});

// ─── Suggestions (embranchements) ───────────────────────────

suggestionCards.forEach((card) => {
  const tracksEl = card.querySelector('.suggestion-tracks');
  if (tracksEl) {
    const count = Math.floor(Math.random() * 3) + 2;
    tracksEl.innerHTML = Array.from({ length: count }, (_, i) => {
      const track = INTERNAL_TRACKS[i % INTERNAL_TRACKS.length];
      return `<button class="track-pill">${track.title} — ${track.artist}</button>`;
    }).join('');
  }
  const playBtnSuggestion = card.querySelector('.btn-suggestion');
  if (playBtnSuggestion) {
    playBtnSuggestion.addEventListener('click', () => {
      state.isPlayerExpanded = true;
      playerFixed.classList.add('player-fixed--expanded');
      if (!state.isPlaying) togglePlay();
    });
  }
});

// ─── Mobile menu toggle ─────────────────────────────────────

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    const nav = document.querySelector('.main-nav');
    if (nav) nav.classList.toggle('active');
  });
}

// ─── Smooth scroll for nav links ────────────────────────────

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ─── Boot ───────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  updatePlayerUI();
  updateRadioUI();
});
