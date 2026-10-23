/* ════════════════════════════════════════════════════════════════════
   TABLE DE TRI — oui / non sur de longues playlists
   Les choix sont gardés dans ce navigateur (localStorage).
   Un morceau déjà trié (dans n'importe quelle playlist) ou déjà présent
   sur le site n'est jamais reproposé.
   Chaque morceau peut recevoir un commentaire, un coup de cœur et trois
   réglages de ressenti : tout part avec les « oui » vers data.js.
   Les « oui » s'exportent en texte à coller à Claude, ou directement au
   format data.js.
   ════════════════════════════════════════════════════════════════════ */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const CLE = 'md-tri-v1';
const charger = () => { try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) { return {}; } };
let alerteMemoire = false;
const sauver = () => {
  try { localStorage.setItem(CLE, JSON.stringify(T)); }
  catch (e) { if (!alerteMemoire) { alerteMemoire = true; toast('Mémoire du navigateur pleine : télécharge une sauvegarde.'); } }
};
const T = charger();
T.listes = T.listes || {};
T.active = T.active || null;
T.notes = T.notes || {};        // commentaire par morceau (identifiant YouTube)
T.coeurs = T.coeurs || {};      // coups de cœur
T.ressentis = T.ressentis || {};// énergie / étrange / danse, quand tu les as réglés
T.jours = T.jours || {};        // nombre de morceaux jugés par jour
T.objectif = T.objectif || 30;
T.duree = T.duree || { ms: 0, n: 0 }; // temps moyen passé par morceau
const L = () => T.listes[T.active];
const SITE = 'site';
const TAILLE_MANCHE = 10;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9぀-ヿ一-龯]+/g, '');
const vibre = n => { try { navigator.vibrate && navigator.vibrate(n); } catch (e) {} };
const JUGE = v => v === 'oui' || v === 'non' || v === 'passe'; // un vrai jugement (pas « déjà vu »)

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
// morceaux déjà présents sur le site, et le texte qu'ils ont déjà
const DEJA = new Set(MORC.map(m => idDe(m.lien)).filter(Boolean));
const NOTE_SITE = {};
MORC.forEach(m => { const id = idDe(m.lien); if (id) NOTE_SITE[id] = (m.note || '').trim(); });
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
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('visible'); clearTimeout(toastMin); toastMin = setTimeout(() => el.classList.remove('visible'), 2800); }

