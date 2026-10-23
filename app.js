/* ════════════════════════════════════════════════════════════════════
   MUSIC DISCOVERY — v1.0
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
// Découvrir compare les fiches des morceaux (moteur.js : style, année, tempo, voix, ambiance).
// « connu / confidentiel » se mesure d'après le nombre de fans de l'artiste sur Deezer,
// et, tant qu'on ne sait pas, d'après la note « etrange » de data.js
const conf = m => { if (m.connu) return 1; const c = m.id ? Pochettes.confidentiel(m) : null; return c === null ? m.etrange : c; };
const val = (m, cle) => cle === 'etrange' ? conf(m) : m[cle];
/* ─────────────────────────────── l'état ─────────────────────────────── */
const S = {
  vue: 'allumage',
  // lecture
  joue: null,             // morceau en cours de lecture
  lecture: null,          // 'yt' | 'extrait' | null
  enLecture: false,
  finTraitee: false,
  erreur: false,          // rien n'a pu être lu
  bloque: false,          // la lecture ne démarre pas toute seule
  aJoue: false,           // le morceau en cours a-t-il déjà démarré ?
  mode: 'radio',
  // la chaîne
  source: (s => ['radio', 'selection'].includes(s) ? s : 'radio')(memoire.lire('md-source', 'radio')),
  suite: [], historique: memoire.lire('md-historique', []).filter(id => parId[id]), echecs: 0,
  epure: memoire.lire('md-epure', false),
  cap: null, capVise: null,              // la direction demandée pour le prochain morceau
  aime: new Set(memoire.lire('md-aime', [])),
  aimePas: new Set(memoire.lire('md-aime-pas', [])),
  // le reste
  volume: borner(memoire.lire('md-volume', 60), 0, 100),
  croises: memoire.lire('md-croises', []),
  gardes: memoire.lire('md-gardes', []),
  injouables: new Set(memoire.lire('md-injouables', [])),
  son: memoire.lire('md-son', 'complet'),
  onglet: 'gardes',
  posteReduit: false,     // poste replié : la vidéo YouTube est alors en pause (jamais de lecture cachée)
  livrets: { machine: false },
};
// les anciens identifiants finissaient par « -numéro » : on les retrouve
const retrouver = ids => [...new Set(ids.map(id => parId[id] ? id : parId[String(id).replace(/-\d+$/, '')] ? String(id).replace(/-\d+$/, '') : null).filter(Boolean))];
S.croises = retrouver(S.croises); memoire.ecrire('md-croises', S.croises);
S.gardes  = retrouver(S.gardes);  memoire.ecrire('md-gardes', S.gardes);
if (S.source === 'selection' && !S.gardes.length) S.source = 'radio';

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
  const change = S.vue !== vue;
  S.vue = vue;
  const faire = () => {
    $$('section[data-ecran]').forEach(s => { s.hidden = s.dataset.ecran !== vue; });
    document.body.dataset.vue = vue;
    window.scrollTo(0, 0);
    arreterExtrait();
    majPoste();
  };
  // un fondu entre deux écrans, là où le navigateur sait le faire
  if (change && document.startViewTransition && !reduitMouvement && document.body.classList.contains('allume')) {
    try { document.startViewTransition(faire); return; } catch (e) {}
  }
  faire();
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

  if (!S.croises.includes(id)) {
    S.croises.unshift(id);
    memoire.ecrire('md-croises', S.croises);
  }
}
const estGarde = id => S.gardes.includes(id);
function basculerGarde(id) {
  if (!id || !parId[id]) return;
  let ajoute = false;
  if (estGarde(id)) {
    S.gardes = S.gardes.filter(x => x !== id);
    toast('Retiré de ta sélection.');
  } else {
    ajoute = true;
    S.gardes.unshift(id);
    const n = S.gardes.length;
    toast(n === 1 ? 'Ajouté à ta sélection. Tu la retrouves en haut, et dans la chaîne.' : `Ajouté à ta sélection (${n}).`, n === 1 ? 4200 : 2400);
    clic(900, 0.08, 0.06);
    const b = $('.bouton-trouvailles'); b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse');
  }
  memoire.ecrire('md-gardes', S.gardes);
  majGarde();
  if (ajoute) S.aime.add(id);
  rendrePupitre();
  if (!$('#bac').hidden) rendreBac();
}
// tous les boutons Garder de la page se mettent à jour d'un coup
function majGarde() {
  $('#compteur-bac').textContent = S.gardes.length;
  $$('[data-garder]').forEach(b => {
    const g = estGarde(b.dataset.garder);
    b.classList.toggle('est-garde', g);
    b.setAttribute('aria-pressed', g);
    const t = $('.avis-garder-texte', b); if (t) t.textContent = g ? 'Dans ma sélection' : 'Ajouter à ma sélection';
  });
  const pg = $('#poste-garder');
  const gj = S.joue && estGarde(S.joue);
  pg.classList.toggle('est-garde', !!gj); pg.setAttribute('aria-pressed', !!gj);
  pg.setAttribute('aria-label', gj ? 'Retirer de ma sélection' : 'Ajouter à ma sélection');
  const rg = $('#radio-garder');
  const idRadio = S.joue;
  const gr = idRadio && estGarde(idRadio);
  rg.classList.toggle('est-garde', !!gr); rg.setAttribute('aria-pressed', !!gr);
  $('.cd-garder-texte', rg).textContent = gr ? 'Dans ma sélection' : 'Ajouter à ma sélection';
}

