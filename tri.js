/* ════════════════════════════════════════════════════════════════════
   TABLE DE TRI — oui / non sur de longues playlists
   Les choix sont gardés dans ce navigateur (localStorage).
   Un morceau déjà trié (dans n'importe quelle playlist) ou déjà présent
   sur le site n'est jamais reproposé.
   Les « oui » s'exportent en texte à coller à Claude, qui les ajoute à data.js.
   ════════════════════════════════════════════════════════════════════ */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const CLE = 'md-tri-v1';
const charger = () => { try { return JSON.parse(localStorage.getItem(CLE)) || { listes: {}, active: null }; } catch (e) { return { listes: {}, active: null }; } };
const sauver = () => { try { localStorage.setItem(CLE, JSON.stringify(T)); } catch (e) { toast('Mémoire du navigateur pleine : exporte tes oui.'); } };
const T = charger();
T.listes = T.listes || {};
const L = () => T.listes[T.active];
const SITE = 'site';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9぀-ヿ一-龯]+/g, '');

/* ─────────── thème clair / sombre ─────────── */
function majTheme() {
  const sombre = document.documentElement.dataset.theme === 'sombre';
  $('#theme').textContent = sombre ? 'Mode clair' : 'Mode sombre';
  document.querySelector('meta[name="theme-color"]').setAttribute('content', sombre ? '#141418' : '#dedcd8');
}
$('#theme').addEventListener('click', () => {
  const t = document.documentElement.dataset.theme === 'sombre' ? 'clair' : 'sombre';
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('md-tri-theme', t); } catch (e) {}
  majTheme();
});
majTheme();

/* ─────────── ce qui est déjà connu ─────────── */
const MORC = typeof MORCEAUX !== 'undefined' ? MORCEAUX : [];
const idDe = lien => { const r = (lien || '').match(/[?&]v=([\w-]{11})/) || (lien || '').match(/youtu\.be\/([\w-]{11})/); return r && r[1]; };
// morceaux déjà présents sur le site
const DEJA = new Set(MORC.map(m => idDe(m.lien)).filter(Boolean));
// tout ce qui a déjà reçu un oui ou un non, toutes playlists confondues
function dejaTries() {
  const g = {};
  for (const [k, l] of Object.entries(T.listes)) {
    if (k === SITE) continue;
    for (const [id, d] of Object.entries(l.decisions || {})) if (d === 'oui' || d === 'non') g[id] = d;
  }
  return g;
}

let toastMin = null;
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('visible'); clearTimeout(toastMin); toastMin = setTimeout(() => el.classList.remove('visible'), 2600); }

/* ─────────── lecteur ─────────── */
let lecteur = null, pret = false, attenteCue = null, courant = null;
window.onYouTubeIframeAPIReady = () => {
  lecteur = new YT.Player('yt', {
    width: '100%', height: '100%',
    playerVars: { playsinline: 1, rel: 0, modestbranding: 1, origin: location.origin.startsWith('http') ? location.origin : undefined },
    events: {
      onReady: () => { pret = true; $('#bouton-charger').disabled = false; $('#bouton-charger').textContent = 'Charger'; },
      onStateChange: e => {
        if (e.data === YT.PlayerState.CUED && attenteCue) { const f = attenteCue; attenteCue = null; f(); }
        if (e.data === YT.PlayerState.PLAYING) { lireInfos(); $('#t-lecture').textContent = 'Pause'; }
        if (e.data === YT.PlayerState.PAUSED) $('#t-lecture').textContent = 'Lecture';
        if (e.data === YT.PlayerState.ENDED) $('#t-lecture').textContent = 'Relancer';
      },
      onError: () => {
        if (!courant) return;
        const l = L();
        l.infos[courant] = Object.assign(l.infos[courant] || {}, { refus: true });
        sauver(); afficherFiche();
      }
    }
  });
};
const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s);

