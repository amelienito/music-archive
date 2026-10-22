/* ════════════════════════════════════════════════════════════════════
   MUSIC DISCOVERY — v0.3
   Toute la logique du site. Tu n'as normalement pas besoin d'y toucher :
   la musique et les stations se gèrent dans data.js,
   les couleurs dans teintes.css.
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
const estMobile = () => matchMedia('(max-width: 640px)').matches;
const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (IOS) document.documentElement.classList.add('ios');

const memoire = {
  lire(cle, defaut) { try { const v = JSON.parse(localStorage.getItem(cle)); return v === null || v === undefined ? defaut : v; } catch (e) { return defaut; } },
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
const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);

const BANQUE = (typeof MORCEAUX !== 'undefined' ? MORCEAUX : []).map((m, i) => {
  const energie = num(m.energie, 5);
  return {
    ...m,
    id: slug(m.artiste + '-' + m.titre) + '-' + i,
    yt: idYouTube(m.lien),
    energie, etrange: num(m.etrange, 5), danse: num(m.danse, 5),
    note: (m.note || '').trim(),
    liens: m.liens || [],
    // les morceaux qui cognent sont joués un peu moins fort, pour ne pas surprendre
    facteur: borner(num(m.volume, energie >= 9 ? 0.66 : energie >= 8 ? 0.78 : energie >= 7 ? 0.88 : 1), 0.1, 1),
  };
});
const parId = Object.fromEntries(BANQUE.map(m => [m.id, m]));
const parTitre = t => BANQUE.find(m => m.titre.toLowerCase() === String(t).toLowerCase());
const distance = (a, b) => Math.hypot(a.energie - b.energie, a.etrange - b.etrange, (a.danse - b.danse) * 0.8);

const STATIONS_BASE = (typeof STATIONS !== 'undefined' && STATIONS.length ? STATIONS : [
  { nom: 'Brume', energie: 1, etrange: 8, danse: 1 }, { nom: 'Velours', energie: 3, etrange: 3, danse: 4 },
  { nom: 'Bitume', energie: 6, etrange: 4, danse: 3 }, { nom: 'Groove', energie: 6, etrange: 3, danse: 9 },
  { nom: 'Déflagration', energie: 9, etrange: 7, danse: 8 },
]).map(s => ({ ...s, energie: num(s.energie, 5), etrange: num(s.etrange, 5), danse: num(s.danse, 5), ids: [] }));
BANQUE.forEach(m => {
  const st = STATIONS_BASE.reduce((best, s) => distance(m, s) < distance(m, best) ? s : best, STATIONS_BASE[0]);
  st.ids.push(m.id);
});
const STATIONS_UI = [...STATIONS_BASE, { nom: 'Toutes', tout: true, ids: BANQUE.map(m => m.id) }, { nom: 'Ton bac', bac: true, ids: [] }];

/* ─────────────────────────────── l'état ─────────────────────────────── */
const S = {
  vue: 'allumage',
  derniereVueDecouvrir: 'accueil',
  cible: { energie: 5, etrange: 5, danse: 5 },
  tour: 0,
  vusSession: new Set(),
  duel: [], autreDuDuel: null,
  courant: null,          // morceau affiché dans la rencontre
  suite: null,            // ce qui jouera ensuite en mode découverte
  joue: null,             // morceau en cours de lecture
  lecture: null,          // 'yt' | 'extrait' | null
  enLecture: false,
  finTraitee: false,
  erreur: false,
  mode: 'decouvrir',      // ou 'radio'
  station: memoire.lire('md-station', 0),
  file: [], pos: 0,
  volume: borner(memoire.lire('md-volume', 60), 0, 100),
  croises: memoire.lire('md-croises', []),
  gardes: memoire.lire('md-gardes', []),
  injouables: new Set(memoire.lire('md-injouables', [])), // ids YouTube qui refusent la lecture intégrée
  onglet: 'gardes',
};
S.croises = S.croises.filter(id => parId[id]);
S.gardes  = S.gardes.filter(id => parId[id]);
if (!STATIONS_UI[S.station]) S.station = 0;
const jouable = m => m.yt && !S.injouables.has(m.yt);

/* ─────────────────────────────── sons de la machine ─────────────────────────────── */
let ctxAudio = null;
function audioCtx() {
  try { ctxAudio = ctxAudio || new (window.AudioContext || window.webkitAudioContext)(); if (ctxAudio.state === 'suspended') ctxAudio.resume(); } catch (e) {}
  return ctxAudio;
}
function clic(freq = 1800, duree = 0.035, volume = 0.05) {
  const c = audioCtx(); if (!c) return;
  try {
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.4, t + duree);
    g.gain.setValueAtTime(volume * (0.3 + S.volume / 140), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + duree + 0.01);
  } catch (e) {}
}
// le grésillement entre deux stations
let bruit = null;
function bruitDemarrer() {
  const c = audioCtx(); if (!c || bruit) return;
  try {
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.6;
    const g = c.createGain(); g.gain.value = 0;
    src.connect(f).connect(g).connect(c.destination); src.start();
    bruit = { src, g, f };
  } catch (e) {}
}
function bruitNiveau(n) { if (bruit) bruit.g.gain.setTargetAtTime(n * 0.09 * (S.volume / 100), ctxAudio.currentTime, 0.03); }
function bruitArreter() { if (!bruit) return; const b = bruit; bruit = null; try { b.g.gain.setTargetAtTime(0, ctxAudio.currentTime, 0.05); setTimeout(() => b.src.stop(), 300); } catch (e) {} }

/* ─────────────────────────────── navigation ─────────────────────────────── */
const VUES_DECOUVRIR = ['accueil', 'duel', 'interlude', 'rencontre'];
function aller(vue) {
  S.vue = vue;
  if (VUES_DECOUVRIR.includes(vue)) S.derniereVueDecouvrir = vue;
  $$('section[data-ecran]').forEach(s => { s.hidden = s.dataset.ecran !== vue; });
  document.body.dataset.vue = vue;
  const source = vue === 'machine' ? 'ecouter' : 'decouvrir';
  document.body.dataset.source = source;
  $$('.selecteur-pos').forEach(b => b.setAttribute('aria-selected', b.dataset.source === source));
  window.scrollTo(0, 0);
  arreterExtrait();
  if (vue !== 'rencontre') annulerSuiteSilencieux();
  majPoste();
}