/* ─────────── lecteur ─────────── */
let lecteur = null, pret = false, attenteCue = null, courant = null, saut = false, debutFiche = 0;
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
    // si le lecteur est déjà « prêt », YouTube ne prévient pas toujours : on vérifie aussi nous-mêmes
    let fini = false;
    const finir = v => { if (fini) return; fini = true; clearTimeout(minuterie); clearInterval(sonde); attenteCue = null; res(v); };
    const minuterie = setTimeout(() => finir(null), 10000);
    const sonde = setInterval(() => {
      try { const pl = lecteur.getPlaylist(); if (pl && pl.length && lecteur.getPlaylistIndex() === index) finir(pl); } catch (e) {}
    }, 400);
    attenteCue = () => finir(lecteur.getPlaylist() || []);
    try { lecteur.stopVideo(); } catch (e) {}
    lecteur.cuePlaylist({ list, listType: 'playlist', index });
  });
}
function fusionner(l, ids) {
  const avant = l.ids.length;
  ids.forEach(id => { if (!l.ids.includes(id)) l.ids.push(id); });
  return l.ids.length - avant;
}
// Invidious découpe une playlist en pages de 200 qui se chevauchent : la page N commence vers (N-1)×100-50
const MIROIRS = ['https://inv.nadeko.net'];
async function suiteParMiroir(l) {
  const page = Math.floor((l.ids.length + 50) / 100) + 1;
  for (const hote of MIROIRS) {
    try {
      const c = new AbortController(); const m = setTimeout(() => c.abort(), 12000);
      const r = await fetch(`${hote}/api/v1/playlists/${encodeURIComponent(l.list)}?page=${page}`, { signal: c.signal });
      clearTimeout(m);
      if (!r.ok) continue;
      const j = await r.json();
      const videos = (j.videos || []).filter(v => v && /^[\w-]{11}$/.test(v.videoId)).sort((a, b) => a.index - b.index);
      if (!videos.length) continue;
      const avant = l.ids.length;
      videos.forEach(v => {
        if (l.ids.includes(v.videoId)) return;
        l.ids.push(v.videoId);
        // on a déjà le titre et la chaîne : la fiche s'affiche tout de suite
        if (!l.infos[v.videoId]) l.infos[v.videoId] = Object.assign(analyser({ title: v.title, author: v.author }), { brut: v.title, chaine: v.author || '' });
      });
      if (j.videoCount) l.total = j.videoCount;
      if (j.videoCount && l.ids.length >= j.videoCount) l.complet = true;
      return l.ids.length - avant;
    } catch (e) {}
  }
  return 0;
}
// en ordre aléatoire, on charge toute la playlist en fond : le hasard porte sur l'ensemble, pas sur les 200 premiers
let chargementFond = false;
async function chargerTout() {
  const l = L();
  if (chargementFond || !l || !l.list || l.complet || l.ids.length < 199 || !$('#opt-hasard').checked) return;
  chargementFond = true;
  try {
    for (let k = 0; k < 40 && !l.complet; k++) { if (!(await suiteParMiroir(l))) break; sauver(); }
    if (courant) { afficherFiche(); majCompteurs(); }
  } finally { chargementFond = false; }
}
// le lecteur YouTube ne donne que 200 morceaux à la fois : on lui redemande la suite à partir du dernier
async function chargerSuite() {
  const l = L();
  if (!l.list || l.complet) return false;
  let ajoutes = 0;
  if (l.ids.length < 199) {
    const nouveaux = await cuePlaylist(l.list, 0);
    if (nouveaux) ajoutes = fusionner(l, nouveaux);
  } else {
    // le lecteur YouTube s'arrête net à 200 : on demande la suite à Invidious, un miroir public de YouTube
    $('#position').textContent = 'Je charge la suite de la playlist…';
    ajoutes = await suiteParMiroir(l);
  }
  // pile 200 et rien de plus : YouTube bloque sans doute. On ne déclare pas la playlist finie, on explique quoi faire
  l.bloquee = !ajoutes && l.ids.length >= 199 && !l.complet;
  if (!ajoutes && !l.bloquee) l.complet = true;
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
// pendant le tri, le formulaire de chargement se replie : le morceau reste en haut de l'écran
function replierCharger(oui) { $('#charger').hidden = oui; $('#ouvrir-charger').hidden = false; document.body.classList.toggle('en-tri', oui); }
$('#ouvrir-charger').addEventListener('click', () => { const h = $('#charger').hidden; $('#charger').hidden = !h; if (h) { rendreListes(); $('#charger').scrollIntoView({ behavior: 'smooth' }); } });
function ouvrirTable() {
  replierCharger(true);
  $('#table').hidden = false;
  $('#bilan').hidden = true;
  $('#compteurs').hidden = false;
  rendreListes();
  suivant();
  chargerTout();
}

/* ─────────── le tri ─────────── */
function prochain() {
  const l = L();
  const vus = T.active === SITE ? {} : dejaTries();
  const restants = [];
  for (const id of l.ids) {
    if (l.decisions[id]) continue;
    if (T.active !== SITE) {
      if (DEJA.has(id)) { l.decisions[id] = 'deja'; continue; }
      if (vus[id]) { l.decisions[id] = 'vu'; continue; }
    }
    restants.push(id);
  }
  if (!restants.length) return null;
  // ordre aléatoire : pour ne pas juger un morceau selon ceux qui l'entourent dans la playlist
  return $('#opt-hasard').checked ? restants[Math.floor(Math.random() * restants.length)] : restants[0];
}
const debut = () => $('#opt-intro').checked ? 40 : 0;
async function suivant() {
  let id = prochain();
  if (!id && await chargerSuite()) id = prochain();
  sauver();
  if (!id) return terminer();
  $('#fin').hidden = true;
  $('#bilan').hidden = true;
  $('#table').hidden = false;
  saut = false;
  ouvrirMorceau(id);
}
function ouvrirMorceau(id) {
  courant = id;
  debutFiche = Date.now();
  lecteur.loadVideoById({ videoId: id, startSeconds: debut() });
  afficherFiche(true);
  majCompteurs();
}
// aller voir un morceau précis (frise, revue, bilan) : on peut changer d'avis
function aller(id) {
  if (!L() || !L().ids.includes(id)) return;
  fermerRevue();
  replierCharger(true);
  $('#fin').hidden = true; $('#bilan').hidden = true; $('#table').hidden = false;
  $('#compteurs').hidden = false;
  saut = true;
  ouvrirMorceau(id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
const infosDe = id => { for (const l of [L(), ...Object.values(T.listes)]) if (l && l.infos && l.infos[id]) return l.infos[id]; return {}; };
const nomDe = id => { const i = infosDe(id); return { titre: i.titre || i.brut || id, artiste: i.artiste || '' }; };

function afficherFiche(nouveau) {
  const l = L();
  const i = (l.infos[courant] || {});
  const total = l.ids.length;
  const jugesN = l.ids.filter(x => JUGE(l.decisions[x])).length;
  const rang = saut ? l.ids.indexOf(courant) + 1 : Math.min(l.ids.filter(x => l.decisions[x]).length + 1, total);
  $('#position').textContent = `${rang} sur ${total}${l.complet ? '' : '+'}`;
  const actuel = l.decisions[courant];
  $('#choix-actuel').hidden = !JUGE(actuel);
  $('#choix-actuel').textContent = actuel === 'oui' ? 'Ton choix : oui' : actuel === 'non' ? 'Ton choix : non' : 'À revoir';
  $('#titre').textContent = i.titre || 'Chargement du titre…';
  $('#artiste').textContent = i.artiste || '';
  const st = statutChaine(i.chaine, i.artiste);
  $('#chaine').hidden = !st;
  if (st) { $('#chaine').textContent = st.texte; $('#chaine').className = 'chaine ' + (st.ok ? 'ok' : 'doute'); }
  $('#deja').hidden = !DEJA.has(courant);
  $('#refus').hidden = !i.refus;
  $('#lien-yt').href = `https://www.youtube.com/watch?v=${courant}`;
  if (nouveau) {
    const c = $('#carte'); c.classList.remove('entre'); void c.offsetWidth; c.classList.add('entre');
    majMot();
  }
  majManche(jugesN);
  rendreFrise();
}
// les n derniers morceaux jugés, du plus ancien au plus récent
function dernierJuges(l, n) {
  const ids = (l.historique || []).map(h => typeof h === 'string' ? h : h.id);
  return ids.filter((id, k) => JUGE(l.decisions[id]) && ids.lastIndexOf(id) === k).slice(-n);
}
// la manche : dix jugements, puis un bilan
function majManche(juges) {
  const l = L();
  const dans = juges % TAILLE_MANCHE;
  const derniers = dernierJuges(l, dans);
  const segs = [];
  for (let k = 0; k < TAILLE_MANCHE; k++) {
    const id = dans ? derniers[k] : null;
    segs.push(`<i class="${k < dans && id ? l.decisions[id] : k === dans ? 'ici' : ''}"></i>`);
  }
  $('#manche').innerHTML = segs.join('');
}

/* ─────────── commentaire, coup de cœur, ressenti ─────────── */
let saveNote = null;
function majMot() {
  const n = $('#note');
  n.value = T.notes[courant] !== undefined ? T.notes[courant] : (T.active === SITE ? (NOTE_SITE[courant] || '') : '');
  ajusterNote();
  majCoeur();
  const r = T.ressentis[courant];
  document.querySelectorAll('#ressenti input[data-r]').forEach(inp => {
    inp.value = r ? r[inp.dataset.r] : 5;
    inp.classList.toggle('regle', !!r);
    inp.nextElementSibling.textContent = r ? r[inp.dataset.r] : '·';
  });
}
function ajusterNote() { const n = $('#note'); n.style.height = 'auto'; n.style.height = Math.min(220, Math.max(64, n.scrollHeight + 2)) + 'px'; }
function majCoeur() {
  const on = !!T.coeurs[courant];
  $('#coeur').setAttribute('aria-pressed', on);
  $('#coeur').textContent = (on ? '★' : '☆') + ' Coup de cœur';
  $('#v-coeur').setAttribute('aria-pressed', on);
  $('#v-coeur').textContent = on ? '★' : '☆';
}
$('#note').addEventListener('input', () => {
  if (!courant) return;
  const v = $('#note').value;
  T.notes[courant] = v;                    // vide aussi : on garde « j'ai effacé » face au texte du site
  if (!v.trim() && !(T.active === SITE && NOTE_SITE[courant])) delete T.notes[courant];
  ajusterNote();
  clearTimeout(saveNote); saveNote = setTimeout(() => { sauver(); rendreFrise(); }, 350);
});
// pendant qu'on écrit, les gros boutons ne masquent plus le champ (clavier du téléphone)
$('#note').addEventListener('focus', () => document.body.classList.add('ecrit'));
$('#note').addEventListener('blur', () => document.body.classList.remove('ecrit'));
$('#note').addEventListener('keydown', e => { if (e.key === 'Escape') $('#note').blur(); });
$('#coeur').addEventListener('click', basculerCoeur);
$('#v-coeur').addEventListener('click', basculerCoeur);
function basculerCoeur() {
  if (!courant) return;
  if (T.coeurs[courant]) delete T.coeurs[courant]; else { T.coeurs[courant] = true; vibre(8); }
  sauver(); majCoeur(); rendreFrise();
}
document.querySelectorAll('#ressenti input[data-r]').forEach(inp => inp.addEventListener('input', () => {
  if (!courant) return;
  const r = T.ressentis[courant] = T.ressentis[courant] || { energie: 5, etrange: 5, danse: 5 };
  r[inp.dataset.r] = +inp.value;
  inp.classList.add('regle'); inp.nextElementSibling.textContent = inp.value;
  clearTimeout(saveNote); saveNote = setTimeout(sauver, 350);
}));
$('#ressenti-effacer').addEventListener('click', () => { if (!courant) return; delete T.ressentis[courant]; sauver(); majMot(); });

/* ─────────── les chiffres du jour ─────────── */
const jourCle = (d = new Date()) => d.toLocaleDateString('sv-SE');
function serie() {
  let n = 0; const d = new Date();
  if (!T.jours[jourCle(d)]) d.setDate(d.getDate() - 1);
  while (T.jours[jourCle(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function majObjectif() {
  const n = T.jours[jourCle()] || 0, o = T.objectif;
  $('#objectif').style.setProperty('--p', Math.min(100, Math.round(n / o * 100)) + '%');
  const sr = serie();
  $('#objectif-texte').textContent = n >= o ? `Objectif atteint, ${n} aujourd'hui` : `Aujourd'hui ${n} sur ${o}`;
  $('#objectif').title = (sr > 1 ? `${sr} jours d'affilée. ` : '') + 'Touche pour changer l\'objectif du jour';
}
$('#objectif').addEventListener('click', () => {
  const choix = [10, 20, 30, 50, 100];
  T.objectif = choix[(choix.indexOf(T.objectif) + 1) % choix.length] || 30;
  sauver(); majObjectif(); toast(`Objectif du jour : ${T.objectif} morceaux.`);
});
function compterJour() {
  const k = jourCle(), avant = T.jours[k] || 0;
  T.jours[k] = avant + 1;
  if (avant + 1 === T.objectif) toast(`Objectif du jour atteint : ${T.objectif} morceaux. Tu peux continuer ou t'arrêter là.`);
  majObjectif();
}
function majCompteurs() {
  const l = L();
  const v = Object.values(l.decisions);
  $('#fin-titre').textContent = l.bloquee ? `Les ${l.ids.length} premiers sont triés.` : 'Playlist triée.';
  $('#fin-bloque').hidden = !l.bloquee;
  $('#n-oui').textContent = v.filter(x => x === 'oui').length;
  $('#n-non').textContent = v.filter(x => x === 'non').length;
  $('#n-deja').textContent = v.filter(x => x === 'deja' || x === 'vu').length;
  $('#n-reste').textContent = l.ids.filter(x => !l.decisions[x]).length + (l.complet ? '' : '+');
  majObjectif();
  rendreExport();
}

/* ─────────── la frise ─────────── */
function rendreFrise() {
  const l = L();
  if (!l) return;
  const f = $('#frise');
  f.classList.toggle('dense', l.ids.length > 400);
  f.innerHTML = l.ids.map(id => {
    const d = l.decisions[id];
    const c = (d === 'deja' || d === 'vu') ? 'vu' : (d || '');
    return `<i data-id="${id}" class="${c}${T.coeurs[id] ? ' coeur-c' : ''}${id === courant ? ' ici' : ''}"></i>`;
  }).join('');
  const v = Object.values(l.decisions);
  $('#frise-legende').textContent = `${v.filter(x => x === 'oui').length} oui, ${v.filter(x => x === 'non').length} non, ${v.filter(x => x === 'passe').length} à revoir`;
  const ici = f.querySelector('.ici');
  if (ici && f.scrollHeight > f.clientHeight) { const t = ici.offsetTop - f.offsetTop - f.clientHeight / 2; f.scrollTop = Math.max(0, t); }
}
$('#frise').addEventListener('click', e => { const c = e.target.closest('[data-id]'); if (c) aller(c.dataset.id); });

/* ─────────── décider ─────────── */
function decider(v) {
  if (!courant) return;
  const l = L();
  const prev = l.decisions[courant];
  l.decisions[courant] = v;
  l.historique.push({ id: courant, prev });
  // le temps passé sur un morceau (au-delà de 3 minutes, on suppose une pause)
  if (!prev && JUGE(v)) {
    const ms = Date.now() - debutFiche;
    if (ms > 800 && ms < 180000) { T.duree.ms += ms; T.duree.n++; }
    compterJour();
  }
  const etaitSaut = saut;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  sauver();
  if (v === 'oui' || v === 'non') {
    vibre(v === 'oui' ? 12 : 6);
    const f = $('#flash');
    f.className = 'verdict-flash ' + v; f.textContent = v === 'oui' ? 'Oui' : 'Non';
    setTimeout(() => { f.className = 'verdict-flash'; }, 350);
  }
  const juges = l.ids.filter(x => JUGE(l.decisions[x])).length;
  if (!etaitSaut && !prev && $('#opt-bilan').checked && JUGE(v) && juges > 0 && juges % TAILLE_MANCHE === 0) return montrerBilan(juges);
  suivant();
}
function annuler() {
  const l = L();
  const h = l.historique.pop();
  if (!h) return toast('Rien à annuler.');
  const id = typeof h === 'string' ? h : h.id;
  const prev = typeof h === 'string' ? undefined : h.prev;
  if (prev) l.decisions[id] = prev; else delete l.decisions[id];
  if (T.jours[jourCle()] > 0 && !prev) T.jours[jourCle()]--;
  sauver();
  $('#bilan').hidden = true; $('#fin').hidden = true; $('#table').hidden = false;
  saut = false;
  ouvrirMorceau(id);
  toast('Choix annulé.');
}
function terminer() {
  replierCharger(false);
  courant = null;
  try { lecteur.stopVideo(); } catch (e) {}
  $('#table').hidden = true;
  $('#bilan').hidden = true;
  $('#fin').hidden = false;
  const l = L();
  const v = Object.values(l.decisions);
  const passes = v.filter(x => x === 'passe').length;
  const vus = v.filter(x => x === 'deja' || x === 'vu').length;
  const coeurs = l.ids.filter(id => T.coeurs[id] && l.decisions[id] === 'oui').length;
  const notes = l.ids.filter(id => (T.notes[id] || '').trim() && l.decisions[id] === 'oui').length;
  $('#fin-texte').textContent = `${v.filter(x => x === 'oui').length} oui, ${v.filter(x => x === 'non').length} non` +
    (vus ? `, ${vus} déjà vus (sautés)` : '') + (passes ? `, ${passes} à revoir` : '') +
    (coeurs ? `, ${coeurs} coup${coeurs > 1 ? 's' : ''} de cœur` : '') + (notes ? `, ${notes} commentaire${notes > 1 ? 's' : ''}` : '') + '.';
  majCompteurs();
}

/* ─────────── le bilan d'une manche ─────────── */
function dureeTexte(ms) {
  const m = Math.round(ms / 60000);
  if (m < 1) return 'moins d\'une minute';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return `${h} h${r ? String(r).padStart(2, '0') : ''}`;
}
function resteTexte() {
  const l = L(); if (!l || T.duree.n < 5) return '';
  const reste = l.ids.filter(x => !l.decisions[x]).length;
  if (!reste) return '';
  const ms = reste * (T.duree.ms / T.duree.n);
  return `À ce rythme, il reste environ ${dureeTexte(ms)} pour finir cette playlist${l.complet ? '' : ' (au moins)'}.`;
}
function montrerBilan(juges) {
  const l = L();
  try { lecteur.pauseVideo(); } catch (e) {}
  courant = null;
  const ids = dernierJuges(l, TAILLE_MANCHE);
  const n = k => ids.filter(id => l.decisions[id] === k).length;
  const manche = Math.floor(juges / TAILLE_MANCHE);
  $('#bilan-titre').textContent = `Manche ${manche} terminée`;
  const coeurs = ids.filter(id => T.coeurs[id]).length;
  $('#bilan-texte').textContent = `${n('oui')} oui, ${n('non')} non` + (n('passe') ? `, ${n('passe')} à revoir` : '') + (coeurs ? `, ${coeurs} coup${coeurs > 1 ? 's' : ''} de cœur` : '') + '. ' + resteTexte();
  $('#bilan-liste').innerHTML = ids.map(id => {
    const d = l.decisions[id], m = nomDe(id), note = (T.notes[id] || '').trim();
    return `<li data-id="${id}" tabindex="0"><span class="pastille ${d}">${d === 'oui' ? '✓' : d === 'non' ? '×' : '?'}</span><span><b>${esc(m.titre)}</b>${T.coeurs[id] ? ' ★' : ''}<small>${esc(m.artiste)}</small>${note ? `<q>${esc(note)}</q>` : ''}</span></li>`;
  }).join('');
  $('#table').hidden = true; $('#bilan').hidden = false;
  $('#bilan-suite').focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
  majCompteurs();
}
$('#bilan-suite').addEventListener('click', () => { $('#bilan').hidden = true; suivant(); });
$('#bilan-revue').addEventListener('click', ouvrirRevue);
$('#bilan-liste').addEventListener('click', e => { const li = e.target.closest('[data-id]'); if (li) aller(li.dataset.id); });
$('#bilan-liste').addEventListener('keydown', e => { if (e.key === 'Enter') { const li = e.target.closest('[data-id]'); if (li) aller(li.dataset.id); } });

/* ─────────── export ─────────── */
const marque = m => (m.refus ? ' | lecture intégrée refusée' : '') + (m.officiel === false ? ` | chaîne non officielle ? (${m.chaine})` : '');
const aplati = t => String(t || '').replace(/\s+/g, ' ').trim();
const apports = id => {
  const p = [];
  if (T.coeurs[id]) p.push('★ coup de cœur');
  const r = T.ressentis[id];
  if (r) p.push(`énergie ${r.energie}, étrange ${r.etrange}, danse ${r.danse}`);
  const n = aplati(T.notes[id]);
  if (n) p.push(`note : « ${n} »`);
  return p.length ? ' | ' + p.join(' | ') : '';
};
function lesOui() {
  const l = L();
  return l.ids.filter(id => l.decisions[id] === 'oui').map(id => ({ id, ...(l.infos[id] || {}) }));
}
function lesNon() {
  const l = L();
  return l.ids.filter(id => l.decisions[id] === 'non').map(id => ({ id, ...(l.infos[id] || {}) }));
}
// sur la liste du site : ce que tu as changé au texte, ou ajouté (coup de cœur, ressenti)
function changementsSite() {
  const l = L();
  return l.ids.filter(id => l.decisions[id] !== 'non').filter(id => {
    const n = T.notes[id] !== undefined ? aplati(T.notes[id]) : aplati(NOTE_SITE[id]);
    return n !== aplati(NOTE_SITE[id]) || T.coeurs[id] || T.ressentis[id];
  }).map(id => ({ id, ...(l.infos[id] || {}) }));
}
function texteExport() {
  if (T.active === SITE) {
    const non = lesNon();
    const doutes = lesOui().filter(m => m.officiel === false);
    const chg = changementsSite();
    return `Morceaux du site à RETIRER (${non.length}) :\n` +
      non.map(m => `${m.artiste || '?'} | ${m.titre || '?'} | https://music.youtube.com/watch?v=${m.id}`).join('\n') +
      (chg.length ? `\n\nMorceaux gardés dont le texte ou les réglages changent (${chg.length}) :\n` +
        chg.map(m => `${m.artiste || '?'} | ${m.titre || '?'} | https://music.youtube.com/watch?v=${m.id}${apports(m.id)}`).join('\n') : '') +
      (doutes.length ? `\n\nGardés, mais chaîne peut-être pas officielle (${doutes.length}) :\n` +
        doutes.map(m => `${m.artiste || '?'} | ${m.titre || '?'} | https://music.youtube.com/watch?v=${m.id}${marque(m)}`).join('\n') : '');
  }
  const oui = lesOui();
  return `Morceaux validés sur la table de tri (${oui.length}) :\n` + oui.map(m =>
    `${m.artiste || '?'} | ${m.titre || m.brut || '?'} | https://music.youtube.com/watch?v=${m.id}${apports(m.id)}${marque(m)}`).join('\n');
}
// les blocs prêts à coller dans data.js, avant le ]; final
const q = x => JSON.stringify(String(x || ''));
function codeExport() {
  const liste = T.active === SITE ? changementsSite() : lesOui();
  return liste.map(m => {
    const p = [`titre: ${q(m.titre || m.brut)}`, `artiste: ${q(m.artiste)}`, `lien: ${q('https://music.youtube.com/watch?v=' + m.id)}`, `note: ${q(aplati(T.notes[m.id] !== undefined ? T.notes[m.id] : ''))}`];
    if (T.coeurs[m.id]) p.push('coeur: true');
    const r = T.ressentis[m.id];
    if (r) p.push(`energie: ${r.energie}`, `etrange: ${r.etrange}`, `danse: ${r.danse}`);
    return '  { ' + p.join(', ') + ' },';
  }).join('\n\n');
}
function rendreExport() {
  const site = T.active === SITE;
  const liste = site ? lesNon() : lesOui();
  const chg = site ? changementsSite() : [];
  $('#export').hidden = !(liste.length || chg.length);
  $('#export-titre').textContent = site ? 'Les changements pour le site' : 'Tes oui, prêts à entrer sur le site';
  $('#export-aide').textContent = site
    ? 'Clique sur « Copier pour Claude », puis colle le texte dans la conversation : Claude retire les morceaux en rouge et reporte tes commentaires.'
    : 'Clique sur « Copier pour Claude », puis colle le texte dans la conversation : Claude les ajoute au site avec tes commentaires et règle leur énergie, leur étrangeté et leur côté dansant. « Format data.js » donne les blocs prêts à coller dans le fichier.';
  $('#copier-code').hidden = site ? !chg.length : false;
  $('#liste-oui').innerHTML = (site ? lesNon() : liste).map(m => `<li>${esc(m.artiste || '?')}, ${esc(m.titre || m.brut || m.id)}${T.coeurs[m.id] ? ' ★' : ''}${m.officiel === false ? ' <span class="petit">(chaîne à vérifier)</span>' : ''}${aplati(T.notes[m.id]) ? ` <span class="petit">« ${esc(aplati(T.notes[m.id]))} »</span>` : ''}</li>`).join('');
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

/* ─────────── la revue : tout ce qui est jugé, modifiable ─────────── */
let filtre = 'tous', revueMax = 60;
const FILTRES = [['tous', 'Tout'], ['oui', 'Oui'], ['non', 'Non'], ['passe', 'À revoir'], ['coeur', '★'], ['note', 'Avec un mot']];
function ordreRevue() {
  const l = L();
  const vus = new Set(), ordre = [];
  for (let k = (l.historique || []).length - 1; k >= 0; k--) {
    const h = l.historique[k], id = typeof h === 'string' ? h : h.id;
    if (!vus.has(id) && JUGE(l.decisions[id])) { vus.add(id); ordre.push(id); }
  }
  l.ids.forEach(id => { if (!vus.has(id) && JUGE(l.decisions[id])) ordre.push(id); });
  return ordre;
}
function statsRevue() {
  const l = L();
  const v = l.ids.map(id => l.decisions[id]);
  const oui = v.filter(x => x === 'oui').length, non = v.filter(x => x === 'non').length;
  const juges = oui + non;
  const parArtiste = {};
  l.ids.filter(id => l.decisions[id] === 'oui').forEach(id => { const a = nomDe(id).artiste.split(/\s+(?:feat\.?|ft\.?|&|x)\s+|,/i)[0].trim(); if (a) parArtiste[a] = (parArtiste[a] || 0) + 1; });
  const top = Object.entries(parArtiste).sort((a, b) => b[1] - a[1]).filter(x => x[1] > 1).slice(0, 3).map(x => `${x[0]} (${x[1]})`).join(', ');
  const nNotes = l.ids.filter(id => l.decisions[id] === 'oui' && aplati(T.notes[id])).length;
  const nCoeurs = l.ids.filter(id => l.decisions[id] === 'oui' && T.coeurs[id]).length;
  const cases = [
    [`${oui}`, 'oui'], [`${non}`, 'non'],
    [juges ? `${Math.round(oui / juges * 100)} %` : '·', 'de oui'],
    [`${nCoeurs}`, nCoeurs > 1 ? 'coups de cœur' : 'coup de cœur'],
    [`${nNotes}`, nNotes > 1 ? 'commentaires' : 'commentaire'],
  ];
  if (serie() > 1) cases.push([`${serie()} j`, 'd\'affilée']);
  if (T.duree.n >= 5) cases.push([`${Math.round(T.duree.ms / T.duree.n / 1000)} s`, 'par morceau']);
  let html = cases.map(c => `<div class="stat"><b>${c[0]}</b><span>${c[1]}</span></div>`).join('');
  const reste = resteTexte();
  if (top) html += `<div class="stat" style="grid-column:1/-1"><span>Tes artistes les plus gardés</span><b style="font-size:1rem">${esc(top)}</b></div>`;
  if (reste) html += `<div class="stat" style="grid-column:1/-1"><span>${esc(reste)}</span></div>`;
  return html;
}
function rendreRevue(garder) {
  const l = L();
  const cible = $('#revue');
  const haut = garder ? $('.panneau').scrollTop : 0;
  if (!l) { cible.innerHTML = '<li class="vide">Charge une playlist pour commencer.</li>'; $('#stats').innerHTML = ''; $('#filtres').innerHTML = ''; $('#plus-revue').hidden = true; return; }
  $('#stats').innerHTML = statsRevue();
  $('#filtres').innerHTML = FILTRES.map(([k, nom]) => `<button class="filtre" data-f="${k}" aria-pressed="${filtre === k}">${nom}</button>`).join('');
  let ids = ordreRevue();
  if (filtre === 'oui' || filtre === 'non' || filtre === 'passe') ids = ids.filter(id => l.decisions[id] === filtre);
  if (filtre === 'coeur') ids = ids.filter(id => T.coeurs[id]);
  if (filtre === 'note') ids = ids.filter(id => aplati(T.notes[id]));
  const montres = ids.slice(0, revueMax);
  $('#plus-revue').hidden = ids.length <= revueMax;
  cible.innerHTML = montres.length ? montres.map(id => {
    const m = nomDe(id), d = l.decisions[id];
    const note = T.notes[id] !== undefined ? T.notes[id] : (T.active === SITE ? NOTE_SITE[id] || '' : '');
    return `<li data-id="${id}">
      <div class="r-nom"><b>${esc(m.titre)}</b><span>${esc(m.artiste)}</span></div>
      <div class="r-actions">
        <button class="b-non" data-v="non" aria-pressed="${d === 'non'}">Non</button>
        <button class="b-passe" data-v="passe" aria-pressed="${d === 'passe'}">À revoir</button>
        <button class="b-oui" data-v="oui" aria-pressed="${d === 'oui'}">Oui</button>
        <button class="b-coeur" data-coeur aria-pressed="${!!T.coeurs[id]}">★</button>
        <button data-aller>Réécouter</button>
      </div>
      <textarea data-note rows="1" aria-label="Commentaire sur ${esc(m.titre)}" placeholder="Ton commentaire (facultatif)">${esc(note)}</textarea>
    </li>`;
  }).join('') : '<li class="vide">Rien ici pour l\'instant.</li>';
  if (garder) $('.panneau').scrollTop = haut;
}
let ouvrirAvant = null;
function ouvrirRevue() {
  ouvrirAvant = document.activeElement;
  revueMax = 60;
  $('#voile').hidden = false;
  rendreRevue();
  $('#fermer-revue').focus({ preventScroll: true });
}
function fermerRevue() {
  if ($('#voile').hidden) return;
  $('#voile').hidden = true;
  sauver();
  if (L() && courant) majMot();
  if (L()) { majCompteurs(); rendreFrise(); }
  if (ouvrirAvant && ouvrirAvant.focus) try { ouvrirAvant.focus({ preventScroll: true }); } catch (e) {}
}
$('#ouvrir-revue').addEventListener('click', ouvrirRevue);
$('#fermer-revue').addEventListener('click', fermerRevue);
$('#voile').addEventListener('click', e => { if (e.target === $('#voile')) fermerRevue(); });
$('#plus-revue').addEventListener('click', () => { revueMax += 60; rendreRevue(true); });
$('#filtres').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; filtre = b.dataset.f; revueMax = 60; rendreRevue(); });
$('#revue').addEventListener('click', e => {
  const li = e.target.closest('[data-id]'); if (!li) return;
  const id = li.dataset.id, l = L();
  if (e.target.closest('[data-aller]')) return aller(id);
  if (e.target.closest('[data-coeur]')) { if (T.coeurs[id]) delete T.coeurs[id]; else T.coeurs[id] = true; sauver(); return rendreRevue(true); }
  const b = e.target.closest('[data-v]');
  if (b) { l.decisions[id] = b.dataset.v; sauver(); rendreRevue(true); }
});
$('#revue').addEventListener('input', e => {
  const t = e.target.closest('[data-note]'); if (!t) return;
  const id = t.closest('[data-id]').dataset.id;
  T.notes[id] = t.value;
  if (!t.value.trim() && !(T.active === SITE && NOTE_SITE[id])) delete T.notes[id];
  clearTimeout(saveNote); saveNote = setTimeout(sauver, 350);
});

/* ─────────── sauvegarde et restauration ─────────── */
function telecharger(nom, texte, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texte], { type: type || 'text/plain' }));
  a.download = nom;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$('#sauvegarder').addEventListener('click', () => {
  telecharger(`music-discovery-tri-${jourCle()}.json`, JSON.stringify(T), 'application/json');
  toast('Sauvegarde téléchargée.');
});
const ouvrirFichier = () => $('#fichier-sauvegarde').click();
$('#restaurer-1').addEventListener('click', ouvrirFichier);
$('#restaurer-2').addEventListener('click', ouvrirFichier);
$('#fichier-sauvegarde').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  try {
    const J = JSON.parse(await f.text());
    if (!J || typeof J !== 'object' || !J.listes) throw new Error('format');
    let nouveaux = 0;
    // on fusionne : rien de ce qui est déjà ici n'est écrasé, sauf les listes absentes
    for (const [k, lj] of Object.entries(J.listes)) {
      const ici = T.listes[k];
      if (!ici) { T.listes[k] = lj; nouveaux += Object.keys(lj.decisions || {}).length; continue; }
      (lj.ids || []).forEach(id => { if (!ici.ids.includes(id)) ici.ids.push(id); });
      for (const [id, d] of Object.entries(lj.decisions || {})) if (!ici.decisions[id]) { ici.decisions[id] = d; nouveaux++; }
      for (const [id, inf] of Object.entries(lj.infos || {})) if (!ici.infos[id]) ici.infos[id] = inf;
      ici.historique = (ici.historique || []).concat((lj.historique || []).filter(h => !ici.historique.some(x => (x.id || x) === (h.id || h))));
    }
    for (const cle of ['notes', 'coeurs', 'ressentis']) for (const [id, v] of Object.entries(J[cle] || {})) if (T[cle][id] === undefined) T[cle][id] = v;
    for (const [j, n] of Object.entries(J.jours || {})) T.jours[j] = Math.max(T.jours[j] || 0, n);
    T.active = T.active && T.listes[T.active] ? T.active : (J.active && T.listes[J.active] ? J.active : null);
    sauver(); rendreListes(); majObjectif();
    if (!$('#voile').hidden) rendreRevue();
    toast(nouveaux ? `Sauvegarde restaurée : ${nouveaux} choix récupérés.` : 'Sauvegarde lue : rien de nouveau à ajouter.');
  } catch (err) { toast('Ce fichier n\'est pas une sauvegarde de la table de tri.'); }
});

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
  toast('Vert = il reste, rouge = il sort du site. Tu peux aussi retoucher les commentaires.');
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
$('#copier-code').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(codeExport()); toast('Copié. À coller dans data.js, avant le ]; final.'); }
  catch (e) { toast('Copie impossible : utilise « Télécharger la liste ».'); }
});
$('#telecharger').addEventListener('click', () => {
  telecharger(T.active === SITE ? 'music-discovery-a-retirer.txt' : 'music-discovery-oui.txt', texteExport() + (T.active === SITE ? '' : '\n\n--- format data.js ---\n' + codeExport()));
});
$('#revoir-passes').addEventListener('click', () => {
  const l = L();
  Object.keys(l.decisions).forEach(id => { if (l.decisions[id] === 'passe') delete l.decisions[id]; });
  sauver(); ouvrirTable();
});
$('#opt-bilan').checked = (() => { try { return localStorage.getItem('md-tri-bilan') !== '0'; } catch (e) { return true; } })();
$('#opt-bilan').addEventListener('change', () => { try { localStorage.setItem('md-tri-bilan', $('#opt-bilan').checked ? '1' : '0'); } catch (e) {} });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#voile').hidden) return fermerRevue();
  if (e.target.matches('textarea, input, summary')) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (!$('#voile').hidden) return;
  const k = e.key;
  if (!$('#bilan').hidden) { if (k === 'Enter' && e.target.tagName !== 'LI') { e.preventDefault(); $('#bilan-suite').click(); } return; }
  if ($('#table').hidden) return;
  if (k === 'ArrowRight' || k === 'o' || k === 'O') { e.preventDefault(); decider('oui'); }
  else if (k === 'ArrowLeft' || k === 'n' || k === 'N') { e.preventDefault(); decider('non'); }
  else if (k === 'ArrowDown') { e.preventDefault(); decider('passe'); }
  else if (k === 'ArrowUp') { e.preventDefault(); $('#t-avance').click(); }
  else if (k === 'c' || k === 'C') { e.preventDefault(); basculerCoeur(); }
  else if (k === ' ') { e.preventDefault(); $('#t-lecture').click(); }
  else if (k === 'z' || k === 'Z' || k === 'Backspace') { e.preventDefault(); annuler(); }
});

