/* ════════════════════════════════════════════════════════════════════
   MUSIC DISCOVERY — v0.2
   Toute la logique du site. Tu n'as normalement pas besoin d'y toucher :
   la musique se gère dans data.js, les couleurs dans teintes.css.
   ════════════════════════════════════════════════════════════════════ */

(() => {
'use strict';

/* ─────────────────────────────── utilitaires ─────────────────────────────── */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const E  = Pochettes.echapper;
const hasard = arr => arr[Math.floor(Math.random() * arr.length)];
const melanger = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const borner = (v, a, b) => Math.max(a, Math.min(b, v));
const reduitMouvement = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tactile = matchMedia('(hover: none)').matches;

const memoire = {
  lire(cle, defaut) { try { const v = JSON.parse(localStorage.getItem(cle)); return v ?? defaut; } catch (e) { return defaut; } },
  ecrire(cle, v) { try { localStorage.setItem(cle, JSON.stringify(v)); } catch (e) {} }
};

/* ─────────────────────────────── la banque ─────────────────────────────── */
function slug(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9぀-ヿ一-龯]+/g, '-').replace(/^-|-$/g, '') || 'x';
}
function idYouTube(lien) {
  if (!lien) return null;
  const m = lien.match(/[?&]v=([\w-]{11})/) || lien.match(/youtu\.be\/([\w-]{11})/) || lien.match(/embed\/([\w-]{11})/);
  return m ? m[1] : null;
}

const BANQUE = (typeof MORCEAUX !== 'undefined' ? MORCEAUX : []).map((m, i) => ({
  ...m,
  id: slug(m.artiste + '-' + m.titre) + '-' + i,
  yt: idYouTube(m.lien),
  energie: Number.isFinite(m.energie) ? m.energie : 5,
  etrange: Number.isFinite(m.etrange) ? m.etrange : 5,
  danse:   Number.isFinite(m.danse)   ? m.danse   : 5,
  note: (m.note || '').trim(),
  liens: m.liens || []
}));
const parId = Object.fromEntries(BANQUE.map(m => [m.id, m]));
const parTitre = t => BANQUE.find(m => m.titre.toLowerCase() === String(t).toLowerCase());

function distance(a, b) {
  return Math.hypot(a.energie - b.energie, a.etrange - b.etrange, (a.danse - b.danse) * 0.8);
}

/* ─────────────────────────────── l'état ─────────────────────────────── */
const S = {
  ecran: 'allumage',
  cible: { energie: 5, etrange: 5, danse: 5 },
  tour: 0,               // nombre de duels joués dans la session
  vusSession: new Set(), // morceaux montrés pendant cette session
  duel: [],              // les deux ids du duel en cours
  autreDuDuel: null,     // celui qu'on n'a pas choisi
  courant: null,         // id affiché dans la rencontre
  joue: null,            // id en cours de lecture
  enLecture: false,
  mode: 'decouvrir',     // ou 'radio'
  file: [], pos: 0,      // file de la radio
  sourceRadio: 'tout',
  croises: memoire.lire('md-croises', []),  // ids (persistant)
  gardes:  memoire.lire('md-gardes', []),   // ids (persistant)
  onglet: 'gardes',
};
// nettoyage si la banque a changé
S.croises = S.croises.filter(id => parId[id]);
S.gardes  = S.gardes.filter(id => parId[id]);

/* ─────────────────────────────── sons de la machine ─────────────────────────────── */
let ctxAudio = null;
function clic(freq = 1800, duree = 0.035, volume = 0.05) {
  try {
    ctxAudio = ctxAudio || new (window.AudioContext || window.webkitAudioContext)();
    const t = ctxAudio.currentTime;
    const o = ctxAudio.createOscillator();
    const g = ctxAudio.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.4, t + duree);
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g).connect(ctxAudio.destination);
    o.start(t); o.stop(t + duree + 0.01);
  } catch (e) {}
}

/* ─────────────────────────────── navigation ─────────────────────────────── */
function aller(ecran) {
  S.ecran = ecran;
  $$('[data-ecran]').forEach(s => { s.hidden = s.dataset.ecran !== ecran; });
  document.body.dataset.vue = ecran;
  window.scrollTo({ top: 0 });
  arreterExtrait();
  placerEcranVideo();
  majCadran();
}