/* ─────────────────────────────── VOLUME (molettes) ─────────────────────────────── */
function majMolettesVolume() {
  $$('[data-molette="volume"]').forEach(b => {
    const mol = $('.molette', b);
    mol.style.setProperty('--rot', `${-135 + S.volume * 2.7}deg`);
    mol.setAttribute('aria-valuenow', Math.round(S.volume));
    const arc = $('.molette-arc circle', b);
    if (arc) arc.style.strokeDasharray = `${S.volume * 0.75} 100`;
    const v = $('.valeur-volume', b);
    if (v) v.textContent = Math.round(S.volume);
  });
}
function reglerVolume(v) {
  S.volume = borner(v, 0, 100);
  memoire.ecrire('md-volume', Math.round(S.volume));
  majMolettesVolume();
  appliquerVolume();
}
function appliquerVolume() {
  const m = S.joue ? parId[S.joue] : null;
  const f = m ? m.facteur : 1;
  const yv = Math.round(S.volume * f * (extraitPour ? 0.15 : 1));
  if (lecteur && lecteurPret) { try { lecteur.setVolume(yv); } catch (e) {} }
  audioLecture.volume = borner(S.volume / 100 * f * (extraitPour ? 0.15 : 1), 0, 1);
}
function brancherMolette(b) {
  const mol = $('.molette', b);
  let depart = null;
  mol.addEventListener('pointerdown', e => {
    depart = { x: e.clientX, y: e.clientY, v: S.volume };
    try { mol.setPointerCapture(e.pointerId); } catch (er) {}
    mol.classList.add('saisie');
    e.preventDefault();
  });
  mol.addEventListener('pointermove', e => {
    if (!depart) return;
    const delta = (depart.y - e.clientY) + (e.clientX - depart.x);
    const nv = depart.v + delta * 0.45;
    if (Math.round(nv / 5) !== Math.round(S.volume / 5)) clic(1600 + nv * 10, 0.012, 0.03);
    reglerVolume(nv);
  });
  const fin = () => { depart = null; mol.classList.remove('saisie'); };
  mol.addEventListener('pointerup', fin);
  mol.addEventListener('pointercancel', fin);
  mol.addEventListener('wheel', e => { e.preventDefault(); reglerVolume(S.volume - e.deltaY * 0.05); }, { passive: false });
  mol.addEventListener('keydown', e => {
    const pas = { ArrowUp: 5, ArrowRight: 5, ArrowDown: -5, ArrowLeft: -5 }[e.key];
    if (pas) { e.preventDefault(); reglerVolume(S.volume + pas); clic(2000, 0.012, 0.03); }
  });
}
$$('[data-molette="volume"]').forEach(brancherMolette);

/* ─────────────────────────────── croiser / garder ─────────────────────────────── */
function croiser(id) {
  S.vusSession.add(id);
  if (!S.croises.includes(id)) {
    S.croises.unshift(id);
    memoire.ecrire('md-croises', S.croises);
  }
  verifierDeblocage();
}
const estGarde = id => S.gardes.includes(id);
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
  $('#compteur-bac').textContent = S.gardes.length;
  if (!$('#bac').hidden) rendreBac();
  $$(`[data-garder="${id}"]`).forEach(b => { if (b.id !== 'radio-garder') majBoutonGarder(b, id); });
  if (S.vue === 'machine') majMachine();
}
function majBoutonGarder(b, id) {
  const g = estGarde(id);
  b.classList.toggle('est-garde', g);
  b.setAttribute('aria-pressed', g);
  b.textContent = g ? 'Gardé' : 'Garder';
}

/* ─────────────────────────────── le moteur de découverte ─────────────────────────────── */
function disponibles() {
  let pool = BANQUE.filter(m => !S.vusSession.has(m.id));
  if (pool.length < 6) {
    S.vusSession = new Set(S.gardes);
    if (S.courant) S.vusSession.add(S.courant);
    toast('Tu as fait le tour du bac. On rebat les cartes.');
    pool = BANQUE.filter(m => !S.vusSession.has(m.id));
  }
  // les morceaux qui jouent en entier passent devant
  const ok = pool.filter(jouable);
  return ok.length >= 6 ? ok : pool;
}

// Les deux propositions respectent l'énergie et l'envie de bouger demandées.
// Ce qui change entre les deux, c'est l'étrangeté : un familier, un pas de côté.
function candidats(cible) {
  const pool = disponibles();
  let tol = 1.5, ok = [];
  while (tol <= 10) {
    ok = pool.filter(m => Math.abs(m.energie - cible.energie) <= tol && Math.abs(m.danse - cible.danse) <= tol + 2);
    if (ok.length >= 4) break;
    tol += 1;
  }
  return ok.length >= 2 ? ok : pool;
}
function tirerDuel() {
  const ok = candidats(S.cible);
  const tries = [...ok].sort((a, b) => distance(a, S.cible) - distance(b, S.cible));
  const proche = hasard(tries.slice(0, Math.min(3, tries.length)));
  const reste = tries.filter(m => m !== proche)
    .sort((a, b) => Math.abs(b.etrange - proche.etrange) - Math.abs(a.etrange - proche.etrange));
  const ecart = hasard(reste.slice(0, Math.min(3, reste.length))) || hasard(BANQUE.filter(m => m !== proche));
  return Math.random() < 0.5 ? [proche, ecart] : [ecart, proche];
}
function apprendre(m) {
  S.cible.energie = borner(S.cible.energie + (m.energie - S.cible.energie) * 0.15, 0, 10);
  S.cible.etrange = borner(S.cible.etrange + (m.etrange - S.cible.etrange) * 0.3, 0, 10);
  S.cible.danse   = borner(S.cible.danse   + (m.danse   - S.cible.danse)   * 0.25, 0, 10);
}