/* ─────────── la carte se fait glisser : à droite = oui, à gauche = non ─────────── */
const carte = $('#carte');
let glisse = null;
const SEUIL = 110;
function reposCarte() { carte.style.transform = ''; carte.style.setProperty('--g', 0); }
carte.addEventListener('pointerdown', e => {
  if ((e.pointerType === 'mouse' && e.button !== 0) || $('#table').hidden || !courant) return;
  if (e.target.closest('a, button')) return;
  glisse = { x: e.clientX, y: e.clientY, id: e.pointerId, dx: 0, actif: false };
});
carte.addEventListener('pointermove', e => {
  if (!glisse || e.pointerId !== glisse.id) return;
  const dx = e.clientX - glisse.x, dy = e.clientY - glisse.y;
  if (!glisse.actif) {
    if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { glisse = null; return; }
    if (Math.abs(dx) < 10) return;
    glisse.actif = true;
    try { carte.setPointerCapture(e.pointerId); } catch (err) {}
    carte.classList.remove('retour', 'envol', 'entre'); carte.classList.add('glisse');
  }
  glisse.dx = dx;
  carte.style.transform = `translateX(${dx}px) rotate(${dx / 28}deg)`;
  carte.style.setProperty('--g', Math.max(-1, Math.min(1, dx / SEUIL)).toFixed(2));
});
const finGlisse = e => {
  if (!glisse || e.pointerId !== glisse.id) return;
  const g = glisse; glisse = null;
  carte.classList.remove('glisse');
  if (!g.actif) return;
  if (e.type !== 'pointercancel' && Math.abs(g.dx) > SEUIL) {
    const v = g.dx > 0 ? 'oui' : 'non';
    carte.classList.add('envol');
    carte.style.transform = `translateX(${g.dx > 0 ? 130 : -130}%) rotate(${g.dx > 0 ? 12 : -12}deg)`;
    setTimeout(() => { carte.classList.remove('envol'); reposCarte(); decider(v); }, 190);
  } else {
    carte.classList.add('retour'); reposCarte();
    setTimeout(() => carte.classList.remove('retour'), 260);
  }
};
carte.addEventListener('pointerup', finGlisse);
carte.addEventListener('pointercancel', finGlisse);

