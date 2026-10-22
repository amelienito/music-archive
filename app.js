/* ════════════════════════════════════════════════════════════════════
   MUSIC DISCOVERY — v0.6
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
const deux = n => String(Math.max(0, Math.floor(n))).padStart(2, '0');
const minutes = s => `${Math.floor(s / 60)}:${deux(s % 60)}`;
const reduitMouvement = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tactile = matchMedia('(hover: none)').matches;
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
  ton: Object.assign({ energie: 5, etrange: 5, danse: 5 }, memoire.lire('md-ton', {})), // les molettes d'Écouter
  sourceRadio: memoire.lire('md-source-radio', 'tout'),
  file: [], pos: 0, recents: [],
  volume: borner(memoire.lire('md-volume', 60), 0, 100),
  croises: memoire.lire('md-croises', []),
  gardes: memoire.lire('md-gardes', []),
  injouables: new Set(memoire.lire('md-injouables', [])),
  son: memoire.lire('md-son', 'complet'),
  onglet: 'gardes',
  posteReduit: false,     // poste replié : la vidéo YouTube est alors en pause (jamais de lecture cachée)
};
S.croises = S.croises.filter(id => parId[id]);
S.gardes  = S.gardes.filter(id => parId[id]);
if (!S.gardes.length && S.sourceRadio === 'trouvailles') S.sourceRadio = 'tout';

const jouable = m => S.son === 'complet' && !!m.yt && !S.injouables.has(m.yt);
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

/* ─────────────────────────────── LES MOLETTES (volume + réglages d'Écouter) ─────────────────────────────── */
const MOLETTES = {
  volume:  { max: 100, sensi: 0.45, pas: 5, get: () => S.volume, set: v => reglerVolume(v) },
  energie: { max: 10, sensi: 0.06, pas: 1, get: () => S.ton.energie, set: v => reglerTon('energie', v), fin: tonChange },
  etrange: { max: 10, sensi: 0.06, pas: 1, get: () => S.ton.etrange, set: v => reglerTon('etrange', v), fin: tonChange },
  danse:   { max: 10, sensi: 0.06, pas: 1, get: () => S.ton.danse,   set: v => reglerTon('danse', v),   fin: tonChange },
};
function majMolettes() {
  $$('[data-molette]').forEach(b => {
    const cfg = MOLETTES[b.dataset.molette]; if (!cfg) return;
    const f = cfg.get() / cfg.max;
    const mol = $('.molette', b);
    mol.style.setProperty('--rot', `${-135 + f * 270}deg`);
    mol.setAttribute('aria-valuenow', Math.round(cfg.get()));
    const arc = $('.molette-arc circle', b);
    if (arc) arc.style.strokeDasharray = `${f * 75} 100`;
    const v = $('.valeur-volume', b);
    if (v) v.textContent = Math.round(S.volume);
  });
}
function reglerVolume(v) {
  S.volume = borner(v, 0, 100);
  memoire.ecrire('md-volume', Math.round(S.volume));
  majMolettes();
  appliquerVolume();
}
function reglerTon(cle, v) {
  S.ton[cle] = borner(v, 0, 10);
  majMolettes();
  majAfficheur();
}
function brancherMolette(b) {
  const cfg = MOLETTES[b.dataset.molette];
  if (!cfg) return;
  const mol = $('.molette', b);
  let depart = null;
  mol.addEventListener('pointerdown', e => {
    depart = { x: e.clientX, y: e.clientY, v: cfg.get() };
    try { mol.setPointerCapture(e.pointerId); } catch (er) {}
    mol.classList.add('saisie');
    e.preventDefault();
  });
  mol.addEventListener('pointermove', e => {
    if (!depart) return;
    const delta = (depart.y - e.clientY) + (e.clientX - depart.x);
    const nv = borner(depart.v + delta * cfg.sensi, 0, cfg.max);
    if (Math.round(nv / cfg.pas) !== Math.round(cfg.get() / cfg.pas)) clic(1500 + (nv / cfg.max) * 1000, 0.012, 0.03);
    cfg.set(nv);
  });
  const fin = () => {
    if (!depart) return;
    depart = null; mol.classList.remove('saisie');
    if (cfg.max === 10) cfg.set(Math.round(cfg.get()));
    if (cfg.fin) cfg.fin();
  };
  mol.addEventListener('pointerup', fin);
  mol.addEventListener('pointercancel', fin);
  let roue = null;
  mol.addEventListener('wheel', e => {
    e.preventDefault();
    cfg.set(borner(cfg.get() - Math.sign(e.deltaY) * cfg.pas, 0, cfg.max));
    clearTimeout(roue); roue = setTimeout(() => cfg.fin && cfg.fin(), 400);
  }, { passive: false });
  mol.addEventListener('keydown', e => {
    const pas = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
    if (!pas) return;
    e.preventDefault();
    cfg.set(borner(cfg.get() + pas * cfg.pas, 0, cfg.max));
    clic(2000, 0.012, 0.03);
    clearTimeout(roue); roue = setTimeout(() => cfg.fin && cfg.fin(), 400);
  });
}
$$('[data-molette]').forEach(brancherMolette);