// Les chemins depuis un morceau : dans quelle direction tu veux aller ?
function chemins(m) {
  const autres = BANQUE.filter(x => x.id !== m.id);
  const pris = new Set();
  const choisir = (filtre, score) => {
    let c = autres.filter(x => !pris.has(x.id) && filtre(x));
    const nonVus = c.filter(x => !S.vusSession.has(x.id));
    if (nonVus.length) c = nonVus;
    const j = c.filter(jouable); if (j.length) c = j;
    c.sort((a, b) => score(a) - score(b));
    const r = hasard(c.slice(0, 2));
    if (r) pris.add(r.id);
    return r;
  };
  const dir = (cle, sens, etiquette) => {
    const autresCles = ['energie', 'etrange', 'danse'].filter(k => k !== cle);
    const x = choisir(
      x => (x[cle] - m[cle]) * sens >= 2,
      x => autresCles.reduce((s, k) => s + Math.abs(x[k] - m[k]), 0) + Math.abs(Math.abs(x[cle] - m[cle]) - 3) * 0.5
    );
    return x && { m: x, etiquette };
  };
  const liste = [];
  const manuel = m.liens.map(parTitre).filter(x => x && x.id !== m.id)[0];
  if (manuel) { pris.add(manuel.id); liste.push({ m: manuel, etiquette: 'Il mène là' }); }
  liste.push(m.energie >= 5 ? dir('energie', -1, 'Plus calme') : dir('energie', 1, 'Plus intense'));
  liste.push(m.etrange >= 5 ? dir('etrange', -1, 'Plus familier') : dir('etrange', 1, 'Plus étrange'));
  liste.push(m.danse >= 5 ? dir('danse', -1, 'Plus posé') : dir('danse', 1, 'Plus dansant'));
  if (!manuel) {
    const loin = choisir(x => distance(x, m) >= 7, x => -distance(x, m) + Math.random() * 3);
    if (loin) liste.push({ m: loin, etiquette: 'Complètement ailleurs' });
  }
  // ce qui jouera tout seul à la fin : le plus proche pas encore entendu
  const suite = manuel || choisir(() => true, x => distance(x, m)) || (liste.find(Boolean) || {}).m;
  return { liste: liste.filter(Boolean), suite };
}

// une phrase-indice pour les cartes mystère
function indice(m) {
  const e = ['Presque immobile', 'Presque immobile', 'Presque immobile', 'Calme', 'Calme', 'Ça avance', 'Ça avance', 'Ça pousse', 'Ça pousse', 'Ça cogne', 'Ça cogne'][Math.round(borner(m.energie, 0, 10))];
  const t = m.etrange <= 3 ? 'et familier' : m.etrange <= 6 ? 'et un peu de travers' : 'et franchement étrange';
  const d = m.danse >= 8 ? 'On danse.' : m.danse <= 2 ? 'On reste assis.' : '';
  return `${e}, ${t}. ${d}`.trim();
}