/* ─────────────────────────────── le cadran ─────────────────────────────── */
function majCadran() {
  const grad = $('#graduations');
  const n = S.vusSession.size;
  const total = Math.max(24, Math.ceil((n + 6) / 12) * 12);
  if (grad.childElementCount !== total) {
    grad.innerHTML = Array.from({ length: total }, (_, i) =>
      `<span class="trait${i % 6 === 0 ? ' trait-long' : ''}"></span>`).join('');
  }
  $$('.trait', grad).forEach((t, i) => t.classList.toggle('allume', i < n));
  const pct = total ? (Math.min(n, total) / total) * 100 : 0;
  $('#aiguille').style.left = `calc(${pct}% )`;

  const encours = $('#en-cours');
  if (S.joue) {
    const m = parId[S.joue];
    encours.innerHTML = `<span class="defile">${E(m.titre)}, ${E(m.artiste)}</span>`;
  } else {
    encours.innerHTML = n ? `<span>${n} morceau${n > 1 ? 'x' : ''} croisé${n > 1 ? 's' : ''} ce soir</span>` : '';
  }
  const bl = $('#bouton-lecture');
  bl.hidden = !S.joue;
  bl.classList.toggle('en-lecture', S.enLecture);
  $('#compteur-bac').textContent = S.gardes.length;
}

/* ─────────────────────────────── croiser / garder ─────────────────────────────── */
function croiser(id) {
  S.vusSession.add(id);
  if (!S.croises.includes(id)) {
    S.croises.unshift(id);
    memoire.ecrire('md-croises', S.croises);
  }
  verifierDeblocage();
  majCadran();
}
function estGarde(id) { return S.gardes.includes(id); }
function basculerGarde(id) {
  if (estGarde(id)) {
    S.gardes = S.gardes.filter(x => x !== id);
    toast('Retiré de ton bac.');
  } else {
    S.gardes.unshift(id);
    toast('Gardé. Il t\'attend dans ton bac.');
    clic(900, 0.08, 0.06);
    const b = $('.bouton-bac'); b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse');
  }
  memoire.ecrire('md-gardes', S.gardes);
  majCadran();
  if (!$('#bac').hidden) rendreBac();
  $$(`[data-garder="${id}"]`).forEach(b => majBoutonGarder(b, id));
}
function majBoutonGarder(b, id) {
  const g = estGarde(id);
  b.classList.toggle('est-garde', g);
  b.setAttribute('aria-pressed', g);
  b.textContent = g ? 'Gardé' : 'Garder';
}

/* ─────────────────────────────── le moteur de découverte ─────────────────────────────── */
function disponibles(exclure = []) {
  let pool = BANQUE.filter(m => !S.vusSession.has(m.id) && !exclure.includes(m.id));
  if (pool.length < 2) {
    // on a fait le tour : on repart avec ce qui n'est pas gardé
    S.vusSession = new Set(S.gardes);
    if (S.courant) S.vusSession.add(S.courant);
    toast('Tu as fait le tour du bac. On rebat les cartes.');
    pool = BANQUE.filter(m => !S.vusSession.has(m.id) && !exclure.includes(m.id));
  }
  return pool;
}

// Un duel = une piste proche de ce que tu cherches + un écart assumé
function tirerDuel() {
  const pool = disponibles();
  const tries = [...pool].sort((a, b) => distance(a, S.cible) - distance(b, S.cible));
  const proche = hasard(tries.slice(0, Math.min(4, tries.length)));
  const reste = tries.filter(m => m !== proche);
  // l'écart : pas l'opposé total, mais une autre porte (tiers du milieu ou du fond)
  const debut = Math.floor(reste.length * 0.35);
  const ecart = hasard(reste.slice(debut).length ? reste.slice(debut) : reste);
  return Math.random() < 0.5 ? [proche, ecart] : [ecart, proche];
}

// chaque choix fait glisser la machine vers ce que tu as choisi
function apprendre(m, force = 0.35) {
  ['energie', 'etrange', 'danse'].forEach(k => {
    S.cible[k] = borner(S.cible[k] + (m[k] - S.cible[k]) * force, 0, 10);
  });
}

function voisins(m) {
  const manuels = m.liens.map(parTitre).filter(Boolean).filter(x => x.id !== m.id);
  const autres = BANQUE.filter(x => x.id !== m.id && !manuels.includes(x));
  const tries = autres.sort((a, b) => distance(a, m) - distance(b, m));
  const nonVus = tries.filter(x => !S.vusSession.has(x.id));
  const base = nonVus.length >= 4 ? nonVus : tries;
  const proche = manuels[0] || hasard(base.slice(0, 3));
  const loin = hasard(base.slice(Math.floor(base.length * 0.6)).filter(x => x !== proche)) || base[base.length - 1];
  return { proche, loin, manuel: !!manuels[0] };
}