// « Philly soul, années 70 » : de quoi choisir sans avoir à écouter
function decennie(a) {
  if (!a) return '';
  if (a < 1800) return 'XVIIIᵉ siècle';
  if (a < 1900) return 'XIXᵉ siècle';
  if (a < 1950) return 'début du XXᵉ siècle';
  return a >= 2000 ? `années ${Math.floor(a / 10) * 10}` : `années ${Math.floor((a % 100) / 10) * 10}`;
}
function indice(m) {
  const t = [m.style, decennie(m.annee)].filter(Boolean).join(', ');
  return t || (m.energie <= 3 ? 'Tout en douceur' : m.energie >= 7 ? 'Ça cogne' : 'Ça avance');
}


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
      <span class="livret-bouton-texte"><strong>${ouvert ? 'Moins d\'infos' : 'Plus d\'infos'}</strong>
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
  <p>Je sais que c'est relou, mais c'est lié à YouTube. Si t'as YouTube Premium, il suffit de te connecter ; sinon, passe en mode extraits.</p>
  <div class="avis-actions">
    <button class="gros-bouton gros-bouton-plein" data-action="encart-ok">Compris</button>
    <button class="lien-bouton" data-action="encart-extraits">Passer en mode extraits</button>
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
  const bouton = el && el.querySelector('.option-ecoute, .extrait-bouton');
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
  $$('.extrait-bouton.en-cours, .option-ecoute.en-cours').forEach(b => b.classList.remove('en-cours'));
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
    echecRadio(m, 'ne démarre pas');
    majEtat();
  };
  demarrage = setTimeout(verif, 9000);
}
function jouerMorceau(m) {
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
        if (err && err.name === 'NotAllowedError') { S.bloque = true; echecRadio(m, 'ne démarre pas'); }
        majEtat();
        // les autres erreurs (lien mort) arrivent par l'événement « error » ci-dessous
      });
  });
}
function extraitIntrouvable(m) {
  S.lecture = null; S.enLecture = false; S.erreur = true;
  majPoste(); majEtat();
  echecRadio(m, S.son === 'extraits' ? 'n\'a pas d\'extrait' : 'ne s\'écoute que sur YouTube Music');
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
  radioSuivant();
}
setInterval(() => {
  if (S.lecture !== 'yt' || !lecteurPret || S.finTraitee || !S.joue) return;
  try { if (lecteur.getPlayerState() === YT.PlayerState.ENDED) finDuMorceau(); } catch (e) {}
}, 1500);
function majEtat() {
  document.body.classList.toggle('en-lecture', S.enLecture);
  $('#poste-icone').classList.toggle('pause', S.enLecture);
  $('#radio-icone').classList.toggle('pause', S.enLecture);
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
let chaineVue = true;
if ('IntersectionObserver' in window) {
  new IntersectionObserver(es => { const v = es[0].isIntersecting; if (v !== chaineVue) { chaineVue = v; majPoste(); } }, { threshold: 0.35 }).observe($('.hifi'));
}
function majPoste() {
  const p = $('#poste');
  const yt = S.lecture === 'yt';
  const visible = !!S.joue && S.vue !== 'allumage' && !(S.vue === 'machine' && chaineVue);
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
  if (S.vue === 'machine' && chaineVue) return $('[data-emplacement="machine"]');
  if (!$('#poste').hidden && !S.posteReduit) return $('[data-emplacement="poste"]');
  return null;
}
function placerEcranVideo() {
  const ev = $('#ecran-video');
  const slot = emplacementCible();
  cancelAnimationFrame(suiviRAF);
  const ou = slot ? slot.dataset.emplacement : '';
  document.body.classList.toggle('video-machine', ou === 'machine');
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
  if (S.vue !== 'machine' || !S.joue || !S.lecture) return;
  const [t] = tempsActuel();
  $('#lcd-temps').textContent = `${deux(t / 60)}:${deux(t % 60)}`;
}, 500);