/* ─────────────────────────────── DÉCOUVRIR : accueil + morceau du jour ─────────────────────────────── */
function dateDuJour() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function morceauDuJour() {
  const j = dateDuJour();
  const force = BANQUE.find(m => m.jour === j);
  if (force) return force;
  const pool = BANQUE.filter(m => m.yt);
  const h = [...j].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
  return pool[h % pool.length];
}
function rendreAccueil() {
  const m = morceauDuJour();
  const revele = memoire.lire('md-jour', '') === dateDuJour();
  const dateTexte = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#accueil-jour').innerHTML = `
    <p class="jour-date">${E(dateTexte)}</p>
    <h2 class="jour-titre">Le morceau du jour</h2>
    <button class="carte-retournable carte-jour ${revele ? 'retournee' : ''}" data-action="jour" data-id="${m.id}" aria-label="${revele ? `Réécouter ${E(m.titre)}` : 'Découvrir le morceau du jour'}">
      <span class="carte-face carte-dos"><span class="carte-dos-motif"></span><span class="carte-dos-texte">${E(indice(m))}<br><br>Retourne-moi.</span></span>
      <span class="carte-face carte-recto">${Pochettes.html(m, 'pochette-grande')}</span>
    </button>
    ${revele ? `<p class="titre-morceau">${E(m.titre)}</p><p class="artiste-morceau">${E(m.artiste)}</p>` : ''}
    <p class="jour-pied">Le même pour tout le monde. Il change demain.</p>`;
}

/* ─────────────────────────────── DUEL ─────────────────────────────── */
const PHRASES_DUEL = [
  'L\'un des deux va te plaire. Peut-être les deux.',
  'Même énergie, deux portes différentes.',
  'Écoute un extrait, ou choisis à l\'instinct.',
  'Le premier qui te fait tourner la tête.',
  'Un familier, un pas de côté. Devine lequel.',
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
  const mystere = S.tour >= 2 && Math.random() < 0.35 ? Math.floor(Math.random() * 2) : -1;
  $('#duel-phrase').textContent = mystere >= 0 ? 'L\'une des deux est cachée. Tu tentes à l\'aveugle ?'
    : S.tour <= 1 ? 'Deux disques sortis du bac. Lequel tu écoutes ?' : hasard(PHRASES_DUEL);
  $('#duel').innerHTML = paire.map((m, i) => i === mystere ? carteMystere(m, i) : carteDuel(m, i)).join('');
  aller('duel');
  if (!tactile) {
    $$('.pochette-duel:not(.mystere)', $('#duel')).forEach(el => {
      el.addEventListener('mouseenter', () => lancerExtrait(el.dataset.id, el));
      el.addEventListener('mouseleave', () => arreterExtrait());
    });
  }
}
function carteDuel(m, i) {
  return `<article class="pochette-duel" style="--penche:${i ? 2.2 : -2.6}deg" data-id="${m.id}">
    <button class="pochette-duel-choix" data-action="choisir" data-id="${m.id}" aria-label="Choisir ${E(m.titre)}, ${E(m.artiste)}">
      ${Pochettes.html(m, 'pochette-grande')}
    </button>
    <div class="pochette-duel-legende">
      <p class="titre-morceau">${E(m.titre)}</p>
      <p class="artiste-morceau">${E(m.artiste)}</p>
      <button class="extrait-bouton" data-action="extrait" data-id="${m.id}" data-extrait-pour="${m.id}" ${Pochettes.extrait(m) ? '' : 'hidden'}>
        <span class="extrait-icone"></span><span>${tactile ? 'Extrait' : 'Survole pour un extrait'}</span>
      </button>
    </div>
  </article>`;
}
function carteMystere(m, i) {
  return `<article class="pochette-duel mystere" style="--penche:${i ? 2.2 : -2.6}deg" data-id="${m.id}">
    <button class="pochette-duel-choix carte-retournable" data-action="choisir-mystere" data-id="${m.id}" aria-label="Choisir la carte mystère">
      <span class="carte-face carte-dos"><span class="carte-dos-motif"></span><span class="carte-dos-texte">${E(indice(m))}</span></span>
      <span class="carte-face carte-recto">${Pochettes.html(m, 'pochette-grande')}</span>
    </button>
    <div class="pochette-duel-legende">
      <p class="titre-morceau">Carte mystère</p>
      <p class="artiste-morceau">Retourne-la, elle se lance.</p>
    </div>
  </article>`;
}

/* ─────────────────────────────── extraits (pré-écoute au survol) ─────────────────────────────── */
const audioExtrait = $('#extrait');
const audioLecture = new Audio(); // sert quand un morceau refuse la lecture YouTube
audioLecture.setAttribute('playsinline', '');
let extraitPour = null, fondu = null;
function lancerExtrait(id, el) {
  const m = parId[id];
  const url = Pochettes.extrait(m);
  if (!url) return;
  arreterExtrait();
  extraitPour = id;
  appliquerVolume();
  audioExtrait.src = url;
  audioExtrait.volume = 0;
  audioExtrait.play().catch(() => {});
  clearInterval(fondu);
  const cibleVol = borner(S.volume / 100 * m.facteur, 0, 1);
  fondu = setInterval(() => { audioExtrait.volume = Math.min(cibleVol, audioExtrait.volume + cibleVol / 10); if (audioExtrait.volume >= cibleVol) clearInterval(fondu); }, 50);
  const bouton = el && el.querySelector('.extrait-bouton');
  if (bouton) bouton.classList.add('en-cours');
  if (el) el.classList.add('ecoute');
}
function arreterExtrait() {
  clearInterval(fondu);
  if (!audioExtrait.paused) audioExtrait.pause();
  const avait = extraitPour;
  extraitPour = null;
  $$('.extrait-bouton.en-cours').forEach(b => b.classList.remove('en-cours'));
  $$('.ecoute').forEach(b => b.classList.remove('ecoute'));
  if (avait) appliquerVolume();
}
audioExtrait.addEventListener('ended', arreterExtrait);

/* ─────────────────────────────── ruptures de rythme ─────────────────────────────── */
function evenementPour(tour) {
  if (tour < 4 || (tour - 4) % 3 !== 0) return null;
  return ['ecart', 'pour-toi', 'question'][((tour - 4) / 3) % 3];
}
function interlude(type) {
  const box = $('#interlude');
  const n = S.vusSession.size;
  if (type === 'ecart') {
    box.innerHTML = `
      <p class="interlude-grand">Même énergie, mais on s'éloigne un peu.</p>
      <p class="interlude-petit">Juste pour voir. Tu pourras revenir.</p>
      <button class="gros-bouton gros-bouton-plein" data-action="ecart">Emmène-moi</button>`;
  } else if (type === 'pour-toi') {
    const m = [...candidats(S.cible)].sort((a, b) => distance(a, S.cible) - distance(b, S.cible))[0];
    box.innerHTML = `
      <p class="interlude-petit">Tu viens de traverser ${n} morceaux.</p>
      <p class="interlude-grand">Celui-là, je l'avais mis de côté pour toi.</p>
      <button class="pochette-solo" data-action="ouvrir" data-id="${m.id}" aria-label="Écouter ${E(m.titre)}">${Pochettes.html(m, 'pochette-grande')}</button>
      <p class="titre-morceau">${E(m.titre)}</p>
      <p class="artiste-morceau">${E(m.artiste)}</p>
      <div class="interlude-actions">
        <button class="gros-bouton gros-bouton-plein" data-action="ouvrir" data-id="${m.id}">Écouter</button>
        <button class="lien-bouton" data-action="duel-suivant">Pas maintenant</button>
      </div>`;
  } else {
    box.innerHTML = `
      <p class="interlude-grand">On continue dans cette direction, ou on retourne tout ?</p>
      <div class="interlude-actions">
        <button class="gros-bouton gros-bouton-plein" data-action="continuer">On continue</button>
        <button class="gros-bouton" data-action="retourner">Retourne tout</button>
      </div>`;
  }
  aller('interlude');
}

/* ─────────────────────────────── RENCONTRE ─────────────────────────────── */
function ouvrir(id, { jouer = true } = {}) {
  const m = parId[id];
  if (!m) return;
  S.courant = id;
  croiser(id);
  const { liste, suite } = chemins(m);
  S.suite = suite ? suite.id : null;
  const autre = S.autreDuDuel && S.autreDuDuel !== id ? parId[S.autreDuDuel] : null;

  $('#rencontre').innerHTML = `
    <div class="rencontre-pochette">${Pochettes.html(m, 'pochette-geante')}</div>
    <div class="rencontre-texte">
      <h1 class="rencontre-titre">${E(m.titre)}</h1>
      <p class="rencontre-artiste">${E(m.artiste)}${m.album && m.album !== m.titre ? `<span class="rencontre-album">${E(m.album)}</span>` : ''}</p>
      ${m.note ? `<blockquote class="rencontre-note">${E(m.note).replace(/\n/g, '<br>')}</blockquote>` : ''}

      <div class="rencontre-lecture">
        <div class="emplacement-ecran" data-emplacement="rencontre">${Pochettes.html(m, 'pochette-fond')}</div>
        <div class="rencontre-actions">
          <button class="bouton-garder" data-action="garder" data-garder="${m.id}" data-id="${m.id}"></button>
          <a class="lien-bouton" href="${E(m.lien)}" target="_blank" rel="noopener">Ouvrir sur YouTube Music</a>
        </div>
      </div>
      <p class="rencontre-indispo" id="rencontre-indispo" hidden></p>

      <nav class="chemins" aria-label="Et après ?">
        <p class="chemins-titre">Et après ? Choisis une direction.</p>
        <div class="chemins-portes">${liste.map(c => porte(c.m, c.etiquette)).join('')}</div>
        <p class="suite-annonce" id="suite-annonce">${suite ? `À la fin, ça enchaîne tout seul sur <strong>${E(suite.titre)}</strong>.` : ''}</p>
        <div class="chemins-bas">
          <button class="gros-bouton" data-action="duel-suivant">Nouveau duel</button>
          ${autre ? `<button class="lien-bouton" data-action="ouvrir" data-id="${autre.id}">Et l'autre, c'était quoi ?</button>` : ''}
        </div>
      </nav>
    </div>`;
  $$('[data-garder]', $('#rencontre')).forEach(b => majBoutonGarder(b, m.id));
  teinterRencontre(m);
  aller('rencontre');
  if (jouer) { S.mode = 'decouvrir'; jouerMorceau(m); }
  else { placerEcranVideo(); majIndispo(); }
}
function porte(m, etiquette) {
  return `<button class="porte-petite" data-action="ouvrir" data-id="${m.id}">
    ${Pochettes.html(m, 'pochette-mini')}
    <span class="porte-petite-texte">
      <span class="porte-petite-etiquette">${etiquette}</span>
      <span class="porte-petite-titre">${E(m.titre)}</span>
      <span class="porte-petite-artiste">${E(m.artiste)}</span>
    </span>
  </button>`;
}
function teinterRencontre(m) {
  const ec = $('.ecran-rencontre');
  ec.style.removeProperty('--couleur-disque');
  Pochettes.couleur(m, ([r, g, b]) => { if (S.courant === m.id) ec.style.setProperty('--couleur-disque', `${r}, ${g}, ${b}`); });
}
function majIndispo() {
  const i = $('#rencontre-indispo');
  if (!i) return;
  const m = parId[S.joue];
  if (!m || S.courant !== S.joue) { i.hidden = true; return; }
  if (S.lecture === 'extrait') {
    i.hidden = false;
    i.innerHTML = `Ce morceau refuse d'être lu sur un autre site : tu entends un extrait de 30 secondes. <a href="${E(m.lien)}" target="_blank" rel="noopener">La version complète est sur YouTube Music.</a>`;
  } else if (S.erreur) {
    i.hidden = false;
    i.innerHTML = `Ce morceau ne peut pas être lu ici. <a href="${E(m.lien)}" target="_blank" rel="noopener">L'écouter sur YouTube Music</a>`;
  } else i.hidden = true;
}

