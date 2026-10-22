/* ════════════════════════════════════════════════════════════════════
   MUSIC DISCOVERY — v0.7
   Toute la logique du site. Tu n'as normalement pas besoin d'y toucher :
   la musique se gère dans data.js, les couleurs dans teintes.css.
   ════════════════════════════════════════════════════════════════════ */

(() => {
'use strict';

/* ─────────────────────────────── utilitaires ─────────────────────────────── */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const E  = Pochettes.echapper;
const N  = Pochettes.normaliser;
const hasard = arr => arr[Math.floor(Math.random() * arr.length)];
const melanger = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const borner = (v, a, b) => Math.max(a, Math.min(b, v));
const deux = n => String(Math.max(0, Math.floor(n))).padStart(2, '0');
const minutes = s => `${Math.floor(s / 60)}:${deux(s % 60)}`;
const reduitMouvement = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tactile = matchMedia('(hover: none)').matches;
const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (IOS) document.documentElement.classList.add('ios');
const doux = reduitMouvement ? 'auto' : 'smooth';

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
// certains titres ne sont faits que de caractères invisibles (ㅤㅤㅤ) : on affiche alors « Sans titre »
const titreVisible = t => String(t || '').replace(/[\s\u3164\u115F\u1160\uFFA0\u2800\u200B-\u200F\u2060\uFEFF]/g, '') ? String(t).trim() : 'Sans titre';

// l'identifiant d'un morceau ne dépend que de son artiste et de son titre :
// retirer un morceau de data.js ne décale plus les trouvailles des autres
const vusIds = {};
const BANQUE = (typeof MORCEAUX !== 'undefined' ? MORCEAUX : []).map((m, i) => {
  const energie = num(m.energie, 5);
  const base = slug(m.artiste + '-' + m.titre);
  vusIds[base] = (vusIds[base] || 0) + 1;
  return {
    ...m,
    id: vusIds[base] > 1 ? `${base}-${vusIds[base]}` : base,
    affiche: titreVisible(m.titre),
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
// Découvrir mesure trois choses (énergie, côté barré, envie de danser) ; la radio, deux
// connu (0) ou confidentiel (10) : mesuré d'après le nombre de fans de l'artiste sur Deezer,
// et, tant qu'on ne sait pas, d'après la note « etrange » de data.js
const conf = m => { const c = m.id ? Pochettes.confidentiel(m) : null; return c === null ? m.etrange : c; };
const val = (m, cle) => cle === 'etrange' ? conf(m) : m[cle];
const distance = (a, b) => Math.hypot(a.energie - b.energie, conf(a) - conf(b), (a.danse - b.danse) * 0.8);
const distanceRadio = (a, b) => Math.hypot(a.energie - b.energie, conf(a) - conf(b));

/* ─────────────────────────────── les réglages de la radio ─────────────────────────────── */
// cinq crans par sélecteur : les trois mots, et un cran entre chacun
const REGLAGES = {
  energie: { valeurs: [1, 3, 5, 7, 9], noms: ['Détente', 'Plutôt calme', 'Entre deux', 'Plutôt énergique', 'Énergique'] },
  etrange: { valeurs: [1, 3, 5, 7, 9], noms: ['Connu', 'Plutôt connu', 'Entre deux', 'Plutôt confidentiel', 'Confidentiel'] },
};
const CRANS = 5;
function tonDeDepart() {
  const v3 = memoire.lire('md-ton-v3', null);
  if (v3 && v3.energie >= 0 && v3.energie < CRANS && v3.etrange >= 0 && v3.etrange < CRANS) return v3;
  const v2 = memoire.lire('md-ton-v2', null); // les sélecteurs à trois positions
  if (v2 && [0, 1, 2].includes(v2.energie)) return { energie: v2.energie * 2, etrange: [0, 1, 2].includes(v2.etrange) ? v2.etrange * 2 : 2 };
  return { energie: 2, etrange: 2 };
}

/* ─────────────────────────────── l'état ─────────────────────────────── */
const S = {
  vue: 'allumage',
  // Découvrir
  cible: { energie: 5, etrange: 5, danse: 5 }, // ce que tes choix dessinent, petit à petit
  prefs: {},              // les directions que tu suis le plus souvent
  dernierDir: null,
  tour: 0,
  vusSession: new Set(),
  courant: null,          // le disque sur la platine
  suite: null,            // les disques proposés pour la suite : { type, options: [{ id, dir }] }
  livrets: { fouille: false, machine: false },
  // lecture
  joue: null,             // morceau en cours de lecture
  lecture: null,          // 'yt' | 'extrait' | null
  enLecture: false,
  finTraitee: false,
  erreur: false,          // rien n'a pu être lu
  bloque: false,          // la lecture ne démarre pas toute seule
  aJoue: false,           // le morceau en cours a-t-il déjà démarré ?
  mode: 'decouvrir',      // ou 'radio'
  // Écouter
  tonPos: tonDeDepart(),
  sourceRadio: memoire.lire('md-source-radio', 'tout'),
  file: [], pos: 0, recents: [], echecs: 0,
  // le reste
  volume: borner(memoire.lire('md-volume', 60), 0, 100),
  croises: memoire.lire('md-croises', []),
  gardes: memoire.lire('md-gardes', []),
  injouables: new Set(memoire.lire('md-injouables', [])),
  son: memoire.lire('md-son', 'complet'),
  onglet: 'gardes',
  posteReduit: false,     // poste replié : la vidéo YouTube est alors en pause (jamais de lecture cachée)
};
// les anciens identifiants finissaient par « -numéro » : on les retrouve
const retrouver = ids => [...new Set(ids.map(id => parId[id] ? id : parId[String(id).replace(/-\d+$/, '')] ? String(id).replace(/-\d+$/, '') : null).filter(Boolean))];
S.croises = retrouver(S.croises); memoire.ecrire('md-croises', S.croises);
S.gardes  = retrouver(S.gardes);  memoire.ecrire('md-gardes', S.gardes);
if (!S.gardes.length && S.sourceRadio === 'trouvailles') S.sourceRadio = 'tout';
const ton = () => ({ energie: REGLAGES.energie.valeurs[S.tonPos.energie], etrange: REGLAGES.etrange.valeurs[S.tonPos.etrange] });

let apiEnPanne = false;
const jouable = m => S.son === 'complet' && !apiEnPanne && !!m.yt && !S.injouables.has(m.yt);
const ecoutable = m => jouable(m) || Pochettes.etat(m) !== 'absent';

/* ─────────────────────────────── petits sons de la machine ─────────────────────────────── */
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

/* ─────────────────────────────── navigation ─────────────────────────────── */
function aller(vue) {
  S.vue = vue;
  $$('section[data-ecran]').forEach(s => { s.hidden = s.dataset.ecran !== vue; });
  document.body.dataset.vue = vue;
  const source = vue === 'machine' ? 'ecouter' : 'decouvrir';
  document.body.dataset.source = source;
  $$('.selecteur-pos').forEach(b => b.setAttribute('aria-selected', b.dataset.source === source));
  window.scrollTo(0, 0);
  arreterExtrait();
  if (vue !== 'fouille') annulerCompte(true);
  majPoste();
}
function allerDecouvrir() {
  if (S.courant || S.suite) { rendreFouille(); aller('fouille'); }
  else { rendreAccueil(); aller('accueil'); }
}

/* ─────────────────────────────── LA MOLETTE DE VOLUME ───────────────────────────────
   Elle se tourne comme une vraie : on l'attrape et on tourne autour.
   Glisser vers le haut marche aussi, la roulette et les flèches du clavier aussi.
   Sur la grande molette, toucher l'anneau règle directement le niveau. */
function majMolettes() {
  $$('[data-molette="volume"]').forEach(b => {
    const f = S.volume / 100;
    const mol = $('.molette', b);
    mol.style.setProperty('--rot', `${-135 + f * 270}deg`);
    mol.setAttribute('aria-valuenow', Math.round(S.volume));
    mol.setAttribute('aria-valuetext', `Volume ${Math.round(S.volume)}`);
    const arc = $('.molette-arc circle', b);
    if (arc) arc.style.strokeDasharray = `${f * 75} 100`;
    const v = $('.valeur-volume', b);
    if (v) v.textContent = Math.round(S.volume);
  });
}
function reglerVolume(v) {
  const avant = Math.round(S.volume / 5);
  S.volume = borner(v, 0, 100);
  if (Math.round(S.volume / 5) !== avant) clic(1500 + S.volume * 10, 0.012, 0.03);
  memoire.ecrire('md-volume', Math.round(S.volume));
  majMolettes();
  appliquerVolume();
}
function brancherMolette(b) {
  const mol = $('.molette', b);
  const angle = (x, y, r) => Math.atan2(x - (r.left + r.width / 2), (r.top + r.height / 2) - y) * 180 / Math.PI; // 0 = en haut, sens des aiguilles
  let g = null;
  mol.addEventListener('pointerdown', e => {
    const r = mol.getBoundingClientRect();
    g = { r, x: e.clientX, y: e.clientY, a: angle(e.clientX, e.clientY, r), bouge: false };
    try { mol.setPointerCapture(e.pointerId); } catch (er) {}
    mol.classList.add('saisie');
    e.preventDefault();
  });
  mol.addEventListener('pointermove', e => {
    if (!g) return;
    if (!g.bouge && Math.hypot(e.clientX - g.x, e.clientY - g.y) < 3) return;
    g.bouge = true;
    const r = g.r, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const loin = Math.hypot(e.clientX - cx, e.clientY - cy) > Math.max(12, r.width * 0.3);
    let delta;
    if (loin) {
      // on tourne autour du bouton : on suit l'angle
      const a = angle(e.clientX, e.clientY, r);
      let d = a - g.a;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      delta = d / 270 * 100;
      g.a = a;
    } else {
      // tout près du centre : vers le haut ou la droite, ça monte
      delta = ((g.y - e.clientY) + (e.clientX - g.x)) * 0.5;
      g.a = angle(e.clientX, e.clientY, r);
    }
    g.x = e.clientX; g.y = e.clientY;
    reglerVolume(S.volume + delta);
  });
  const fin = e => {
    if (!g) return;
    const r = g.r, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    // un simple toucher sur l'anneau de la grande molette : le volume va là où on a touché
    if (!g.bouge && e && r.width >= 70 && Math.hypot(e.clientX - cx, e.clientY - cy) > r.width * 0.3) {
      const a = borner(angle(e.clientX, e.clientY, r), -135, 135);
      reglerVolume((a + 135) / 270 * 100);
    }
    g = null; mol.classList.remove('saisie');
  };
  mol.addEventListener('pointerup', fin);
  mol.addEventListener('pointercancel', () => { g = null; mol.classList.remove('saisie'); });
  mol.addEventListener('wheel', e => { e.preventDefault(); reglerVolume(S.volume - Math.sign(e.deltaY) * 5); }, { passive: false });
  mol.addEventListener('keydown', e => {
    const pas = { ArrowUp: 5, ArrowRight: 5, ArrowDown: -5, ArrowLeft: -5, PageUp: 20, PageDown: -20 }[e.key];
    if (!pas) return;
    e.preventDefault();
    reglerVolume(S.volume + pas);
  });
}
$$('[data-molette="volume"]').forEach(brancherMolette);

function appliquerVolume() {
  const m = S.joue ? parId[S.joue] : null;
  const f = m ? m.facteur : 1;
  const att = extraitPour ? 0.15 : 1; // pendant une pré-écoute, le morceau en cours se fait tout petit
  if (lecteur && lecteurPret) { try { lecteur.setVolume(Math.round(S.volume * f * att)); } catch (e) {} }
  audioLecture.volume = borner(S.volume / 100 * f * att, 0, 1);
}

/* ─────────────────────────────── croiser / garder ─────────────────────────────── */
function croiser(id) {
  S.vusSession.add(id);
  if (!S.croises.includes(id)) {
    S.croises.unshift(id);
    memoire.ecrire('md-croises', S.croises);
  }
}
const estGarde = id => S.gardes.includes(id);
function basculerGarde(id) {
  if (!id || !parId[id]) return;
  if (estGarde(id)) {
    S.gardes = S.gardes.filter(x => x !== id);
    toast('Retiré de tes trouvailles.');
  } else {
    const premier = !S.gardes.length;
    S.gardes.unshift(id);
    toast(premier ? 'Gardé. Tu le retrouves dans Mes trouvailles, en haut.' : 'Gardé dans tes trouvailles.', premier ? 4200 : 2400);
    clic(900, 0.08, 0.06);
    const b = $('.bouton-trouvailles'); b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse');
  }
  memoire.ecrire('md-gardes', S.gardes);
  majGarde();
  if (!$('#bac').hidden) rendreBac();
}
// tous les boutons Garder de la page se mettent à jour d'un coup
function majGarde() {
  $('#compteur-bac').textContent = S.gardes.length;
  $$('[data-garder]').forEach(b => {
    const g = estGarde(b.dataset.garder);
    b.classList.toggle('est-garde', g);
    b.setAttribute('aria-pressed', g);
    if (b.classList.contains('bouton-garder')) b.textContent = g ? 'Gardé' : 'Garder';
  });
  const pg = $('#poste-garder');
  const gj = S.joue && estGarde(S.joue);
  pg.classList.toggle('est-garde', !!gj); pg.setAttribute('aria-pressed', !!gj);
  pg.setAttribute('aria-label', gj ? 'Retirer de mes trouvailles' : 'Garder ce morceau');
  const rg = $('#radio-garder');
  const idRadio = S.file[S.pos];
  const gr = idRadio && estGarde(idRadio);
  rg.classList.toggle('est-garde', !!gr); rg.setAttribute('aria-pressed', !!gr);
  $('.cd-garder-texte', rg).textContent = gr ? 'Gardé' : 'Garder';
}

/* ─────────────────────────────── le moteur de découverte ───────────────────────────────
   À chaque disque, deux propositions pour la suite :
   la première « dans la même veine », la seconde dans une direction
   (plus calme, plus barré, plus dansant… ou complètement ailleurs).
   Les directions que tu choisis souvent reviennent plus souvent. */
const DIRECTIONS = {
  veine:      { etiquette: 'Dans la même veine' },
  calme:      { etiquette: 'Plus calme', cle: 'energie', sens: -1 },
  energique:  { etiquette: 'Plus énergique', cle: 'energie', sens: 1 },
  accessible: { etiquette: 'Plus connu', cle: 'etrange', sens: -1 },
  barre:      { etiquette: 'Plus confidentiel', cle: 'etrange', sens: 1 },
  pose:       { etiquette: 'Plus posé', cle: 'danse', sens: -1 },
  dansant:    { etiquette: 'Plus dansant', cle: 'danse', sens: 1 },
  ailleurs:   { etiquette: 'Complètement ailleurs' },
  debutDoux:  { etiquette: 'Plutôt connu' },
  debutBarre: { etiquette: 'Plutôt confidentiel' },
  coup:       { etiquette: 'Coup de cœur' },
};
function disponibles(exclure = []) {
  const hors = new Set(exclure);
  let pool = BANQUE.filter(m => !S.vusSession.has(m.id) && !hors.has(m.id));
  if (pool.length < 8) {
    S.vusSession = new Set(S.gardes);
    if (S.courant) S.vusSession.add(S.courant);
    toast('Tu as fait le tour de la sélection. On rebat les cartes.');
    pool = BANQUE.filter(m => !S.vusSession.has(m.id) && !hors.has(m.id));
  }
  const ok = pool.filter(ecoutable);
  return ok.length >= 4 ? ok : pool;
}
function tirerPondere(items, poids) {
  const total = poids.reduce((s, p) => s + p, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) { r -= poids[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}
function versDirection(ref, dir, pool) {
  if (dir === 'ailleurs') {
    const loin = pool.filter(x => distance(x, ref) >= 6).sort((a, b) => distance(b, ref) - distance(a, ref));
    return hasard(loin.slice(0, 5));
  }
  const d = DIRECTIONS[dir];
  const autres = ['energie', 'etrange', 'danse'].filter(k => k !== d.cle);
  const score = x => autres.reduce((s, k) => s + Math.abs(val(x, k) - val(ref, k)), 0) + Math.abs(Math.abs(val(x, d.cle) - val(ref, d.cle)) - 3) * 0.6;
  const c = pool.filter(x => (val(x, d.cle) - val(ref, d.cle)) * d.sens >= 2).sort((a, b) => score(a) - score(b));
  return hasard(c.slice(0, 2));
}
function tirerSuite(ref, { exclure = [], pasDeCoup = false } = {}) {
  const pool = disponibles([...(S.courant ? [S.courant] : []), ...exclure]);
  if (pool.length < 2) return null;
  // premier choix : la même énergie, l'un plutôt connu, l'autre plutôt confidentiel
  if (!ref) {
    const c = S.cible;
    let tol = 1.5, proches = [];
    while (tol <= 10) {
      proches = pool.filter(m => Math.abs(m.energie - c.energie) <= tol && Math.abs(m.danse - c.danse) <= tol + 2);
      if (proches.length >= 6) break;
      tol += 1;
    }
    if (proches.length < 2) proches = pool;
    const tri = [...proches].sort((a, b) => conf(a) - conf(b));
    const a = hasard(tri.slice(0, Math.min(3, tri.length - 1)));
    const reste = tri.filter(x => x !== a);
    const b = hasard(reste.slice(-Math.min(3, reste.length)));
    return { type: 'premier', options: [{ id: a.id, dir: 'debutDoux' }, { id: b.id, dir: 'debutBarre' }] };
  }
  // de temps en temps, un coup de cœur tout seul : le plus proche de ce que tes choix dessinent
  if (!pasDeCoup && S.tour > 0 && S.tour % 7 === 0) {
    const m = [...pool].sort((x, y) => distance(x, S.cible) - distance(y, S.cible))[0];
    if (m) return { type: 'coup', options: [{ id: m.id, dir: 'coup' }] };
  }
  // A : dans la même veine (un lien choisi à la main dans data.js passe en premier)
  const manuel = ref.liens.map(parTitre).find(x => x && pool.includes(x));
  const a = manuel || hasard([...pool].sort((x, y) => distance(x, ref) - distance(y, ref)).slice(0, 3));
  const resteB = pool.filter(x => x !== a);
  // B : une direction
  let dir;
  if (S.tour % 5 === 4) dir = 'ailleurs';
  else {
    const possibles = ['calme', 'energique', 'accessible', 'barre', 'pose', 'dansant'].filter(d => {
      const D = DIRECTIONS[d];
      return resteB.some(x => (val(x, D.cle) - val(ref, D.cle)) * D.sens >= 2);
    });
    const poids = possibles.map(d => (1 + 1.5 * (S.prefs[d] || 0)) * (d === S.dernierDir ? 0.5 : 1));
    dir = possibles.length ? tirerPondere(possibles, poids) : 'ailleurs';
  }
  let b = versDirection(ref, dir, resteB);
  if (!b) { dir = 'ailleurs'; b = versDirection(ref, 'ailleurs', resteB) || hasard(resteB); }
  const type = S.tour >= 2 && S.tour % 3 === 2 ? 'mystere' : 'normal';
  return { type, options: [{ id: a.id, dir: 'veine' }, { id: b.id, dir }] };
}
function apprendre(m) {
  S.cible.energie = borner(S.cible.energie + (m.energie - S.cible.energie) * 0.2, 0, 10);
  S.cible.etrange = borner(S.cible.etrange + (conf(m) - S.cible.etrange) * 0.3, 0, 10);
  S.cible.danse   = borner(S.cible.danse   + (m.danse   - S.cible.danse)   * 0.25, 0, 10);
}
// une phrase pour deviner un disque sans le voir
function indice(m) {
  const e = m.energie <= 2 ? 'Tout en douceur' : m.energie <= 4 ? 'Plutôt détente' : m.energie <= 6 ? 'Ça avance' : m.energie <= 8 ? 'Énergique' : 'Ça cogne';
  const c = conf(m);
  const t = c <= 3 ? 'et plutôt connu' : c <= 6 ? 'et pas si connu' : 'et confidentiel';
  const d = m.danse >= 8 ? ' On danse.' : m.danse <= 2 ? ' On reste assis.' : '';
  return `${e}, ${t}.${d}`;
}

/* ─────────────────────────────── DÉCOUVRIR : par où commencer ─────────────────────────────── */
function dateDuJour() {
  const d = new Date();
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
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
    <p class="jour-titre">Le morceau du jour</p>
    <button class="carte-retournable carte-jour ${revele ? 'retournee' : ''}" data-action="jour" data-id="${m.id}" aria-label="${revele ? `Réécouter ${E(m.affiche)}` : 'Retourner le morceau du jour'}">
      <span class="carte-face carte-dos"><span class="carte-dos-motif"></span><span class="carte-dos-texte">${E(indice(m))}<br><br>Retourne-moi.</span></span>
      <span class="carte-face carte-recto">${Pochettes.html(m, 'pochette-grande')}</span>
    </button>
    ${revele ? `<p class="titre-morceau">${E(m.affiche)}</p><p class="artiste-morceau">${E(m.artiste)}</p>` : ''}
    <p class="jour-pied">Le même pour tout le monde, ce ${E(dateTexte)}. Il change demain.</p>`;
}
function commencer(envie) {
  S.cible = envie === 'energique' ? { energie: 7.5, etrange: 4.5, danse: 6.5 }
    : envie === 'detente' ? { energie: 2.5, etrange: 4.5, danse: 2.5 }
    : { energie: 2 + Math.random() * 6, etrange: 3 + Math.random() * 5, danse: 1 + Math.random() * 8 };
  S.tour = 0; S.prefs = {}; S.dernierDir = null;
  S.suite = tirerSuite(null);
  if (S.suite) S.suite.options.forEach(o => croiser(o.id));
  clic(1200);
  rendreFouille();
  aller('fouille');
}

/* ─────────────────────────────── LA FOUILLE ─────────────────────────────── */
function rendreFouille() {
  rendrePlatine();
  rendreSuite();
  rendreLivret('fouille', S.courant && parId[S.courant]);
  majGarde();
  majAvis();
}
// choisir un disque : il passe sur la platine, et deux autres sortent pour la suite
function choisir(id, dir, { bouger = true } = {}) {
  const m = parId[id];
  if (!m) return;
  annulerCompte(true);
  if (dir && DIRECTIONS[dir] && DIRECTIONS[dir].cle) S.prefs[dir] = (S.prefs[dir] || 0) + 1;
  S.dernierDir = dir || null;
  apprendre(m);
  S.tour++;
  mettreSurLaPlatine(m, { bouger });
}
function mettreSurLaPlatine(m, { bouger = true, jouer = true } = {}) {
  S.courant = m.id;
  croiser(m.id);
  S.suite = tirerSuite(m);
  if (S.suite) S.suite.options.forEach(o => croiser(o.id));
  rendreFouille();
  if (bouger) {
    if (S.vue !== 'fouille') aller('fouille');
    else window.scrollTo({ top: 0, behavior: doux });
  }
  if (jouer) { S.mode = 'decouvrir'; jouerMorceau(m); }
  else majPoste();
  if (!bouger) toast(`Ensuite : ${m.affiche}`);
}

/* le disque qui joue */
function rendrePlatine() {
  const el = $('#platine');
  const m = S.courant && parId[S.courant];
  el.hidden = !m;
  $('#fouille').classList.toggle('sans-platine', !m);
  if (!m) { el.dataset.id = ''; return; }
  if (el.dataset.id !== m.id) {
    el.dataset.id = m.id;
    el.innerHTML = `
      <div class="platine-ecran">
        <div class="emplacement-ecran emplacement-fouille" data-emplacement="fouille"></div>
        <div class="platine-pochette">${Pochettes.html(m, 'pochette-platine')}</div>
      </div>
      <div class="platine-texte">
        <h1 class="platine-titre">${E(m.affiche)}</h1>
        <p class="platine-artiste">${E(m.artiste)}</p>
        <button class="platine-album" data-action="livret" data-livret="fouille" data-ouvrir="1" hidden></button>
        ${m.note ? `<p class="platine-note">${E(m.note).replace(/\n/g, '<br>')}</p>` : ''}
        <div class="platine-actions">
          <button class="bouton-garder" data-action="garder" data-garder="${m.id}" data-id="${m.id}">Garder</button>
          <button class="platine-lecture" data-action="platine-lecture" hidden><span class="icone icone-lecture"></span><span class="platine-lecture-texte">Lecture</span></button>
          <button class="lien-bouton" data-action="livret" data-livret="fouille" data-ouvrir="1">Ouvrir le livret</button>
        </div>
        <div class="platine-progression" hidden><span></span></div>
        <p class="platine-info" hidden></p>
        <div class="avis-pub" data-avis hidden></div>
      </div>`;
    teinterFond(m);
  }
  majPlatine();
}
function phraseAlbumCourte(m) {
  const f = Pochettes.meta(m) || {};
  const nom = f.album || m.album;
  const annee = f.annee;
  if (f.typeAlbum === 'single' || (nom && N(nom) === N(m.titre))) return `Sorti en single${annee ? ` en ${annee}` : ''}`;
  if (!nom) return '';
  return `Sur l'album ${nom}${annee ? ` (${annee})` : ''}`;
}
function majPlatine() {
  const el = $('#platine');
  if (!el || el.hidden) return;
  const m = parId[el.dataset.id];
  if (!m) return;
  const actif = S.mode === 'decouvrir' && S.joue === m.id;
  el.classList.toggle('actif', actif);
  const alb = $('.platine-album', el);
  const phrase = phraseAlbumCourte(m);
  alb.hidden = !phrase;
  alb.textContent = phrase;
  // pour les extraits (pas de commandes YouTube), ou pour reprendre ce disque
  const b = $('.platine-lecture', el);
  const montrer = !actif || (S.lecture === 'extrait' && !S.erreur);
  b.hidden = !montrer;
  b.classList.toggle('en-pause', actif && S.enLecture);
  $('.icone', b).classList.toggle('pause', actif && S.enLecture);
  $('.platine-lecture-texte', b).textContent = !actif ? 'L\'écouter' : S.enLecture ? 'Pause' : 'Lecture';
  $('.platine-progression', el).hidden = !(actif && S.lecture === 'extrait');
  // ce qu'il faut savoir sur la lecture
  const info = $('.platine-info', el);
  const src = Pochettes.source(m);
  let html = '';
  if (actif && S.bloque && S.lecture === 'yt') html = 'La vidéo ne démarre pas toute seule : appuie sur ▶ dans la vidéo.';
  else if (actif && S.bloque) html = 'L\'extrait ne démarre pas tout seul : appuie sur Lecture.';
  else if (actif && S.erreur) html = 'Ce morceau ne peut pas être lu ici. <button class="lien-bouton" data-action="livret" data-livret="fouille" data-ouvrir="1">Le livret</button> donne ses liens pour l\'écouter en entier ailleurs.';
  else if (actif && S.lecture === 'extrait') {
    const entier = src && src.lien ? ` <a href="${E(src.lien)}" target="_blank" rel="noopener">En entier sur ${src.nom}</a>` : '';
    html = (S.son === 'extraits' ? 'Extrait de 30 secondes.'
      : 'Ce morceau ne se lit pas ici en entier : extrait de 30 secondes.') + entier;
  }
  info.hidden = !html;
  if (info.innerHTML !== html) info.innerHTML = html;
}
function teinterFond(m) {
  const ec = $('.ecran-fouille');
  ec.style.removeProperty('--couleur-disque');
  Pochettes.couleur(m, ([r, g, b]) => { if (S.courant === m.id) ec.style.setProperty('--couleur-disque', `${r}, ${g}, ${b}`); });
}

/* les disques pour la suite */
function rendreSuite() {
  const el = $('#suite');
  const s = S.suite;
  if (!s) { el.innerHTML = `<h2 class="suite-titre" id="suite-titre">C'est tout pour l'instant</h2><p class="suite-sous">La sélection est trop petite pour te proposer autre chose. Reviens bientôt.</p>`; return; }
  const titre = s.type === 'premier' ? (S.courant ? 'Nouveau départ, lequel ?' : 'Pour commencer, lequel ?')
    : s.type === 'coup' ? 'Avant de continuer' : 'La suite, à toi de choisir';
  const sous = s.type === 'premier' ? (tactile ? 'Touche « Écouter 30 s » pour entendre un bout, puis choisis.' : 'Survole une pochette pour entendre un bout, puis choisis.')
    : s.type === 'coup' ? 'Celui-là, je l\'avais mis de côté pour toi.'
    : s.type === 'mystere' ? 'L\'un des deux est caché. Si tu ne choisis pas, la première démarre à la fin du morceau.'
    : 'Si tu ne choisis pas, la première démarre à la fin du morceau.';
  const options = s.type === 'coup' ? carteCoup(s.options[0])
    : s.options.map((o, i) => (s.type === 'mystere' && i === 1) ? carteMystere(o, i) : carteOption(o, i)).join('');
  el.innerHTML = `
    <h2 class="suite-titre" id="suite-titre">${titre}</h2>
    <p class="suite-sous" id="suite-sous" aria-live="polite">${sous}</p>
    <div class="suite-options suite-${s.type}">${options}</div>
    ${s.type === 'coup' ? '' : `<div class="suite-pied">
      <button class="lien-bouton" data-action="aucun">Aucun des deux</button>
      ${tactile ? '' : '<span class="raccourcis">Au clavier : 1 ou 2 pour choisir, G pour garder.</span>'}
    </div>`}`;
  if (!tactile) {
    $$('.option:not(.mystere), .coup', el).forEach(c => {
      c.addEventListener('mouseenter', () => lancerExtrait(c.dataset.id, c));
      c.addEventListener('mouseleave', () => { if (extraitPour === c.dataset.id) arreterExtrait(); });
    });
  }
}
function boutonExtrait(m) {
  const src = Pochettes.source(m);
  return `<div class="option-extrait">
      <button class="extrait-bouton" data-action="extrait" data-id="${m.id}" data-extrait-pour="${m.id}" data-etat="${Pochettes.etat(m)}" data-source="${src ? src.nom : ''}">
        <span class="extrait-icone"></span>
        <span class="extrait-ok">${tactile ? 'Écouter 30 s' : 'Survole pour un extrait'}</span>
        <span class="extrait-inconnu">Extrait en route…</span>
        <span class="extrait-absent">Pas d'extrait</span>
      </button>
      <a class="extrait-lien" data-lien-pour="${m.id}" target="_blank" rel="noopener" href="${src && src.lien ? E(src.lien) : '#'}"${src && src.lien ? '' : ' hidden'}>${src ? `En entier sur ${src.nom}` : ''}</a>
    </div>`;
}
function carteOption(o, i) {
  const m = parId[o.id];
  const et = DIRECTIONS[o.dir] ? DIRECTIONS[o.dir].etiquette : '';
  return `<article class="option" data-id="${m.id}" style="--penche:${i ? 1.6 : -2}deg">
    <button class="option-pochette" data-action="choisir" data-id="${m.id}" data-dir="${o.dir}" aria-label="${E(et)} : ${E(m.affiche)}, ${E(m.artiste)}">
      ${Pochettes.html(m, 'pochette-option')}
      <span class="sticker" aria-hidden="true">${E(et)}</span>
      <span class="option-barre" aria-hidden="true"></span>
    </button>
    <p class="option-titre">${E(m.affiche)}</p>
    <p class="option-artiste">${E(m.artiste)}</p>
    ${m.long ? '<p class="option-long">Un long moment : garde-le pour quand tu as le temps.</p>' : ''}
    ${boutonExtrait(m)}
  </article>`;
}
function carteMystere(o, i) {
  const m = parId[o.id];
  return `<article class="option mystere" data-id="${m.id}" style="--penche:${i ? 1.6 : -2}deg">
    <button class="option-pochette carte-retournable" data-action="choisir-mystere" data-id="${m.id}" data-dir="${o.dir}" aria-label="Choisir la carte mystère">
      <span class="carte-face carte-dos"><span class="carte-dos-motif"></span><span class="carte-dos-texte">${E(indice(m))}</span></span>
      <span class="carte-face carte-recto">${Pochettes.html(m, 'pochette-option')}</span>
      <span class="sticker" aria-hidden="true">Carte mystère</span>
    </button>
    <p class="option-titre">Carte mystère</p>
    <p class="option-artiste">Retourne-la, elle se lance.</p>
  </article>`;
}
function carteCoup(o) {
  const m = parId[o.id];
  return `<article class="coup" data-id="${m.id}">
    <button class="option-pochette" data-action="choisir" data-id="${m.id}" data-dir="coup" aria-label="Écouter le coup de cœur : ${E(m.affiche)}, ${E(m.artiste)}">
      ${Pochettes.html(m, 'pochette-option')}
      <span class="sticker sticker-coup" aria-hidden="true">Coup de cœur</span>
    </button>
    <div class="coup-texte">
      <p class="option-titre">${E(m.affiche)}</p>
      <p class="option-artiste">${E(m.artiste)}</p>
      ${boutonExtrait(m)}
      <div class="coup-actions">
        <button class="gros-bouton gros-bouton-plein" data-action="choisir" data-id="${m.id}" data-dir="coup">L'écouter</button>
        <button class="lien-bouton" data-action="pas-maintenant">Pas maintenant</button>
      </div>
    </div>
  </article>`;
}

/* enchaînement automatique à la fin d'un morceau : la première proposition, après 5 secondes */
let compte = null;
function annulerCompte(silencieux) {
  clearInterval(compte); compte = null;
  $$('.option.compte, .coup.compte').forEach(c => c.classList.remove('compte'));
  if (!silencieux) {
    const s = $('#suite-sous');
    if (s) s.textContent = 'D\'accord, on reste là. Choisis quand tu veux.';
  }
}
function lancerCompte(o) {
  annulerCompte(true);
  const m = parId[o.id];
  let n = 5;
  const carte = $(`#suite [data-id="${o.id}"]`);
  if (carte) carte.classList.add('compte');
  const maj = () => {
    const s = $('#suite-sous');
    if (s) s.innerHTML = `On enchaîne sur « ${E(m.affiche)} » dans ${n} s. <button class="lien-bouton" data-action="rester">Rester ici</button>`;
  };
  maj();
  compte = setInterval(() => {
    n--;
    if (n <= 0) { annulerCompte(true); choisir(o.id, o.dir); }
    else maj();
  }, 1000);
}
function enchainerDecouverte() {
  const o = S.suite && S.suite.options[0];
  if (!o) return;
  if (S.vue === 'fouille' && S.courant === S.joue) lancerCompte(o);
  else choisir(o.id, o.dir, { bouger: false }); // ailleurs sur le site : on enchaîne sans te déplacer
}

/* ─────────────────────────────── LE LIVRET ───────────────────────────────
   Comme le livret d'un CD : l'album, l'artiste, et où écouter le morceau
   en entier. Replié par défaut, pour que la page reste légère. */
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
function dateLongue(d) {
  if (!d) return '';
  const [a, mo, j] = d.split('-').map(Number);
  if (!a) return '';
  if (!mo || (mo === 1 && j === 1)) return `en ${a}`;
  return `le ${j === 1 ? '1er' : j} ${MOIS[mo - 1]} ${a}`;
}
function phraseAlbum(a) {
  const mot = { album: 'Album', single: 'Single', ep: 'EP', compile: 'Compilation' }[a.type] || 'Album';
  const fem = a.type === 'compile';
  let p = mot;
  const date = dateLongue(a.date);
  if (date) p += ` sorti${fem ? 'e' : ''} ${date}`;
  if (a.label) p += ` chez ${a.label}`;
  p += '.';
  if (a.nb > 1) p += ` ${a.nb} titres${a.duree ? `, ${Math.round(a.duree / 60)} minutes` : ''}.`;
  if (a.genre) p += ` Au rayon ${a.genre.toLowerCase()}.`;
  return p;
}
function liensAilleurs(m) {
  const q = encodeURIComponent(`${Pochettes.artistePrincipal(m.artiste)} ${m.titre}`);
  const l = Pochettes.liens(m);
  return [
    ['YouTube Music', m.lien],
    ['Deezer', l.deezer || `https://www.deezer.com/search/${q}`],
    ['Apple Music', l.apple || `https://music.apple.com/fr/search?term=${q}`],
    ['Qobuz', `https://www.qobuz.com/fr-fr/search?q=${q}`],
    ['Bandcamp', m.bandcamp || `https://bandcamp.com/search?q=${q}&item_type=t`],
  ].map(([nom, url]) => `<a href="${E(url)}" target="_blank" rel="noopener">${nom}</a>`).join('');
}
function rendreLivret(ou, m, { force = false } = {}) {
  const el = $(`#livret-${ou}`);
  if (!el) return;
  if (!m) { el.hidden = true; el.dataset.id = ''; return; }
  el.hidden = false;
  const ouvert = S.livrets[ou];
  if (!force && el.dataset.id === m.id && el.dataset.ouvert === String(ouvert)) return;
  el.dataset.id = m.id;
  el.dataset.ouvert = String(ouvert);
  el.classList.toggle('ouvert', ouvert);
  const q = encodeURIComponent(`${Pochettes.artistePrincipal(m.artiste)} ${m.titre}`);
  el.innerHTML = `
    <button class="livret-bouton" data-action="livret" data-livret="${ou}" aria-expanded="${ouvert}">
      <span class="livret-icone" aria-hidden="true"><span></span></span>
      <span class="livret-bouton-texte"><strong>${ouvert ? 'Refermer le livret' : 'Ouvrir le livret'}</strong>
      <span>L'album, l'artiste, et où écouter « ${E(m.affiche)} » en entier</span></span>
    </button>
    ${ouvert ? `
    <div class="livret-pages">
      <section class="livret-page" aria-label="L'album">
        <div class="livret-album" data-album-pour="${m.id}"><p class="livret-attente">On feuillette l'album…</p></div>
      </section>
      <section class="livret-page" aria-label="L'artiste">
        <div class="livret-artiste" data-artiste-pour="${m.id}"><p class="livret-attente">On cherche qui est derrière ce morceau…</p></div>
      </section>
    </div>
    <div class="livret-ailleurs">
      <p class="livret-ailleurs-titre">Écouter ce morceau en entier sur</p>
      <p class="ailleurs">${liensAilleurs(m)}</p>
      <p class="livret-paroles"><a class="lien-bouton" href="https://genius.com/search?q=${q}" target="_blank" rel="noopener">Les paroles sur Genius</a></p>
    </div>` : ''}`;
  if (ouvert) { remplirAlbum(el, m); remplirArtiste(el, m); }
}
const pistesLivret = {};
// un titre de l'album qui est aussi dans la sélection : on peut le lancer en entier
function dansLaSelection(titre, artiste) {
  const t = N(titre), a = N(Pochettes.artistePrincipal(artiste));
  return BANQUE.find(x => N(x.titre) === t && (N(x.artiste).includes(a) || a.includes(N(Pochettes.artistePrincipal(x.artiste)))));
}
function remplirAlbum(el, m) {
  const ou = el.id.replace('livret-', '');
  Pochettes.album(m).then(a => {
    const corps = el.querySelector(`[data-album-pour="${m.id}"]`);
    if (!corps) return;
    if (!a) {
      corps.innerHTML = `<p class="livret-nom">${E(m.album || 'Album inconnu')}</p>
        <p class="livret-vide">${m.album ? 'C\'est l\'album d\'où vient ce morceau. ' : ''}Les catalogues n'en disent pas plus : ces disques-là se racontent chez les disquaires.</p>`;
      return;
    }
    const t = N(m.titre);
    pistesLivret[ou] = a.pistes;
    const pistes = a.pistes.length > 1 ? `<p class="pistes-aide">Touche un titre pour en écouter 30 secondes${a.pistes.some(p => dansLaSelection(p.titre, a.artiste || m.artiste)) ? ' (ceux marqués « en entier » sont dans la sélection)' : ''}.</p>
      <ol class="pistes">${a.pistes.slice(0, 40).map((p, i) => {
      const pt = N(p.titre);
      const ici = pt && t && (pt === t || pt.startsWith(t) || t.startsWith(pt));
      const sel = !ici && dansLaSelection(p.titre, a.artiste || m.artiste);
      const duree = p.duree ? `<span class="piste-duree">${minutes(p.duree)}</span>` : '';
      return ici
        ? `<li class="ici"><span class="piste-btn"><span class="piste-titre">${E(p.titre)}</span><span class="piste-note">en cours</span>${duree}</span></li>`
        : `<li><button class="piste-btn" data-action="piste" data-livret="${ou}" data-i="${i}"${sel ? ` data-id="${sel.id}"` : ''}><span class="piste-titre">${E(p.titre)}</span>${sel ? '<span class="piste-note">en entier</span>' : '<span class="piste-note piste-ecoute">30 s</span>'}${duree}</button></li>`;
    }).join('')}</ol>` : '';
    corps.innerHTML = `
      <div class="livret-album-tete">
        ${Pochettes.html(m, 'pochette-livret')}
        <div>
          <p class="livret-nom">${E(a.titre || m.album || '')}</p>
          <p class="livret-phrase">${E(phraseAlbum(a))}</p>
        </div>
      </div>
      <div class="livret-wiki" data-wiki hidden></div>
      ${pistes}
      ${a.liens.deezer || a.liens.apple ? `<p class="livret-liens">${a.liens.deezer ? `<a class="lien-bouton" href="${E(a.liens.deezer)}" target="_blank" rel="noopener">L'album sur Deezer</a>` : ''}${a.liens.apple ? `<a class="lien-bouton" href="${E(a.liens.apple)}" target="_blank" rel="noopener">L'album sur Apple Music</a>` : ''}</p>` : ''}`;
    Infos.oeuvre(a.titre || m.album || m.titre, a.artiste || m.artiste, a.type === 'single' ? 'chanson' : 'album', w => {
      const box = corps.querySelector('[data-wiki]');
      if (!box || !w) return;
      box.hidden = false;
      box.innerHTML = `<p>${E(w.extrait)}</p><a class="lien-bouton" href="${E(w.url)}" target="_blank" rel="noopener">Lire la suite sur Wikipédia${w.langue === 'en' ? ' (en anglais)' : ''}</a>`;
    });
  });
}
function remplirArtiste(el, m) {
  Infos.artiste(m.artiste, f => {
    const corps = el.querySelector(`[data-artiste-pour="${m.id}"]`);
    if (!corps) return;
    const nom = Pochettes.artistePrincipal(m.artiste);
    if (!f) {
      corps.innerHTML = `<p class="livret-nom">${E(nom)}</p>
        <p class="livret-vide">Pas de fiche Wikipédia fiable sur ${E(nom)}. Les meilleurs se cachent parfois là où personne n'a encore écrit.</p>
        <p class="livret-liens"><a class="lien-bouton" href="https://music.youtube.com/search?q=${encodeURIComponent(nom)}" target="_blank" rel="noopener">Tout ${E(nom)} sur YouTube Music</a></p>`;
      return;
    }
    corps.innerHTML = `
      <div class="livret-artiste-tete">
        ${f.image ? `<img class="livret-photo" src="${E(f.image)}" alt="" loading="lazy">` : ''}
        <p class="livret-nom">${E(f.titre)}</p>
      </div>
      <p class="livret-texte">${E(f.extrait)}</p>
      <p class="livret-liens">
        <a class="lien-bouton" href="${E(f.url)}" target="_blank" rel="noopener">Lire la suite sur Wikipédia${f.langue === 'en' ? ' (en anglais)' : ''}</a>
        <a class="lien-bouton" href="https://music.youtube.com/search?q=${encodeURIComponent(nom)}" target="_blank" rel="noopener">Tout ${E(nom)} sur YouTube Music</a>
      </p>`;
  });
}
function ouvrirLivret(ou, m) {
  S.livrets[ou] = true;
  rendreLivret(ou, m, { force: true });
  const el = $(`#livret-${ou}`);
  if (el) setTimeout(() => el.scrollIntoView({ behavior: doux, block: 'start' }), 60);
}

// la première fois qu'un morceau passe par YouTube : pourquoi des pubs, et comment s'en passer légalement
const AVIS_PUB = `
  <p class="avis-titre">Des pubs ?</p>
  <p>Les morceaux complets passent par YouTube. Connecté à YouTube Premium dans ce navigateur, plus de pub. Sinon, il y a le mode extraits, dans Réglages.</p>
  <div class="avis-actions">
    <button class="gros-bouton gros-bouton-plein" data-action="encart-ok">Compris</button>
    <button class="lien-bouton" data-action="encart-extraits">Passer en extraits</button>
  </div>`;
function majAvis() {
  const montrer = S.lecture === 'yt' && !memoire.lire('md-encart-pub', false);
  $$('[data-avis]').forEach(a => { if (montrer && !a.innerHTML.trim()) a.innerHTML = AVIS_PUB; a.hidden = !montrer; });
}

/* ─────────────────────────────── pré-écoutes (survol, ou « Écouter 30 s ») ─────────────────────────────── */
const audioExtrait = $('#extrait');
const audioLecture = new Audio(); // sert au mode extraits, et quand un morceau refuse YouTube
audioLecture.setAttribute('playsinline', '');
let extraitPour = null, fondu = null;
function lancerExtrait(id, el) {
  const m = parId[id];
  if (!m) return;
  arreterExtrait();
  extraitPour = id;
  appliquerVolume();
  if (el) el.classList.add('ecoute');
  const bouton = el && el.querySelector('.extrait-bouton');
  if (bouton) bouton.classList.add('en-cours');
  Pochettes.extraitFrais(m).then(url => {
    if (extraitPour !== id) return;
    if (!url) { arreterExtrait(); return; }
    audioExtrait.dataset.id = id;
    audioExtrait.dataset.essai = '0';
    audioExtrait.src = url;
    audioExtrait.volume = 0;
    audioExtrait.play().catch(() => {});
    clearInterval(fondu);
    const cibleVol = borner(S.volume / 100 * m.facteur, 0, 1);
    fondu = setInterval(() => { audioExtrait.volume = Math.min(cibleVol, audioExtrait.volume + cibleVol / 10); if (audioExtrait.volume >= cibleVol) clearInterval(fondu); }, 50);
  });
}
function lancerExtraitPiste(p, cle, li) {
  arreterExtrait();
  extraitPour = cle;
  appliquerVolume();
  if (li) li.classList.add('ecoute');
  Pochettes.extraitPiste(p).then(url => {
    if (extraitPour !== cle) return;
    if (!url) { arreterExtrait(); toast('Pas d\'extrait pour ce titre.'); return; }
    audioExtrait.dataset.id = '';
    audioExtrait.src = url;
    audioExtrait.volume = borner(S.volume / 100, 0, 1);
    audioExtrait.play().catch(() => arreterExtrait());
  });
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
// un extrait qui ne se lit pas (lien périmé) : on le renouvelle une fois, sinon on l'oublie
audioExtrait.addEventListener('error', () => {
  const id = audioExtrait.dataset.id, m = parId[id];
  if (!m || extraitPour !== id) return;
  if (audioExtrait.dataset.essai !== '1') {
    audioExtrait.dataset.essai = '1';
    Pochettes.rafraichir(m).then(url => { if (extraitPour === id && url) { audioExtrait.src = url; audioExtrait.play().catch(() => {}); } });
    return;
  }
  Pochettes.oublierExtrait(m, audioExtrait.src);
  arreterExtrait();
});
document.addEventListener('pochette-prete', e => {
  const id = e.detail;
  if (S.courant === id) majPlatine();
  if (S.joue === id && S.vue === 'machine') majAfficheur();
});

/* ─────────────────────────────── LE LECTEUR ─────────────────────────────── */
let lecteur = null, lecteurPret = false, enAttente = null, apiDemandee = false, demarrage = null;
function chargerAPI() {
  if (apiDemandee) return;
  apiDemandee = true;
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  s.onerror = () => panneAPI();
  document.head.appendChild(s);
  setTimeout(() => { if (!lecteurPret) panneAPI(); }, 12000);
}
// YouTube injoignable : on passe aux extraits pour ne pas rester bloqué
function panneAPI() {
  if (lecteurPret || apiEnPanne) return;
  apiEnPanne = true;
  toast('YouTube ne répond pas : on passe aux extraits de 30 secondes.', 4000);
  if (enAttente) { const m = enAttente; enAttente = null; if (S.joue === m.id) jouerExtraitComplet(m); }
}
window.onYouTubeIframeAPIReady = () => {
  lecteur = new YT.Player('yt-lecteur', {
    width: '100%', height: '100%',
    // lecteur youtube.com classique : un visiteur abonné à YouTube Premium n'a pas de pub
    playerVars: { playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, origin: location.origin.startsWith('http') ? location.origin : undefined },
    events: {
      onReady: () => {
        lecteurPret = true;
        apiEnPanne = false;
        if (enAttente) { const m = enAttente; enAttente = null; if (S.joue === m.id) jouerMorceau(m); }
      },
      onStateChange: e => {
        if (S.lecture !== 'yt') return;
        if (e.data === YT.PlayerState.PLAYING) { S.enLecture = true; S.aJoue = true; S.bloque = false; S.echecs = 0; clearTimeout(demarrage); appliquerVolume(); }
        if (e.data === YT.PlayerState.PAUSED) S.enLecture = false;
        if (e.data === YT.PlayerState.ENDED) { S.enLecture = false; finDuMorceau(); }
        majEtat();
      },
      onError: () => {
        const m = parId[S.joue];
        if (!m || S.lecture !== 'yt') return;
        clearTimeout(demarrage);
        S.injouables.add(m.yt);
        memoire.ecrire('md-injouables', [...S.injouables]);
        try { lecteur.stopVideo(); } catch (e) {}
        jouerExtraitComplet(m);
      }
    }
  });
};
// une vidéo qui ne démarre jamais (lecture automatique bloquée, vidéo coincée) ne doit pas tout figer
function surveillerDemarrage(m) {
  clearTimeout(demarrage);
  let patience = 2;
  const verif = () => {
    if (S.joue !== m.id || S.lecture !== 'yt' || S.enLecture) return;
    let st = -1;
    try { st = lecteur.getPlayerState(); } catch (e) {}
    if (st === YT.PlayerState.PLAYING || st === YT.PlayerState.PAUSED) return;
    if (st === YT.PlayerState.BUFFERING && patience-- > 0) { demarrage = setTimeout(verif, 6000); return; }
    S.bloque = true;
    if (S.mode === 'radio') echecRadio(m, 'ne démarre pas');
    majEtat();
  };
  demarrage = setTimeout(verif, 9000);
}
function jouerMorceau(m) {
  annulerCompte(true);
  arreterExtrait();
  clearTimeout(demarrage);
  S.joue = m.id;
  S.finTraitee = false;
  S.erreur = false;
  S.bloque = false;
  S.aJoue = false;
  audioLecture.pause();
  if (!jouable(m)) { jouerExtraitComplet(m); return; }
  S.lecture = 'yt';
  S.enLecture = false;
  S.posteReduit = false;
  $('#ecran-video').hidden = false;
  majPoste();
  if (!lecteurPret) { enAttente = m; chargerAPI(); majEtat(); return; }
  try { lecteur.loadVideoById(m.yt); } catch (e) {}
  appliquerVolume();
  surveillerDemarrage(m);
  majEtat();
}
function jouerExtraitComplet(m, essai = 0) {
  if (lecteur && lecteurPret) { try { lecteur.stopVideo(); } catch (e) {} }
  clearTimeout(demarrage);
  S.lecture = 'extrait'; S.erreur = false; S.enLecture = false;
  majPoste(); majEtat();
  Pochettes.extraitFrais(m).then(url => {
    if (S.joue !== m.id || S.lecture !== 'extrait') return;
    if (!url) return extraitIntrouvable(m);
    audioLecture.dataset.id = m.id;
    audioLecture.dataset.essai = String(essai);
    audioLecture.src = url;
    appliquerVolume();
    audioLecture.play()
      .then(() => { S.enLecture = true; S.aJoue = true; S.bloque = false; S.echecs = 0; majEtat(); })
      .catch(err => {
        if (S.joue !== m.id) return;
        S.enLecture = false;
        // lecture automatique refusée par le navigateur : il faut un geste (appuyer sur lecture)
        if (err && err.name === 'NotAllowedError') { S.bloque = true; if (S.mode === 'radio') echecRadio(m, 'ne démarre pas'); }
        majEtat();
        // les autres erreurs (lien mort) arrivent par l'événement « error » ci-dessous
      });
  });
}
function extraitIntrouvable(m) {
  S.lecture = null; S.enLecture = false; S.erreur = true;
  majPoste(); majEtat();
  if (S.mode === 'radio') echecRadio(m, S.son === 'extraits' ? 'n\'a pas d\'extrait' : 'ne s\'écoute que sur YouTube Music');
}
// un extrait dont le lien est périmé : on en redemande un, une fois ; sinon on passe
audioLecture.addEventListener('error', () => {
  const id = audioLecture.dataset.id, m = parId[id];
  if (!m || S.joue !== id || S.lecture !== 'extrait') return;
  if (audioLecture.dataset.essai !== '1') {
    Pochettes.rafraichir(m).then(() => { if (S.joue === id && S.lecture === 'extrait') jouerExtraitComplet(m, 1); });
    return;
  }
  Pochettes.oublierExtrait(m, audioLecture.src);
  extraitIntrouvable(m);
});
audioLecture.addEventListener('ended', () => { if (S.lecture !== 'extrait') return; S.enLecture = false; majEtat(); finDuMorceau(); });
audioLecture.addEventListener('pause', () => { if (S.lecture === 'extrait') { S.enLecture = false; majEtat(); } });
audioLecture.addEventListener('play', () => { if (S.lecture === 'extrait') { S.enLecture = true; S.bloque = false; majEtat(); } });

function basculerLecture() {
  if (!S.joue) return;
  if (S.lecture === 'extrait') { if (audioLecture.paused) audioLecture.play().catch(() => {}); else audioLecture.pause(); return; }
  if (S.lecture === 'yt' && S.posteReduit) { S.posteReduit = false; majPoste(); }
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
setInterval(() => {
  if (S.lecture !== 'yt' || !lecteurPret || S.finTraitee || !S.joue) return;
  try { if (lecteur.getPlayerState() === YT.PlayerState.ENDED) finDuMorceau(); } catch (e) {}
}, 1500);
function majEtat() {
  document.body.classList.toggle('en-lecture', S.enLecture);
  $('#poste-icone').classList.toggle('pause', S.enLecture);
  $('#radio-icone').classList.toggle('pause', S.enLecture && S.mode === 'radio');
  majPlatine();
  majAvis();
  majPoste();
  if (S.vue === 'machine') majAfficheur();
}
function tempsActuel() {
  try {
    if (S.lecture === 'yt' && lecteurPret) return [lecteur.getCurrentTime() || 0, lecteur.getDuration() || 0];
    if (S.lecture === 'extrait') return [audioLecture.currentTime || 0, audioLecture.duration || 30];
  } catch (e) {}
  return [0, 0];
}

/* ─────────────────────────────── le poste et l'écran vidéo ─────────────────────────────── */
/* Règles du lecteur YouTube, respectées ici : la vidéo est toujours visible
   pendant qu'elle joue (jamais de lecture cachée), dans un cadre d'au moins
   200 × 200 pixels, sans rien posé par-dessus. */
let platineVue = true;
if ('IntersectionObserver' in window) {
  new IntersectionObserver(es => { const v = es[0].isIntersecting; if (v !== platineVue) { platineVue = v; majPoste(); } }, { threshold: 0.2 }).observe($('#platine'));
}
function majPoste() {
  const p = $('#poste');
  const yt = S.lecture === 'yt';
  const surSaPage = S.vue === 'fouille' && S.mode === 'decouvrir' && S.courant === S.joue && platineVue;
  const radioSurMachine = S.vue === 'machine' && S.mode === 'radio';
  const visible = !!S.joue && S.vue !== 'allumage' && !radioSurMachine && !surSaPage;
  p.hidden = !visible;
  p.classList.toggle('avec-video', visible && yt && !S.posteReduit);
  p.classList.toggle('reduit', visible && yt && S.posteReduit);
  document.body.classList.toggle('avec-poste', visible);
  if (S.joue) {
    const m = parId[S.joue];
    $('#poste-titre').textContent = m.affiche;
    $('#poste-artiste').textContent = S.lecture === 'extrait' ? `${m.artiste}, extrait 30 s` : m.artiste;
    const slot = $('[data-emplacement="poste"]');
    if (slot.dataset.id !== m.id) { slot.innerHTML = Pochettes.html(m, 'pochette-fond'); slot.dataset.id = m.id; }
  }
  const r = $('#poste-reduire');
  r.hidden = !yt;
  r.classList.toggle('deplier', S.posteReduit);
  r.setAttribute('aria-label', S.posteReduit ? 'Afficher la vidéo' : 'Réduire le lecteur (met en pause)');
  r.title = S.posteReduit ? 'Afficher la vidéo' : 'Réduire (met en pause)';
  majGarde();
  placerEcranVideo();
  requestAnimationFrame(() => document.body.style.setProperty('--poste-h', visible ? `${p.offsetHeight}px` : '0px'));
}
let suiviRAF = null;
function emplacementCible() {
  if (!S.joue || S.lecture !== 'yt') return null;
  if (S.vue === 'machine' && S.mode === 'radio') return $('[data-emplacement="machine"]');
  if (S.vue === 'fouille' && S.mode === 'decouvrir' && S.courant === S.joue && platineVue) return $('[data-emplacement="fouille"]');
  if (!$('#poste').hidden && !S.posteReduit) return $('[data-emplacement="poste"]');
  return null;
}
function placerEcranVideo() {
  const ev = $('#ecran-video');
  const slot = emplacementCible();
  cancelAnimationFrame(suiviRAF);
  const ou = slot ? slot.dataset.emplacement : '';
  document.body.classList.toggle('video-machine', ou === 'machine');
  document.body.classList.toggle('video-fouille', ou === 'fouille');
  if (!slot) {
    ev.classList.add('cache');
    // garde-fou : une vidéo qui n'est pas à l'écran ne doit pas jouer
    if (S.lecture === 'yt' && S.enLecture && lecteurPret) { try { lecteur.pauseVideo(); } catch (e) {} }
    return;
  }
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

// le temps qui passe : la chaîne, et la barre des extraits sur la platine
setInterval(() => {
  if (S.vue === 'fouille') {
    const barre = $('#platine .platine-progression span');
    if (barre && S.mode === 'decouvrir' && S.joue === S.courant && S.lecture === 'extrait') {
      const [t, d] = tempsActuel();
      barre.style.width = d ? `${Math.min(100, t / d * 100)}%` : '0%';
    }
  }
  if (S.vue !== 'machine') return;
  const m = parId[S.file[S.pos]];
  const active = !!m && S.mode === 'radio' && S.joue === m.id;
  const [t, d] = active ? tempsActuel() : [0, 0];
  $('#vfd-temps').textContent = `${deux(t / 60)}:${deux(t % 60)}`;
  $('#vfd-progression').style.width = d ? `${Math.min(100, (t / d) * 100)}%` : '0%';
}, 500);

/* ─────────────────────────────── ÉCOUTER : la chaîne ───────────────────────────────
   Deux sélecteurs à trois positions règlent ce qui passe : détente, entre deux
   ou énergique ; accessible, de travers ou barré. Le morceau en cours continue,
   c'est la suite qui change. */
function descriptionTon() {
  return `${REGLAGES.energie.noms[S.tonPos.energie]}, ${REGLAGES.etrange.noms[S.tonPos.etrange].toLowerCase()}`;
}
function majSelecteurs() {
  $$('.selecteur-rotatif').forEach(el => {
    const cle = el.dataset.reglage, pos = S.tonPos[cle];
    el.style.setProperty('--rot', `${(pos - 2) * 31}deg`);
    const nom = $('.sel-valeur', el);
    if (nom) nom.textContent = REGLAGES[cle].noms[pos];
    $$('.sel-etiquette', el).forEach(b => {
      const p = +b.dataset.pos, ok = p === pos;
      b.setAttribute('aria-checked', ok);
      b.classList.toggle('proche', !ok && Math.abs(p - pos) === 1);
      b.tabIndex = ok || (pos % 2 === 1 && p === pos - 1) ? 0 : -1;
    });
  });
}
// on peut aussi attraper le bouton et le tourner, cran par cran
$$('.sel-bouton').forEach(bt => {
  let g = null;
  bt.addEventListener('pointerdown', e => { g = { x: e.clientX, y: e.clientY, bouge: false, pos: S.tonPos[bt.dataset.reglage] }; try { bt.setPointerCapture(e.pointerId); } catch (er) {} e.preventDefault(); });
  bt.addEventListener('pointermove', e => {
    if (!g) return;
    const d = (g.y - e.clientY) + (e.clientX - g.x);
    if (Math.abs(d) > 6) g.bouge = true;
    if (g.bouge) regler(bt.dataset.reglage, g.pos + Math.round(d / 24), true);
  });
  // après avoir tourné le bouton, le « clic » qui suit ne doit pas avancer d'un cran de plus
  const fin = () => { if (!g) return; const bouge = g.bouge; g = null; if (bouge) { bt.dataset.saisi = '1'; setTimeout(() => delete bt.dataset.saisi, 50); tonChange(); } };
  bt.addEventListener('pointerup', fin);
  bt.addEventListener('pointercancel', fin);
});
function regler(cle, pos, enDirect) {
  if (!REGLAGES[cle]) return;
  pos = borner(pos, 0, CRANS - 1);
  if (S.tonPos[cle] === pos) return;
  S.tonPos[cle] = pos;
  memoire.ecrire('md-ton-v3', S.tonPos);
  majSelecteurs();
  clic(1500 + pos * 200, 0.03, 0.07);
  if (!enDirect) tonChange();
}
// au clavier : les flèches déplacent le sélecteur
$$('.selecteur-rotatif').forEach(el => el.addEventListener('keydown', e => {
  const pas = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
  if (!pas) return;
  e.preventDefault();
  const cle = el.dataset.reglage;
  regler(cle, S.tonPos[cle] + pas);
  const b = $(`.sel-etiquette[tabindex="0"]`, el);
  if (b) b.focus();
}));
// la file : les morceaux les plus proches du réglage, enchaînés avec un fil
function construireFil(exclure = []) {
  // au hasard : toute la sélection mélangée, sélecteurs ignorés
  // les longs moments (20 minutes et plus) ont leur bouton à eux
  if (S.sourceRadio === 'longs') return melanger(BANQUE.filter(m => m.long && !exclure.includes(m.id))).map(m => m.id);
  if (S.sourceRadio === 'hasard') {
    let p = BANQUE.filter(m => !m.long && !exclure.includes(m.id) && ecoutable(m));
    if (p.length < 3) p = BANQUE.filter(m => !m.long && !exclure.includes(m.id));
    return melanger(p).map(m => m.id);
  }
  const cible = ton();
  const base = (S.sourceRadio === 'trouvailles' && S.gardes.length ? S.gardes.map(id => parId[id]) : BANQUE)
    .filter(m => m && !exclure.includes(m.id) && (S.sourceRadio === 'trouvailles' || !m.long));
  let pool = base.filter(ecoutable);
  if (pool.length < 3) pool = base;
  pool.sort((a, b) => distanceRadio(a, cible) - distanceRadio(b, cible));
  const garde = S.sourceRadio === 'trouvailles' ? pool.length : Math.min(pool.length, 14);
  const reste = melanger(pool.slice(0, garde));
  if (!reste.length) return [];
  reste.sort((a, b) => distanceRadio(a, cible) - distanceRadio(b, cible));
  const fil = [reste.shift()];
  while (reste.length) {
    const der = fil[fil.length - 1];
    reste.sort((a, b) => distance(a, der) - distance(b, der));
    const i = Math.random() < 0.2 ? Math.floor(Math.random() * reste.length) : Math.floor(Math.random() * Math.min(3, reste.length));
    fil.push(reste.splice(i, 1)[0]);
  }
  return fil.map(m => m.id);
}
function reconstruireSuite() {
  const actuel = S.mode === 'radio' && S.joue ? S.joue : null;
  const nouveau = construireFil(actuel ? [actuel, ...S.recents.slice(-8)] : S.recents.slice(-8));
  S.file = actuel ? [actuel, ...nouveau] : nouveau;
  S.pos = 0;
}
function tonChange() {
  if (S.sourceRadio === 'hasard' || S.sourceRadio === 'longs') {
    S.sourceRadio = 'tout'; memoire.ecrire('md-source-radio', 'tout');
    $$('.source-pos').forEach(b => b.setAttribute('aria-checked', b.dataset.source === 'tout'));
  }
  reconstruireSuite();
  majMachine();
  const prochain = parId[S.file[S.mode === 'radio' && S.joue ? 1 : 0]];
  toast(prochain ? `Réglé : ${descriptionTon().toLowerCase()}. Ensuite : ${prochain.affiche}` : `Réglé : ${descriptionTon().toLowerCase()}`);
}
function choisirSourceRadio(src) {
  if (src === 'trouvailles' && !S.gardes.length) { toast('Garde des morceaux en découvrant : ils formeront ta sélection.'); return; }
  S.sourceRadio = src;
  memoire.ecrire('md-source-radio', src);
  $$('.source-pos').forEach(b => b.setAttribute('aria-checked', b.dataset.source === src));
  reconstruireSuite();
  majMachine();
  clic(1500, 0.03, 0.06);
}
function entrerMachine() {
  if (!S.file.length) reconstruireSuite();
  $$('.source-pos').forEach(b => b.setAttribute('aria-checked', b.dataset.source === S.sourceRadio));
  majSelecteurs();
  aller('machine');
  majMachine();
}
function majMachine() {
  const m = parId[S.file[S.pos]];
  $('#cd-etiquette').innerHTML = m ? Pochettes.html(m, 'pochette-cd') : '';
  majAfficheur();
  majGarde();
  S.file.slice(S.pos + 1, S.pos + 4).forEach(x => Pochettes.demander(parId[x]));
  rendreLivret('machine', m);
  placerEcranVideo();
}
function majAfficheur() {
  const m = parId[S.file[S.pos]];
  const active = !!m && S.mode === 'radio' && S.joue === m.id;
  $('#vfd-piste').textContent = `Piste ${deux(S.recents.length + (active ? 0 : 1))}`;
  const texte = m ? `${m.affiche}, ${m.artiste}${active && S.lecture === 'extrait' ? ' (extrait)' : ''}` : 'Rien à jouer.';
  const t = $('#vfd-texte');
  if (t.textContent !== texte) { t.textContent = texte; t.style.animationDuration = `${Math.max(8, texte.length * 0.28)}s`; }
  $('#vfd-reglage').textContent = S.sourceRadio === 'trouvailles' ? 'Mes trouvailles' : S.sourceRadio === 'hasard' ? 'Au hasard' : S.sourceRadio === 'longs' ? 'Longs moments' : descriptionTon();
  $('#vfd-etat').textContent = !active ? 'Stop' : S.bloque ? 'Bloqué' : S.enLecture ? 'Lecture' : S.aJoue ? 'Pause' : 'Chargement';
  const ensuite = parId[S.file[S.pos + 1]];
  $('#vfd-ensuite').textContent = ensuite ? `Ensuite : ${ensuite.affiche}` : '';
  const ms = $('#machine-source');
  const src = active && S.lecture === 'extrait' ? Pochettes.source(m) : null;
  ms.hidden = !src && !(active && S.bloque);
  if (active && S.bloque) ms.textContent = 'La lecture ne démarre pas toute seule : appuie sur lecture.';
  else if (src) ms.innerHTML = `Extrait de 30 secondes.${src.lien ? ` <a href="${E(src.lien)}" target="_blank" rel="noopener">En entier sur ${src.nom}</a>` : ''}`;
  document.body.classList.toggle('cd-tourne', active && S.enLecture);
}
function radioJouerCourant() {
  const m = parId[S.file[S.pos]];
  if (!m) { toast('Rien à jouer avec ce réglage.'); return; }
  S.mode = 'radio';
  croiser(m.id);
  if (S.recents[S.recents.length - 1] !== m.id) S.recents.push(m.id);
  jouerMorceau(m);
  majMachine();
}
// un morceau qui ne veut pas se lire : on essaie l'extrait, sinon on passe ; au bout de 3 ratés d'affilée, on s'arrête
function echecRadio(m, raison) {
  if (S.mode !== 'radio' || S.joue !== m.id) return;
  S.echecs++;
  if (S.echecs >= 3) {
    S.echecs = 0;
    radioStop();
    toast('Trois morceaux de suite ne démarrent pas. Vérifie ta connexion, puis appuie sur lecture.', 6000);
    return;
  }
  if (S.lecture === 'yt' && Pochettes.etat(m) === 'ok' && !S.bloque) { jouerExtraitComplet(m); return; }
  toast(`${m.affiche} ${raison}. On passe au suivant.`);
  setTimeout(() => { if (S.mode === 'radio' && S.joue === m.id) radioSuivant(); }, 1500);
}
function radioSuivant() {
  if (!S.file.length) reconstruireSuite();
  S.pos++;
  // fin de la file : on en reconstruit une, sans répéter ce qu'on vient d'entendre
  if (S.pos >= S.file.length) { S.file = construireFil(S.recents.slice(-10)); S.pos = 0; }
  clic(1400);
  radioJouerCourant();
}
function radioPrecedent() {
  const [t] = tempsActuel();
  if (S.mode === 'radio' && S.joue && t > 5) {
    try { if (S.lecture === 'yt') lecteur.seekTo(0, true); else audioLecture.currentTime = 0; } catch (e) {}
    clic(1100); return;
  }
  if (S.recents.length >= 2) {
    S.recents.pop();
    const id = S.recents.pop();
    S.file.splice(S.pos, 0, id);
  } else if (S.pos > 0) S.pos--;
  clic(1100);
  radioJouerCourant();
}
function radioLecture() {
  if (!S.file.length) reconstruireSuite();
  const id = S.file[S.pos];
  S.echecs = 0;
  if (S.mode === 'radio' && S.joue === id && S.lecture) basculerLecture(); else radioJouerCourant();
  clic(600, 0.06, 0.07);
}
function radioStop() {
  if (S.mode !== 'radio' || !S.joue) return;
  S.finTraitee = true;
  clearTimeout(demarrage);
  try { if (S.lecture === 'yt') lecteur.stopVideo(); } catch (e) {}
  audioLecture.pause();
  S.enLecture = false; S.lecture = null; S.joue = null; S.bloque = false;
  clic(500, 0.05, 0.06);
  majEtat(); majMachine();
}

/* ─────────────────────────────── MES TROUVAILLES / RÉGLAGES (panneaux) ─────────────────────────────── */
function ouvrirPanneau(id) {
  fermerPanneaux(true);
  if (id === 'bac') rendreBac();
  $('#voile').hidden = false;
  $('#' + id).hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('panneau-ouvert')));
}
function fermerPanneaux(immediat) {
  document.body.classList.remove('panneau-ouvert');
  const cacher = () => { $('#voile').hidden = true; $('#bac').hidden = true; $('#reglages').hidden = true; };
  if (immediat === true || reduitMouvement) cacher(); else setTimeout(cacher, 320);
}
function rendreBac() {
  $('#n-gardes').textContent = S.gardes.length;
  $('#n-croises').textContent = S.croises.length;
  $$('#bac .onglet').forEach(o => o.setAttribute('aria-selected', o.dataset.onglet === S.onglet));
  const ids = S.onglet === 'gardes' ? S.gardes : S.croises;
  $('#bac-liste').innerHTML = !ids.length
    ? `<li class="bac-vide">${S.onglet === 'gardes'
        ? 'Rien de gardé pour l\'instant. Quand un morceau te plaît, appuie sur Garder : il t\'attendra ici.'
        : 'Tout ce que tu croises s\'inscrit ici. Lance une découverte.'}</li>`
    : ids.map(id => {
        const m = parId[id];
        return `<li class="bac-ligne">
          <button class="bac-morceau" data-action="ouvrir" data-id="${m.id}">
            ${Pochettes.html(m, 'pochette-mini')}
            <span><span class="bac-titre">${E(m.affiche)}</span><span class="bac-artiste">${E(m.artiste)}</span></span>
          </button>
          <button class="bac-garder ${estGarde(m.id) ? 'est-garde' : ''}" data-action="garder" data-id="${m.id}" aria-label="${estGarde(m.id) ? 'Retirer' : 'Garder'} ${E(m.affiche)}">${estGarde(m.id) ? '−' : '+'}</button>
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

/* ─────────────────────────────── COMMENT ÉCOUTER ─────────────────────────────── */
function majSon() { $$('.choix-son').forEach(b => b.setAttribute('aria-checked', b.dataset.son === S.son)); }
function choisirSon(son) {
  if (son === S.son) return;
  S.son = son;
  memoire.ecrire('md-son', son);
  majSon();
  toast(son === 'extraits' ? 'Mode extraits : 30 secondes par morceau, sans pub.' : 'Morceaux complets, via YouTube.');
  if (S.joue) jouerMorceau(parId[S.joue]);
}

/* ─────────────────────────────── TEINTES ─────────────────────────────── */
const TEINTES = [
  { id: 'salon',  nom: 'Salon',  couleur: '#dcdbd8', pastille: 'conic-gradient(#1b3cc4 0 33%, #9a5f34 0 66%, #dcdbd8 0)' },
  { id: 'nuit',   nom: 'Nuit',   couleur: '#141318', pastille: 'conic-gradient(#5470ff 0 33%, #6e4122 0 66%, #141318 0)' },
  { id: 'papier', nom: 'Papier', couleur: '#dfe4d7', pastille: 'linear-gradient(135deg, #dfe4d7 50%, #1d2a4d 50%)' },
];
// anciennes teintes (avant la v0.6) : on retombe sur la plus proche
const ANCIENNES = { ambre: 'nuit', signal: 'salon', vide: 'salon', fievre: 'salon' };
const teinteChoisie = memoire.lire('md-teinte-v5', null);
let teinteActive = teinteChoisie ? (ANCIENNES[teinteChoisie] || teinteChoisie)
  : (matchMedia('(prefers-color-scheme: dark)').matches ? 'nuit' : 'salon'); // sans choix : comme le téléphone
function rendreTeintes() {
  const html = TEINTES.map(t => `<button class="pastille" role="radio" data-action="teinte" data-teinte="${t.id}" aria-checked="${t.id === teinteActive}" aria-label="Teinte ${t.nom}" title="${t.nom}"><span style="background:${t.pastille}"></span><em>${t.nom}</em></button>`).join('');
  $('#teintes-facade').innerHTML = html;
  $('#teintes-reglages').innerHTML = html;
}
function appliquerTeinte(id, choisie) {
  const t = TEINTES.find(x => x.id === id) || TEINTES[0];
  teinteActive = t.id;
  document.documentElement.dataset.teinte = t.id;
  $('meta[name="theme-color"]').setAttribute('content', t.couleur);
  if (choisie || teinteChoisie) memoire.ecrire('md-teinte-v5', t.id);
  rendreTeintes();
  if (choisie) { toast(`Teinte ${t.nom}`, 1400); clic(2400, 0.02, 0.05); }
}

/* ─────────────────────────────── toast ─────────────────────────────── */
let toastMinuterie = null;
function toast(msg, duree = 2800) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('visible');
  clearTimeout(toastMinuterie);
  toastMinuterie = setTimeout(() => t.classList.remove('visible'), duree);
}

/* ─────────────────────────────── commencer ─────────────────────────────── */
function allumer() {
  audioCtx();
  clic(220, 0.12, 0.12);
  setTimeout(() => clic(2600, 0.02, 0.04), 140);
  document.body.classList.add('allume');
  setTimeout(() => { rendreAccueil(); aller('accueil'); }, reduitMouvement ? 0 : 600);
}
const demarre = () => document.body.classList.contains('allume');

/* ─────────────────────────────── les actions ─────────────────────────────── */
const ACTIONS = {
  'allumer': allumer,
  'accueil': () => { if (!demarre()) return; rendreAccueil(); aller('accueil'); },
  'source': b => {
    if (!demarre()) return;
    clic(1500, 0.03, 0.06);
    if (b.dataset.source === 'ecouter') return entrerMachine();
    allerDecouvrir();
  },
  'envie': b => commencer(b.dataset.envie),
  'jour': b => {
    memoire.ecrire('md-jour', dateDuJour());
    const m = parId[b.dataset.id];
    if (!b.classList.contains('retournee')) {
      b.classList.add('retournee');
      clic(900, 0.05, 0.06);
      setTimeout(() => mettreSurLaPlatine(m), reduitMouvement ? 0 : 750);
    } else mettreSurLaPlatine(m);
  },
  'choisir': b => { arreterExtrait(); clic(1200); choisir(b.dataset.id, b.dataset.dir); },
  'choisir-mystere': b => {
    if (b.classList.contains('retournee')) return;
    b.classList.add('retournee');
    clic(900, 0.05, 0.06);
    setTimeout(() => choisir(b.dataset.id, b.dataset.dir), reduitMouvement ? 0 : 800);
  },
  'aucun': () => {
    const exclure = S.suite ? S.suite.options.map(o => o.id) : [];
    S.suite = tirerSuite(S.courant ? parId[S.courant] : null, { exclure, pasDeCoup: true });
    if (S.suite) S.suite.options.forEach(o => croiser(o.id));
    annulerCompte(true);
    clic();
    rendreSuite();
    // le morceau était déjà fini : la nouvelle première proposition démarre à son tour
    if (S.finTraitee && S.mode === 'decouvrir' && S.joue === S.courant && !S.enLecture && S.suite) lancerCompte(S.suite.options[0]);
  },
  'pas-maintenant': () => {
    S.suite = tirerSuite(S.courant ? parId[S.courant] : null, { exclure: S.suite ? S.suite.options.map(o => o.id) : [], pasDeCoup: true });
    if (S.suite) S.suite.options.forEach(o => croiser(o.id));
    rendreSuite();
  },
  'rester': () => annulerCompte(false),
  'piste': b => {
    if (b.dataset.id) { arreterExtrait(); clic(1300); mettreSurLaPlatine(parId[b.dataset.id]); return; }
    const p = (pistesLivret[b.dataset.livret] || [])[+b.dataset.i];
    if (!p) return;
    const cle = `piste:${b.dataset.livret}:${b.dataset.i}`;
    if (extraitPour === cle) arreterExtrait(); else lancerExtraitPiste(p, cle, b.closest('li'));
  },
  'extrait': b => { const id = b.dataset.id; if (extraitPour === id) arreterExtrait(); else lancerExtrait(id, b.closest('.option, .coup')); },
  'ouvrir': b => { fermerPanneaux(); clic(1300); mettreSurLaPlatine(parId[b.dataset.id]); },
  'garder': b => basculerGarde(b.dataset.id),
  'garder-joue': () => basculerGarde(S.joue),
  'lecture': () => basculerLecture(),
  'platine-lecture': () => {
    const m = parId[S.courant];
    if (!m) return;
    if (S.mode === 'decouvrir' && S.joue === m.id && S.lecture) basculerLecture();
    else { S.mode = 'decouvrir'; jouerMorceau(m); }
  },
  'suivant': () => {
    if (S.mode === 'radio') return radioSuivant();
    const o = S.suite && S.suite.options[0];
    if (o) choisir(o.id, o.dir, { bouger: S.vue === 'fouille' });
  },
  'retour-morceau': () => { if (S.mode === 'radio') entrerMachine(); else { rendreFouille(); aller('fouille'); } },
  'livret': b => {
    const ou = b.dataset.livret;
    const m = ou === 'machine' ? parId[S.file[S.pos]] : parId[S.courant];
    if (!m) return;
    if (b.dataset.ouvrir) return ouvrirLivret(ou, m);
    S.livrets[ou] = !S.livrets[ou];
    rendreLivret(ou, m, { force: true });
    clic(1000, 0.04, 0.05);
  },
  'radio-lecture': radioLecture,
  'radio-suivant': radioSuivant,
  'radio-precedent': radioPrecedent,
  'radio-stop': radioStop,
  'radio-garder': () => basculerGarde(S.file[S.pos]),
  'radio-raconte': () => { const m = parId[S.file[S.pos]]; if (m) ouvrirLivret('machine', m); },
  'regler': b => regler(b.dataset.reglage, +b.dataset.pos),
  'regler-suivant': b => { if (b.dataset.saisi) return; const c = b.dataset.reglage; regler(c, (S.tonPos[c] + 1) % CRANS); },
  'source-radio': b => choisirSourceRadio(b.dataset.source),
  'ouvrir-bac': () => ouvrirPanneau('bac'),
  'ouvrir-reglages': () => ouvrirPanneau('reglages'),
  'fermer-panneaux': () => fermerPanneaux(),
  'onglet': b => { S.onglet = b.dataset.onglet; rendreBac(); },
  'ecouter-gardes': () => { fermerPanneaux(); S.sourceRadio = 'trouvailles'; memoire.ecrire('md-source-radio', 'trouvailles'); S.file = []; entrerMachine(); radioJouerCourant(); },
  'copier-liste': copierListe,
  'son': b => choisirSon(b.dataset.son),
  'teinte': b => appliquerTeinte(b.dataset.teinte, true),
  'encart-ok': () => { memoire.ecrire('md-encart-pub', true); majAvis(); },
  'encart-extraits': () => { memoire.ecrire('md-encart-pub', true); majAvis(); choisirSon('extraits'); },
  'reduire-poste': () => {
    S.posteReduit = !S.posteReduit;
    if (S.posteReduit && S.lecture === 'yt' && lecteurPret) { try { lecteur.pauseVideo(); } catch (e) {} }
    clic(1200, 0.03, 0.05);
    majPoste();
  },
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-action]');
  if (!b) return;
  const a = ACTIONS[b.dataset.action];
  if (!a) return;
  e.preventDefault();
  // une erreur dans une action ne doit jamais figer le reste du site
  try { a(b); } catch (err) { console.error(err); toast('Oups, quelque chose a coincé. Réessaie.'); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fermerPanneaux();
  const libre = e.target === document.body || (e.target.matches && e.target.matches('.option-pochette, .bouton-garder'));
  if (!libre || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === ' ' && S.joue) { e.preventDefault(); basculerLecture(); return; }
  if (S.vue === 'fouille' && S.suite && (e.key === '1' || e.key === '2')) {
    const o = S.suite.options[+e.key - 1];
    if (o) { e.preventDefault(); clic(1200); choisir(o.id, o.dir); }
    return;
  }
  if (e.key === 'g' || e.key === 'G') {
    const id = S.vue === 'machine' ? S.file[S.pos] : S.vue === 'fouille' ? S.courant : S.joue;
    if (id) { e.preventDefault(); basculerGarde(id); }
  }
});

/* ─────────────────────────────── démarrage ─────────────────────────────── */
appliquerTeinte(teinteActive, false);
majMolettes();
majSelecteurs();
majSon();
majGarde();
chargerAPI();
// pochettes, extraits et fiches de toute la sélection, préparés dès l'arrivée (puis gardés en cache)
BANQUE.forEach(m => Pochettes.demander(m));
if (IOS) $('#allumage-conseil').textContent = 'Sur iPhone, le volume se règle avec les boutons du téléphone : baisse-le un peu avant de commencer.';
if (S.gardes.length || S.croises.length) {
  const r = $('#allumage-retour');
  r.hidden = false;
  r.textContent = S.gardes.length
    ? `Tes trouvailles t'attendent : ${S.gardes.length} morceau${S.gardes.length > 1 ? 'x' : ''} gardé${S.gardes.length > 1 ? 's' : ''}.`
    : `Content de te revoir. Tu avais croisé ${S.croises.length} morceaux.`;
}
aller('allumage');
})();