/* ─────────────────────────────── LA CHAÎNE ET LE PUPITRE ───────────────────────────────
   Un seul lieu : la chaîne diffuse, et dessous on l'oriente pendant qu'elle
   tourne. « Ça j'aime bien » attire la suite vers ce morceau, « Pas trop
   comme ça » l'en éloigne (et passe au suivant), les directions changent le
   prochain titre. Le moteur (moteur.js) compare les fiches de data.js pour
   que chaque morceau mène au plus proche. */
const SOURCES = {
  radio:     { nom: 'La radio', sous: 'Toute la sélection, d\'un morceau proche à l\'autre' },
  selection: { nom: 'Ma sélection', sous: 'Ce que tu as gardé' },
};
const CAPS = ['calme', 'energique', 'dansant', 'pose', 'connu', 'confidentiel', 'cote'];
const nomCap = d => d === 'connu' ? 'Plus mainstream' : (Moteur.DIRECTIONS[d] || {}).etiquette || '';
function poolSource() {
  let p;
  if (S.source === 'selection') p = S.gardes.map(id => parId[id]).filter(Boolean);
  else p = BANQUE;
  const ok = p.filter(ecoutable);
  return ok.length >= 3 ? ok : p;
}
// ce que tu aimes attire, ce que tu n'aimes pas repousse
function score(cur, x) {
  let d = Moteur.distance(cur, x);
  S.aime.forEach(id => { const a = parId[id]; if (a && a !== x) d -= 0.7 * Math.exp(-Moteur.distance(a, x) / 2.6); });
  S.aimePas.forEach(id => { const a = parId[id]; if (a) d += 2.4 * Math.exp(-Moteur.distance(a, x) / 2.2); });
  return d;
}
function parmiDeux(l) { return !l.length ? null : l.length === 1 || Math.random() < 0.72 ? l[0] : l[1]; }
function construireSuite(depuis, n = 6) {
  const recents = new Set(S.historique.slice(-40));
  const base = poolSource().filter(m => (!depuis || m.id !== depuis.id) && !S.aimePas.has(m.id));
  if (S.source === 'selection') {
    // ta sélection, rangée pour s'enchaîner, en repartant après le morceau en cours
    const ordre = Moteur.sequencer(poolSource(), { depart: depuis && S.gardes.includes(depuis.id) ? depuis : null }).map(m => m.id);
    const i = depuis ? ordre.indexOf(depuis.id) : -1;
    return [...ordre.slice(i + 1), ...ordre.slice(0, Math.max(0, i))].slice(0, n);
  }
  let pool = base.filter(m => !recents.has(m.id));
  if (pool.length < n) pool = base;
  const suite = [];
  let cur = depuis || hasard(pool);
  if (!depuis && cur) { suite.push(cur.id); pool = pool.filter(m => m !== cur); }
  while (suite.length < n && pool.length) {
    let x = null;
    if (!suite.length && S.cap && cur) x = Moteur.versDirection(cur, S.cap, pool, val);
    if (!x) x = parmiDeux(pool.map(m => [m, score(cur, m)]).sort((a, b) => a[1] - b[1]).map(p => p[0]));
    if (!x) break;
    suite.push(x.id);
    pool = pool.filter(m => m !== x);
    cur = x;
  }
  return suite;
}
function rafraichirSuite() {
  S.suite = construireSuite(parId[S.joue] || null);
  rendrePupitre();
  majAfficheur();
}