/* ─────────────────────────────── écran DUEL ─────────────────────────────── */
const PHRASES_DUEL = [
  'Deux disques sortis du bac. Lequel tu écoutes ?',
  'L\'un des deux va te plaire. Peut-être les deux.',
  'Ils ne se ressemblent pas. C\'est voulu.',
  'Écoute un extrait, ou choisis à l\'instinct.',
  'Le premier qui te fait tourner la tête.',
  'Un proche de ce que tu cherches, un pas de côté. Devine lequel.',
];

function nouveauDuel() {
  S.tour++;
  const ev = evenementPour(S.tour);
  if (ev) return interlude(ev);
  montrerDuel(tirerDuel());
}

function montrerDuel(paire) {
  S.duel = paire.map(m => m.id);
  paire.forEach(m => croiser(m.id));
  $('#duel-phrase').textContent = S.tour === 1 ? 'Deux disques sortis du bac. Lequel tu écoutes ?' : hasard(PHRASES_DUEL);
  $('#duel').innerHTML = paire.map((m, i) => `
    <article class="pochette-duel" style="--penche:${i ? 2.2 : -2.6}deg" data-id="${m.id}">
      <button class="pochette-duel-choix" data-action="choisir" data-id="${m.id}" aria-label="Choisir ${E(m.titre)}, ${E(m.artiste)}">
        ${Pochettes.html(m, 'pochette-grande')}
      </button>
      <div class="pochette-duel-legende">
        <p class="titre-morceau">${E(m.titre)}</p>
        <p class="artiste-morceau">${E(m.artiste)}</p>
        <button class="extrait-bouton" data-action="extrait" data-id="${m.id}" data-extrait-pour="${m.id}" ${Pochettes.extrait(m) ? '' : 'hidden'}>
          <span class="extrait-icone"></span><span class="extrait-texte">${tactile ? 'Extrait' : 'Survole pour un extrait'}</span>
        </button>
      </div>
    </article>`).join('');
  aller('duel');
  if (!tactile) {
    $$('.pochette-duel', $('#duel')).forEach(el => {
      el.addEventListener('mouseenter', () => lancerExtrait(el.dataset.id, el));
      el.addEventListener('mouseleave', () => arreterExtrait());
    });
  }
}

/* ─────────────────────────────── extraits (pré-écoute) ─────────────────────────────── */
const audioExtrait = $('#extrait');
let extraitPour = null, fondu = null;
function lancerExtrait(id, el) {
  const m = parId[id];
  const url = Pochettes.extrait(m);
  if (!url) return;
  arreterExtrait();
  extraitPour = id;
  if (S.enLecture && lecteur && lecteurPret) { try { lecteur.setVolume(15); } catch (e) {} }
  audioExtrait.src = url;
  audioExtrait.currentTime = 0;
  audioExtrait.volume = 0;
  audioExtrait.play().catch(() => {});
  clearInterval(fondu);
  fondu = setInterval(() => { audioExtrait.volume = Math.min(0.9, audioExtrait.volume + 0.08); if (audioExtrait.volume >= 0.9) clearInterval(fondu); }, 60);
  (el || document).querySelector?.('.extrait-bouton')?.classList.add('en-cours');
  el?.classList.add('ecoute');
}
function arreterExtrait() {
  clearInterval(fondu);
  if (!audioExtrait.paused) audioExtrait.pause();
  extraitPour = null;
  $$('.extrait-bouton.en-cours').forEach(b => b.classList.remove('en-cours'));
  $$('.ecoute').forEach(b => b.classList.remove('ecoute'));
  if (lecteur && lecteurPret) { try { lecteur.setVolume(100); } catch (e) {} }
}
audioExtrait.addEventListener('ended', arreterExtrait);

/* ─────────────────────────────── ruptures de rythme ─────────────────────────────── */
// Pour éviter "50 fois deux carrés" : tous les 3 duels, il se passe autre chose.
function evenementPour(tour) {
  if (tour < 4) return null;
  if ((tour - 4) % 3 !== 0) return null;
  const cycle = ['ecart', 'pour-toi', 'question'];
  return cycle[((tour - 4) / 3) % cycle.length];
}