function analyser(data) {
  const brut = data.title || '';
  const auteurBrut = data.author || '';
  const nettoie = x => x.replace(/\s*[\(\[][^\)\]]*(official|officiel|clip|audio|video|vidéo|lyric|visuali[sz]er|music video|hd|4k)[^\)\]]*[\)\]]/ig, '').trim();
  const topic = /\s-\sTopic$/i.test(auteurBrut);
  const auteur = auteurBrut.replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').trim();
  if (!topic && brut.includes(' - ')) {
    const [a, ...r] = brut.split(' - ');
    return { artiste: a.trim(), titre: nettoie(r.join(' - ')) };
  }
  return { artiste: auteur, titre: nettoie(brut) };
}
// la vidéo vient-elle d'une chaîne officielle ? (c'est ce qui garantit que l'artiste est payé)
function statutChaine(chaine, artiste) {
  if (!chaine) return null;
  if (/\s-\sTopic$/i.test(chaine)) return { ok: true, texte: 'Version officielle (fournie par le label à YouTube Music)' };
  if (/vevo$/i.test(chaine)) return { ok: true, texte: `Chaîne officielle (${chaine})` };
  const a = norm(chaine), b = norm(String(artiste || '').split(/\s+(?:feat\.?|ft\.?|&|x)\s+|,/i)[0]);
  if (a && b && (a.includes(b) || b.includes(a))) return { ok: true, texte: `Chaîne de l'artiste (${chaine})` };
  return { ok: false, texte: `Mise en ligne par « ${chaine} » : peut-être pas officielle, cherche la version de l'artiste ou du label` };
}
function lireInfos() {
  if (!courant || !lecteur.getVideoData) return;
  const d = lecteur.getVideoData();
  if (!d || d.video_id !== courant || !d.title) return;
  const l = L();
  const i = l.infos[courant] = l.infos[courant] || {};
  // pour les morceaux du site, on garde le titre et l'artiste de data.js
  if (T.active !== SITE) Object.assign(i, analyser(d));
  i.brut = d.title;
  i.chaine = d.author || '';
  const st = statutChaine(i.chaine, i.artiste);
  i.officiel = st ? st.ok : null;
  sauver(); afficherFiche();
}

/* ─────────── charger une liste ─────────── */
function lireEntree(texte) {
  const liste = texte.match(/[?&]list=([\w-]+)/);
  if (liste) return { cle: 'pl:' + liste[1], list: liste[1], ids: [] };
  const ids = [...texte.matchAll(/(?:[?&]v=|youtu\.be\/)([\w-]{11})/g)].map(m => m[1]);
  if (ids.length) return { cle: 'ids:' + ids.slice(0, 3).join(','), list: null, ids: [...new Set(ids)] };
  return null;
}
function cuePlaylist(list, index) {
  return new Promise(res => {
    const minuterie = setTimeout(() => { attenteCue = null; res(null); }, 10000);
    attenteCue = () => { clearTimeout(minuterie); res(lecteur.getPlaylist() || []); };
    lecteur.cuePlaylist({ list, listType: 'playlist', index });
  });
}
function fusionner(l, ids) {
  const avant = l.ids.length;
  ids.forEach(id => { if (!l.ids.includes(id)) l.ids.push(id); });
  return l.ids.length - avant;
}
async function chargerSuite() {
  const l = L();
  if (!l.list || l.complet) return false;
  const nouveaux = await cuePlaylist(l.list, l.ids.length);
  if (!nouveaux || !nouveaux.length) { l.complet = true; sauver(); return false; }
  const ajoutes = fusionner(l, nouveaux);
  if (!ajoutes) l.complet = true;
  sauver();
  return ajoutes > 0;
}
async function demarrer() {
  const e = lireEntree($('#entree').value);
  if (!e) { toast('Je ne trouve pas de lien de playlist ou de morceau YouTube.'); return; }
  const existait = !!T.listes[e.cle];
  if (!existait) T.listes[e.cle] = { nom: '', list: e.list, ids: [], infos: {}, decisions: {}, historique: [], complet: !e.list, cree: Date.now() };
  T.active = e.cle;
  const l = L();
  if (!e.list) fusionner(l, e.ids);
  sauver();
  $('#bouton-charger').textContent = 'Chargement…';
  if (e.list) {
    // on relit toujours la playlist : si tu y as ajouté des morceaux, ils arrivent à la suite
    const ids = await cuePlaylist(e.list, 0);
    if (!ids || !ids.length) {
      $('#bouton-charger').textContent = 'Charger';
      if (!existait) {
        delete T.listes[e.cle]; T.active = null; sauver();
        toast('Playlist introuvable ou privée. Vérifie qu\'elle est publique ou « non répertoriée ».');
        return;
      }
      toast('Impossible de relire la playlist pour l\'instant : je reprends avec ce que j\'avais.');
    } else {
      const ajoutes = fusionner(l, ids);
      if (ids.length >= 199) l.complet = false;
      else if (!existait) l.complet = true;
      if (existait) toast(ajoutes ? `Playlist reprise : ${ajoutes} nouveau${ajoutes > 1 ? 'x' : ''} morceau${ajoutes > 1 ? 'x' : ''}.` : 'Playlist reprise là où tu t\'étais arrêté.');
    }
    sauver();
  }
  $('#bouton-charger').textContent = 'Charger';
  ouvrirTable();
}
function ouvrirTable() {
  $('#table').hidden = false;
  $('#compteurs').hidden = false;
  rendreListes();
  suivant();
}