/* le disque dans le tiroir : la radio (holographique), le fond du bac (noir), ma sélection (CD-R) */
function disqueHTML(k, extra = '') {
  if (k === 'selection') return `<span class="disque disque-compil ${extra}"><span class="disque-main">Ma sélection</span></span>`;
  if (k === 'radio') return `<span class="disque disque-hasard ${extra}"><span class="disque-nom">La radio<small>Music Discovery</small></span></span>`;
  return `<span class="disque disque-vide ${extra}"></span>`;
}
let tiroirMin = [];
function poserDisque(k) {
  const d = $('#disque-tiroir');
  const tmp = document.createElement('div');
  tmp.innerHTML = disqueHTML(k, 'disque-tiroir');
  const nv = tmp.firstElementChild;
  nv.id = 'disque-tiroir';
  d.replaceWith(nv);
}
function chargerTiroir(k) {
  tiroirMin.forEach(clearTimeout); tiroirMin = [];
  const t = $('#tiroir');
  if (reduitMouvement) { poserDisque(k); majAfficheur(); return; }
  document.body.classList.add('lecture-disque');
  t.classList.add('ouvert'); t.classList.remove('pose');
  clic(300, 0.18, 0.05);
  tiroirMin.push(setTimeout(() => { poserDisque(k); t.classList.add('pose'); clic(700, 0.05, 0.05); }, 420));
  tiroirMin.push(setTimeout(() => { t.classList.remove('ouvert'); clic(320, 0.16, 0.05); }, 980));
  tiroirMin.push(setTimeout(() => { t.classList.remove('pose'); document.body.classList.remove('lecture-disque'); majAfficheur(); }, 1650));
  majAfficheur();
}
// la touche d'éjection change de disque : la radio, ou ta sélection
function ejecter() {
  if (S.source === 'radio' && !S.gardes.length) { toast('Ta sélection est vide : appuie sur « Ajouter à ma sélection » quand un morceau te plaît.', 4200); return; }
  choisirSource(S.source === 'radio' ? 'selection' : 'radio');
  toast(S.source === 'selection' ? 'Ta sélection est dans la chaîne.' : 'Retour à la radio.');
}
function choisirSource(k) {
  if (!SOURCES[k]) return;
  if (k === 'selection' && !S.gardes.length) { toast('Ta sélection est vide : appuie sur « Ajouter à ma sélection » quand un morceau te plaît.', 4200); return; }
  S.source = k;
  memoire.ecrire('md-source', k);
  S.cap = null;
  const premier = construireSuite(null, 1)[0];
  chargerTiroir(k);
  if (premier) jouerRadio(premier);
}

/* jouer : le morceau passe, la suite se recalcule depuis lui */
function jouerRadio(id) {
  const m = parId[id];
  if (!m) return;
  S.mode = 'radio';
  croiser(m.id);
  if (S.historique[S.historique.length - 1] !== m.id) S.historique.push(m.id);
  memoire.ecrire('md-historique', S.historique.slice(-60));
  jouerMorceau(m);
  S.cap = S.capVise === m.id ? null : S.cap;
  S.capVise = null;
  S.suite = construireSuite(m);
  if (S.cap) S.capVise = S.suite[0];
  rendrePupitre();
  majMachine();
}
function radioSuivant() {
  if (!S.suite.length) S.suite = construireSuite(parId[S.joue] || null);
  const id = S.suite[0];
  clic(1400);
  if (id) jouerRadio(id);
}
function radioPrecedent() {
  const [t] = tempsActuel();
  if (S.joue && t > 5) {
    try { if (S.lecture === 'yt') lecteur.seekTo(0, true); else audioLecture.currentTime = 0; } catch (e) {}
    clic(1100); return;
  }
  if (S.historique.length >= 2) { S.historique.pop(); const id = S.historique.pop(); clic(1100); jouerRadio(id); }
}
function radioLecture() {
  S.echecs = 0;
  if (S.joue && S.lecture) basculerLecture();
  else jouerRadio(S.joue || construireSuite(null, 1)[0]);
  clic(600, 0.06, 0.07);
}
function radioStop() {
  if (!S.joue) return;
  S.finTraitee = true;
  clearTimeout(demarrage);
  try { if (S.lecture === 'yt') lecteur.stopVideo(); } catch (e) {}
  audioLecture.pause();
  S.enLecture = false; S.lecture = null; S.bloque = false;
  clic(500, 0.05, 0.06);
  majEtat(); majMachine();
}
// un morceau qui ne veut pas se lire : on essaie l'extrait, sinon on passe ; au bout de 3 ratés d'affilée, on s'arrête
function echecRadio(m, raison) {
  if (S.joue !== m.id) return;
  S.echecs++;
  if (S.echecs >= 3) {
    S.echecs = 0;
    radioStop();
    toast('Trois morceaux de suite ne démarrent pas. Vérifie ta connexion, puis appuie sur lecture.', 6000);
    return;
  }
  if (S.lecture === 'yt' && Pochettes.etat(m) === 'ok' && !S.bloque) { jouerExtraitComplet(m); return; }
  toast(`${m.affiche} ${raison}. On passe au suivant.`);
  setTimeout(() => { if (S.joue === m.id) radioSuivant(); }, 1500);
}