function interlude(type) {
  const box = $('#interlude');
  const n = S.vusSession.size;
  if (type === 'ecart') {
    box.innerHTML = `
      <p class="interlude-grand">On s'éloigne un peu de ce que tu as choisi.</p>
      <p class="interlude-petit">Juste pour voir. Tu pourras revenir.</p>
      <button class="gros-bouton gros-bouton-plein" data-action="ecart">Emmène-moi</button>`;
  } else if (type === 'pour-toi') {
    const pool = disponibles();
    const m = [...pool].sort((a, b) => distance(a, S.cible) - distance(b, S.cible))[0];
    croiser(m.id);
    box.innerHTML = `
      <p class="interlude-petit">Tu viens de traverser ${n} morceaux.</p>
      <p class="interlude-grand">Celui-là, je l'avais mis de côté pour toi.</p>
      <button class="pochette-solo" data-action="ouvrir" data-id="${m.id}" aria-label="Écouter ${E(m.titre)}">
        ${Pochettes.html(m, 'pochette-grande')}
      </button>
      <p class="titre-morceau">${E(m.titre)}</p>
      <p class="artiste-morceau">${E(m.artiste)}</p>
      <div class="interlude-actions">
        <button class="gros-bouton gros-bouton-plein" data-action="ouvrir" data-id="${m.id}">Écouter</button>
        <button class="lien-bouton" data-action="duel-suivant">Pas maintenant</button>
      </div>`;
  } else if (type === 'question') {
    box.innerHTML = `
      <p class="interlude-grand">On continue dans cette direction, ou on retourne tout ?</p>
      <div class="interlude-actions">
        <button class="gros-bouton gros-bouton-plein" data-action="continuer">On continue</button>
        <button class="gros-bouton" data-action="retourner">Retourne tout</button>
      </div>`;
  }
  aller('interlude');
}

/* ─────────────────────────────── écran RENCONTRE ─────────────────────────────── */
function ouvrir(id, { jouer = true } = {}) {
  const m = parId[id];
  if (!m) return;
  S.courant = id;
  S.mode = 'decouvrir';
  croiser(id);
  const { proche, loin, manuel } = voisins(m);
  const autre = S.autreDuDuel && S.autreDuDuel !== id ? parId[S.autreDuDuel] : null;

  $('#rencontre').innerHTML = `
    <div class="rencontre-pochette">
      ${Pochettes.html(m, 'pochette-geante')}
    </div>
    <div class="rencontre-texte">
      <h1 class="rencontre-titre">${E(m.titre)}</h1>
      <p class="rencontre-artiste">${E(m.artiste)}${m.album && m.album !== m.titre ? `<span class="rencontre-album">${E(m.album)}</span>` : ''}</p>

      ${m.note ? `<blockquote class="rencontre-note">${E(m.note).replace(/\n/g, '<br>')}</blockquote>` : ''}

      <div class="rencontre-lecture">
        <div class="emplacement-ecran" data-emplacement></div>
        <div class="rencontre-actions">
          <button class="bouton-garder" data-action="garder" data-garder="${m.id}" data-id="${m.id}"></button>
          <a class="lien-bouton" href="${E(m.lien)}" target="_blank" rel="noopener">Ouvrir sur YouTube Music</a>
        </div>
      </div>
      <p class="rencontre-indispo" id="rencontre-indispo" hidden>
        Ce morceau refuse de jouer ici. <a href="${E(m.lien)}" target="_blank" rel="noopener">L'écouter sur YouTube Music</a>
      </p>

      <nav class="terrier" aria-label="Et après ?">
        <p class="terrier-titre" id="terrier-titre">Et après ?</p>
        <div class="terrier-portes">
          ${porte(proche, manuel ? 'Il mène là' : 'Dans la même pièce')}
          ${porte(loin, 'Complètement ailleurs')}
        </div>
        <div class="terrier-bas">
          <button class="gros-bouton" data-action="duel-suivant">Nouveau duel</button>
          ${autre ? `<button class="lien-bouton" data-action="ouvrir" data-id="${autre.id}">Et l'autre, c'était quoi ?</button>` : ''}
        </div>
      </nav>
    </div>`;
  $$('[data-garder]', $('#rencontre')).forEach(b => majBoutonGarder(b, m.id));
  aller('rencontre');
  if (jouer) jouerMorceau(m);
}

function porte(m, etiquette) {
  if (!m) return '';
  return `<button class="porte-petite" data-action="ouvrir" data-id="${m.id}">
    ${Pochettes.html(m, 'pochette-mini')}
    <span class="porte-petite-texte">
      <span class="porte-petite-etiquette">${etiquette}</span>
      <span class="porte-petite-titre">${E(m.titre)}</span>
      <span class="porte-petite-artiste">${E(m.artiste)}</span>
    </span>
  </button>`;
}

