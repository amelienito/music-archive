/* ════════════════════════════════════════════════════════════════════
   POCHETTES & EXTRAITS
   Va chercher tout seul, dans le navigateur du visiteur :
     • la pochette haute définition du morceau
     • un extrait de 30 secondes (pré-écoute au survol, et mode sans pub)
     • les liens directs du morceau sur Deezer et Apple Music
   Deux catalogues publics sont interrogés : Apple Music et Deezer.
   Les extraits sont promotionnels : on affiche toujours d'où ils viennent,
   avec le lien pour écouter le morceau en entier chez eux.
   Rien à remplir à la main. Tout est mis en cache dans le navigateur.
   En attendant (ou si rien n'est trouvé), on montre l'image YouTube.
   ════════════════════════════════════════════════════════════════════ */

const Pochettes = (() => {
  const CLE = 'md-pochettes-v5';
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) { cache = {}; }

  const file = [];          // recherches en attente
  let enCours = 0;
  const MAX_SIMULTANE = 3;
  const abonnes = {};       // id -> [callbacks]
  const retentes = new Set(); // morceaux dont Deezer n'a pas répondu (quota) : une nouvelle chance par visite

  function sauver() {
    try { localStorage.setItem(CLE, JSON.stringify(cache)); } catch (e) {}
  }

  function normaliser(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9぀-ヿ一-龯]+/g, ' ').trim();
  }

  function artistePrincipal(artiste) {
    return artiste.split(/\s+(?:feat\.?|ft\.?|&|et|x)\s+|,/i)[0].trim();
  }

  function miniatureYouTube(m) {
    return m.yt ? `https://i.ytimg.com/vi/${m.yt}/hqdefault.jpg` : null;
  }

  // ce qu'on peut afficher tout de suite
  function image(m) {
    const c = cache[m.id];
    if (c && c.art) return { src: c.art, yt: false };
    const yt = miniatureYouTube(m);
    return yt ? { src: yt, yt: true } : null;
  }

  function extrait(m) {
    const c = cache[m.id];
    return c && c.preview ? c.preview : null;
  }

  function jsonp(url) {
    return new Promise((resolve, reject) => {
      const nom = 'md_cb_' + Math.random().toString(36).slice(2);
      const s = document.createElement('script');
      const minuterie = setTimeout(() => { nettoyer(); reject(new Error('délai')); }, 9000);
      function nettoyer() {
        clearTimeout(minuterie);
        delete window[nom];
        s.remove();
      }
      window[nom] = (data) => { nettoyer(); resolve(data); };
      s.onerror = () => { nettoyer(); reject(new Error('réseau')); };
      s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + nom;
      document.head.appendChild(s);
    });
  }

  // est-ce que ce résultat correspond bien au morceau ? (sinon mauvaise pochette)
  function correspond(m, artisteRes, titreRes) {
    const a = normaliser(artistePrincipal(m.artiste));
    const ra = normaliser(artisteRes);
    const t = normaliser(m.titre);
    const rt = normaliser(titreRes);
    const memeArtiste = a && ra && (ra.includes(a) || a.includes(ra));
    const memeTitre = t && rt && (rt === t || rt.includes(t) || t.includes(rt));
    const motCommun = a.split(' ').some(w => w.length > 2 && ra.split(' ').includes(w));
    if (memeArtiste && memeTitre) return 3;
    if (memeArtiste) return 2;
    if (memeTitre && motCommun) return 1;
    return 0;
  }

  async function chercherApple(m) {
    const terme = encodeURIComponent(`${artistePrincipal(m.artiste)} ${m.titre}`);
    const data = await jsonp(`https://itunes.apple.com/search?term=${terme}&entity=song&limit=10&country=FR`);
    const res = ((data && data.results) || []).map(r => ({ r, s: correspond(m, r.artistName, r.trackName) })).filter(x => x.s > 0);
    res.sort((x, y) => y.s - x.s);
    const best = res[0] && res[0].r;
    if (!best) return null;
    return {
      art: best.artworkUrl100 ? best.artworkUrl100.replace(/\/\d+x\d+bb/, '/600x600bb') : null,
      preview: best.previewUrl || null,
      lien: best.trackViewUrl || null,
      album: best.collectionName || null,
      annee: best.releaseDate ? best.releaseDate.slice(0, 4) : null,
      genre: best.primaryGenreName || null,
      duree: best.trackTimeMillis ? Math.round(best.trackTimeMillis / 1000) : null,
    };
  }

  async function chercherDeezer(m) {
    const terme = encodeURIComponent(`${artistePrincipal(m.artiste)} ${m.titre}`);
    const data = await jsonp(`https://api.deezer.com/search?q=${terme}&limit=10&output=jsonp`);
    if (data && data.error) throw new Error('quota');
    const res = ((data && data.data) || []).map(r => ({ r, s: correspond(m, r.artist && r.artist.name, r.title) })).filter(x => x.s > 0);
    res.sort((x, y) => y.s - x.s);
    const best = res[0] && res[0].r;
    if (!best) return null;
    return {
      art: best.album && (best.album.cover_xl || best.album.cover_big) || null,
      preview: best.preview || null,
      lien: best.link || null,
      album: best.album && best.album.title || null,
      duree: best.duration || null,
    };
  }

  async function chercher(m) {
    let apple = null, deezer = null, dzErr = false;
    try { apple = await chercherApple(m); } catch (e) {}
    try { deezer = await chercherDeezer(m); } catch (e) { dzErr = true; }
    const pris = k => (apple && apple[k]) || (deezer && deezer[k]) || null;
    // extrait : Deezer d'abord (ses règles autorisent l'écoute des extraits), Apple Music sinon
    const source = deezer && deezer.preview ? 'deezer' : apple && apple.preview ? 'apple' : null;
    return {
      art: pris('art'),
      preview: source === 'deezer' ? deezer.preview : source === 'apple' ? apple.preview : null,
      source,
      lienDeezer: deezer && deezer.lien || null,
      lienApple: apple && apple.lien || null,
      album: pris('album'), annee: pris('annee'), genre: pris('genre'), duree: pris('duree'),
      dzErr, t: Date.now()
    };
  }

  // d'où vient l'extrait, et où écouter le morceau en entier
  const NOMS = { deezer: 'Deezer', apple: 'Apple Music' };
  function source(m) { const c = cache[m.id]; return c && c.source ? { cle: c.source, nom: NOMS[c.source], lien: c.source === 'deezer' ? c.lienDeezer : c.lienApple } : null; }
  function liens(m) { const c = cache[m.id] || {}; return { deezer: c.lienDeezer || null, apple: c.lienApple || null }; }

  // la fiche du morceau (album, année, genre, durée), quand on l'a trouvée
  function meta(m) { return cache[m.id] || null; }

  // 'inconnu' (recherche pas encore faite), 'ok' (extrait dispo) ou 'absent'
  function etat(m) {
    const c = cache[m.id];
    if (!c) return 'inconnu';
    return c.preview ? 'ok' : 'absent';
  }

  function pomper() {
    while (enCours < MAX_SIMULTANE && file.length) {
      const m = file.shift();
      enCours++;
      chercher(m)
        .then(r => { cache[m.id] = r; sauver(); })
        .catch(() => { /* on retentera à la prochaine visite */ })
        .finally(() => {
          enCours--;
          (abonnes[m.id] || []).forEach(cb => cb(m));
          delete abonnes[m.id];
          majImages(m);
          pomper();
        });
    }
  }

  // demande la pochette d'un morceau ; cb appelé quand c'est prêt
  function demander(m, cb) {
    const c = cache[m.id];
    const perime = c && !c.art && c.t && (Date.now() - c.t > 7 * 864e5);
    const aRetenter = c && c.dzErr && !retentes.has(m.id);
    if (aRetenter) retentes.add(m.id);
    if (c && !perime && !aRetenter) { if (cb) cb(m); return; }
    if (cb) (abonnes[m.id] = abonnes[m.id] || []).push(cb);
    if (!file.includes(m)) file.push(m);
    pomper();
  }

  // remplace toutes les images d'un morceau déjà affichées à l'écran
  function majImages(m) {
    const src = source(m);
    document.querySelectorAll(`[data-extrait-pour="${m.id}"]`).forEach(b => { b.dataset.etat = etat(m); if (src) b.dataset.source = src.nom; });
    // le petit lien « en entier sur … » posé à côté de chaque extrait
    document.querySelectorAll(`a[data-lien-pour="${m.id}"]`).forEach(a => {
      if (src && src.lien) { a.href = src.lien; a.textContent = `En entier sur ${src.nom}`; a.hidden = false; }
    });
    const im = image(m);
    if (im) {
      document.querySelectorAll(`img[data-pochette="${m.id}"]`).forEach(img => {
        if (img.getAttribute('src') !== im.src) { img.classList.add('se-revele'); img.src = im.src; }
        img.classList.toggle('est-yt', im.yt);
      });
    }
    document.dispatchEvent(new CustomEvent('pochette-prete', { detail: m.id }));
  }

  // HTML d'une pochette (image + repli typographique)
  function html(m, classe = '') {
    const im = image(m);
    const initiale = (m.titre.trim()[0] || '?').toUpperCase();
    const teinte = [...m.id].reduce((s, c) => s + c.charCodeAt(0), 0) % 360;
    demander(m);
    return `<div class="pochette ${classe}" style="--h:${teinte}">
      <span class="pochette-repli" aria-hidden="true">${initiale}</span>
      ${im ? `<img data-pochette="${m.id}" class="${im.yt ? 'est-yt' : ''}" src="${im.src}" alt="Pochette de ${echapper(m.titre)}, ${echapper(m.artiste)}" loading="lazy" onerror="this.remove()">` : ''}
    </div>`;
  }

  // couleur dominante d'une pochette (pour teinter l'écran du morceau)
  function couleur(m, cb) {
    const c = cache[m.id];
    if (c && c.coul) { cb(c.coul); return; }
    const im = image(m);
    if (!im) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const cv = document.createElement('canvas');
        cv.width = cv.height = 20;
        const x = cv.getContext('2d');
        // les miniatures YouTube ont des bandes noires : on ne lit que le centre
        if (im.yt) x.drawImage(img, img.width * .25, img.height * .25, img.width * .5, img.height * .5, 0, 0, 20, 20);
        else x.drawImage(img, 0, 0, 20, 20);
        const d = x.getImageData(0, 0, 20, 20).data;
        let r = 0, g = 0, b = 0, p = 0;
        for (let i = 0; i < d.length; i += 4) {
          const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
          const w = 0.15 + (mx - mn) / 255; // les pixels colorés comptent plus
          r += d[i] * w; g += d[i + 1] * w; b += d[i + 2] * w; p += w;
        }
        const coul = [Math.round(r / p), Math.round(g / p), Math.round(b / p)];
        if (!im.yt && cache[m.id]) { cache[m.id].coul = coul; sauver(); }
        cb(coul);
      } catch (e) { /* image non lisible : pas de teinte */ }
    };
    img.src = im.src;
  }

  function echapper(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  return { html, image, extrait, etat, meta, source, liens, demander, couleur, echapper, artistePrincipal, normaliser };
})();