// rien ne se perd si on ferme l'onglet en plein commentaire
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(saveNote); sauver(); } });
window.addEventListener('pagehide', () => { clearTimeout(saveNote); sauver(); });

// sur iPhone, Safari bloque les cookies YouTube dans les vidéos intégrées : Premium n'y est pas reconnu
if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) $('#avis-ios').hidden = false;
// l'option « ordre aléatoire » est retenue
try { $('#opt-hasard').checked = localStorage.getItem('md-tri-hasard') === '1'; } catch (e) {}
$('#opt-hasard').addEventListener('change', () => { try { localStorage.setItem('md-tri-hasard', $('#opt-hasard').checked ? '1' : '0'); } catch (e) {} chargerTout(); });
// une playlist marquée « finie » à 200 morceaux (avant le miroir) : on retente la suite à la prochaine reprise
Object.values(T.listes).forEach(l => { if (l.list && l.ids.length >= 199 && l.ids.length <= 200 && l.complet && !l.total) l.complet = false; });
// reprise : ce qui est déjà en mémoire
rendreListes();
majObjectif();
const nTries = Object.keys(dejaTries()).length;
if (nTries) $('#memoire').textContent = `${nTries} morceau${nTries > 1 ? 'x' : ''} déjà trié${nTries > 1 ? 's' : ''} en mémoire dans ce navigateur, plus les ${DEJA.size} du site : ils ne te seront plus reproposés, même dans une autre playlist.`;
if (T.active && T.listes[T.active]) $('#entree').placeholder = 'Colle une nouvelle playlist, ou la même pour la reprendre là où tu t\'es arrêté.';
})();