/* ─────────────────────────────── le lecteur YouTube ─────────────────────────────── */
let lecteur = null, lecteurPret = false, enAttente = null, apiDemandee = false;

function chargerAPI() {
  if (apiDemandee) return;
  apiDemandee = true;
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  s.onerror = () => toast('Impossible de joindre YouTube. Vérifie ta connexion.');
  document.head.appendChild(s);
}
window.onYouTubeIframeAPIReady = () => {
  lecteur = new YT.Player('yt-lecteur', {
    width: '100%', height: '100%',
    playerVars: { playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, origin: location.origin.startsWith('http') ? location.origin : undefined },
    events: {
      onReady: () => {
        lecteurPret = true;
        if (enAttente) { const m = enAttente; enAttente = null; jouerMorceau(m); }
      },
      onStateChange: e => {
        const YTS = YT.PlayerState;
        if (e.data === YTS.PLAYING) { S.enLecture = true; arreterExtraitSiVolumePlein(); }
        if (e.data === YTS.PAUSED) S.enLecture = false;
        if (e.data === YTS.ENDED) { S.enLecture = false; finDuMorceau(); }
        majEtatLecture();
      },
      onError: () => {
        S.enLecture = false;
        majEtatLecture();
        if (S.mode === 'radio') { toast('Ce morceau refuse de jouer ici. Suivant.'); setTimeout(() => radioSuivant(), 1500); }
        else { const i = $('#rencontre-indispo'); if (i) i.hidden = false; }
      }
    }
  });
};
function arreterExtraitSiVolumePlein() { if (!extraitPour) { try { lecteur.setVolume(100); } catch (e) {} } }

function jouerMorceau(m) {
  S.joue = m.id;
  const ev = $('#ecran-video');
  if (!m.yt) {
    S.enLecture = false;
    majEtatLecture();
    const i = $('#rencontre-indispo'); if (i) i.hidden = false;
    if (S.mode === 'radio') { toast('Celui-là ne s\'écoute que sur YouTube Music. Suivant.'); setTimeout(() => radioSuivant(), 1500); }
    return;
  }
  ev.hidden = false;
  placerEcranVideo();
  if (!lecteurPret) { enAttente = m; chargerAPI(); majCadran(); return; }
  try { lecteur.loadVideoById(m.yt); } catch (e) {}
  majCadran();
}

function basculerLecture() {
  if (!lecteurPret || !S.joue) return;
  const st = lecteur.getPlayerState();
  if (st === YT.PlayerState.PLAYING) lecteur.pauseVideo(); else lecteur.playVideo();
}

function finDuMorceau() {
  if (S.mode === 'radio') return radioSuivant();
  if (S.ecran === 'rencontre') {
    const t = $('#terrier-titre');
    if (t) { t.textContent = 'Fini. Tu continues par où ?'; $('.terrier').classList.add('appel'); }
  }
}

function majEtatLecture() {
  document.body.classList.toggle('en-lecture', S.enLecture);
  $('#radio-icone')?.classList.toggle('pause', S.enLecture && S.mode === 'radio');
  const st = $('#radio-statut');
  if (st && S.mode === 'radio') st.textContent = S.enLecture ? 'À l\'antenne' : (S.joue ? 'En pause' : 'En attente');
  majCadran();
}

// l'écran vidéo se déplace dans l'emplacement prévu de l'écran actif,
// sinon il se range en petit dans un coin (la musique continue)
let suiviRAF = null;
function placerEcranVideo() {
  const ev = $('#ecran-video');
  if (!S.joue || ev.hidden) return;
  const ecranActif = $(`[data-ecran="${S.ecran}"]`);
  const slot = ecranActif && $('[data-emplacement]', ecranActif);
  const montrerSlot = slot && (S.ecran === 'machine' ? S.mode === 'radio' : S.courant === S.joue);
  ev.classList.toggle('range', !montrerSlot);
  if (montrerSlot) {
    const suivre = () => {
      const r = slot.getBoundingClientRect();
      ev.style.top = r.top + 'px'; ev.style.left = r.left + 'px';
      ev.style.width = r.width + 'px'; ev.style.height = r.height + 'px';
    };
    suivre();
    cancelAnimationFrame(suiviRAF);
    const boucle = () => { suivre(); suiviRAF = requestAnimationFrame(boucle); };
    suiviRAF = requestAnimationFrame(boucle);
  } else {
    cancelAnimationFrame(suiviRAF);
    ev.style.top = ev.style.left = ev.style.width = ev.style.height = '';
  }
}
addEventListener('resize', placerEcranVideo);

