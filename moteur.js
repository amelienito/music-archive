/* ════════════════════════════════════════════════════════════════════
   MOTEUR — les ambiances, et la façon de passer d'un morceau à l'autre
   Chaque morceau a une fiche dans data.js (ambiance, style, année, tempo,
   voix, étiquettes). Le moteur compare deux fiches et dit à quel point
   les deux morceaux vont bien ensemble : c'est ce qui fait que
   « dans la même veine » reste dans la même veine, et que la radio
   enchaîne sans à-coups.
   ════════════════════════════════════════════════════════════════════ */

const Moteur = (() => {
  // les sept ambiances : ce sont les bacs de Découvrir et les disques de la chaîne
  const AMBIANCES = {
    soleil:     { nom: 'Soleil',     sous: 'Soul, funk, chaleur',          couleur: '#f0a03a', sombre: '#7a4310', encre: '#2b1500', voisins: ['piste', 'bitume', 'brume'] },
    bitume:     { nom: 'Bitume',     sous: 'Rap, la ville la nuit',        couleur: '#2c3aa0', sombre: '#141a52', encre: '#eef0ff', voisins: ['soleil', 'piste', 'ailleurs'] },
    piste:      { nom: 'Piste',      sous: 'Pour danser',                  couleur: '#e23d8b', sombre: '#6e1240', encre: '#fff0f6', voisins: ['soleil', 'bitume', 'ailleurs', 'electrique'] },
    brume:      { nom: 'Brume',      sous: 'Doux et rêveur',               couleur: '#a8c6d6', sombre: '#3e5a69', encre: '#14242c', voisins: ['soleil', 'ailleurs', 'epopee'] },
    ailleurs:   { nom: 'Ailleurs',   sous: 'Étrange et lointain',          couleur: '#2f9e6a', sombre: '#0f4a2f', encre: '#effff6', voisins: ['brume', 'piste', 'electrique', 'bitume'] },
    electrique: { nom: 'Électrique', sous: 'Guitares et pop vive',         couleur: '#e2462e', sombre: '#6b170b', encre: '#fff2ee', voisins: ['piste', 'ailleurs', 'epopee'] },
    epopee:     { nom: 'Épopée',     sous: 'Orchestres et jeux vidéo',     couleur: '#6a49c9', sombre: '#2a1a5e', encre: '#f3efff', voisins: ['brume', 'electrique'] },
  };
  const ORDRE = ['soleil', 'bitume', 'piste', 'brume', 'ailleurs', 'electrique', 'epopee'];

  // des étiquettes de la même famille se ressemblent un peu, même si ce ne sont pas les mêmes
  const FAMILLES = [
    ['soul', 'funk', 'disco', 'rnb', 'boogie', 'gospel', 'motown', 'philly', 'memphis'],
    ['rap', 'boom bap', 'drumless', 'trap', 'drill', 'cloud rap', 'samples soul', 'new york', 'sud', 'west coast', 'france'],
    ['house', 'electro', 'club', 'french touch', 'hyperpop', 'minimal', 'synthés', 'reggaeton', 'latin'],
    ['ambient', 'vaporwave', 'lofi', 'nature', 'long', 'berceuse', 'glitch'],
    ['classique', 'orchestre', 'cordes', 'piano', 'romantique', 'virtuose', 'harpe'],
    ['jazz', 'lounge', 'library', 'swing', 'cuivres', 'orgue'],
    ['pop', 'indie', 'dream pop', 'folk', 'chanson', 'ballade', 'voix aérienne', 'mélancolique'],
    ['rock', 'punk', 'metal', 'guitares', 'rapide'],
    ['monde', 'arabe', 'bresil', 'samba', 'japon', 'citypop', 'afro', 'reggae'],
  ];
  const familleDe = {};
  FAMILLES.forEach((f, i) => f.forEach(t => { familleDe[t] = i; }));

  const tagsDe = m => m._tags || (m._tags = (m.tags || []).map(t => String(t).toLowerCase()));
  // 1 = mêmes étiquettes, 0 = rien en commun
  function ressemblance(a, b) {
    const A = tagsDe(a), B = tagsDe(b);
    if (!A.length || !B.length) return a.ambiance && a.ambiance === b.ambiance ? 0.4 : 0.1;
    const meilleur = (t, autre) => {
      let m = 0;
      for (const u of autre) {
        if (u === t) return 1;
        if (familleDe[t] !== undefined && familleDe[t] === familleDe[u]) m = 0.4;
      }
      return m;
    };
    let s = 0;
    A.forEach(t => { s += meilleur(t, B); });
    B.forEach(t => { s += meilleur(t, A); });
    return s / (A.length + B.length);
  }
  const voisines = (x, y) => !!(AMBIANCES[x] && AMBIANCES[x].voisins.includes(y));
  function ecartAmbiance(a, b) {
    if (!a.ambiance || !b.ambiance) return 0.7;
    return a.ambiance === b.ambiance ? 0 : voisines(a.ambiance, b.ambiance) ? 0.7 : 1.4;
  }
  // les époques : deux œuvres classiques sont proches entre elles, loin de tout le reste
  function ecartEpoque(a, b) {
    const x = a.annee, y = b.annee;
    if (!x || !y) return 0.3;
    const cx = x < 1950, cy = y < 1950;
    if (cx && cy) return Math.min(1, Math.abs(x - y) / 120) * 0.3;
    if (cx !== cy) return 1;
    return Math.min(1, Math.abs(x - y) / 25);
  }
  // le tempo : un morceau à 70 et un à 140 battent au même pas (l'un est le double de l'autre)
  function ecartTempo(a, b) {
    if (!a.bpm || !b.bpm) return 0.3;
    let r = Math.abs(Math.log2(a.bpm / b.bpm)) % 1;
    r = Math.min(r, 1 - r);
    return Math.min(1, r * 2);
  }
  function ecartVoix(a, b) {
    if (!a.voix || !b.voix || a.voix === b.voix) return 0;
    const p = [a.voix, b.voix].sort().join('-');
    return { 'chant-rap': 0.45, 'chant-instru': 0.35, 'instru-rap': 0.6 }[p] || 0.4;
  }
  const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
  // plus c'est petit, mieux les deux morceaux vont ensemble
  function distance(a, b, { sans = null } = {}) {
    let d = 4 * (1 - ressemblance(a, b));
    d += ecartAmbiance(a, b);
    if (sans !== 'energie') d += 0.22 * Math.abs(num(a.energie, 5) - num(b.energie, 5));
    if (sans !== 'danse') d += 0.12 * Math.abs(num(a.danse, 5) - num(b.danse, 5));
    d += 0.9 * ecartEpoque(a, b);
    d += 0.6 * ecartTempo(a, b);
    d += ecartVoix(a, b);
    return d;
  }

  // tire au sort parmi les meilleurs, le premier le plus souvent
  function parmiLesMeilleurs(liste, n = 2) {
    const l = liste.slice(0, n);
    if (!l.length) return null;
    const poids = l.map((_, i) => 1 / (i + 1.4));
    let r = Math.random() * poids.reduce((s, p) => s + p, 0);
    for (let i = 0; i < l.length; i++) { r -= poids[i]; if (r <= 0) return l[i]; }
    return l[0];
  }
  function lesPlusProches(ref, pool, opts) {
    return pool.filter(x => x !== ref).map(x => [x, distance(ref, x, opts)]).sort((p, q) => p[1] - q[1]).map(p => p[0]);
  }

  /* les directions de Découvrir
     val(m, cle) donne l'énergie, la danse ou le côté confidentiel d'un morceau */
  const DIRECTIONS = {
    veine:        { etiquette: 'Dans la même veine', court: 'Même veine' },
    energique:    { etiquette: 'Plus énergique', court: 'Plus énergique', cle: 'energie', sens: 1 },
    calme:        { etiquette: 'Plus calme', court: 'Plus calme', cle: 'energie', sens: -1 },
    dansant:      { etiquette: 'Plus dansant', court: 'Plus dansant', cle: 'danse', sens: 1 },
    pose:         { etiquette: 'Plus posé', court: 'Plus posé', cle: 'danse', sens: -1 },
    connu:        { etiquette: 'Plus connu', court: 'Plus connu', cle: 'etrange', sens: -1 },
    confidentiel: { etiquette: 'Plus confidentiel', court: 'Plus confidentiel', cle: 'etrange', sens: 1 },
    cote:         { etiquette: 'Un pas de côté', court: 'Pas de côté' },
  };
  /* Chaque direction a un pas minimum et, pour la danse, un seuil absolu :
     « plus dansant » depuis un morceau de piano doit vraiment faire danser,
     pas juste un peu moins immobile. Si rien de cohérent n'existe (trop loin
     du morceau en cours), la direction est indisponible plutôt que farfelue. */
  const REGLES = {
    energique:    { cle: 'energie', sens: 1, pas: 1.5 },
    calme:        { cle: 'energie', sens: -1, pas: 1.5 },
    dansant:      { cle: 'danse', sens: 1, pas: 2, plancher: 4 },
    pose:         { cle: 'danse', sens: -1, pas: 2, plafond: 5 },
    connu:        { cle: 'etrange', sens: -1, pas: 1.5 },
    confidentiel: { cle: 'etrange', sens: 1, pas: 1.5 },
  };
  const QUALITE = 6.5; // au-delà, le morceau proposé n'a plus rien à voir avec celui en cours
  /* le premier pas : un cran au-dessus, pas un saut au bout de l'échelle.
     energique : +1 à +3 (force 1), +2 à +4 (force 2)… ; si rien, on accepte plus loin */
  function candidatsDirection(ref, dir, pool, val, force = 1, large = false) {
    const R = REGLES[dir];
    const ecart = x => (val(x, R.cle) - val(ref, R.cle)) * R.sens;
    const mini = Math.max(1, R.pas * force - 0.5), maxi = large ? 99 : R.pas * force + 1.5;
    const ok = x => ecart(x) >= mini - 0.01 && ecart(x) <= maxi + 0.01
      && (R.plancher === undefined || val(x, R.cle) >= R.plancher)
      && (R.plafond === undefined || val(x, R.cle) <= R.plafond)
      && (x.ambiance === ref.ambiance || voisines(ref.ambiance, x.ambiance));
    const sans = R.cle === 'etrange' ? null : R.cle;
    const cible = R.pas * force;
    return pool.filter(ok).map(x => [x, distance(ref, x, { sans }) + 0.6 * Math.abs(ecart(x) - cible)])
      .filter(p => p[1] <= QUALITE).sort((a, b) => a[1] - b[1]).map(p => p[0]);
  }
  function versDirection(ref, dir, pool, val, { force = 1 } = {}) {
    if (!ref || !pool.length) return null;
    if (dir === 'veine') return parmiLesMeilleurs(lesPlusProches(ref, pool), 2);
    if (dir === 'cote') {
      // une ambiance voisine, mais par le morceau qui lui ressemble le plus : un pont, pas un saut
      const voisins = pool.filter(x => x.ambiance !== ref.ambiance && voisines(ref.ambiance, x.ambiance));
      const c = voisins.length ? voisins : pool.filter(x => x.ambiance !== ref.ambiance);
      return parmiLesMeilleurs(lesPlusProches(ref, c), 2);
    }
    if (!REGLES[dir]) return null;
    // on essaie le pas demandé, puis un pas plus petit si l'on est déjà tout au bout
    for (let f = force; f >= 1; f--) {
      const c = candidatsDirection(ref, dir, pool, val, f);
      if (c.length) return parmiLesMeilleurs(c, 2);
    }
    const loin = candidatsDirection(ref, dir, pool, val, 1, true);
    return loin.length ? parmiLesMeilleurs(loin, 2) : null;
  }
  // peut-on aller dans cette direction depuis ce morceau, sans tomber sur n'importe quoi ?
  function possible(ref, dir, pool, val) {
    if (!REGLES[dir]) return pool.length > 0;
    return candidatsDirection(ref, dir, pool, val, 1, true).length > 0;
  }
  /* la pente : une direction qui tient sur plusieurs morceaux, par paliers.
     Le premier morceau monte d'un cran ; ensuite on reste au même niveau (ou un peu plus),
     et un morceau sur trois remonte d'un cran. Jamais en arrière, jamais de saut au bout de
     l'échelle : on parcourt plus de morceaux en chemin au lieu de foncer vers les extrêmes. */
  function suivantPente(ref, dir, pool, val, { premier = false, force = 1, etape = 0 } = {}) {
    const R = REGLES[dir];
    if (!R) return null;
    if (premier) { const x = versDirection(ref, dir, pool, val, { force }); if (x) return x; }
    const ecart = x => (val(x, R.cle) - val(ref, R.cle)) * R.sens;
    const proche = x => x.ambiance === ref.ambiance || voisines(ref.ambiance, x.ambiance);
    const monte = etape % 3 === 2;
    const essais = monte
      ? [[1, R.pas + 1], [0, R.pas + 1], [0, 99]]   // un cran de plus, sinon au moins pareil
      : [[0, 1], [0, R.pas + 1], [0, 99]];           // pareil (ou à peine plus)
    for (const [mini, maxi] of essais) {
      const c = pool.filter(x => proche(x) && ecart(x) >= mini && ecart(x) <= maxi)
        .map(x => [x, distance(ref, x)]).sort((a, b) => a[1] - b[1]).map(p => p[0]);
      if (c.length) return parmiLesMeilleurs(c, 2);
    }
    // tout au bout de l'échelle dans ces ambiances : on va chercher ailleurs, mais toujours sans redescendre
    const ailleurs = pool.filter(x => ecart(x) >= 0).map(x => [x, distance(ref, x)]).sort((a, b) => a[1] - b[1]).map(p => p[0]);
    return ailleurs.length ? parmiLesMeilleurs(ailleurs, 2) : null;
  }
  /* l'ordre d'un disque : chaque morceau mène au plus proche, puis on
     décroise les enchaînements maladroits (comme un DJ qui prépare son set) */
  function longueur(o) { let s = 0; for (let i = 1; i < o.length; i++) s += distance(o[i - 1], o[i]); return s; }
  function sequencer(liste, { depart = null, tours = 8 } = {}) {
    const reste = [...liste];
    if (reste.length < 3) return reste;
    let premier = depart && reste.includes(depart) ? depart : reste[Math.floor(Math.random() * reste.length)];
    const o = [premier];
    reste.splice(reste.indexOf(premier), 1);
    while (reste.length) {
      const der = o[o.length - 1];
      let k = 0, best = Infinity;
      reste.forEach((x, i) => { const d = distance(der, x); if (d < best) { best = d; k = i; } });
      o.push(reste.splice(k, 1)[0]);
    }
    // 2-opt : on retourne un bout du chemin quand ça raccourcit les sauts (le premier morceau reste en tête)
    const n = o.length;
    const D = new Map();
    const d = (a, b) => { const k = a.id + '|' + b.id; if (!D.has(k)) D.set(k, distance(a, b)); return D.get(k); };
    for (let t = 0; t < tours; t++) {
      let mieux = false;
      for (let i = 1; i < n - 2; i++) {
        for (let j = i + 1; j < n - 1; j++) {
          const avant = d(o[i - 1], o[i]) + d(o[j], o[j + 1]);
          const apres = d(o[i - 1], o[j]) + d(o[i], o[j + 1]);
          if (apres + 1e-9 < avant) { o.splice(i, j - i + 1, ...o.slice(i, j + 1).reverse()); mieux = true; }
        }
      }
      if (!mieux) break;
    }
    return o;
  }

  // le morceau le plus « central » d'un ensemble : un bon point de départ pour un bac
  function representatifs(liste, n = 4) {
    return liste.map(x => [x, liste.reduce((s, y) => s + (x === y ? 0 : distance(x, y)), 0)])
      .sort((p, q) => p[1] - q[1]).slice(0, n).map(p => p[0]);
  }

  return { AMBIANCES, ORDRE, DIRECTIONS, REGLES, distance, ressemblance, versDirection, possible, suivantPente, sequencer, representatifs, longueur, lesPlusProches };
})();
if (typeof module !== 'undefined') module.exports = Moteur;
