(function () {
  'use strict';

  const state = {
    tracks: shuffleTracks(TRACKS),
    index: 0,
    encountered: [],
    kept: [],
    radioPlaying: false,
    radioTrack: null,
    audio: new Audio()
  };

  function shuffleTracks(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function formatTime(seconds) {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ':' + s.toString().padStart(2, '0');
  }

  function getTwoTracks() {
    if (state.index >= state.tracks.length) {
      state.tracks = shuffleTracks(TRACKS);
      state.index = 0;
    }
    return [state.tracks[state.index], state.tracks[state.index + 1]];
  }

  function showSection(id) {
    document.querySelectorAll('.section').forEach(function (s) {
      s.classList.remove('active');
    });
    document.querySelectorAll('.nav-tab').forEach(function (t) {
      t.classList.remove('active');
    });
    var sec = document.getElementById(id);
    if (sec) sec.classList.add('active');
    var tab = document.querySelector('.nav-tab[data-tab="' + id + '"]');
    if (tab) tab.classList.add('active');
  }

  function renderCard(track, audioId) {
    var hasUrl = track.audioUrl && track.audioUrl.length > 0;
    var html = '<div class="track-card" data-id="' + track.id + '" data-url="' + (hasUrl ? track.audioUrl : '') + '">';
    html += '<div class="track-info">';
    html += '<div class="track-title">' + track.title + '</div>';
    html += '<div class="track-artist">' + track.artist + '</div>';
    html += '<div class="track-meta">';
    html += '<span>' + formatTime(track.duration) + '</span>';
    html += '<span class="dot">·</span>';
    html += '<span>ID ' + track.id + '</span>';
    html += '</div></div>';
    if (hasUrl) {
      html += '<div class="audio-player">';
      html += '<audio id="' + audioId + '" controls src="' + track.audioUrl + '"></audio>';
      html += '<div class="player-status">lecture libre</div></div>';
    } else {
      html += '<div class="fallback-notice">';
      html += '<p>Pas d\'extrait disponible.<br>Tu peux garder ou passer ce titre.</p>';
      html += '<button class="simulate-btn" data-id="' + track.id + '">Simuler</button></div>';
    }
    html += '<div class="track-actions">';
    html += '<button class="action-btn pass" data-action="pass" data-id="' + track.id + '">Passer</button>';
    html += '<button class="action-btn keep" data-action="keep" data-id="' + track.id + '">Garder</button>';
    html += '<button class="action-btn choose" data-action="choose" data-id="' + track.id + '">Choisir</button>';
    html += '</div></div>';
    return html;
  }

  function renderDiscovery() {
    var pair = getTwoTracks();
    var sec = document.getElementById('discovery');
    if (!sec) return;
    if (!pair[0]) {
      sec.innerHTML = '<div class="empty-state"><div class="empty-icon">✦</div><p>Plus de titres à découvrir. Reviens plus tard.</p></div>';
      return;
    }
    sec.innerHTML = '<div class="discovery-stack">' +
      renderCard(pair[0], 'audio-a') +
      renderCard(pair[1], 'audio-b') +
      '</div>';
    bindCards();
    updateCounter();
    checkMilestones();
  }

  function bindCards() {
    var fallbackBtns = document.querySelectorAll('.simulate-btn');
    fallbackBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(btn.dataset.id, 10);
        btn.textContent = 'Lu';
        btn.disabled = true;
        setTimeout(function () { btn.textContent = 'Simulé'; }, 3000);
      });
    });

    var actionBtns = document.querySelectorAll('.action-btn');
    actionBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.dataset.action;
        var id = parseInt(btn.dataset.id, 10);
        handleAction(action, id);
      });
    });
  }

  function handleAction(action, id) {
    var track = TRACKS.find(function (t) { return t.id === id; });
    if (!track) return;

    addEncountered(track);

    if (action === 'keep' || action === 'choose') {
      addKept(track);
    }

    if (action === 'choose') {
      state.index += 2;
    } else {
      state.index += 1;
    }

    renderDiscovery();
  }

  function addEncountered(track) {
    if (!state.encountered.find(function (t) { return t.id === track.id; })) {
      state.encountered.push(track);
    }
    renderList('encountered-list', state.encountered, 'encountered');
  }

  function addKept(track) {
    if (!state.kept.find(function (t) { return t.id === track.id; })) {
      state.kept.push(track);
    }
    renderList('kept-list', state.kept, 'kept');
  }

  function renderList(listId, items, type) {
    var container = document.getElementById(listId);
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">✦</div><p>Aucun titre pour le moment.</p></div>';
      return;
    }

    container.innerHTML = items.map(function (t, i) {
      return '<div class="list-item" data-id="' + t.id + '">' +
        '<div class="item-num">' + (i + 1) + '</div>' +
        '<div class="item-info">' +
        '<div class="item-title">' + t.title + '</div>' +
        '<div class="item-artist">' + t.artist + '</div>' +
        '</div>' +
        '<div class="item-actions">' +
        (type === 'encountered' ? '<button class="item-btn keep-list-btn" data-id="' + t.id + '">Garder</button>' : '') +
        '<button class="item-btn remove-btn" data-id="' + t.id + '" data-type="' + type + '">Retirer</button>' +
        '</div></div>';
    }).join('');

    container.querySelectorAll('.keep-list-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(btn.dataset.id, 10);
        var track = TRACKS.find(function (t) { return t.id === id; });
        if (track) addKept(track);
      });
    });

    container.querySelectorAll('.remove-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(btn.dataset.id, 10);
        var t = btn.dataset.type;
        if (t === 'encountered') {
          state.encountered = state.encountered.filter(function (x) { return x.id !== id; });
          renderList('encountered-list', state.encountered, 'encountered');
        } else {
          state.kept = state.kept.filter(function (x) { return x.id !== id; });
          renderList('kept-list', state.kept, 'kept');
        }
        updateCounter();
      });
    });
  }

  function renderRadio() {
    var sec = document.getElementById('radio');
    if (!sec) return;
    if (state.radioPlaying && state.radioTrack) {
      sec.innerHTML = '<div class="radio-display">' +
        '<div class="radio-emoji">📻</div>' +
        '<div class="radio-station">Radio — en lecture</div>' +
        '<div class="radio-now">' + state.radioTrack.title + ' · ' + state.radioTrack.artist + '</div>' +
        '<div class="radio-controls">' +
        '<button class="radio-btn" id="radio-stop">Arrêter</button>' +
        '</div></div>';
    } else {
      sec.innerHTML = '<div class="radio-display">' +
        '<div class="radio-emoji">📻</div>' +
        '<div class="radio-station">Radio</div>' +
        '<div class="radio-now">Aucun titre en lecture</div>' +
        '<div class="radio-controls">' +
        '<button class="radio-btn" id="radio-start">Démarrer</button>' +
        '</div></div>';
    }
    bindRadioControls();
  }

  function bindRadioControls() {
    var startBtn = document.getElementById('radio-start');
    var stopBtn = document.getElementById('radio-stop');
    if (startBtn) startBtn.addEventListener('click', startRadio);
    if (stopBtn) stopBtn.addEventListener('click', stopRadio);
  }

  function startRadio() {
    if (state.kept.length === 0) {
      state.radioTrack = state.tracks[Math.floor(Math.random() * state.tracks.length)];
    } else {
      state.radioTrack = state.kept[Math.floor(Math.random() * state.kept.length)];
    }
    state.radioPlaying = true;
    state.audio.volume = 0.4;
    renderRadio();
  }

  function stopRadio() {
    state.radioPlaying = false;
    state.audio.pause();
    renderRadio();
  }

  function updateCounter() {
    var el = document.getElementById('counter');
    if (el) el.textContent = state.encountered.length + ' / ' + TRACKS.length;
  }

  function checkMilestones() {
    var n = state.encountered.length;
    if (n === 5 || n === 20) {
      setTimeout(function () { showMilestoneMessage(n); }, 600);
    }
  }

  function showMilestoneMessage(n) {
    var icon = n === 5 ? '✦' : '✦✦';
    var texts = {};
    texts[5] = '5 titres découverts — tu commences à voir clair.';
    texts[20] = '20 titres découverts — tu traces ton chemin.';
    var container = document.querySelector('.app');
    if (!container) return;
    var div = document.createElement('div');
    div.className = 'message-banner';
    div.innerHTML = '<div class="msg-text">' + icon + ' ' + texts[n] + '</div>';
    container.insertAdjacentElement('afterbegin', div);
    setTimeout(function () { if (div.parentNode) div.remove(); }, 4000);
  }

  function renderEncountered() {
    var sec = document.getElementById('encountered');
    if (!sec) return;
    sec.innerHTML = '<div id="encountered-list" class="list-section"></div>';
    renderList('encountered-list', state.encountered, 'encountered');
  }

  function bindNavTabs() {
    var tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var tabId = tab.dataset.tab;
        showSection(tabId);
        if (tabId === 'radio') renderRadio();
        if (tabId === 'encountered') renderEncountered();
        if (tabId === 'kept') renderList('kept-list', state.kept, 'kept');
      });
    });
  }

  function buildNavTabs() {
    var nav = document.querySelector('.nav-tabs');
    if (!nav) return;
    var tabs = [
      { id: 'discovery', label: 'Découverte' },
      { id: 'encountered', label: 'Rencontrés' },
      { id: 'kept', label: 'Gardés' },
      { id: 'radio', label: 'Radio' }
    ];
    nav.innerHTML = tabs.map(function (t) {
      return '<button class="nav-tab' + (t.id === 'discovery' ? ' active' : '') + '" data-tab="' + t.id + '">' + t.label + '</button>';
    }).join('');
  }

  function init() {
    buildNavTabs();
    bindNavTabs();
    renderDiscovery();
    renderList('kept-list', state.kept, 'kept');
    renderRadio();
    updateCounter();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