/* l'avis du visiteur sur le morceau qui passe */
function aimer(id) {
  if (!id) return;
  if (S.aime.has(id)) { S.aime.delete(id); toast('D\'accord, on oublie.'); }
  else { S.aime.add(id); S.aimePas.delete(id); toast('Noté : la suite va dans ce sens.'); clic(1000, 0.06, 0.05); }
  memoire.ecrire('md-aime', [...S.aime]); memoire.ecrire('md-aime-pas', [...S.aimePas]);
  rafraichirSuite();
}
function pasAime(id) {
  if (!id) return;
  S.aimePas.add(id); S.aime.delete(id);
  memoire.ecrire('md-aime', [...S.aime]); memoire.ecrire('md-aime-pas', [...S.aimePas]);
  toast('Compris, on s\'éloigne de ce genre-là.');
  S.suite = construireSuite(parId[id]);
  radioSuivant();
}
function orienter(dir) {
  if (!S.joue) return;
  S.cap = S.cap === dir ? null : dir;
  S.suite = construireSuite(parId[S.joue]);
  S.capVise = S.cap ? S.suite[0] : null;
  rendrePupitre();
  majAfficheur();
  const p = parId[S.suite[0]];
  if (S.cap && p) toast(`${nomCap(dir)} : ensuite, « ${p.affiche} ».`);
  clic(1500, 0.03, 0.06);
}