// enchaînement automatique à la fin d'un morceau
let suiteMinuterie = null;
function annulerSuiteSilencieux() { clearInterval(suiteMinuterie); suiteMinuterie = null; }
function annulerSuite() {
  annulerSuiteSilencieux();
  const a = $('#suite-annonce');
  if (a) a.textContent = 'Enchaînement annulé. Choisis une direction quand tu veux.';
}
function enchainerDecouverte() {
  const suite = S.suite && parId[S.suite];
  if (!suite) return;
  if (S.vue === 'rencontre' && S.courant === S.joue) {
    let n = 5;
    const a = $('#suite-annonce');
    const maj = () => { a.innerHTML = `Ensuite : <strong>${E(suite.titre)}</strong>, dans ${n} s. <button class="lien-bouton" data-action="annuler-suite">Rester ici</button>`; };
    maj();
    clearInterval(suiteMinuterie);
    suiteMinuterie = setInterval(() => { n--; if (n <= 0) { annulerSuiteSilencieux(); ouvrir(suite.id); } else maj(); }, 1000);
  } else {
    // ailleurs sur le site : la musique continue sans te déplacer
    croiser(suite.id);
    const { suite: apres } = chemins(suite);
    S.suite = apres ? apres.id : null;
    jouerMorceau(suite);
    toast(`Ensuite : ${suite.titre}`);
  }
}

/* ─────────────────────────────── LE LECTEUR ─────────────────────────────── */
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
    // youtube-nocookie : le lecteur n'utilise pas le compte YouTube du visiteur
    host: 'https://www.youtube-nocookie.com',
    playerVars: { playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, origin: location.origin.startsWith('http') ? location.origin : undefined },
    events: {
      onReady: () => {
        lecteurPret = true;
        if (enAttente) { const m = enAttente; enAttente = null; jouerMorceau(m); }
      },
      onStateChange: e => {
        if (S.lecture !== 'yt') return;
        if (e.data === YT.PlayerState.PLAYING) { S.enLecture = true; appliquerVolume(); }
        if (e.data === YT.PlayerState.PAUSED) S.enLecture = false;
        if (e.data === YT.PlayerState.ENDED) { S.enLecture = false; finDuMorceau(); }
        majEtat();
      },
      onError: () => {
        const m = parId[S.joue];
        if (!m || S.lecture !== 'yt') return;
        S.injouables.add(m.yt);
        memoire.ecrire('md-injouables', [...S.injouables]);
        try { lecteur.stopVideo(); } catch (e) {}
        jouerExtraitComplet(m);
      }
    }
  });
};

function jouerMorceau(m) {
  annulerSuiteSilencieux();
  arreterExtrait();
  S.joue = m.id;
  S.finTraitee = false;
  S.erreur = false;
  audioLecture.pause();
  if (!jouable(m)) { jouerExtraitComplet(m); return; }
  S.lecture = 'yt';
  $('#ecran-video').hidden = false;
  majPoste();
  if (!lecteurPret) { enAttente = m; chargerAPI(); majEtat(); return; }
  try { lecteur.loadVideoById(m.yt); } catch (e) {}
  appliquerVolume();
  majEtat();
}

// repli : l'extrait de 30 s quand YouTube refuse
function jouerExtraitComplet(m) {
  if (lecteur && lecteurPret) { try { lecteur.stopVideo(); } catch (e) {} }
  const url = Pochettes.extrait(m);
  if (url) {
    S.lecture = 'extrait'; S.erreur = false;
    audioLecture.src = url;
    appliquerVolume();
    audioLecture.play().then(() => { S.enLecture = true; majEtat(); }).catch(() => { S.enLecture = false; majEtat(); });
  } else {
    S.lecture = null; S.enLecture = false; S.erreur = true;
    // l'extrait est peut-être encore en route
    Pochettes.demander(m, () => { if (S.joue === m.id && S.erreur && Pochettes.extrait(m)) jouerExtraitComplet(m); });
    if (S.mode === 'radio') {
      toast(`${m.titre} ne s'écoute que sur YouTube Music. Suivant.`);
      setTimeout(() => { if (S.joue === m.id && S.erreur) radioSuivant(); }, 1800);
    }
  }
  majPoste(); majEtat();
}
audioLecture.addEventListener('ended', () => { if (S.lecture !== 'extrait') return; S.enLecture = false; majEtat(); finDuMorceau(); });
audioLecture.addEventListener('pause', () => { if (S.lecture === 'extrait') { S.enLecture = false; majEtat(); } });
audioLecture.addEventListener('play', () => { if (S.lecture === 'extrait') { S.enLecture = true; majEtat(); } });