/* ─────────── le tri ─────────── */
function prochain() {
  const l = L();
  const vus = T.active === SITE ? {} : dejaTries();
  for (const id of l.ids) {
    if (l.decisions[id]) continue;
    if (T.active !== SITE) {
      if (DEJA.has(id)) { l.decisions[id] = 'deja'; continue; }
      if (vus[id]) { l.decisions[id] = 'vu'; continue; }
    }
    return id;
  }
  return null;
}
async function suivant() {
  let id = prochain();
  if (!id && await chargerSuite()) id = prochain();
  sauver();
  if (!id) return terminer();
  $('#fin').hidden = true;
  $('#table').hidden = false;
  courant = id;
  const debut = $('#opt-intro').checked ? 40 : 0;
  lecteur.loadVideoById({ videoId: id, startSeconds: debut });
  afficherFiche();
  majCompteurs();
}
function afficherFiche() {
  const l = L();
  const i = (l.infos[courant] || {});
  const total = l.ids.length;
  const faits = l.ids.filter(x => l.decisions[x]).length;
  $('#position').textContent = `${faits + 1} sur ${total}${l.complet ? '' : '+'}`;
  $('#titre').textContent = i.titre || 'Chargement du titre…';
  $('#artiste').textContent = i.artiste || '';
  const st = statutChaine(i.chaine, i.artiste);
  $('#chaine').hidden = !st;
  if (st) { $('#chaine').textContent = st.texte; $('#chaine').className = 'chaine ' + (st.ok ? 'ok' : 'doute'); }
  $('#deja').hidden = !DEJA.has(courant);
  $('#refus').hidden = !i.refus;
  $('#lien-yt').href = `https://www.youtube.com/watch?v=${courant}`;
}
function majCompteurs() {
  const l = L();
  const v = Object.values(l.decisions);
  $('#n-oui').textContent = v.filter(x => x === 'oui').length;
  $('#n-non').textContent = v.filter(x => x === 'non').length;
  $('#n-deja').textContent = v.filter(x => x === 'deja' || x === 'vu').length;
  $('#n-reste').textContent = l.ids.filter(x => !l.decisions[x]).length + (l.complet ? '' : '+');
  rendreExport();
}
function decider(v) {
  if (!courant) return;
  const l = L();
  l.decisions[courant] = v;
  l.historique.push(courant);
  sauver();
  if (v === 'oui' || v === 'non') {
    const f = $('#flash');
    f.className = 'verdict-flash ' + v; f.textContent = v === 'oui' ? 'Oui' : 'Non';
    setTimeout(() => { f.className = 'verdict-flash'; }, 350);
  }
  suivant();
}
function annuler() {
  const l = L();
  const id = l.historique.pop();
  if (!id) return toast('Rien à annuler.');
  delete l.decisions[id];
  sauver();
  courant = id;
  lecteur.loadVideoById({ videoId: id, startSeconds: $('#opt-intro').checked ? 40 : 0 });
  afficherFiche(); majCompteurs();
  toast('Choix annulé.');
}
function terminer() {
  courant = null;
  try { lecteur.stopVideo(); } catch (e) {}
  $('#table').hidden = true;
  $('#fin').hidden = false;
  const l = L();
  const v = Object.values(l.decisions);
  const passes = v.filter(x => x === 'passe').length;
  const vus = v.filter(x => x === 'deja' || x === 'vu').length;
  $('#fin-texte').textContent = `${v.filter(x => x === 'oui').length} oui, ${v.filter(x => x === 'non').length} non` +
    (vus ? `, ${vus} déjà vus (sautés)` : '') + (passes ? `, ${passes} à revoir.` : '.');
  majCompteurs();
}