/* ─────────────────────────────── LA MACHINE (radio) ─────────────────────────────── */
// La radio n'est pas un mélange au hasard : chaque morceau est choisi
// parmi les plus proches du précédent, avec un écart de temps en temps.
function construireFil(ids) {
  const reste = melanger(ids.map(id => parId[id]).filter(Boolean));
  if (!reste.length) return [];
  const fil = [reste.shift()];
  while (reste.length) {
    const der = fil[fil.length - 1];
    reste.sort((a, b) => distance(a, der) - distance(b, der));
    const i = Math.random() < 0.2 ? Math.floor(Math.random() * reste.length) : Math.floor(Math.random() * Math.min(3, reste.length));
    fil.push(reste.splice(i, 1)[0]);
  }
  return fil.map(m => m.id);
}

function demarrerRadio(source = 'tout') {
  S.mode = 'radio';
  S.sourceRadio = source;
  const ids = source === 'gardes' && S.gardes.length ? [...S.gardes] : BANQUE.map(m => m.id);
  S.file = construireFil(ids);
  S.pos = 0;
  $('#machine-source').textContent = source === 'gardes' ? (S.gardes.length > 1 ? `Tes ${S.gardes.length} morceaux gardés, à la suite.` : 'Ton morceau gardé, en boucle. Garde-en d\'autres.') : 'Toute la sélection, mélangée avec un fil.';
  aller('machine');
  majMachine();
}

function majMachine() {
  const id = S.file[S.pos];
  const m = parId[id];
  $('#radio-titre').textContent = m ? m.titre : 'Appuie sur lecture.';
  $('#radio-artiste').textContent = m ? m.artiste : '';
  $('#macaron').innerHTML = m ? Pochettes.html(m, 'pochette-macaron') : '';
  const g = $('#radio-garder');
  if (m) { g.dataset.garder = m.id; g.textContent = estGarde(m.id) ? 'Gardé' : 'Garder ce morceau'; g.classList.toggle('est-garde', estGarde(m.id)); }
  majEtatLecture();
  // pré-charger les pochettes des suivants
  S.file.slice(S.pos + 1, S.pos + 4).forEach(x => Pochettes.demander(parId[x]));
}

function radioJouerCourant() {
  const m = parId[S.file[S.pos]];
  if (!m) return;
  S.mode = 'radio';
  croiser(m.id);
  jouerMorceau(m);
  majMachine();
}
function radioSuivant() {
  if (!S.file.length) return;
  S.pos = (S.pos + 1) % S.file.length;
  clic(1400);
  radioJouerCourant();
}
function radioPrecedent() {
  if (!S.file.length) return;
  S.pos = (S.pos - 1 + S.file.length) % S.file.length;
  clic(1100);
  radioJouerCourant();
}
function radioLecture() {
  const id = S.file[S.pos];
  if (S.joue === id && lecteurPret && S.mode === 'radio') basculerLecture();
  else radioJouerCourant();
  clic(600, 0.06, 0.07);
}

