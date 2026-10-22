/* ════════════════════════════════════════════════════════════════════
   POCHETTES & EXTRAITS
   Va chercher tout seul, dans le navigateur du visiteur :
     • la pochette haute définition du morceau (catalogue Apple Music)
     • un extrait de 30 secondes (pour la pré-écoute au survol)
   Rien à remplir à la main. Tout est mis en cache dans le navigateur.
   En attendant (ou si rien n'est trouvé), on montre l'image YouTube.
   ════════════════════════════════════════════════════════════════════ */

const Pochettes = (() => {
  const CLE = 'md-pochettes-v2';
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) { cache = {}; }

  const file = [];          // recherches en attente
  let enCours = 0;
  const MAX_SIMULTANE = 3;
  const abonnes = {};       // id -> [callbacks]

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

  async function chercher(m) {
    const principal = artistePrincipal(m.artiste);
    const terme = encodeURIComponent(`${principal} ${m.titre}`);
    const data = await jsonp(`https://itunes.apple.com/search?term=${terme}&entity=song&limit=8&country=FR`);
    const res = (data && data.results) || [];
    const a = normaliser(principal);
    const t = normaliser(m.titre);
    const alb = normaliser(m.album);
    // on n'accepte un résultat que si l'artiste correspond (sinon mauvaise pochette)
    const candidats = res.filter(r => {
      const ra = normaliser(r.artistName);
      return a && (ra.includes(a) || a.includes(ra));
    });
    const score = r => {
      let s = 0;
      const rt = normaliser(r.trackName);
      if (rt === t) s += 3; else if (rt.includes(t) || t.includes(rt)) s += 2;
      if (alb && normaliser(r.collectionName).includes(alb)) s += 1;
      return s;
    };
    candidats.sort((x, y) => score(y) - score(x));
    const best = candidats[0];
    if (!best) return { art: null, preview: null, t: Date.now() };
    return {
      art: best.artworkUrl100 ? best.artworkUrl100.replace(/\/\d+x\d+bb/, '/600x600bb') : null,
      preview: best.previewUrl || null,
      t: Date.now()
    };
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
    if (c && !perime) { if (cb) cb(m); return; }
    if (cb) (abonnes[m.id] = abonnes[m.id] || []).push(cb);
    if (!file.includes(m)) file.push(m);
    pomper();
  }

  // remplace toutes les images d'un morceau déjà affichées à l'écran
  function majImages(m) {
    const im = image(m);
    if (!im) return;
    document.querySelectorAll(`img[data-pochette="${m.id}"]`).forEach(img => {
      if (img.getAttribute('src') !== im.src) {
        img.classList.add('se-revele');
        img.src = im.src;
      }
      img.classList.toggle('est-yt', im.yt);
    });
    document.querySelectorAll(`[data-extrait-pour="${m.id}"]`).forEach(b => {
      b.hidden = !extrait(m);
    });
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

  function echapper(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  return { html, image, extrait, demander, echapper };
})();