/* le pupitre : le morceau qui passe, sa mini-chronique, l'avis, la suite */
function rendrePupitre() {
  const m = parId[S.joue];
  const el = $('#maintenant');
  if (!m) {
    el.innerHTML = `<p class="maintenant-vide">Appuie sur lecture : la chaîne démarre, et tu l'orientes ici.</p>`;
  } else if (el.dataset.id !== m.id) {
    el.dataset.id = m.id;
    el.innerHTML = `
      <div class="maintenant-pochette">${Pochettes.html(m, 'pochette-maintenant')}</div>
      <div class="maintenant-texte">
        <p class="maintenant-style">${E(indice(m))}</p>
        <h2 class="maintenant-titre">${E(m.affiche)}</h2>
        <p class="maintenant-artiste">${E(m.artiste)}</p>
        ${m.note ? `<p class="maintenant-note">${E(m.note).replace(/\n/g, '<br>')}</p>` : ''}
        <p class="maintenant-chronique" data-chronique="${m.id}"></p>
        <div class="avis-boutons">
          <button class="avis-bouton" data-action="pas-aime" aria-label="Pas trop comme ça : on passe et on s'en éloigne"><span aria-hidden="true">↷</span> Pas trop comme ça</button>
          <button class="avis-bouton avis-aime" data-action="aime" aria-pressed="false"><span aria-hidden="true">♥</span> Ça, j'aime bien</button>
          <button class="avis-bouton avis-garder" data-action="garder-joue" data-garder="${m.id}" aria-pressed="false"><span aria-hidden="true">+</span> <span class="avis-garder-texte">Ajouter à ma sélection</span></button>
        </div>
        <button class="lien-bouton" data-action="radio-raconte">Plus d'infos sur l'album et l'artiste</button>
      </div>`;
    remplirChronique(m);
  }
  if (m) {
    const a = $('.avis-aime', el);
    if (a) { a.setAttribute('aria-pressed', S.aime.has(m.id)); a.classList.toggle('actif', S.aime.has(m.id)); }
  }
  $('#caps').innerHTML = CAPS.map(d => `<button class="cap" data-action="cap" data-dir="${d}" aria-pressed="${S.cap === d}"${m ? '' : ' disabled'}>${E(nomCap(d))}</button>`).join('');
  const p = parId[S.suite[0]];
  $('#ensuite').innerHTML = p ? `<span class="ensuite-mot">Ensuite</span><button class="ensuite-titre" data-action="jouer-id" data-id="${p.id}" title="L'écouter tout de suite">${E(p.affiche)} <em>${E(p.artiste)}</em></button>${S.cap ? `<span class="file-cap">${E(nomCap(S.cap))}</span>` : ''}`
    + (S.source === 'selection' ? `<span class="ensuite-source">Tu écoutes ta sélection. <button class="lien-bouton" data-action="source-chaine" data-source="radio">Revenir à la radio</button></span>` : '') : '';
  majGarde();
}
// quelques mots sur le titre, sinon l'album, sinon l'artiste : en français, sans les phrases de catalogue
function remplirChronique(m) {
  Pochettes.album(m).then(a => Infos.chronique(m, a && a.titre, c => {
    const p = $(`[data-chronique="${m.id}"]`);
    if (!p || !c) return;
    p.innerHTML = `${E(c.texte)} <a class="chronique-source" href="${E(c.url)}" target="_blank" rel="noopener">Sur ${E(c.de)}, d'après Wikipédia</a>`;
    p.classList.add('pret');
  }));
}
// « Juste la musique » : la chaîne seule, rien d'autre
function basculerEpure(force) {
  S.epure = typeof force === 'boolean' ? force : !S.epure;
  memoire.ecrire('md-epure', S.epure);
  document.body.classList.toggle('epure', S.epure);
  const b = $('#bouton-epure');
  b.setAttribute('aria-pressed', S.epure);
  b.textContent = S.epure ? 'Tout afficher' : 'Juste la musique';
  clic(1300, 0.03, 0.05);
  majPoste();
}
function entrerMachine() {
  rendrePupitre();
  if (!$('#tiroir').classList.contains('ouvert')) poserDisque(S.source);
  aller('machine');
  majMachine();
}
function majMachine() {
  const m = parId[S.joue];
  majAfficheur();
  majGarde();
  S.suite.slice(0, 4).forEach(x => Pochettes.demander(parId[x]));
  rendreLivret('machine', m);
  placerEcranVideo();
}
function texteLCD(el, texte) {
  if (el.textContent === texte) return;
  el.textContent = texte;
  el.style.animationDuration = `${Math.max(8, texte.length * 0.3)}s`;
  const boite = el.parentElement;
  boite.classList.add('fixe');
  requestAnimationFrame(() => { if (el.scrollWidth > boite.clientWidth + 2) boite.classList.remove('fixe'); });
}
function majAfficheur() {
  const m = parId[S.joue];
  const active = !!m && !!S.lecture;
  const lecture = document.body.classList.contains('lecture-disque');
  $('#lcd-disque').textContent = SOURCES[S.source].nom.toUpperCase();
  $('#lcd-piste').textContent = m ? deux(S.historique.length) : '--';
  const texte = lecture ? 'READING' : m ? `${m.affiche} · ${m.artiste}${active && S.lecture === 'extrait' ? ' (extrait)' : ''}` : 'APPUIE SUR LECTURE';
  texteLCD($('#lcd-texte'), texte);
  $('#lcd-etat').textContent = lecture ? 'READ' : !active ? 'STOP' : S.bloque ? 'APPUIE SUR ▶' : S.enLecture ? '▶ PLAY' : S.aJoue ? 'II PAUSE' : 'LOAD';
  const ensuite = parId[S.suite[0]];
  $('#lcd-ensuite').textContent = ensuite && !lecture ? `ENSUITE ${ensuite.affiche}` : '';
  if (!active) $('#lcd-temps').textContent = '--:--';
  const ms = $('#machine-source');
  const src = active && S.lecture === 'extrait' ? Pochettes.source(m) : null;
  ms.hidden = !src && !(active && S.bloque);
  if (active && S.bloque) ms.textContent = 'La lecture ne démarre pas toute seule : appuie sur lecture.';
  else if (src) ms.innerHTML = `Extrait de 30 secondes.${src.lien ? ` <a href="${E(src.lien)}" target="_blank" rel="noopener">En entier sur ${src.nom}</a>` : ''}`;
  document.body.classList.toggle('cd-tourne', active && S.enLecture);
  document.body.classList.toggle('chaine-allumee', true);
  if (m && m.bpm) document.body.style.setProperty('--battement', `${(60 / (m.bpm > 140 ? m.bpm / 2 : m.bpm)).toFixed(3)}s`);
  lancerSpectre();
}
/* le petit égaliseur de l'écran : il bat au tempo du morceau (on ne peut pas analyser
   le son de YouTube, alors il danse d'après la fiche : tempo et énergie) */