/* ─────────── export ─────────── */
const marque = m => (m.refus ? ' | lecture intégrée refusée' : '') + (m.officiel === false ? ` | chaîne non officielle ? (${m.chaine})` : '');
function lesOui() {
  const l = L();
  return l.ids.filter(id => l.decisions[id] === 'oui').map(id => ({ id, ...(l.infos[id] || {}) }));
}
function lesNon() {
  const l = L();
  return l.ids.filter(id => l.decisions[id] === 'non').map(id => ({ id, ...(l.infos[id] || {}) }));
}
function texteExport() {
  if (T.active === SITE) {
    const non = lesNon();
    const doutes = lesOui().filter(m => m.officiel === false);
    return `Morceaux du site à RETIRER (${non.length}) :\n` +
      non.map(m => `${m.artiste || '?'} | ${m.titre || '?'} | https://music.youtube.com/watch?v=${m.id}`).join('\n') +
      (doutes.length ? `\n\nGardés, mais chaîne peut-être pas officielle (${doutes.length}) :\n` +
        doutes.map(m => `${m.artiste || '?'} | ${m.titre || '?'} | https://music.youtube.com/watch?v=${m.id}${marque(m)}`).join('\n') : '');
  }
  const oui = lesOui();
  return `Morceaux validés sur la table de tri (${oui.length}) :\n` + oui.map(m =>
    `${m.artiste || '?'} | ${m.titre || m.brut || '?'} | https://music.youtube.com/watch?v=${m.id}${marque(m)}`).join('\n');
}
function rendreExport() {
  const site = T.active === SITE;
  const liste = site ? lesNon() : lesOui();
  $('#export').hidden = !liste.length;
  $('#export-titre').textContent = site ? 'Les morceaux à retirer du site' : 'Tes oui, prêts à entrer sur le site';
  $('#export-aide').textContent = site
    ? 'Clique sur « Copier pour Claude », puis colle le texte dans la conversation : Claude retire ces morceaux du site.'
    : 'Clique sur « Copier pour Claude », puis colle le texte dans la conversation : Claude les ajoute au site et règle leur énergie, leur étrangeté et leur côté dansant.';
  $('#liste-oui').innerHTML = liste.map(m => `<li>${esc(m.artiste || '?')}, ${esc(m.titre || m.brut || m.id)}${m.officiel === false ? ' <span class="petit">(chaîne à vérifier)</span>' : ''}</li>`).join('');
  const passes = Object.values(L().decisions).filter(x => x === 'passe').length;
  $('#revoir-passes').hidden = !passes;
  $('#revoir-passes').textContent = `Revoir les « pas sûr » (${passes})`;
}
function rendreListes() {
  const cles = Object.keys(T.listes);
  let n = 0;
  $('#listes').innerHTML = cles.length > 1 || (cles.length === 1 && $('#table').hidden)
    ? cles.map(k => {
        const l = T.listes[k];
        const faits = l.ids.filter(x => l.decisions[x]).length;
        const nom = k === SITE ? 'Le site actuel' : `Playlist ${++n}`;
        return `<button class="liste-pastille" data-cle="${esc(k)}" aria-pressed="${k === T.active}">${nom} (${faits}/${l.ids.length}${l.complet ? '' : '+'})</button>`;
      }).join('')
    : '';
}