/* ─────────────────────────────── LE BAC ─────────────────────────────── */
function ouvrirBac() {
  rendreBac();
  $('#voile').hidden = false;
  $('#bac').hidden = false;
  requestAnimationFrame(() => document.body.classList.add('bac-ouvert'));
  $('#bac .onglet[aria-selected="true"]').focus();
}
function fermerBac() {
  document.body.classList.remove('bac-ouvert');
  setTimeout(() => { $('#voile').hidden = true; $('#bac').hidden = true; }, reduitMouvement ? 0 : 320);
}
function rendreBac() {
  $('#n-gardes').textContent = S.gardes.length;
  $('#n-croises').textContent = S.croises.length;
  $$('#bac .onglet').forEach(o => o.setAttribute('aria-selected', o.dataset.onglet === S.onglet));
  const ids = S.onglet === 'gardes' ? S.gardes : S.croises;
  const liste = $('#bac-liste');
  if (!ids.length) {
    liste.innerHTML = `<li class="bac-vide">${S.onglet === 'gardes'
      ? 'Rien de gardé pour l\'instant. Quand un morceau te plaît, appuie sur Garder : il t\'attendra ici, même si tu reviens dans six mois.'
      : 'Tout ce que tu croises s\'inscrit ici. Lance une découverte.'}</li>`;
  } else {
    liste.innerHTML = ids.map(id => {
      const m = parId[id];
      return `<li class="bac-ligne">
        <button class="bac-morceau" data-action="ouvrir" data-id="${m.id}">
          ${Pochettes.html(m, 'pochette-mini')}
          <span><span class="porte-petite-titre">${E(m.titre)}</span><span class="porte-petite-artiste">${E(m.artiste)}</span></span>
        </button>
        <button class="bac-garder ${estGarde(m.id) ? 'est-garde' : ''}" data-action="garder" data-id="${m.id}" aria-label="${estGarde(m.id) ? 'Retirer' : 'Garder'} ${E(m.titre)}">${estGarde(m.id) ? '−' : '+'}</button>
      </li>`;
    }).join('');
  }
  const pied = $('#bac-pied');
  pied.hidden = S.onglet !== 'gardes' || !S.gardes.length;
  const avecYt = S.gardes.map(id => parId[id].yt).filter(Boolean).slice(0, 50);
  $('#lien-playlist').href = `https://www.youtube.com/watch_videos?video_ids=${avecYt.join(',')}`;
}
async function copierListe() {
  const txt = S.gardes.map(id => { const m = parId[id]; return `${m.titre}, ${m.artiste}  ${m.lien}`; }).join('\n');
  try { await navigator.clipboard.writeText('Mes trouvailles sur Music Discovery\n\n' + txt); toast('Liste copiée.'); }
  catch (e) { toast('Copie impossible dans ce navigateur.'); }
}

/* ─────────────────────────────── teintes (skins) ─────────────────────────────── */
const TEINTES = [
  { id: 'ambre',  nom: 'Ambre',  couleur: '#24161d' },
  { id: 'papier', nom: 'Papier', couleur: '#dfe4d7' },
  { id: 'signal', nom: 'Signal', couleur: '#1730ff' },
  { id: 'vide',   nom: 'Vide',   couleur: '#f6f6f3' },
  { id: 'fievre', nom: 'Fièvre', couleur: '#ff6fae', cachee: true },
];
let debloquees = memoire.lire('md-teintes-debloquees', []);
let teinteActive = memoire.lire('md-teinte', 'ambre');
function teintesDispo() { return TEINTES.filter(t => !t.cachee || debloquees.includes(t.id)); }
function appliquerTeinte(id, annoncer) {
  const dispo = teintesDispo();
  const t = dispo.find(x => x.id === id) || dispo[0];
  teinteActive = t.id;
  document.documentElement.dataset.teinte = t.id;
  $('meta[name="theme-color"]').setAttribute('content', t.couleur);
  const i = dispo.indexOf(t);
  $('.molette').style.setProperty('--rot', `${-120 + (240 / Math.max(1, dispo.length - 1)) * i}deg`);
  memoire.ecrire('md-teinte', t.id);
  if (annoncer) {
    const n = $('#teinte-nom');
    n.textContent = t.nom;
    n.classList.remove('visible'); void n.offsetWidth; n.classList.add('visible');
  }
}
function teinteSuivante() {
  const dispo = teintesDispo();
  const i = dispo.findIndex(t => t.id === teinteActive);
  appliquerTeinte(dispo[(i + 1) % dispo.length].id, true);
  clic(2400, 0.02, 0.05);
}
function verifierDeblocage() {
  if (S.croises.length >= 12 && !debloquees.includes('fievre')) {
    debloquees.push('fievre');
    memoire.ecrire('md-teintes-debloquees', debloquees);
    setTimeout(() => toast('Une nouvelle teinte vient de s\'ajouter sur la molette, en bas à droite.', 5000), 1200);
  }
}

/* ─────────────────────────────── toast ─────────────────────────────── */
let toastMinuterie = null;
function toast(msg, duree = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('visible');
  clearTimeout(toastMinuterie);
  toastMinuterie = setTimeout(() => t.classList.remove('visible'), duree);
}

/* ─────────────────────────────── allumage ─────────────────────────────── */
function allumer() {
  clic(220, 0.12, 0.12);
  setTimeout(() => clic(2600, 0.02, 0.04), 140);
  document.body.classList.add('allume');
  chargerAPI(); // on prépare le lecteur pendant l'animation
  setTimeout(() => aller('choix'), reduitMouvement ? 0 : 900);
}