function basculerLecture() {
  if (!S.joue) return;
  if (S.lecture === 'extrait') { if (audioLecture.paused) audioLecture.play().catch(() => {}); else audioLecture.pause(); return; }
  if (S.lecture === 'yt' && lecteurPret) {
    const st = lecteur.getPlayerState();
    if (st === YT.PlayerState.PLAYING) lecteur.pauseVideo(); else lecteur.playVideo();
  } else jouerMorceau(parId[S.joue]);
}
function finDuMorceau() {
  if (S.finTraitee) return;
  S.finTraitee = true;
  if (S.mode === 'radio') radioSuivant(); else enchainerDecouverte();
}
// filet de sécurité : si YouTube oublie de prévenir que le morceau est fini
setInterval(() => {
  if (S.lecture !== 'yt' || !lecteurPret || S.finTraitee || !S.joue) return;
  try { if (lecteur.getPlayerState() === YT.PlayerState.ENDED) finDuMorceau(); } catch (e) {}
}, 1500);

function majEtat() {
  document.body.classList.toggle('en-lecture', S.enLecture);
  $('#poste-icone').classList.toggle('pause', S.enLecture);
  $('#radio-icone').classList.toggle('pause', S.enLecture && S.mode === 'radio');
  majIndispo();
  majPoste();
  if (S.vue === 'machine') majAfficheur();
}

/* ─────────────────────────────── le poste et l'écran vidéo ─────────────────────────────── */
function majPoste() {
  const p = $('#poste');
  // sur la page du morceau en cours, la vidéo est déjà là : pas besoin du poste (sauf sur téléphone)
  const surSaPage = S.vue === 'rencontre' && S.courant === S.joue && !estMobile();
  const visible = !!S.joue && S.vue !== 'machine' && S.vue !== 'allumage' && !surSaPage;
  p.hidden = !visible;
  document.body.classList.toggle('avec-poste', visible);
  if (S.joue) {
    const m = parId[S.joue];
    $('#poste-titre').textContent = m.titre;
    $('#poste-artiste').textContent = S.lecture === 'extrait' ? `${m.artiste}, extrait 30 s` : m.artiste;
    const slot = $('[data-emplacement="poste"]');
    if (slot.dataset.id !== m.id) { slot.innerHTML = Pochettes.html(m, 'pochette-fond'); slot.dataset.id = m.id; }
  }
  placerEcranVideo();
}
let suiviRAF = null;
function emplacementCible() {
  if (!S.joue || S.lecture !== 'yt') return null;
  if (S.vue === 'machine') return S.mode === 'radio' ? $('[data-emplacement="machine"]') : null;
  if (S.vue === 'rencontre' && S.courant === S.joue && !estMobile()) return $('[data-emplacement="rencontre"]');
  if (!$('#poste').hidden) return $('[data-emplacement="poste"]');
  return null;
}
function placerEcranVideo() {
  const ev = $('#ecran-video');
  const slot = emplacementCible();
  cancelAnimationFrame(suiviRAF);
  if (!slot) { ev.classList.add('cache'); return; }
  ev.classList.remove('cache');
  const suivre = () => {
    const r = slot.getBoundingClientRect();
    ev.style.transform = `translate(${Math.round(r.left)}px, ${Math.round(r.top)}px)`;
    ev.style.width = r.width + 'px'; ev.style.height = r.height + 'px';
    suiviRAF = requestAnimationFrame(suivre);
  };
  suivre();
}

addEventListener('resize', majPoste);