function appliquerVolume() {
  const m = S.joue ? parId[S.joue] : null;
  const f = m ? m.facteur : 1;
  const att = extraitPour ? 0.15 : 1;
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
  if (!id) return;
  if (estGarde(id)) {
    S.gardes = S.gardes.filter(x => x !== id);
    toast('Retiré de tes trouvailles.');
  } else {
    S.gardes.unshift(id);
    toast('Gardé dans tes trouvailles.');
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

/* ─────────────────────────────── le moteur de découverte ─────────────────────────────── */
function disponibles() {
  let pool = BANQUE.filter(m => !S.vusSession.has(m.id));
  if (pool.length < 6) {
    S.vusSession = new Set(S.gardes);
    if (S.courant) S.vusSession.add(S.courant);
    toast('Tu as fait le tour de la sélection. On rebat les cartes.');
    pool = BANQUE.filter(m => !S.vusSession.has(m.id));
  }
  const ok = pool.filter(ecoutable);
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
// les directions possibles depuis un morceau
function chemins(m) {
  const autres = BANQUE.filter(x => x.id !== m.id);
  const pris = new Set();
  const choisir = (filtre, score) => {
    let c = autres.filter(x => !pris.has(x.id) && filtre(x));
    const nonVus = c.filter(x => !S.vusSession.has(x.id));
    if (nonVus.length) c = nonVus;
    const j = c.filter(ecoutable); if (j.length) c = j;
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
  // ce qui jouera tout seul à la fin : un lien choisi à la main, sinon le plus proche pas encore entendu
  const manuel = m.liens.map(parTitre).filter(x => x && x.id !== m.id)[0];
  if (manuel) pris.add(manuel.id);
  const suite = manuel || choisir(() => true, x => distance(x, m));
  const liste = [
    m.energie >= 5 ? dir('energie', -1, 'Plus calme') : dir('energie', 1, 'Plus intense'),
    m.etrange >= 5 ? dir('etrange', -1, 'Plus familier') : dir('etrange', 1, 'Plus étrange'),
    m.danse >= 5 ? dir('danse', -1, 'Plus posé') : dir('danse', 1, 'Plus dansant'),
  ];
  const loin = choisir(x => distance(x, m) >= 7, x => -distance(x, m) + Math.random() * 3);
  if (loin) liste.push({ m: loin, etiquette: 'Complètement ailleurs' });
  return { liste: liste.filter(Boolean), suite };
}
function indice(m) {
  const e = ['Presque immobile', 'Presque immobile', 'Presque immobile', 'Calme', 'Calme', 'Ça avance', 'Ça avance', 'Ça pousse', 'Ça pousse', 'Ça cogne', 'Ça cogne'][Math.round(borner(m.energie, 0, 10))];
  const t = m.etrange <= 3 ? 'et familier' : m.etrange <= 6 ? 'et un peu de travers' : 'et franchement étrange';
  const d = m.danse >= 8 ? 'On danse.' : m.danse <= 2 ? 'On reste assis.' : '';
  return `${e}, ${t}. ${d}`.trim();
}

/* ─────────────────────────────── DÉCOUVRIR : accueil + morceau du jour ─────────────────────────────── */
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
    : S.tour <= 1 ? 'Deux disques sortis de la pile. Lequel tu écoutes ?' : hasard(PHRASES_DUEL);
  $('#duel').innerHTML = paire.map((m, i) => i === mystere ? carteMystere(m, i) : carteDuel(m, i)).join('');
  aller('duel');
  if (!tactile) {
    $$('.pochette-duel:not(.mystere)', $('#duel')).forEach(el => {
      el.addEventListener('mouseenter', () => { survol = el.dataset.id; lancerExtrait(el.dataset.id, el); });
      el.addEventListener('mouseleave', () => { survol = null; arreterExtrait(); });
    });
  }
}
function carteDuel(m, i) {
  const src = Pochettes.source(m);
  return `<article class="pochette-duel" style="--penche:${i ? 2.2 : -2.6}deg" data-id="${m.id}">
    <button class="pochette-duel-choix" data-action="choisir" data-id="${m.id}" aria-label="Choisir ${E(m.titre)}, ${E(m.artiste)}">
      ${Pochettes.html(m, 'pochette-grande')}
    </button>
    <div class="pochette-duel-legende">
      <p class="titre-morceau">${E(m.titre)}</p>
      <p class="artiste-morceau">${E(m.artiste)}</p>
      <button class="extrait-bouton" data-action="extrait" data-id="${m.id}" data-extrait-pour="${m.id}" data-etat="${Pochettes.etat(m)}" data-source="${src ? src.nom : ''}">
        <span class="extrait-icone"></span>
        <span class="extrait-ok">${tactile ? 'Écouter un extrait' : 'Survole pour un extrait'}</span>
        <span class="extrait-inconnu">Extrait en route…</span>
        <span class="extrait-absent">Pas d'extrait, choisis à l'instinct</span>
      </button>
      <a class="extrait-lien" data-lien-pour="${m.id}" target="_blank" rel="noopener" href="${src && src.lien ? E(src.lien) : '#'}"${src && src.lien ? '' : ' hidden'}>${src ? `En entier sur ${src.nom}` : ''}</a>
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
const audioLecture = new Audio(); // sert au mode extraits, et quand un morceau refuse YouTube
audioLecture.setAttribute('playsinline', '');
let extraitPour = null, fondu = null, survol = null;
document.addEventListener('pochette-prete', e => {
  if (survol === e.detail && S.vue === 'duel' && extraitPour !== survol) {
    const el = $(`.pochette-duel[data-id="${survol}"]`);
    if (el) lancerExtrait(survol, el);
  }
  if (S.courant === e.detail && S.vue === 'rencontre') { rendreFiche(parId[e.detail]); rendreAilleurs(parId[e.detail]); majIndispo(); }
  if (S.joue === e.detail && S.vue === 'machine') majAfficheur();
});
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

/* ─────────────────────────────── RENCONTRE (la page d'un morceau) ─────────────────────────────── */
function ouvrir(id, { jouer = true, versInfos = false } = {}) {
  const m = parId[id];
  if (!m) return;
  S.courant = id;
  croiser(id);
  const { liste, suite } = chemins(m);
  S.suite = suite ? suite.id : null;
  const autre = S.autreDuDuel && S.autreDuDuel !== id ? parId[S.autreDuDuel] : null;
  const q = encodeURIComponent(`${Pochettes.artistePrincipal(m.artiste)} ${m.titre}`);

  $('#rencontre').innerHTML = `
    <div class="rencontre-pochette">${Pochettes.html(m, 'pochette-geante')}</div>
    <div class="rencontre-texte">
      <h1 class="rencontre-titre">${E(m.titre)}</h1>
      <p class="rencontre-artiste">${E(m.artiste)}</p>
      ${m.note ? `<blockquote class="rencontre-note">${E(m.note).replace(/\n/g, '<br>')}</blockquote>` : ''}

      <div class="rencontre-boutons">
        <button class="bouton-garder" data-action="garder" data-garder="${m.id}" data-id="${m.id}"></button>
        ${suite ? `<button class="bouton-suivant" data-action="ouvrir" data-id="${suite.id}">
          <span class="bouton-suivant-etiquette">Morceau suivant</span>
          <span class="bouton-suivant-titre">${E(suite.titre.trim() || '(sans titre)')} <span class="bouton-suivant-artiste">· ${E(suite.artiste)}</span></span>
        </button>` : ''}
      </div>
      <p class="suite-annonce" id="suite-annonce">Si tu ne touches à rien, il se lancera tout seul à la fin.</p>

      <div class="emplacement-ecran emplacement-rencontre" data-emplacement="rencontre">${Pochettes.html(m, 'pochette-fond')}</div>
      <p class="rencontre-indispo" id="rencontre-indispo" hidden></p>
      <p class="ailleurs" id="ailleurs"></p>
      <div class="avis-pub" data-avis hidden></div>

      <nav class="chemins" aria-label="Choisir une autre direction">
        <p class="chemins-titre">Ou choisis une direction</p>
        <div class="chemins-portes">${liste.map(c => porte(c.m, c.etiquette)).join('')}</div>
        <div class="chemins-bas">
          <button class="lien-bouton" data-action="duel-suivant">Revenir aux duels</button>
          ${autre ? `<button class="lien-bouton" data-action="ouvrir" data-id="${autre.id}">Et l'autre du duel, c'était quoi ?</button>` : ''}
        </div>
      </nav>

      <section class="a-propos" id="a-propos" aria-label="Plus d'infos">
        <h2 class="a-propos-titre">Plus d'infos</h2>
        <dl class="fiche" id="fiche"></dl>
        <div class="bio" id="bio"><p class="bio-attente">On cherche qui est derrière ce morceau…</p></div>
        <div class="liens-plus">
          <a class="lien-bouton" href="https://genius.com/search?q=${q}" target="_blank" rel="noopener">Les paroles sur Genius</a>
          <a class="lien-bouton" href="https://music.youtube.com/search?q=${encodeURIComponent(Pochettes.artistePrincipal(m.artiste))}" target="_blank" rel="noopener">Tout l'artiste sur YouTube Music</a>
        </div>
      </section>
    </div>`;
  majGarde();
  rendreFiche(m);
  rendreAilleurs(m);
  majAvis();
  rendreBio(m);
  teinterRencontre(m);
  aller('rencontre');
  if (jouer) { S.mode = 'decouvrir'; jouerMorceau(m); }
  else { placerEcranVideo(); majIndispo(); }
  if (versInfos) setTimeout(() => $('#a-propos').scrollIntoView({ behavior: reduitMouvement ? 'auto' : 'smooth', block: 'start' }), 120);
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
// écouter le morceau en entier, en toute légalité, sur le service de son choix
function rendreAilleurs(m) {
  const el = $('#ailleurs');
  if (!el || S.courant !== m.id) return;
  const q = encodeURIComponent(`${Pochettes.artistePrincipal(m.artiste)} ${m.titre}`);
  const l = Pochettes.liens(m);
  const liens = [
    ['YouTube Music', m.lien],
    ['Deezer', l.deezer || `https://www.deezer.com/search/${q}`],
    ['Apple Music', l.apple || `https://music.apple.com/fr/search?term=${q}`],
    ['Qobuz', `https://www.qobuz.com/fr-fr/search?q=${q}`],
    ['Bandcamp', m.bandcamp || `https://bandcamp.com/search?q=${q}&item_type=t`],
  ];
  el.innerHTML = `<span class="ailleurs-titre">Écouter en entier sur</span> ` +
    liens.map(([nom, url]) => `<a href="${E(url)}" target="_blank" rel="noopener">${nom}</a>`).join('');
}
// la première fois qu'un morceau passe par YouTube : pourquoi des pubs, et comment s'en passer légalement
const AVIS_PUB = `
  <p class="avis-titre">Pourquoi des pubs ?</p>
  <p>Les morceaux complets passent par le lecteur officiel de YouTube : ses pubs, c'est ce qui rémunère les artistes. Pour écouter sans pub en restant réglo :</p>
  <ul>
    <li><strong>YouTube Premium</strong> : connecté à ton compte, plus aucune pub, ici non plus.</li>
    <li><strong>Le mode extraits</strong> : 30 secondes par morceau, sans compte.</li>
    <li><strong>Ton service à toi</strong> : chaque morceau a ses liens Deezer, Apple Music, Qobuz et Bandcamp.</li>
  </ul>
  <div class="avis-actions">
    <button class="gros-bouton gros-bouton-plein" data-action="encart-ok">Compris</button>
    <button class="lien-bouton" data-action="encart-extraits">Passer en extraits</button>
  </div>`;
function majAvis() {
  const montrer = S.lecture === 'yt' && !memoire.lire('md-encart-pub', false);
  $$('[data-avis]').forEach(a => { if (montrer && !a.innerHTML.trim()) a.innerHTML = AVIS_PUB; a.hidden = !montrer; });
}
function rendreFiche(m) {
  const el = $('#fiche');
  if (!el || S.courant !== m.id) return;
  const f = Pochettes.meta(m) || {};
  const lignes = [
    ['Album', f.album || (m.album && m.album !== m.titre ? m.album : '')],
    ['Sortie', f.annee],
    ['Genre', f.genre],
    ['Durée', f.duree ? minutes(f.duree) : ''],
  ].filter(([, v]) => v);
  el.innerHTML = lignes.map(([k, v]) => `<div><dt>${k}</dt><dd>${E(v)}</dd></div>`).join('');
  el.hidden = !lignes.length;
}
function rendreBio(m) {
  Infos.artiste(m.artiste, fiche => {
    const el = $('#bio');
    if (!el || S.courant !== m.id) return;
    if (!fiche) {
      el.innerHTML = `<p class="bio-vide">Pas de fiche Wikipédia fiable pour ${E(Pochettes.artistePrincipal(m.artiste))}. Les meilleurs se cachent parfois là où personne n'a encore écrit.</p>`;
      return;
    }
    el.innerHTML = `
      ${fiche.image ? `<img class="bio-photo" src="${E(fiche.image)}" alt="" loading="lazy">` : ''}
      <div>
        <p class="bio-nom">${E(fiche.titre)}</p>
        <p class="bio-texte">${E(fiche.extrait)}</p>
        <a class="lien-bouton" href="${E(fiche.url)}" target="_blank" rel="noopener">Lire la suite sur Wikipédia${fiche.langue === 'en' ? ' (en anglais)' : ''}</a>
      </div>`;
  });
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
    const src = Pochettes.source(m);
    const par = src ? `, fourni par ${src.nom}` : '';
    const entier = src && src.lien
      ? `<a href="${E(src.lien)}" target="_blank" rel="noopener">En entier sur ${src.nom}</a> ou <a href="${E(m.lien)}" target="_blank" rel="noopener">sur YouTube Music</a>.`
      : `<a href="${E(m.lien)}" target="_blank" rel="noopener">En entier sur YouTube Music</a>.`;
    i.hidden = false;
    i.innerHTML = S.son === 'extraits'
      ? `Extrait de 30 secondes${par}. ${entier}`
      : `Ce morceau refuse d'être lu sur un autre site : tu entends un extrait de 30 secondes${par}. ${entier}`;
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
  if (a) a.textContent = 'Enchaînement annulé. Choisis quand tu veux.';
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
    // lecteur youtube.com classique : un visiteur abonné à YouTube Premium n'a pas de pub
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
  S.posteReduit = false;
  $('#ecran-video').hidden = false;
  majPoste();
  if (!lecteurPret) { enAttente = m; chargerAPI(); majEtat(); return; }
  try { lecteur.loadVideoById(m.yt); } catch (e) {}
  appliquerVolume();
  majEtat();
}
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
    Pochettes.demander(m, () => { if (S.joue === m.id && S.erreur && Pochettes.extrait(m)) jouerExtraitComplet(m); });
    if (S.mode === 'radio') {
      toast(S.son === 'extraits' ? `Pas d'extrait pour ${m.titre}. Suivant.` : `${m.titre} ne s'écoute que sur YouTube Music. Suivant.`);
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
  majIndispo();
  majAvis();
  majPoste();
  if (S.vue === 'machine') majAfficheur();
}

/* ─────────────────────────────── le poste et l'écran vidéo ─────────────────────────────── */
/* Règles du lecteur YouTube, respectées ici : la vidéo est toujours visible
   pendant qu'elle joue (jamais de lecture cachée), dans un cadre d'au moins
   200 × 200 pixels, sans rien posé par-dessus. */
function majPoste() {
  const p = $('#poste');
  const yt = S.lecture === 'yt';
  const surSaPage = yt && S.vue === 'rencontre' && S.courant === S.joue;
  const radioSurMachine = S.vue === 'machine' && S.mode === 'radio';
  const visible = !!S.joue && S.vue !== 'allumage' && !radioSurMachine && !surSaPage;
  p.hidden = !visible;
  p.classList.toggle('avec-video', visible && yt && !S.posteReduit);
  p.classList.toggle('reduit', visible && yt && S.posteReduit);
  document.body.classList.toggle('avec-poste', visible);
  if (S.joue) {
    const m = parId[S.joue];
    $('#poste-titre').textContent = m.titre;
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
  if (S.vue === 'rencontre' && S.courant === S.joue) return $('[data-emplacement="rencontre"]');
  if (!$('#poste').hidden && !S.posteReduit) return $('[data-emplacement="poste"]');
  return null;
}
function placerEcranVideo() {
  const ev = $('#ecran-video');
  const slot = emplacementCible();
  cancelAnimationFrame(suiviRAF);
  const ou = slot ? slot.dataset.emplacement : '';
  document.body.classList.toggle('video-machine', ou === 'machine');
  document.body.classList.toggle('video-rencontre', ou === 'rencontre');
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

/* ─────────────────────────────── ÉCOUTER : la chaîne ───────────────────────────────
   Pas de catégories : trois molettes règlent ce qui passe (calme / intense,
   familier / étrange, assis / debout). Le morceau en cours continue,
   c'est la suite qui change. */
function descriptionTon() {
  const t = S.ton;
  const e = t.energie <= 3 ? 'calme' : t.energie >= 7 ? 'intense' : 'entre deux';
  const b = t.etrange <= 3 ? 'familier' : t.etrange >= 7 ? 'étrange' : 'un peu de travers';
  const d = t.danse <= 3 ? 'assis' : t.danse >= 7 ? 'debout' : 'ça balance';
  return `${e}, ${b}, ${d}`;
}
// la file : les morceaux les plus proches du réglage, enchaînés avec un fil
function construireFil(exclure = []) {
  // mode aléatoire : toute la sélection mélangée, molettes ignorées
  if (S.sourceRadio === 'hasard') {
    let p = BANQUE.filter(m => !exclure.includes(m.id) && ecoutable(m));
    if (p.length < 3) p = BANQUE.filter(m => !exclure.includes(m.id));
    return melanger(p).map(m => m.id);
  }
  const base = (S.sourceRadio === 'trouvailles' && S.gardes.length ? S.gardes.map(id => parId[id]) : BANQUE)
    .filter(m => m && !exclure.includes(m.id));
  let pool = base.filter(ecoutable);
  if (pool.length < 3) pool = base;
  pool.sort((a, b) => distance(a, S.ton) - distance(b, S.ton));
  const garde = S.sourceRadio === 'trouvailles' ? pool.length : Math.min(pool.length, 14);
  const reste = melanger(pool.slice(0, garde));
  if (!reste.length) return [];
  reste.sort((a, b) => distance(a, S.ton) - distance(b, S.ton));
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
  memoire.ecrire('md-ton', S.ton);
  if (S.sourceRadio === 'hasard') { S.sourceRadio = 'tout'; memoire.ecrire('md-source-radio', 'tout'); $$('.source-pos').forEach(b => b.setAttribute('aria-checked', b.dataset.source === 'tout')); }
  reconstruireSuite();
  majMachine();
  const prochain = parId[S.file[S.mode === 'radio' && S.joue ? 1 : 0]];
  toast(prochain ? `Réglé : ${descriptionTon()}. Ensuite : ${prochain.titre}` : `Réglé : ${descriptionTon()}`);
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
  aller('machine');
  majMachine();
}
function majMachine() {
  const m = parId[S.file[S.pos]];
  $('#cd-etiquette').innerHTML = m ? Pochettes.html(m, 'pochette-cd') : '';
  majAfficheur();
  majGarde();
  S.file.slice(S.pos + 1, S.pos + 4).forEach(x => Pochettes.demander(parId[x]));
  placerEcranVideo();
}
function majAfficheur() {
  const m = parId[S.file[S.pos]];
  const active = !!m && S.mode === 'radio' && S.joue === m.id;
  $('#vfd-piste').textContent = `Piste ${deux(S.recents.length + (active ? 0 : 1))}`;
  const texte = m ? `${m.titre}, ${m.artiste}${active && S.lecture === 'extrait' ? ' (extrait)' : ''}` : 'Rien à jouer.';
  const t = $('#vfd-texte');
  if (t.textContent !== texte) { t.textContent = texte; t.style.animationDuration = `${Math.max(8, texte.length * 0.28)}s`; }
  $('#vfd-reglage').textContent = S.sourceRadio === 'trouvailles' ? 'Mes trouvailles' : S.sourceRadio === 'hasard' ? 'Au hasard' : descriptionTon();
  $('#vfd-etat').textContent = !active ? 'Stop' : S.enLecture ? 'Lecture' : 'Pause';
  const ensuite = parId[S.file[S.pos + 1]];
  $('#vfd-ensuite').textContent = ensuite ? `Ensuite : ${ensuite.titre}` : '';
  const ms = $('#machine-source');
  const src = active && S.lecture === 'extrait' ? Pochettes.source(m) : null;
  ms.hidden = !src;
  if (src) ms.innerHTML = `Extrait de 30 secondes fourni par ${src.nom}.${src.lien ? ` <a href="${E(src.lien)}" target="_blank" rel="noopener">L'écouter en entier sur ${src.nom}</a>` : ''}`;
  document.body.classList.toggle('cd-tourne', active && S.enLecture);
}
function tempsActuel() {
  try {
    if (S.lecture === 'yt' && lecteurPret) return [lecteur.getCurrentTime() || 0, lecteur.getDuration() || 0];
    if (S.lecture === 'extrait') return [audioLecture.currentTime || 0, audioLecture.duration || 30];
  } catch (e) {}
  return [0, 0];
}
setInterval(() => {
  if (S.vue !== 'machine') return;
  const m = parId[S.file[S.pos]];
  const active = !!m && S.mode === 'radio' && S.joue === m.id;
  const [t, d] = active ? tempsActuel() : [0, 0];
  $('#vfd-temps').textContent = `${deux(t / 60)}:${deux(t % 60)}`;
  $('#vfd-progression').style.width = d ? `${Math.min(100, (t / d) * 100)}%` : '0%';
}, 500);
function radioJouerCourant() {
  const m = parId[S.file[S.pos]];
  if (!m) return;
  S.mode = 'radio';
  croiser(m.id);
  if (S.recents[S.recents.length - 1] !== m.id) S.recents.push(m.id);
  jouerMorceau(m);
  majMachine();
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
  if (S.mode === 'radio' && S.joue === id && S.lecture) basculerLecture(); else radioJouerCourant();
  clic(600, 0.06, 0.07);
}
function radioStop() {
  if (S.mode !== 'radio' || !S.joue) return;
  S.finTraitee = true;
  try { if (S.lecture === 'yt') lecteur.stopVideo(); } catch (e) {}
  audioLecture.pause();
  S.enLecture = false; S.lecture = null; S.joue = null;
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
    setTimeout(() => { S.autreDuDuel = S.duel.find(x => x !== id) || null; apprendre(parId[id]); ouvrir(id); }, reduitMouvement ? 0 : 800);
  },
  'autre-duel': () => { clic(); montrerDuel(tirerDuel()); },
  'duel-suivant': () => { S.autreDuDuel = null; nouveauDuel(); },
  'extrait': b => { const id = b.dataset.id; if (extraitPour === id) arreterExtrait(); else lancerExtrait(id, b.closest('.pochette-duel')); },
  'ouvrir': b => {
    if (!$('#bac').hidden) fermerPanneaux();
    if (S.vue === 'rencontre') S.autreDuDuel = null;
    clic(1300);
    ouvrir(b.dataset.id);
  },
  'garder': b => basculerGarde(b.dataset.id),
  'garder-joue': () => basculerGarde(S.joue),
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
  'radio-lecture': radioLecture,
  'radio-suivant': radioSuivant,
  'radio-precedent': radioPrecedent,
  'radio-stop': radioStop,
  'radio-garder': () => basculerGarde(S.file[S.pos]),
  'radio-raconte': () => {
    const id = S.file[S.pos];
    if (!id) return;
    const continuer = S.joue === id;
    if (continuer) S.mode = 'decouvrir';
    ouvrir(id, { jouer: !continuer, versInfos: true });
  },
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
  if (a) { e.preventDefault(); a(b); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fermerPanneaux();
  if (e.key === ' ' && e.target === document.body && S.joue) { e.preventDefault(); basculerLecture(); }
});
$$('.fader input').forEach(f => f.addEventListener('input', () => clic(2000 + +f.value * 120, 0.015, 0.03)));

/* ─────────────────────────────── démarrage ─────────────────────────────── */
appliquerTeinte(teinteActive, false);
majMolettes();
majSon();
majGarde();
chargerAPI();
// pochettes, extraits et fiches de toute la sélection, préparés dès l'arrivée (puis gardés en cache)
BANQUE.forEach(m => Pochettes.demander(m));
if (IOS) $('#allumage-conseil').textContent = 'Sur iPhone, le volume se règle avec les boutons du téléphone : baisse-le un peu avant d\'allumer.';
if (S.gardes.length || S.croises.length) {
  const r = $('#allumage-retour');
  r.hidden = false;
  r.textContent = S.gardes.length
    ? `Tes trouvailles t'attendent : ${S.gardes.length} morceau${S.gardes.length > 1 ? 'x' : ''} gardé${S.gardes.length > 1 ? 's' : ''}.`
    : `Content de te revoir. Tu avais croisé ${S.croises.length} morceaux.`;
}
aller('allumage');
})();