/* ─────────── commandes ─────────── */
$('#bouton-charger').addEventListener('click', demarrer);
$('#listes').addEventListener('click', e => {
  const b = e.target.closest('[data-cle]');
  if (!b) return;
  if (!pret) return toast('Le lecteur se prépare, une seconde.');
  T.active = b.dataset.cle; sauver(); ouvrirTable();
});
// trier aussi les morceaux déjà sur le site : vert = il reste, rouge = il sort
$('#trier-site').addEventListener('click', () => {
  if (!pret) return toast('Le lecteur se prépare, une seconde.');
  const l = T.listes[SITE] = T.listes[SITE] || { nom: 'Le site actuel', list: null, ids: [], infos: {}, decisions: {}, historique: [], complet: true, cree: Date.now() };
  MORC.forEach(m => {
    const id = idDe(m.lien);
    if (!id) return;
    if (!l.ids.includes(id)) l.ids.push(id);
    l.infos[id] = Object.assign(l.infos[id] || {}, { titre: m.titre, artiste: m.artiste });
  });
  // un morceau retiré de data.js n'a plus à être trié
  l.ids = l.ids.filter(id => DEJA.has(id));
  T.active = SITE; sauver(); ouvrirTable();
  toast('Vert = il reste, rouge = il sort du site.');
});
$('#v-oui').addEventListener('click', () => decider('oui'));
$('#v-non').addEventListener('click', () => decider('non'));
$('#t-passer').addEventListener('click', () => decider('passe'));
$('#t-annuler').addEventListener('click', annuler);
$('#t-lecture').addEventListener('click', () => {
  const st = lecteur.getPlayerState();
  if (st === YT.PlayerState.PLAYING) lecteur.pauseVideo(); else lecteur.playVideo();
});
$('#t-recul').addEventListener('click', () => lecteur.seekTo(Math.max(0, lecteur.getCurrentTime() - 10), true));
$('#t-avance').addEventListener('click', () => lecteur.seekTo(lecteur.getCurrentTime() + 30, true));
$('#copier').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(texteExport()); toast('Copié. Colle-le dans la conversation avec Claude.'); }
  catch (e) { toast('Copie impossible : utilise « Télécharger la liste ».'); }
});
$('#telecharger').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texteExport()], { type: 'text/plain' }));
  a.download = T.active === SITE ? 'music-discovery-a-retirer.txt' : 'music-discovery-oui.txt';
  a.click();
});
$('#revoir-passes').addEventListener('click', () => {
  const l = L();
  Object.keys(l.decisions).forEach(id => { if (l.decisions[id] === 'passe') delete l.decisions[id]; });
  sauver(); ouvrirTable();
});
document.addEventListener('keydown', e => {
  if ($('#table').hidden || e.target.matches('textarea, input')) return;
  const k = e.key;
  if (k === 'ArrowRight' || k === 'o' || k === 'O') { e.preventDefault(); decider('oui'); }
  else if (k === 'ArrowLeft' || k === 'n' || k === 'N') { e.preventDefault(); decider('non'); }
  else if (k === 'ArrowDown') { e.preventDefault(); decider('passe'); }
  else if (k === 'ArrowUp') { e.preventDefault(); $('#t-avance').click(); }
  else if (k === ' ') { e.preventDefault(); $('#t-lecture').click(); }
  else if (k === 'z' || k === 'Z' || k === 'Backspace') { e.preventDefault(); annuler(); }
});
// glisser la fiche sur téléphone : à droite = oui, à gauche = non
let x0 = null;
const fiche = $('.fiche');
fiche.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
fiche.addEventListener('touchend', e => {
  if (x0 === null) return;
  const dx = e.changedTouches[0].clientX - x0; x0 = null;
  if (Math.abs(dx) > 90) decider(dx > 0 ? 'oui' : 'non');
});

// reprise : ce qui est déjà en mémoire
rendreListes();
const nTries = Object.keys(dejaTries()).length;
if (nTries) $('#memoire').textContent = `${nTries} morceau${nTries > 1 ? 'x' : ''} déjà trié${nTries > 1 ? 's' : ''} en mémoire dans ce navigateur, plus les ${DEJA.size} du site : ils ne te seront plus reproposés, même dans une autre playlist.`;
if (T.active && T.listes[T.active]) $('#entree').placeholder = 'Colle une nouvelle playlist, ou la même pour la reprendre là où tu t\'es arrêté.';
})();