/* ─────────────────────────────── ÉCOUTER : le tuner et la machine ─────────────────────────────── */
function construireFil(ids) {
  let reste = melanger(ids.map(id => parId[id]).filter(Boolean));
  const ok = reste.filter(jouable);
  if (ok.length >= 3) reste = ok;
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
function rendreTuner() {
  const n = STATIONS_UI.length;
  const crans = (n - 1) * 8;
  $('#tuner-echelle').innerHTML =
    Array.from({ length: crans + 1 }, (_, i) => `<span class="graduation${i % 8 === 0 ? ' graduation-station' : ''}" style="left:${(i / crans) * 100}%"></span>`).join('') +
    STATIONS_UI.map((s, i) => `<button class="station" data-action="station" data-station="${i}" style="left:${(i / (n - 1)) * 100}%">${E(s.nom)}</button>`).join('');
  $('#tuner-aiguille').setAttribute('aria-valuemax', n - 1);
  placerAiguille(S.station);
}
function placerAiguille(pos) {
  const n = STATIONS_UI.length;
  $('#tuner-aiguille').style.left = `calc(var(--marge) + (100% - 2 * var(--marge)) * ${pos / (n - 1)})`;
  $$('.station').forEach((b, i) => b.classList.toggle('active', i === Math.round(pos)));
}
function choisirStation(i, { jouer = true } = {}) {
  const st = STATIONS_UI[i];
  if (!st) return;
  if (st.bac && !S.gardes.length) {
    toast('Ton bac est vide. Garde des morceaux en découvrant, ils formeront ta station.');
    placerAiguille(S.station);
    return;
  }
  const change = i !== S.station || !S.file.length || st.bac;
  S.station = i;
  memoire.ecrire('md-station', i);
  placerAiguille(i);
  $('#tuner-aiguille').setAttribute('aria-valuenow', i);
  if (change) {
    S.file = construireFil(st.bac ? S.gardes : st.ids);
    S.pos = 0;
    clic(700, 0.06, 0.06);
  }
  majMachine();
  if (jouer && (change || S.mode !== 'radio' || !S.joue)) radioJouerCourant();
}
function brancherTuner() {
  const verre = $('.tuner-verre');
  const aiguille = $('#tuner-aiguille');
  let saisie = false;
  const posDepuis = x => {
    const ech = $('#tuner-echelle').getBoundingClientRect();
    return borner((x - ech.left) / ech.width, 0, 1) * (STATIONS_UI.length - 1);
  };
  verre.addEventListener('pointerdown', e => {
    if (e.target.closest('.station')) return;
    saisie = true;
    try { verre.setPointerCapture(e.pointerId); } catch (er) {}
    bruitDemarrer();
    const p = posDepuis(e.clientX); placerAiguille(p); bruitNiveau(Math.abs(p - Math.round(p)) * 2);
    aiguille.classList.add('saisie');
  });
  verre.addEventListener('pointermove', e => {
    if (!saisie) return;
    const p = posDepuis(e.clientX);
    placerAiguille(p);
    bruitNiveau(Math.min(1, Math.abs(p - Math.round(p)) * 2.2));
  });
  const fin = e => {
    if (!saisie) return;
    saisie = false; aiguille.classList.remove('saisie');
    bruitArreter();
    choisirStation(Math.round(posDepuis(e.clientX)));
  };
  verre.addEventListener('pointerup', fin);
  verre.addEventListener('pointercancel', () => { saisie = false; bruitArreter(); placerAiguille(S.station); });
  aiguille.addEventListener('keydown', e => {
    const pas = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (pas) { e.preventDefault(); choisirStation(borner(S.station + pas, 0, STATIONS_UI.length - 1)); }
  });
}
function entrerMachine() {
  if (!S.file.length) choisirStation(S.station, { jouer: false });
  aller('machine');
  majMachine();
}
function majMachine() {
  const m = parId[S.file[S.pos]];
  $('#macaron').innerHTML = m ? Pochettes.html(m, 'pochette-macaron') : '';
  const g = $('#radio-garder');
  if (m) { g.dataset.garder = m.id; g.textContent = estGarde(m.id) ? 'Gardé' : 'Garder ce morceau'; g.classList.toggle('est-garde', estGarde(m.id)); }
  majAfficheur();
  S.file.slice(S.pos + 1, S.pos + 4).forEach(x => Pochettes.demander(parId[x]));
  placerEcranVideo();
}
function majAfficheur() {
  const st = STATIONS_UI[S.station];
  const m = parId[S.file[S.pos]];
  const active = !!m && S.mode === 'radio' && S.joue === m.id;
  $('#radio-statut').textContent = `Station ${st.nom}${active ? (S.enLecture ? ', à l\'antenne' : ', en pause') : ''}${active && S.lecture === 'extrait' ? ' (extrait)' : ''}`;
  $('#radio-titre').textContent = m ? (active ? m.titre : 'Touche la platine pour lancer.') : 'Station vide.';
  $('#radio-artiste').textContent = m && active ? m.artiste : `${S.file.length} morceau${S.file.length > 1 ? 'x' : ''} sur cette station`;
}
function radioJouerCourant() {
  const m = parId[S.file[S.pos]];
  if (!m) return;
  S.mode = 'radio';
  croiser(m.id);
  jouerMorceau(m);
  majMachine();
}
function radioSuivant() { if (!S.file.length) return; S.pos = (S.pos + 1) % S.file.length; clic(1400); radioJouerCourant(); }
function radioPrecedent() { if (!S.file.length) return; S.pos = (S.pos - 1 + S.file.length) % S.file.length; clic(1100); radioJouerCourant(); }
function radioLecture() {
  if (!S.file.length) choisirStation(S.station, { jouer: false });
  const id = S.file[S.pos];
  if (S.mode === 'radio' && S.joue === id) basculerLecture(); else radioJouerCourant();
  clic(600, 0.06, 0.07);
}

/* ─────────────────────────────── LE BAC ─────────────────────────────── */
function ouvrirBac() {
  rendreBac();
  $('#voile').hidden = false;
  $('#bac').hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('bac-ouvert')));
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
  $('#bac-liste').innerHTML = !ids.length
    ? `<li class="bac-vide">${S.onglet === 'gardes'
        ? 'Rien de gardé pour l\'instant. Quand un morceau te plaît, appuie sur Garder : il t\'attendra ici, même si tu reviens dans six mois.'
        : 'Tout ce que tu croises s\'inscrit ici. Lance une découverte.'}</li>`
    : ids.map(id => {
        const m = parId[id];
        return `<li class="bac-ligne">
          <button class="bac-morceau" data-action="ouvrir" data-id="${m.id}">
            ${Pochettes.html(m, 'pochette-mini')}
            <span><span class="porte-petite-titre">${E(m.titre)}</span><span class="porte-petite-artiste">${E(m.artiste)}</span></span>
          </button>
          <button class="bac-garder ${estGarde(m.id) ? 'est-garde' : ''}" data-action="garder" data-id="${m.id}" aria-label="${estGarde(m.id) ? 'Retirer' : 'Garder'} ${E(m.titre)}">${estGarde(m.id) ? '−' : '+'}</button>
        </li>`;
      }).join('');
  $('#bac-pied').hidden = S.onglet !== 'gardes' || !S.gardes.length;
  const avecYt = S.gardes.map(id => parId[id].yt).filter(Boolean).slice(0, 50);
  $('#lien-playlist').href = `https://www.youtube.com/watch_videos?video_ids=${avecYt.join(',')}`;
}
async function copierListe() {
  const txt = S.gardes.map(id => { const m = parId[id]; return `${m.titre}, ${m.artiste}  ${m.lien}`; }).join('\n');
  try { await navigator.clipboard.writeText('Mes trouvailles sur Music Discovery\n\n' + txt); toast('Liste copiée.'); }
  catch (e) { toast('Copie impossible dans ce navigateur.'); }
}

/* ─────────────────────────────── TEINTES ─────────────────────────────── */
const TEINTES = [
  { id: 'ambre',  nom: 'Ambre',  couleur: '#24161d' },
  { id: 'papier', nom: 'Papier', couleur: '#dfe4d7' },
  { id: 'signal', nom: 'Signal', couleur: '#1730ff' },
  { id: 'vide',   nom: 'Vide',   couleur: '#f6f6f3' },
  { id: 'fievre', nom: 'Fièvre', couleur: '#ff6fae', cachee: true },
];
let debloquees = memoire.lire('md-teintes-debloquees', []);
let teinteActive = memoire.lire('md-teinte', 'ambre');
const teintesDispo = () => TEINTES.filter(t => !t.cachee || debloquees.includes(t.id));
function appliquerTeinte(id, annoncer) {
  const dispo = teintesDispo();
  const t = dispo.find(x => x.id === id) || dispo[0];
  teinteActive = t.id;
  document.documentElement.dataset.teinte = t.id;
  $('meta[name="theme-color"]').setAttribute('content', t.couleur);
  const i = dispo.indexOf(t);
  $$('.molette-crantee').forEach(m => m.style.setProperty('--rot', `${-120 + (240 / Math.max(1, dispo.length - 1)) * i}deg`));
  $('#nom-teinte').textContent = t.nom;
  $('#nom-teinte-bac').textContent = t.nom;
  memoire.ecrire('md-teinte', t.id);
  if (annoncer) toast(`Teinte ${t.nom}`, 1400);
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
    setTimeout(() => toast('Une nouvelle teinte vient de se débloquer sur la molette Teinte.', 5000), 1200);
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
  audioCtx();
  clic(220, 0.12, 0.12);
  setTimeout(() => clic(2600, 0.02, 0.04), 140);
  document.body.classList.add('allume');
  setTimeout(() => { rendreAccueil(); aller('accueil'); }, reduitMouvement ? 0 : 700);
}