/* ─────────────────────────────── les actions ─────────────────────────────── */
const ACTIONS = {
  'allumer': allumer,
  'accueil': () => { if (document.body.classList.contains('allume')) aller('choix'); },
  'vers-reglage': () => { clic(); aller('reglage'); },
  'vers-radio': () => { clic(); demarrerRadio('tout'); },
  'confiance': () => {
    S.cible = { energie: Math.random() * 10, etrange: 3 + Math.random() * 7, danse: Math.random() * 10 };
    S.tour = 0; clic(); toast('Ok. On va faire comme ça.');
    nouveauDuel();
  },
  'regle': () => {
    S.cible = { energie: +$('#f-energie').value, etrange: +$('#f-etrange').value, danse: +$('#f-danse').value };
    S.tour = 0; clic(); nouveauDuel();
  },
  'choisir': b => {
    const m = parId[b.dataset.id];
    S.autreDuDuel = S.duel.find(x => x !== m.id) || null;
    apprendre(m);
    clic(1200);
    ouvrir(m.id);
  },
  'autre-duel': () => { clic(); montrerDuel(tirerDuel()); },
  'duel-suivant': () => { S.autreDuDuel = null; nouveauDuel(); },
  'extrait': b => {
    const id = b.dataset.id;
    if (extraitPour === id) arreterExtrait(); else lancerExtrait(id, b.closest('.pochette-duel'));
  },
  'ouvrir': b => { fermerBacSiOuvert(); S.autreDuDuel = S.ecran === 'rencontre' ? null : S.autreDuDuel; clic(1300); ouvrir(b.dataset.id); },
  'garder': b => basculerGarde(b.dataset.id),
  'ecart': () => {
    S.cible = { energie: 10 - S.cible.energie, etrange: borner(S.cible.etrange + 3, 0, 10), danse: 10 - S.cible.danse };
    montrerDuel(tirerDuel());
  },
  'continuer': () => montrerDuel(tirerDuel()),
  'retourner': () => {
    S.cible = { energie: 10 - S.cible.energie, etrange: 10 - S.cible.etrange, danse: 10 - S.cible.danse };
    toast('Tout retourné.');
    montrerDuel(tirerDuel());
  },
  'lecture': () => { if (S.mode === 'radio') radioLecture(); else basculerLecture(); },
  'retour-morceau': () => { if (S.mode === 'radio') aller('machine'); else if (S.joue) ouvrir(S.joue, { jouer: false }); },
  'radio-lecture': radioLecture,
  'radio-suivant': radioSuivant,
  'radio-precedent': radioPrecedent,
  'radio-garder': b => { const id = S.file[S.pos]; if (id) { basculerGarde(id); majMachine(); } },
  'radio-raconte': () => {
    const id = S.file[S.pos];
    if (!id) return;
    const continuerLecture = S.joue === id;
    S.mode = 'decouvrir';
    ouvrir(id, { jouer: !continuerLecture });
  },
  'ouvrir-bac': ouvrirBac,
  'fermer-bac': fermerBac,
  'onglet': b => { S.onglet = b.dataset.onglet; rendreBac(); },
  'ecouter-gardes': () => { fermerBac(); demarrerRadio('gardes'); setTimeout(radioJouerCourant, 50); },
  'copier-liste': copierListe,
  'teinte': teinteSuivante,
};
function fermerBacSiOuvert() { if (!$('#bac').hidden) fermerBac(); }

document.addEventListener('click', e => {
  const b = e.target.closest('[data-action]');
  if (!b) return;
  const a = ACTIONS[b.dataset.action];
  if (a) { e.preventDefault(); a(b); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#bac').hidden) fermerBac();
  if (e.key === ' ' && e.target === document.body && S.joue) { e.preventDefault(); ACTIONS.lecture(); }
});

// les faders affichent un petit clic à chaque cran
$$('.fader input').forEach(f => f.addEventListener('input', () => clic(2000 + +f.value * 120, 0.015, 0.03)));

/* ─────────────────────────────── démarrage ─────────────────────────────── */
appliquerTeinte(teinteActive, false);
if (S.gardes.length || S.croises.length) {
  const r = $('#allumage-retour');
  r.hidden = false;
  r.textContent = S.gardes.length
    ? `Ton bac t'attend : ${S.gardes.length} morceau${S.gardes.length > 1 ? 'x' : ''} gardé${S.gardes.length > 1 ? 's' : ''}.`
    : `Content de te revoir. Tu avais croisé ${S.croises.length} morceaux.`;
}
aller('allumage');
})();
