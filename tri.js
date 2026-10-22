/* ════════════════════════════════════════════════════════════════════
   TABLE DE TRI — oui / non sur de longues playlists
   Les choix sont gardés dans ce navigateur (localStorage).
   Les « oui » s'exportent en texte à coller à Claude, qui les ajoute à data.js.
   ════════════════════════════════════════════════════════════════════ */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const CLE = 'md-tri-v1';
const charger = () => { try { return JSON.parse(localStorage.getItem(CLE)) || { listes: {}, active: null }; } catch (e) { return { listes: {}, active: null }; } };
const sauver = () => { try { localStorage.setItem(CLE, JSON.stringify(T)); } catch (e) { toast('Mémoire du navigateur pleine : exporte tes oui.'); } };
const T = charger();
const L = () => T.listes[T.active];

// morceaux déjà présents sur le site
const DEJA = new Set((typeof MORCEAUX !== 'undefined' ? MORCEAUX : []).map(m => {
  const r = (m.lien || '').match(/[?&]v=([\w-]{11})/) || (m.lien || '').match(/youtu\.be\/([\w-]{11})/);
  return r && r[1];
}).filter(Boolean));

let toastMin = null;
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('visible'); clearTimeout(toastMin); toastMin = setTimeout(() => el.classList.remove('visible'), 2200); }

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
function lireInfos() {
  if (!courant || !lecteur.getVideoData) return;
  const d = lecteur.getVideoData();
  if (!d || d.video_id !== courant || !d.title) return;
  const l = L();
  l.infos[courant] = Object.assign(l.infos[courant] || {}, analyser(d), { brut: d.title });
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
async function chargerSuite() {
  const l = L();
  if (!l.list || l.complet) return false;
  const nouveaux = await cuePlaylist(l.list, l.ids.length);
  if (!nouveaux || !nouveaux.length) { l.complet = true; sauver(); return false; }
  const avant = l.ids.length;
  nouveaux.forEach(id => { if (!l.ids.includes(id)) l.ids.push(id); });
  if (l.ids.length === avant) l.complet = true;
  sauver();
  return l.ids.length > avant;
}
async function demarrer() {
  const e = lireEntree($('#entree').value);
  if (!e) { toast('Je ne trouve pas de lien de playlist ou de morceau YouTube.'); return; }
  if (!T.listes[e.cle]) T.listes[e.cle] = { nom: '', list: e.list, ids: e.ids, infos: {}, decisions: {}, historique: [], complet: !e.list, cree: Date.now() };
  T.active = e.cle;
  sauver();
  $('#bouton-charger').textContent = 'Chargement…';
  if (e.list && !L().ids.length) {
    const ids = await cuePlaylist(e.list, 0);
    if (!ids || !ids.length) { toast('Playlist introuvable ou privée. Vérifie qu\'elle est publique ou « non répertoriée ».'); $('#bouton-charger').textContent = 'Charger'; delete T.listes[e.cle]; sauver(); return; }
    L().ids = ids;
    if (ids.length < 199) L().complet = true;
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
  for (const id of l.ids) {
    if (l.decisions[id]) continue;
    if (DEJA.has(id) && T.active !== 'site') { l.decisions[id] = 'deja'; continue; }
    return id;
  }
  return null;
}
async function suivant() {
  let id = prochain();
  if (!id && await chargerSuite()) id = prochain();
  // on anticipe la suite quand il ne reste presque plus rien de chargé
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
  $('#deja').hidden = !DEJA.has(courant);
  $('#refus').hidden = !i.refus;
  $('#lien-yt').href = `https://www.youtube.com/watch?v=${courant}`;
}
function majCompteurs() {
  const l = L();
  const v = Object.values(l.decisions);
  $('#n-oui').textContent = v.filter(x => x === 'oui').length;
  $('#n-non').textContent = v.filter(x => x === 'non').length;
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
  $('#fin-texte').textContent = `${v.filter(x => x === 'oui').length} oui, ${v.filter(x => x === 'non').length} non` + (passes ? `, ${passes} à revoir.` : '.');
  majCompteurs();
}

/* ─────────── export ─────────── */
function lesOui() {
  const l = L();
  return l.ids.filter(id => l.decisions[id] === 'oui').map(id => ({ id, ...(l.infos[id] || {}) }));
}
function texteExport() {
  const oui = lesOui();
  if (T.active === 'site') {
    const l = L(), non = l.ids.filter(id => l.decisions[id] === 'non');
    return `Morceaux du site à RETIRER (${non.length}) :\n` + non.map(id => { const m = l.infos[id] || {}; return `${m.artiste || '?'} | ${m.titre || '?'} | https://music.youtube.com/watch?v=${id}`; }).join('\n');
  }
  return `Morceaux validés sur la table de tri (${oui.length}) :\n` + oui.map(m =>
    `${m.artiste || '?'} | ${m.titre || m.brut || '?'} | https://music.youtube.com/watch?v=${m.id}${m.refus ? ' | lecture intégrée refusée' : ''}`).join('\n');
}
function rendreExport() {
  const oui = lesOui();
  $('#export').hidden = !oui.length && !(T.active === 'site' && Object.values(L().decisions).includes('non'));
  $('#liste-oui').innerHTML = oui.map(m => `<li>${esc(m.artiste || '?')}, ${esc(m.titre || m.brut || m.id)}</li>`).join('');
  const passes = Object.values(L().decisions).filter(x => x === 'passe').length;
  $('#revoir-passes').hidden = !passes;
  $('#revoir-passes').textContent = `Revoir les « pas sûr » (${passes})`;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function rendreListes() {
  const cles = Object.keys(T.listes);
  $('#listes').innerHTML = cles.length > 1 || (cles.length === 1 && $('#table').hidden)
    ? cles.map((k, i) => {
        const l = T.listes[k];
        const faits = l.ids.filter(x => l.decisions[x]).length;
        return `<button class="liste-pastille" data-cle="${esc(k)}" aria-pressed="${k === T.active}">Playlist ${i + 1} (${faits}/${l.ids.length}${l.complet ? '' : '+'})</button>`;
      }).join('')
    : '';
}

/* ─────────── commandes ─────────── */
$('#bouton-charger').addEventListener('click', demarrer);
$('#listes').addEventListener('click', e => {
  const b = e.target.closest('[data-cle]');
  if (!b || !pret) return;
  T.active = b.dataset.cle; sauver(); ouvrirTable();
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
  a.download = 'music-discovery-oui.txt';
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

// reprise : la dernière playlist est proposée
rendreListes();
if (T.active && T.listes[T.active]) $('#entree').placeholder = 'Colle une nouvelle playlist, ou reprends une des tiennes ci-dessous.';
})();

/* ─────────── trier aussi les morceaux déjà sur le site ─────────── */
document.getElementById('trier-site').addEventListener('click', () => {
  const ids = [...DEJA], infos = {};
  (typeof MORCEAUX !== 'undefined' ? MORCEAUX : []).forEach(m => { const r = (m.lien || '').match(/[?&]v=([\w-]{11})/); if (r) infos[r[1]] = { titre: m.titre, artiste: m.artiste }; });
  if (!T.listes.site) T.listes.site = { nom: 'Le site actuel', list: null, ids, infos, decisions: {}, historique: [], complet: true, cree: Date.now() };
  T.active = 'site'; sauver(); ouvrirTable();
  toast('Vert = il reste, rouge = il sort du site.');
});