const BARRES = 18;
$('#lcd-spectre').innerHTML = '<i></i>'.repeat(BARRES);
const barres = $$('#lcd-spectre i');
const pics = new Array(BARRES).fill(0);
let spectreRAF = null, spectreDernier = 0;
function lancerSpectre() {
  if (spectreRAF || reduitMouvement) return;
  if (S.vue !== 'machine' || !S.enLecture) return;
  spectreRAF = requestAnimationFrame(animerSpectre);
}
function animerSpectre(t) {
  if (S.vue !== 'machine' || !S.enLecture) {
    spectreRAF = null;
    barres.forEach((b, i) => { b.style.setProperty('--h', '0.06'); pics[i] = 0; b.style.setProperty('--pic', 0); });
    return;
  }
  spectreRAF = requestAnimationFrame(animerSpectre);
  if (t - spectreDernier < 55) return;
  spectreDernier = t;
  const m = parId[S.joue] || {};
  const bpm = m.bpm || 100, e = num(m.energie, 5) / 10;
  const temps = (t / 60000) * (bpm > 150 ? bpm / 2 : bpm);
  const coup = Math.pow(1 - (temps % 1), 3);
  barres.forEach((b, i) => {
    const f = i / (BARRES - 1);
    const base = (0.22 + 0.5 * e) * (1 - f * 0.5);
    const bruit = 0.5 + 0.5 * Math.sin(t / (85 + i * 11) + i * 1.9) * Math.sin(t / (230 + i * 17) + i);
    const h = Math.max(0.06, Math.min(1, base * (0.5 + 0.55 * bruit) + coup * (1 - f) * 0.38 * (0.4 + e) + Math.random() * 0.07));
    pics[i] = Math.max(h, pics[i] - 0.035);
    b.style.setProperty('--h', h.toFixed(2));
    b.style.setProperty('--pic', ((pics[i] - h) * 52).toFixed(1));
  });
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
        ? 'Rien dans ta sélection pour l\'instant. Quand un morceau te plaît, appuie sur « Ajouter à ma sélection ».'
        : 'Tout ce qui passe dans la chaîne s\'inscrit ici.'}</li>`
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
  try { await navigator.clipboard.writeText('Ma sélection sur Music Discovery\n\n' + txt); toast('Liste copiée : colle-la dans un outil d\'import de playlist (TuneMyMusic, Soundiiz…).', 4500); }
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
  // le geste « Commencer » autorise le son : la chaîne démarre sur le morceau du jour
  const jour = morceauDuJour();
  const dejaCeJour = memoire.lire('md-jour-joue', '') === dateDuJour();
  const m = S.source === 'radio' && !dejaCeJour && jour ? jour : parId[construireSuite(null, 1)[0]];
  if (m === jour) memoire.ecrire('md-jour-joue', dateDuJour());
  entrerMachine();
  if (m) jouerRadio(m.id);
}
const demarre = () => document.body.classList.contains('allume');

/* ─────────────────────────────── les actions ─────────────────────────────── */
const ACTIONS = {
  'allumer': allumer,
  'accueil': () => { if (demarre()) window.scrollTo({ top: 0, behavior: doux }); },
  'piste': b => {
    if (b.dataset.id) { arreterExtrait(); clic(1300); jouerRadio(b.dataset.id); return; }
    const p = (pistesLivret[b.dataset.livret] || [])[+b.dataset.i];
    if (!p) return;
    const cle = `piste:${b.dataset.livret}:${b.dataset.i}`;
    if (extraitPour === cle) arreterExtrait(); else lancerExtraitPiste(p, cle, b.closest('li'));
  },
  'ouvrir': b => { fermerPanneaux(); clic(1300); jouerRadio(b.dataset.id); },
  'jouer-id': b => { clic(1300); jouerRadio(b.dataset.id); },
  'garder': b => basculerGarde(b.dataset.id),
  'garder-joue': () => basculerGarde(S.joue),
  'aime': () => aimer(S.joue),
  'pas-aime': () => pasAime(S.joue),
  'cap': b => orienter(b.dataset.dir),
  'source-chaine': b => choisirSource(b.dataset.source),
  'lecture': () => basculerLecture(),
  'suivant': () => radioSuivant(),
  'retour-morceau': () => { entrerMachine(); window.scrollTo({ top: 0, behavior: doux }); },
  'epure': () => basculerEpure(),
  'livret': b => {
    const m = parId[S.joue];
    if (!m) return;
    if (b.dataset.ouvrir) return ouvrirLivret('machine', m);
    S.livrets.machine = !S.livrets.machine;
    rendreLivret('machine', m, { force: true });
    clic(1000, 0.04, 0.05);
  },
  'radio-lecture': radioLecture,
  'radio-suivant': radioSuivant,
  'radio-precedent': radioPrecedent,
  'radio-stop': radioStop,
  'radio-garder': () => basculerGarde(S.joue),
  'radio-raconte': () => { const m = parId[S.joue]; if (m) ouvrirLivret('machine', m); },
  'ejecter': ejecter,
  'ecouter-selection': () => { fermerPanneaux(); choisirSource('selection'); window.scrollTo({ top: 0, behavior: doux }); },
  'copier-lien': async () => {
    try { await navigator.clipboard.writeText(location.href); toast('Lien copié : colle-le dans ton navigateur.'); }
    catch (e) { toast(location.href, 6000); }
  },
  'fermer-avis-appli': () => { $('#avis-appli').hidden = true; memoire.ecrire('md-avis-appli', true); },
  'ouvrir-bac': () => ouvrirPanneau('bac'),
  'ouvrir-reglages': () => ouvrirPanneau('reglages'),
  'fermer-panneaux': () => fermerPanneaux(),
  'onglet': b => { S.onglet = b.dataset.onglet; rendreBac(); },
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
  const libre = e.target === document.body || (e.target.matches && e.target.matches('.cap, .avis-bouton, .file-titre'));
  if (!libre || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === ' ' && S.joue) { e.preventDefault(); basculerLecture(); return; }
  if (!S.joue) return;
  if (e.key === 'g' || e.key === 'G') { e.preventDefault(); basculerGarde(S.joue); }
  else if (e.key === 'j' || e.key === 'J') { e.preventDefault(); aimer(S.joue); }
  else if (e.key === 'x' || e.key === 'X') { e.preventDefault(); pasAime(S.joue); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); radioSuivant(); }
});

/* ─────────────────────────────── démarrage ─────────────────────────────── */
appliquerTeinte(teinteActive, false);
majMolettes();
majSon();
majGarde();
S.suite = construireSuite(null);
if (S.epure) { document.body.classList.add('epure'); $('#bouton-epure').setAttribute('aria-pressed', 'true'); $('#bouton-epure').textContent = 'Tout afficher'; }
poserDisque(S.source);
rendrePupitre();
majAfficheur();
chargerAPI();
// pochettes, extraits et fiches de toute la sélection, préparés dès l'arrivée (puis gardés en cache)
BANQUE.forEach(m => Pochettes.demander(m));
if (IOS) $('#allumage-conseil').textContent = 'Sur iPhone, le volume se règle avec les boutons du téléphone : baisse-le un peu avant de commencer.';
if (S.gardes.length || S.croises.length) {
  const r = $('#allumage-retour');
  r.hidden = false;
  r.textContent = S.gardes.length
    ? `Ta sélection t'attend : ${S.gardes.length} morceau${S.gardes.length > 1 ? 'x' : ''}.`
    : `Content de te revoir. Tu avais croisé ${S.croises.length} morceaux.`;
}
// ouvert depuis Instagram, TikTok, Messenger… : leur navigateur intégré lit mal YouTube et ne garde rien
(() => {
  const ua = navigator.userAgent || '';
  const appli = [['Instagram', /Instagram/i], ['Facebook', /FBAN|FBAV|FB_IAB|FBIOS/i], ['Messenger', /Messenger|FB_IAB\/MESSENGER/i], ['TikTok', /TikTok|musical_ly|BytedanceWebview|trill/i],
    ['Snapchat', /Snapchat/i], ['LinkedIn', /LinkedInApp/i], ['X', /Twitter/i], ['Pinterest', /Pinterest/i], ['Google', /GSA\//i], ['Line', /\bLine\//]].find(([, r]) => r.test(ua));
  const webview = /Android.*; wv\)/.test(ua);
  if ((!appli && !webview) || memoire.lire('md-avis-appli', false)) return;
  const nom = appli ? appli[0] : 'cette appli';
  const android = /Android/i.test(ua);
  $('#avis-appli').hidden = false;
  $('#avis-appli-texte').textContent = android
    ? `Le navigateur intégré à ${nom} lit mal la musique et oublie ta sélection. Ouvre plutôt la page dans Chrome.`
    : `Le navigateur intégré à ${nom} lit mal la musique et oublie ta sélection. Touche ⋯ ou ↗ (en haut ou en bas de l'écran), puis « Ouvrir dans Safari » ou « Ouvrir dans le navigateur ».`;
  if (android) {
    const a = $('#avis-appli-ouvrir');
    a.hidden = false;
    a.href = `intent://${location.host}${location.pathname}${location.search}#Intent;scheme=https;package=com.android.chrome;end`;
  }
})();
aller('allumage');
})();
