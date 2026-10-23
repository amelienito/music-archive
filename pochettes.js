/* ════════════════════════════════════════════════════════════════════
   POCHETTES, EXTRAITS & ALBUMS
   Va chercher tout seul, dans le navigateur du visiteur :
     • la pochette haute définition du morceau
     • un extrait de 30 secondes (pré-écoute, et mode sans pub)
     • les liens directs du morceau sur Deezer et Apple Music
     • la fiche de l'album (date, label, liste des titres) pour le livret
   Deux catalogues publics sont interrogés : Apple Music et Deezer.
   Les extraits sont promotionnels : on affiche toujours d'où ils viennent,
   avec le lien pour écouter le morceau en entier chez eux.
   Les liens d'extraits Deezer expirent au bout d'un moment : on les
   renouvelle juste avant de les jouer.
   Tout est mis en cache dans le navigateur.
   ════════════════════════════════════════════════════════════════════ */

const Pochettes = (() => {
  const CLE = 'md-pochettes-v10';
  const CLE_ALBUMS = 'md-albums-v3';
  const lire = cle => { try { return JSON.parse(localStorage.getItem(cle)) || {}; } catch (e) { return {}; } };
  let cache = lire(CLE);
  let albums = lire(CLE_ALBUMS);
  const sauver = () => { try { localStorage.setItem(CLE, JSON.stringify(cache)); } catch (e) {} };
  const sauverAlbums = () => { try { localStorage.setItem(CLE_ALBUMS, JSON.stringify(albums)); } catch (e) {} };

  const file = [];            // recherches en attente
  let enCours = 0;
  const MAX_SIMULTANE = 3;
  const abonnes = {};         // id -> [callbacks]
  const retentes = new Set(); // morceaux dont Deezer n'a pas répondu (quota) : une nouvelle chance par visite

  function normaliser(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9぀-ヿ一-龯]+/g, ' ').trim();
  }
  function artistePrincipal(artiste) {
    return String(artiste || '').split(/\s+(?:feat\.?|ft\.?|&|et|x)\s+|,/i)[0].trim();
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

  function jsonp(url) {
    return new Promise((resolve, reject) => {
      const nom = 'md_cb_' + Math.random().toString(36).slice(2);
      const s = document.createElement('script');
      const minuterie = setTimeout(() => { nettoyer(); reject(new Error('délai')); }, 9000);
      function nettoyer() { clearTimeout(minuterie); delete window[nom]; s.remove(); }
      window[nom] = data => { nettoyer(); resolve(data); };
      s.onerror = () => { nettoyer(); reject(new Error('réseau')); };
      s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + nom;
      document.head.appendChild(s);
    });
  }

  // est-ce que ce résultat correspond bien au morceau ? (sinon mauvaise pochette)
  function correspond(m, artisteRes, titreRes, albumRes) {
    const a = normaliser(artistePrincipal(m.artiste));
    const ra = normaliser(artisteRes);
    const t = normaliser(m.titre);
    const rt = normaliser(titreRes);
    const memeArtiste = a && ra && (ra.includes(a) || a.includes(ra));
    const mot = (x, y) => ` ${x} `.includes(` ${y} `);
    const memeTitre = t && rt && (rt === t || mot(rt, t) || mot(t, rt));
    const motCommun = a.split(' ').some(w => w.length > 2 && ra.split(' ').includes(w));
    // bonus quand l'album correspond à celui noté dans data.js : la bonne édition, pas une compilation
    const bonus = m.album && albumRes && normaliser(albumRes).startsWith(normaliser(m.album)) ? 0.5 : 0;
    // le même artiste ne suffit pas : sinon on prend la pochette et l'extrait d'un autre morceau
    if (memeArtiste && memeTitre) return 3 + bonus;
    if (memeTitre && motCommun) return 1 + bonus;
    return 0;
  }

  // « Love Deluxe » / « Pearls - Single » / « Cosmos - EP » -> nom propre + type
  function nettoyerAlbum(nom) {
    const n = String(nom || '');
    const r = n.match(/\s+-\s+(Single|EP)$/i);
    return r ? { nom: n.slice(0, r.index), type: r[1].toLowerCase() } : { nom: n, type: null };
  }

  async function chercherApple(m) {
    const terme = encodeURIComponent(`${artistePrincipal(m.artiste)} ${m.titre}`);
    const data = await jsonp(`https://itunes.apple.com/search?term=${terme}&entity=song&limit=10&country=FR`);
    const res = ((data && data.results) || []).map(r => ({ r, s: correspond(m, r.artistName, r.trackName, r.collectionName) })).filter(x => x.s > 0);
    res.sort((x, y) => y.s - x.s);
    const best = res[0] && res[0].r;
    if (!best) return null;
    const alb = nettoyerAlbum(best.collectionName);
    return {
      art: best.artworkUrl100 ? best.artworkUrl100.replace(/\/\d+x\d+bb/, '/600x600bb') : null,
      preview: best.previewUrl || null,
      lien: best.trackViewUrl || null,
      album: alb.nom || null, typeAlbum: alb.type,
      annee: best.releaseDate ? best.releaseDate.slice(0, 4) : null,
      genre: best.primaryGenreName || null,
      duree: best.trackTimeMillis ? Math.round(best.trackTimeMillis / 1000) : null,
      idAlbum: best.collectionId || null,
    };
  }

  async function chercherDeezer(m) {
    const terme = encodeURIComponent(`${artistePrincipal(m.artiste)} ${m.titre}`);
    const data = await jsonp(`https://api.deezer.com/search?q=${terme}&limit=10&output=jsonp`);
    if (data && data.error) throw new Error('quota');
    const res = ((data && data.data) || []).map(r => ({ r, s: correspond(m, r.artist && r.artist.name, r.title, r.album && r.album.title) })).filter(x => x.s > 0);
    res.sort((x, y) => y.s - x.s);
    const best = res[0] && res[0].r;
    if (!best) return null;
    return {
      art: best.album && (best.album.cover_xl || best.album.cover_big) || null,
      preview: best.preview || null,
      lien: best.link || null,
      id: best.id || null,
      album: best.album && best.album.title || null,
      idAlbum: best.album && best.album.id || null,
      idArtiste: best.artist && best.artist.id || null,
      duree: best.duration || null,
    };
  }
  // combien de fans l'artiste a sur Deezer : c'est ce qui dit s'il est connu ou confidentiel
  async function fansParNom(nom) {
    const n = normaliser(nom);
    if (!n) return null;
    const d = await jsonp(`https://api.deezer.com/search/artist?q=${encodeURIComponent(nom)}&limit=8&output=jsonp`);
    if (!d || d.error) return null;
    const ok = (d.data || []).filter(a => { const an = normaliser(a.name); return an === n || an.endsWith(' ' + n) || an.startsWith(n + ' '); });
    return ok.length ? Math.max(...ok.map(a => a.nb_fan || 0)) : null;
  }
  async function fansDeezer(id) {
    const d = await jsonp(`https://api.deezer.com/artist/${id}?output=jsonp`);
    return d && !d.error && typeof d.nb_fan === 'number' ? d.nb_fan : null;
  }

  async function chercher(m) {
    let apple = null, deezer = null, dzErr = false;
    try { apple = await chercherApple(m); } catch (e) {}
    try { deezer = await chercherDeezer(m); } catch (e) { dzErr = true; }
    // la popularité se mesure sur l'artiste principal (le compositeur pour le classique), pas sur l'interprète trouvé
    let fans = null;
    try { fans = await fansParNom(artistePrincipal(m.artiste)); } catch (e) {}
    if (fans === null && deezer && deezer.idArtiste) { try { fans = await fansDeezer(deezer.idArtiste); } catch (e) {} }
    const pris = k => (apple && apple[k]) || (deezer && deezer[k]) || null;
    // l'album : celui qui correspond à data.js d'abord, sinon Apple, sinon Deezer
    const voulu = m.album ? normaliser(m.album) : '';
    const albumApple = apple && apple.album, albumDeezer = deezer && deezer.album;
    const album = voulu && albumDeezer && normaliser(albumDeezer).startsWith(voulu) && !(albumApple && normaliser(albumApple).startsWith(voulu))
      ? albumDeezer : (albumApple || albumDeezer || m.album || null);
    return {
      art: pris('art'),
      previewDz: deezer && deezer.preview || null,
      dzId: deezer && deezer.id || null,
      previewApple: apple && apple.preview || null,
      lienDeezer: deezer && deezer.lien || null,
      lienApple: apple && apple.lien || null,
      album, typeAlbum: apple && apple.typeAlbum || null,
      annee: pris('annee'), genre: pris('genre'), duree: pris('duree'),
      idAlbumApple: apple && apple.idAlbum || null,
      idAlbumDeezer: deezer && deezer.idAlbum || null,
      fans, absentDeezer: !dzErr && !deezer,
      dzErr, t: Date.now()
    };
  }

  // connu (0) ou confidentiel (10), d'après le nombre de fans sur Deezer ; null tant qu'on ne sait pas
  function confidentiel(m) {
    const c = cache[m.id];
    if (!c) return null;
    if (typeof c.fans === 'number') return Math.max(0, Math.min(10, 10 - (Math.log10(c.fans + 1) - 2) * 1.8));
    if (c.absentDeezer) return 9; // introuvable sur Deezer : on le range côté confidentiel
    return null;
  }

  /* ─── les extraits ─── */
  // un lien Deezer porte sa date d'expiration (exp=…) : on le considère mort 20 s avant
  const expire = url => { const r = /exp=(\d+)/.exec(url || ''); return !!r && (+r[1]) * 1000 < Date.now() + 20000; };
  // l'extrait jouable tout de suite (sans réseau), ou null
  function extrait(m) {
    const c = cache[m.id];
    if (!c) return null;
    if (c.previewDz && !expire(c.previewDz)) return c.previewDz;
    return c.previewApple || null;
  }
  // l'extrait, renouvelé si besoin (promesse : un lien, ou null)
  function extraitFrais(m) {
    const suite = () => {
      const c = cache[m.id];
      if (!c) return null;
      if (c.previewDz && !expire(c.previewDz)) return c.previewDz;
      if (c.dzId && (c.previewDz || !c.previewApple)) return rafraichir(m);
      return c.previewApple || null;
    };
    if (!cache[m.id]) return new Promise(res => demander(m, () => res(suite())));
    return Promise.resolve(suite());
  }
  // redemande à Deezer un lien d'extrait tout neuf
  function rafraichir(m) {
    const c = cache[m.id];
    if (!c || !c.dzId) return Promise.resolve(c && c.previewApple || null);
    return jsonp(`https://api.deezer.com/track/${c.dzId}?output=jsonp`)
      .then(d => {
        if (d && d.preview) { c.previewDz = d.preview; sauver(); return d.preview; }
        return c.previewApple || null;
      })
      .catch(() => c.previewApple || null);
  }
  // l'extrait d'un titre de l'album (Apple d'abord, sinon Deezer avec un lien tout neuf)
  function extraitPiste(p) {
    if (p.extrait) return Promise.resolve(p.extrait);
    if (!p.dzId) return Promise.resolve(null);
    return jsonp(`https://api.deezer.com/track/${p.dzId}?output=jsonp`).then(d => d && d.preview || null).catch(() => null);
  }
  // un extrait qui refuse de se lire, même renouvelé : on ne le propose plus
  function oublierExtrait(m, url) {
    const c = cache[m.id];
    if (!c) return;
    if (c.previewDz && (!url || c.previewDz === url)) { c.previewDz = null; c.dzId = null; }
    else if (c.previewApple && c.previewApple === url) c.previewApple = null;
    sauver();
    majImages(m);
  }

  // d'où vient l'extrait, et où écouter le morceau en entier
  const NOMS = { deezer: 'Deezer', apple: 'Apple Music' };
  function source(m) {
    const c = cache[m.id];
    if (!c) return null;
    const cle = c.previewDz || c.dzId ? 'deezer' : c.previewApple ? 'apple' : null;
    return cle ? { cle, nom: NOMS[cle], lien: cle === 'deezer' ? c.lienDeezer : c.lienApple } : null;
  }
  function liens(m) { const c = cache[m.id] || {}; return { deezer: c.lienDeezer || null, apple: c.lienApple || null }; }
  // la fiche du morceau (album, année, genre, durée), quand on l'a trouvée
  function meta(m) { return cache[m.id] || null; }
  // 'inconnu' (recherche pas encore faite), 'ok' (extrait dispo) ou 'absent'
  function etat(m) {
    const c = cache[m.id];
    if (!c) return 'inconnu';
    return c.previewDz || c.dzId || c.previewApple ? 'ok' : 'absent';
  }

  /* ─── la fiche de l'album, pour le livret ─── */
  async function lookupApple(id) {
    const d = await jsonp(`https://itunes.apple.com/lookup?id=${id}&entity=song&country=FR&limit=200`);
    const res = (d && d.results) || [];
    const col = res.find(r => r.wrapperType === 'collection');
    if (!col) return null;
    const alb = nettoyerAlbum(col.collectionName);
    const pistes = res.filter(r => r.wrapperType === 'track')
      .sort((a, b) => ((a.discNumber || 1) - (b.discNumber || 1)) || ((a.trackNumber || 0) - (b.trackNumber || 0)))
      .map(r => ({ titre: r.trackName, duree: r.trackTimeMillis ? Math.round(r.trackTimeMillis / 1000) : null, extrait: r.previewUrl || null }));
    // « ℗ 1992 Sony Music Entertainment UK Limited » -> « Sony Music Entertainment UK Limited »
    const label = (col.copyright || '').replace(/^[^A-Za-zÀ-ÿ]*(?:\(?[cpCP]\)?\s*)?\d{4}[\s,.]*/, '').trim() || null;
    return {
      titre: alb.nom, type: alb.type, artiste: col.artistName,
      date: col.releaseDate ? col.releaseDate.slice(0, 10) : null,
      genre: col.primaryGenreName || null, label,
      nb: col.trackCount || pistes.length, pistes,
      lien: col.collectionViewUrl || null,
    };
  }
  async function lookupDeezer(id) {
    const d = await jsonp(`https://api.deezer.com/album/${id}?output=jsonp`);
    if (!d || d.error) return null;
    const types = { album: 'album', single: 'single', ep: 'ep', compile: 'compile' };
    return {
      titre: d.title, type: types[d.record_type] || null, artiste: d.artist && d.artist.name,
      date: d.release_date || null, label: d.label || null,
      genre: d.genres && d.genres.data && d.genres.data[0] ? d.genres.data[0].name : null,
      nb: d.nb_tracks || null, duree: d.duration || null,
      pistes: ((d.tracks && d.tracks.data) || []).map(t => ({ titre: t.title, duree: t.duration || null, dzId: t.id || null })),
      lien: d.link || null,
    };
  }
  // promesse : la fiche de l'album du morceau, ou null
  async function album(m) {
    if (!cache[m.id]) await new Promise(res => demander(m, res));
    const c = cache[m.id];
    if (!c) return null;
    const cle = c.idAlbumApple ? 'ap' + c.idAlbumApple : c.idAlbumDeezer ? 'dz' + c.idAlbumDeezer : null;
    if (!cle) return null;
    if (cle in albums) return albums[cle];
    let ap = null, dz = null;
    if (c.idAlbumApple) { try { ap = await lookupApple(c.idAlbumApple); } catch (e) {} }
    if (c.idAlbumDeezer) { try { dz = await lookupDeezer(c.idAlbumDeezer); } catch (e) {} }
    if (!ap && !dz) return null;
    const pistes = ap && ap.pistes.length ? ap.pistes : dz ? dz.pistes : [];
    // l'album doit vraiment contenir le morceau, sinon on ne raconte pas le mauvais disque
    const t = normaliser(m.titre).replace(/\s*\(.*$/, '');
    const dedans = !pistes.length || pistes.some(p => { const pt = normaliser(p.titre); return pt && t && (pt === t || pt.includes(t) || t.includes(pt.replace(/\s*\(.*$/, ''))); });
    if (!dedans) { albums[cle] = null; sauverAlbums(); return null; }
    // on garde aussi l'identifiant Deezer de chaque titre, pour retrouver un extrait si Apple n'en a pas
    if (ap && dz) pistes.forEach(p => { const x = dz.pistes.find(q => normaliser(q.titre) === normaliser(p.titre)); if (x) p.dzId = x.dzId; });
    const info = {
      titre: (ap && ap.titre) || (dz && dz.titre) || c.album,
      type: (dz && dz.type) || (ap && ap.type) || c.typeAlbum || 'album',
      artiste: (ap && ap.artiste) || (dz && dz.artiste) || m.artiste,
      date: (dz && dz.date) || (ap && ap.date) || null,
      label: (dz && dz.label) || (ap && ap.label) || null,
      genre: (ap && ap.genre) || (dz && dz.genre) || null,
      nb: pistes.length || (dz && dz.nb) || (ap && ap.nb) || null,
      duree: (dz && dz.duree) || pistes.reduce((s, p) => s + (p.duree || 0), 0) || null,
      pistes,
      liens: { apple: ap && ap.lien || null, deezer: dz && dz.lien || null },
    };
    albums[cle] = info; sauverAlbums();
    return info;
  }

  function pomper() {
    while (enCours < MAX_SIMULTANE && file.length) {
      const m = file.shift();
      enCours++;
      chercher(m)
        .then(r => {
          // un morceau dont l'extrait de 30 s n'est pas la bonne version : on n'en propose pas
          if (r && m.sansExtrait) Object.assign(r, { previewDz: null, dzId: null, previewApple: null });
          cache[m.id] = r; sauver();
        })
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
    if (!m) return;
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
    document.querySelectorAll(`[data-extrait-pour="${m.id}"]`).forEach(b => { b.dataset.etat = etat(m); b.dataset.source = src ? src.nom : ''; });
    // le petit lien « en entier sur … » posé à côté de chaque extrait
    document.querySelectorAll(`a[data-lien-pour="${m.id}"]`).forEach(a => {
      if (src && src.lien) { a.href = src.lien; a.textContent = `En entier sur ${src.nom}`; a.hidden = false; }
      else a.hidden = true;
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

  // couleur dominante d'une pochette (pour teinter le fond de la page)
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

  return { html, image, extrait, extraitFrais, extraitPiste, confidentiel, rafraichir, oublierExtrait, etat, meta, source, liens, album, demander, couleur, echapper, artistePrincipal, normaliser };
})();