/* ─────────────────────────────── les actions ─────────────────────────────── */
const ACTIONS = {
  'allumer': allumer,
  'accueil': () => { if (!document.body.classList.contains('allume')) return; rendreAccueil(); aller('accueil'); },
  'source': b => {
    if (!document.body.classList.contains('allume')) return;
    clic(1500, 0.03, 0.06);
    if (b.dataset.source === 'ecouter') return entrerMachine();
    if (S.derniereVueDecouvrir === 'rencontre' && S.courant) return ouvrir(S.courant, { jouer: false });
    if (S.derniereVueDecouvrir === 'accueil') rendreAccueil();
    aller(S.derniereVueDecouvrir);
  },
  'jour': b => {
    memoire.ecrire('md-jour', dateDuJour());
    if (!b.classList.contains('retournee')) {
      b.classList.add('retournee');
      clic(900, 0.05, 0.06);
      setTimeout(() => ouvrir(b.dataset.id), reduitMouvement ? 0 : 750);
    } else ouvrir(b.dataset.id);
  },
  'confiance': () => {
    S.cible = { energie: 2 + Math.random() * 6, etrange: 3 + Math.random() * 6, danse: 1 + Math.random() * 8 };
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
    apprendre(m); clic(1200);
    ouvrir(m.id);
  },
  'choisir-mystere': b => {
    if (b.classList.contains('retournee')) return;
    b.classList.add('retournee');
    clic(900, 0.05, 0.06);
    const id = b.dataset.id;
    setTimeout(() => {
      S.autreDuDuel = S.duel.find(x => x !== id) || null;
      apprendre(parId[id]); ouvrir(id);
    }, reduitMouvement ? 0 : 800);
  },
  'autre-duel': () => { clic(); montrerDuel(tirerDuel()); },
  'duel-suivant': () => { S.autreDuDuel = null; nouveauDuel(); },
  'extrait': b => { const id = b.dataset.id; if (extraitPour === id) arreterExtrait(); else lancerExtrait(id, b.closest('.pochette-duel')); },
  'ouvrir': b => {
    if (!$('#bac').hidden) fermerBac();
    if (S.vue === 'rencontre') S.autreDuDuel = null;
    clic(1300);
    ouvrir(b.dataset.id);
  },
  'garder': b => basculerGarde(b.dataset.id),
  'ecart': () => { S.cible.etrange = 10 - S.cible.etrange; montrerDuel(tirerDuel()); },
  'continuer': () => montrerDuel(tirerDuel()),
  'retourner': () => {
    S.cible = { energie: 10 - S.cible.energie, etrange: 10 - S.cible.etrange, danse: 10 - S.cible.danse };
    toast('Tout retourné.');
    montrerDuel(tirerDuel());
  },
  'annuler-suite': annulerSuite,
  'lecture': () => basculerLecture(),
  'suivant': () => {
    if (S.mode === 'radio') return radioSuivant();
    const s = S.suite && parId[S.suite];
    if (!s) return;
    if (S.vue === 'rencontre' && S.courant === S.joue) ouvrir(s.id); else { S.finTraitee = true; enchainerDecouverte(); }
  },
  'retour-morceau': () => { if (S.mode === 'radio') entrerMachine(); else if (S.joue) ouvrir(S.joue, { jouer: false }); },
  'station': b => choisirStation(+b.dataset.station),
  'radio-lecture': radioLecture,
  'radio-suivant': radioSuivant,
  'radio-precedent': radioPrecedent,
  'radio-garder': () => { const id = S.file[S.pos]; if (id) basculerGarde(id); },
  'radio-raconte': () => {
    const id = S.file[S.pos];
    if (!id) return;
    const continuer = S.joue === id;
    if (continuer) S.mode = 'decouvrir';
    ouvrir(id, { jouer: !continuer });
  },
  'ouvrir-bac': ouvrirBac,
  'fermer-bac': fermerBac,
  'onglet': b => { S.onglet = b.dataset.onglet; rendreBac(); },
  'ecouter-gardes': () => { fermerBac(); aller('machine'); choisirStation(STATIONS_UI.length - 1); },
  'copier-liste': copierListe,
  'teinte': teinteSuivante,
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-action]');
  if (!b) return;
  const a = ACTIONS[b.dataset.action];
  if (a) { e.preventDefault(); a(b); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#bac').hidden) fermerBac();
  if (e.key === ' ' && e.target === document.body && S.joue) { e.preventDefault(); basculerLecture(); }
});
$$('.fader input').forEach(f => f.addEventListener('input', () => clic(2000 + +f.value * 120, 0.015, 0.03)));

/* ─────────────────────────────── démarrage ─────────────────────────────── */
appliquerTeinte(teinteActive, false);
majMolettesVolume();
rendreTuner();
brancherTuner();
chargerAPI(); // le lecteur se prépare pendant que tu règles le volume
$('#compteur-bac').textContent = S.gardes.length;
if (IOS) $('#allumage-conseil').textContent = 'Sur iPhone, le volume se règle avec les boutons du téléphone : baisse-le un peu avant d\'allumer.';
if (S.gardes.length || S.croises.length) {
  const r = $('#allumage-retour');
  r.hidden = false;
  r.textContent = S.gardes.length
    ? `Ton bac t'attend : ${S.gardes.length} morceau${S.gardes.length > 1 ? 'x' : ''} gardé${S.gardes.length > 1 ? 's' : ''}.`
    : `Content de te revoir. Tu avais croisé ${S.croises.length} morceaux.`;
}
aller('allumage');
})();
