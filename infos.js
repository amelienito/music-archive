/* ════════════════════════════════════════════════════════════════════
   INFOS — la fiche Wikipédia de l'artiste
   Cherche d'abord sur Wikipédia en français, puis en anglais.
   On n'accepte une page que si elle parle bien d'un·e musicien·ne
   et que son titre correspond au nom de l'artiste.
   Tout est mis en cache dans le navigateur.
   ════════════════════════════════════════════════════════════════════ */

const Infos = (() => {
  const CLE = 'md-wiki-v1';
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) { cache = {}; }
  const sauver = () => { try { localStorage.setItem(CLE, JSON.stringify(cache)); } catch (e) {} };
  const enCours = {};

  const MUSIQUE = /(chanteu|rappeu|musicien|musicienne|groupe|duo|trio|disc[- ]?jockey|\bDJ\b|producteur|productrice|compositeu|auteur-compositeur|artiste|beatmaker|singer|rapper|musician|band|producer|songwriter|record producer|composer|hip hop|soul|jazz|électronique|electronic)/i;

  const norm = s => Pochettes.normaliser(String(s || '').replace(/\(.*?\)/g, ''));

  async function json(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }

  async function chercher(nom, langue) {
    const n = norm(nom);
    if (!n) return null;
    const q = encodeURIComponent(nom);
    const res = await json(`https://${langue}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&srlimit=6&format=json&origin=*`);
    const pages = (res.query && res.query.search) || [];
    for (const p of pages) {
      const t = norm(p.title);
      if (!(t === n || t.startsWith(n + ' ') || n.startsWith(t + ' ') || t === n.replace(/^the /, ''))) continue;
      const s = await json(`https://${langue}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(p.title.replace(/ /g, '_'))}`);
      if (s.type !== 'standard') continue;
      if (!MUSIQUE.test(`${s.description || ''} ${s.extract || ''}`)) continue;
      return {
        titre: s.title,
        extrait: couper(s.extract || '', 520),
        image: s.thumbnail ? s.thumbnail.source : null,
        url: s.content_urls && s.content_urls.desktop ? s.content_urls.desktop.page : `https://${langue}.wikipedia.org/wiki/${encodeURIComponent(p.title)}`,
        langue
      };
    }
    return null;
  }

  // garde des phrases entières, sans dépasser max caractères
  function couper(txt, max) {
    if (txt.length <= max) return txt;
    const phrases = txt.match(/[^.!?]+[.!?]+(\s|$)/g) || [txt];
    let out = '';
    for (const p of phrases) { if ((out + p).length > max) break; out += p; }
    return (out || txt.slice(0, max) + '…').trim();
  }

  // cb(fiche) avec fiche = null si rien de fiable n'a été trouvé
  function artiste(nomComplet, cb) {
    const nom = Pochettes.artistePrincipal(nomComplet);
    const cle = norm(nom);
    if (cle in cache) { cb(cache[cle]); return; }
    if (enCours[cle]) { enCours[cle].push(cb); return; }
    enCours[cle] = [cb];
    (async () => {
      let fiche = null, panne = false;
      try { fiche = await chercher(nom, 'fr'); } catch (e) { panne = true; }
      if (!fiche) { try { fiche = await chercher(nom, 'en'); } catch (e) { panne = true; } }
      // en cas de souci réseau, on ne mémorise pas l'échec : on retentera
      if (fiche || !panne) { cache[cle] = fiche; sauver(); }
      enCours[cle].forEach(f => f(fiche));
      delete enCours[cle];
    })();
  }

  return { artiste };
})();
