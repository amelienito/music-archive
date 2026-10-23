/* ════════════════════════════════════════════════════════════════════
   INFOS — les fiches Wikipédia de l'artiste et de l'album
   Cherche d'abord sur Wikipédia en français, puis en anglais.
   On n'accepte une page que si elle parle bien de musique et que son
   titre correspond : sinon, mieux vaut rien qu'une mauvaise fiche.
   Tout est mis en cache dans le navigateur.
   ════════════════════════════════════════════════════════════════════ */

const Infos = (() => {
  const CLE = 'md-wiki-v3';
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) { cache = {}; }
  const sauver = () => { try { localStorage.setItem(CLE, JSON.stringify(cache)); } catch (e) {} };
  const enCours = {};

  // une vraie fiche de musicien : le métier doit apparaître dans la description courte (ou la première phrase)
  const ROLE = /(chanteu|rappeu|musicien|compositeu|compositrice|auteur-compositeur|autrice-compositrice|groupe (de |musical)|duo (de |musical)|disc[- ]?jockey|\bDJ\b|producteur|productrice|beatmaker|pianiste|violoniste|guitariste|batteu|chef d'orchestre|orchestre|ensemble (vocal|musical)|singer|rapper|musician|composer|songwriter|record producer|\bband\b|pianist|violinist|guitarist|drummer|conductor|orchestra|musical (group|duo|ensemble)|music (group|duo|producer)|hip hop|DJ)/i;
  // et surtout pas une vodka, une ville ou un footballeur qui porte le même nom
  const PAS_MUSIQUE = /(vodka|boisson|alcool|bière|marque|entreprise|société|commune|ville|village|film|téléfilm|série télévisée|roman|jeu vidéo|personnage|footballeur|joueur de|homme politique|femme politique|astéroïde|cratère|navire|drink|beverage|brand|company|city|town|novel|video game|fictional|footballer|politician|asteroid|crater|ship)/i;
  const OEUVRE = {
    album: /(album|\bEP\b|mixtape|bande originale|soundtrack|compilation|\bLP\b|disque)/i,
    chanson: /(chanson|single|\bsong\b|\btitre\b|morceau)/i,
  };

  const norm = s => Pochettes.normaliser(String(s || '').replace(/\(.*?\)/g, ''));

  async function json(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }
  async function resume(titre, langue) {
    return json(`https://${langue}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titre.replace(/ /g, '_'))}`);
  }
  const fiche = (s, langue, p) => ({
    titre: s.title,
    extrait: couper(s.extract || '', 520),
    image: s.thumbnail ? s.thumbnail.source : null,
    url: s.content_urls && s.content_urls.desktop ? s.content_urls.desktop.page : `https://${langue}.wikipedia.org/wiki/${encodeURIComponent(p.title)}`,
    langue
  });

  // le titre de la page correspond-il au nom ? (« Schubert » -> « Franz Schubert », « Rachmaninoff » -> « Sergueï Rachmaninov »)
  function memeNom(titre, nom) {
    const t = norm(titre), n = norm(nom);
    if (!t || !n) return false;
    if (t === n || t === n.replace(/^the /, '') || t.startsWith(n + ' ') || n.startsWith(t + ' ') || t.endsWith(' ' + n)) return true;
    // même nom de famille, à l'orthographe près
    const dt = t.split(' ').pop(), dn = n.split(' ').pop();
    return n.split(' ').length <= 2 && dt.length >= 6 && dn.length >= 6 && dt.slice(0, 6) === dn.slice(0, 6) && Math.abs(dt.length - dn.length) <= 2;
  }
  function estMusicien(s, titreBrut) {
    const paren = (titreBrut.match(/\(([^)]*)\)/) || [])[1];
    if (paren && !(ROLE.test(paren) || /(groupe|band|artiste|artist|musique|music|chanteu|rappeu|singer|rapper|DJ)/i.test(paren))) return false; // « Rachmaninoff (vodka) »
    const desc = s.description || '';
    const premiere = ((s.extract || '').match(/^[^.]*\./) || [''])[0];
    const texte = desc || premiere;
    return ROLE.test(texte) && !PAS_MUSIQUE.test(texte);
  }
  async function chercherArtiste(nom, langue) {
    if (!norm(nom)) return null;
    const res = await json(`https://${langue}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(nom)}&srlimit=8&format=json&origin=*`);
    for (const p of (res.query && res.query.search) || []) {
      if (!memeNom(p.title, nom)) continue;
      const s = await resume(p.title, langue);
      if (s.type !== 'standard' || !estMusicien(s, p.title)) continue;
      return fiche(s, langue, p);
    }
    return null;
  }

  // un album (ou une chanson) : le titre doit correspondre, et la page doit citer l'artiste
  async function chercherOeuvre(titre, artiste, sorte, langue) {
    const t = norm(titre), a = norm(Pochettes.artistePrincipal(artiste));
    if (!t || !a) return null;
    const q = encodeURIComponent(`${titre} ${Pochettes.artistePrincipal(artiste)}`);
    const res = await json(`https://${langue}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&srlimit=6&format=json&origin=*`);
    for (const p of (res.query && res.query.search) || []) {
      const pt = norm(p.title);
      if (!(pt === t || pt.startsWith(t + ' '))) continue;
      const s = await resume(p.title, langue);
      if (s.type !== 'standard') continue;
      const texte = `${s.description || ''} ${s.extract || ''}`;
      if (!OEUVRE[sorte].test(texte)) continue;
      if (!norm(texte).includes(a)) continue;
      return fiche(s, langue, p);
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

  // file d'attente commune : une seule recherche par fiche, résultat en cache
  function trouver(cle, chercher, cb) {
    if (cle in cache) { cb(cache[cle]); return; }
    if (enCours[cle]) { enCours[cle].push(cb); return; }
    enCours[cle] = [cb];
    (async () => {
      let f = null, panne = false;
      try { f = await chercher('fr'); } catch (e) { panne = true; }
      // en français seulement : pas de fiche française, on renvoie vers Genius plutôt qu'en anglais
      // en cas de souci réseau, on ne mémorise pas l'échec : on retentera
      if (f || !panne) { cache[cle] = f; sauver(); }
      enCours[cle].forEach(fn => fn(f));
      delete enCours[cle];
    })();
  }

  // cb(fiche) avec fiche = null si rien de fiable n'a été trouvé
  function artiste(nomComplet, cb) {
    const nom = Pochettes.artistePrincipal(nomComplet);
    trouver(norm(nom), langue => chercherArtiste(nom, langue), cb);
  }
  function oeuvre(titre, artisteNom, sorte, cb) {
    trouver(`${sorte}:${norm(titre)}:${norm(Pochettes.artistePrincipal(artisteNom))}`, langue => chercherOeuvre(titre, artisteNom, sorte, langue), cb);
  }

  /* la petite chronique d'un morceau, en français seulement :
     d'abord ce qu'on sait du titre, sinon de l'album, sinon de l'artiste.
     Les phrases de catalogue (« sorti le…, contient treize titres… ») sont écartées. */
  const CREUX = /(\b(est|était) (un|une|le|la|l')\s*(\w+(ième|ier|ière)\s+)?(album|single|chanson|titre|morceau|ep|maxi|disque|compilation|mixtape)\b|\bsorti(e|s)? (le|en|chez|sur)\b|\bparu(e)? (le|en)\b|\bcontient\b|\bcomprend\b|\bcomposé(e)? de\b|\b\d+ (titres|morceaux|pistes|chansons)\b|\blabel\b|\benregistré(e)?\b|\bproduit(e)? par\b|\bextrait de l'album\b|\bpiste\b|\bclassement\b|\bcertifié)/i;
  const phrasesDe = t => (String(t || '').match(/[^.!?]+[.!?]+(\s|$)/g) || []).map(x => x.trim()).filter(Boolean);
  function utile(t) {
    const garde = phrasesDe(t).filter(p => p.length > 50 && !CREUX.test(p));
    return garde.length ? garde.slice(0, 2).join(' ') : null;
  }
  function chronique(m, albumTitre, cb) {
    const art = Pochettes.artistePrincipal(m.artiste);
    const album = albumTitre || m.album || '';
    const etapes = [
      ['le titre', l => chercherOeuvre(m.titre, m.artiste, 'chanson', l), utile],
      ['l\'album', l => album ? chercherOeuvre(album, m.artiste, 'album', l) : Promise.resolve(null), utile],
      ['l\'artiste', l => chercherArtiste(art, l), t => phrasesDe(t).slice(0, 2).join(' ') || null],
    ];
    (async () => {
      for (const [de, chercher, filtre] of etapes) {
        const cle = `fr:${de}:${norm(de === 'l\'artiste' ? art : de === 'l\'album' ? album + '|' + art : m.titre + '|' + art)}`;
        let f = cache[cle];
        if (f === undefined) {
          try { f = await chercher('fr'); cache[cle] = f || null; sauver(); } catch (e) { f = null; }
        }
        const texte = f && filtre(f.extrait);
        if (texte) return cb({ texte, de, url: f.url });
      }
      cb(null);
    })();
  }

  return { artiste, oeuvre, chronique };
})();
