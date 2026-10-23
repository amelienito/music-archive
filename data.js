/* ════════════════════════════════════════════════════════════════════
   MUSIC DISCOVERY — ta banque musicale
   ════════════════════════════════════════════════════════════════════

   C'est le SEUL fichier que tu as besoin de toucher pour faire vivre
   le site. Tout le reste se construit tout seul à partir d'ici.

   ➜ Pour ajouter un morceau : copie un bloc { ... }, colle-le à la fin
     de la liste (avant le ];), remplis, n'oublie pas la virgule.

   Champs obligatoires
     titre    le nom du morceau
     artiste  le ou les artistes
     lien     le lien YouTube ou YouTube Music du morceau
              (c'est lui qui permet de l'écouter directement sur le site).
              Prends la version officielle : celle de YouTube Music (chaîne
              « Artiste - Topic »), de l'artiste ou de son label.

   Champs facultatifs (tu peux les laisser vides ou les supprimer)
     album    l'album d'origine (aide à trouver la bonne pochette)
     note     TON texte. Trois mots, un pavé, ou rien du tout.
              Rien du tout, c'est très bien aussi : le morceau parle seul.
     liens    titres d'autres morceaux de la banque vers lesquels
              celui-ci doit mener. Ex : liens: ["Pearls", "Judy"]
     volume   de 0.1 à 1, si un morceau est enregistré trop fort.
              (Les morceaux très énergiques sont déjà baissés tout seuls.)
     jour     une date "2026-12-25" pour en faire le morceau du jour ce jour-là.
              Sans ça, le morceau du jour est tiré au sort, le même pour tous.
     connu    true pour un morceau connu de tous même si ses interprètes
              ne le sont pas (Mozart, Zelda…) : il ira côté « connu ».
     coeur    true pour un coup de cœur : il passe en priorité quand le site
              propose « Celui-là, je l'avais mis de côté pour toi ».
              (La table de tri le coche pour toi.)
     long     true pour un morceau de 20 minutes et plus (simple repère).
     bandcamp le lien Bandcamp du morceau, s'il y est. Il apparaît dans
              « Écouter en entier sur » (sans pub, et l'artiste touche plus).
              Ex : bandcamp: "https://artiste.bandcamp.com/track/morceau"

   La fiche du morceau : c'est elle qui fait que « dans la même veine »
   reste dans la même veine, et que la chaîne enchaîne sans à-coups.
     ambiance le bac et le disque où il range : "soleil" (soul, funk, chaleur),
              "bitume" (rap, la ville la nuit), "piste" (pour danser),
              "brume" (doux et rêveur), "ailleurs" (étrange et lointain),
              "electrique" (guitares et pop vive), "epopee" (orchestres,
              jeux vidéo). Les couleurs et les noms sont dans moteur.js.
     style    deux ou trois mots montrés aux visiteurs : "Philly soul"
     annee    l'année de sortie (ou de composition)
     bpm      le tempo, à peu près
     voix     "chant", "rap" ou "instru"
     tags     quelques étiquettes, en minuscules : ["soul", "philly", "cordes"].
              Deux morceaux qui partagent des étiquettes se suivent bien.
   Tu n'as pas à les remplir toi-même : quand tu colles tes « oui » de la
   table de tri, Claude écrit la fiche de chaque nouveau morceau.

   Les réglages (de 0 à 10) servent au moteur de découverte.
   Ils ne sont jamais montrés aux visiteurs. Ajuste-les à l'instinct :
     energie  0 immobile · 2 calme · 4 posé · 6 ça avance · 8 intense
              · 10 extrême (thrash, metal, speedcore)
     danse    0 impossible (classique, ambient) · 2 on écoute · 4 on hoche
              la tête · 6 ça groove · 8 dansant · 10 club, disco
              (un metal très énergique peut avoir une danse basse : on
              secoue la tête, on ne danse pas)
     etrange  1 évident pour tout le monde · 5 inhabituel · 9 d'où ça sort ?

   ⚠ Les valeurs actuelles sont une première estimation faite par Claude.
     Corrige-les comme tu le sens, c'est ta sélection, pas la sienne.
   ════════════════════════════════════════════════════════════════════ */

const MORCEAUX = [

  { titre: "Losin' Weight", artiste: "Cam'ron feat. Prodigy", album: "S.D.E.",
    lien: "https://music.youtube.com/watch?v=RQxJfDU66rw", note: "",
    ambiance: "bitume", style: "Rap new-yorkais", annee: 2000, bpm: 92, voix: "rap",
    tags: ["rap", "boom bap", "samples soul", "new york"],
    energie: 5, etrange: 3, danse: 4 },

  { titre: "King Back", artiste: "T.I.", album: "King",
    lien: "https://music.youtube.com/watch?v=Q7KuF4aImt8", note: "",
    ambiance: "bitume", style: "Rap du Sud", annee: 2006, bpm: 80, voix: "rap",
    tags: ["rap", "sud", "cuivres", "trap"],
    energie: 8, etrange: 2, danse: 6 },

  { titre: "What We Do", artiste: "Freeway feat. JAY-Z & Beanie Sigel", album: "Philadelphia Freeway",
    lien: "https://music.youtube.com/watch?v=ITSVEXkuadk", note: "",
    ambiance: "bitume", style: "Rap de Philadelphie", annee: 2003, bpm: 90, voix: "rap",
    tags: ["rap", "boom bap", "samples soul", "philly"],
    energie: 5, etrange: 2, danse: 4 },

  { titre: "Exhibit C", artiste: "Jay Electronica", album: "Exhibit C",
    lien: "https://music.youtube.com/watch?v=b0c9A74BmcU", note: "",
    ambiance: "bitume", style: "Rap à samples", annee: 2009, bpm: 92, voix: "rap",
    tags: ["rap", "boom bap", "samples soul", "cuivres"],
    energie: 7, etrange: 4, danse: 3 },

  { titre: "Larry Bird", artiste: "Roc Marciano feat. Knowledge the Pirate & GREA8GAWD", album: "Marciology",
    lien: "https://music.youtube.com/watch?v=KZ8Xu74Ysrk", note: "",
    ambiance: "bitume", style: "Rap underground", annee: 2024, bpm: 80, voix: "rap",
    tags: ["rap", "drumless", "samples soul", "nocturne"],
    energie: 3, etrange: 6, danse: 2 },

  { titre: "Flashback", artiste: "Boldy James & ChanHays", album: "Prisoner of Circumstance",
    lien: "https://music.youtube.com/watch?v=vhAFirTDTSM", note: "",
    ambiance: "bitume", style: "Rap underground", annee: 2023, bpm: 78, voix: "rap",
    tags: ["rap", "drumless", "samples soul", "nocturne"],
    energie: 3, etrange: 5, danse: 2 },

  { titre: "Summer's Eve", artiste: "Nicholas Craven & Boldy James", album: "Summer's Eve",
    lien: "https://music.youtube.com/watch?v=J-7XkIQcPUQ", note: "",
    ambiance: "bitume", style: "Rap underground", annee: 2024, bpm: 80, voix: "rap",
    tags: ["rap", "drumless", "samples soul", "solaire"],
    energie: 3, etrange: 5, danse: 2 },

  { titre: "I'm the Devil", artiste: "Lil B", album: "6 Kiss",
    lien: "https://music.youtube.com/watch?v=7-1nLlYjpKY", note: "",
    ambiance: "ailleurs", style: "Cloud rap", annee: 2009, bpm: 70, voix: "rap",
    tags: ["rap", "cloud rap", "expérimental", "nocturne"],
    energie: 4, etrange: 9, danse: 3 },

  { titre: "Got to Be Real", artiste: "Cheryl Lynn", album: "Cheryl Lynn",
    lien: "https://music.youtube.com/watch?v=SxW1I0diFqI", note: "",
    ambiance: "piste", style: "Disco", annee: 1978, bpm: 118, voix: "chant",
    tags: ["disco", "funk", "cuivres", "solaire"],
    energie: 8, etrange: 1, danse: 10 },

  { titre: "Judy", artiste: "Al Green", album: "Let's Stay Together",
    lien: "https://music.youtube.com/watch?v=lcwGFZQLD9Q", note: "",
    ambiance: "soleil", style: "Soul de Memphis", annee: 1972, bpm: 90, voix: "chant",
    tags: ["soul", "memphis", "cuivres", "ballade"],
    energie: 3, etrange: 3, danse: 5 },

  { titre: "Quiet Storm", artiste: "Smokey Robinson", album: "A Quiet Storm",
    lien: "https://music.youtube.com/watch?v=c52DagmSTdI", note: "",
    ambiance: "soleil", style: "Soul quiet storm", annee: 1975, bpm: 84, voix: "chant",
    tags: ["soul", "motown", "nocturne", "ballade"],
    energie: 2, etrange: 3, danse: 3 },

  { titre: "Can't Get Enough", artiste: "Alissia & Anderson .Paak", album: "K-POPS!",
    lien: "https://music.youtube.com/watch?v=Jbz_1TH69Q0", note: "",
    ambiance: "soleil", style: "Funk-soul d'aujourd'hui", annee: 2024, bpm: 105, voix: "chant",
    tags: ["funk", "soul", "rnb", "cuivres"],
    energie: 6, etrange: 3, danse: 7 },

  { titre: "YOU HAVE TO LEAVE!!!", artiste: "Hyas et Tactic 24", album: "LOUDER!!!",
    lien: "https://music.youtube.com/watch?v=yM_KeoOHVy8", note: "",
    ambiance: "piste", style: "Rage, électro dure", annee: 2024, bpm: 150, voix: "rap",
    tags: ["rap", "electro", "club", "hyperpop"],
    energie: 10, etrange: 8, danse: 8 },

  { titre: "Feisty", artiste: "Smerz", album: "Feisty",
    lien: "https://music.youtube.com/watch?v=0_KGch347UI", note: "",
    ambiance: "piste", style: "Pop électronique glacée", annee: 2021, bpm: 120, voix: "chant",
    tags: ["electro", "pop", "minimal", "expérimental"],
    energie: 5, etrange: 7, danse: 6 },

  { titre: "Cassius 1999 (Radio Edit)", artiste: "Cassius", album: "1999",
    lien: "https://music.youtube.com/watch?v=J8fMAXnDocs", note: "",
    ambiance: "piste", style: "French touch", annee: 1999, bpm: 124, voix: "instru",
    tags: ["house", "french touch", "club", "disco"],
    energie: 8, etrange: 2, danse: 10 },

  { titre: "SWING", artiste: "Angie", album: "SWING",
    lien: "https://music.youtube.com/watch?v=guDSFndnX_M", note: "",
    ambiance: "piste", style: "Rap afro-R&B", annee: 2024, bpm: 105, voix: "rap",
    tags: ["rap", "rnb", "afro", "solaire"],
    energie: 6, etrange: 5, danse: 7 },

  { titre: "CSIRAC", artiste: "Ninajirachi", album: "I Love My Computer",
    lien: "https://music.youtube.com/watch?v=L_rc7qJyFOQ", note: "",
    ambiance: "piste", style: "Électro club", annee: 2025, bpm: 140, voix: "instru",
    tags: ["electro", "club", "hyperpop", "synthés"],
    energie: 9, etrange: 7, danse: 8 },

  { titre: "Nomad", artiste: "Clairo", album: "Charm",
    lien: "https://music.youtube.com/watch?v=RdRD80xT2mc", note: "",
    ambiance: "brume", style: "Soft rock seventies", annee: 2024, bpm: 80, voix: "chant",
    tags: ["indie", "pop", "ballade", "piano"],
    energie: 2, etrange: 3, danse: 2 },

  { titre: "Heaven is a Home", artiste: "Kali Uchis", album: "Sincerely",
    lien: "https://music.youtube.com/watch?v=3CsPC9C8Oa4", note: "",
    ambiance: "brume", style: "R&B rêveur", annee: 2025, bpm: 75, voix: "chant",
    tags: ["rnb", "pop", "voix aérienne", "ballade"],
    energie: 2, etrange: 4, danse: 3 },

  { titre: "Where I Sit", artiste: "Men I Trust", album: "Equus Caballus",
    lien: "https://music.youtube.com/watch?v=IGrobvR8WtA", note: "",
    ambiance: "brume", style: "Dream pop", annee: 2025, bpm: 95, voix: "chant",
    tags: ["indie", "dream pop", "guitares", "voix aérienne"],
    energie: 3, etrange: 3, danse: 4 },

  { titre: "The Field", artiste: "Blood Orange feat. Caroline Polachek & Daniel Caesar", album: "Essex Honey",
    lien: "https://music.youtube.com/watch?v=Brt_wrBrSqQ", note: "",
    ambiance: "brume", style: "Pop de chambre", annee: 2025, bpm: 80, voix: "chant",
    tags: ["rnb", "indie", "cordes", "mélancolique"],
    energie: 3, etrange: 6, danse: 2 },

  { titre: "Six Songs for Invisible Gardens", artiste: "Green-House", album: "Six Songs for Invisible Gardens",
    lien: "https://music.youtube.com/watch?v=nqCTPxdW9tQ", note: "", long: true,
    ambiance: "brume", style: "Ambient", annee: 2020, bpm: 60, voix: "instru",
    tags: ["ambient", "synthés", "nature", "long"],
    energie: 0, etrange: 7, danse: 0 },

  { titre: "Plume Valley", artiste: "Windows96", album: "Plume Valley",
    lien: "https://music.youtube.com/watch?v=MFBOtWq7dsE", note: "", long: true,
    ambiance: "brume", style: "Ambient vaporwave", annee: 2019, bpm: 60, voix: "instru",
    tags: ["ambient", "vaporwave", "synthés", "long"],
    energie: 1, etrange: 8, danse: 0 },

  { titre: "Fly-day Chinatown", artiste: "Yasuha", album: "Transit",
    lien: "https://music.youtube.com/watch?v=hci81q8Q49Q", note: "",
    ambiance: "soleil", style: "City pop", annee: 1981, bpm: 125, voix: "chant",
    tags: ["citypop", "funk", "disco", "japon"],
    energie: 7, etrange: 4, danse: 8 },

  { titre: "私のすべて", artiste: "Pizzicato Five", album: "The Band of 20th Century",
    lien: "https://music.youtube.com/watch?v=SD_Hk_O5YFA", note: "",
    ambiance: "ailleurs", style: "Shibuya-kei", annee: 1986, bpm: 120, voix: "chant",
    tags: ["citypop", "pop", "lounge", "japon"],
    energie: 5, etrange: 6, danse: 6 },

  { titre: "Euryale", artiste: "Serge Bulot", album: "Euryale",
    lien: "https://music.youtube.com/watch?v=5P2hiU8J5QE", note: "",
    ambiance: "ailleurs", style: "Synthés minimalistes", annee: 1983, bpm: 100, voix: "instru",
    tags: ["electro", "synthés", "minimal", "expérimental"],
    energie: 3, etrange: 7, danse: 2 },

  { titre: "Big City Life", artiste: "Mattafix", album: "Signs of a Struggle",
    lien: "https://music.youtube.com/browse/MPREb_JvDDGFtLBYc", note: "",
    ambiance: "soleil", style: "Reggae-pop", annee: 2005, bpm: 95, voix: "chant",
    tags: ["pop", "reggae", "soul", "solaire"],
    energie: 5, etrange: 2, danse: 6 },

  { titre: "Not Much 2 Say", artiste: "Jadasea", album: "Not Much 2 Say",
    lien: "https://music.youtube.com/watch?v=qQb4ZDpS74Q", note: "",
    ambiance: "bitume", style: "Rap lo-fi londonien", annee: 2021, bpm: 85, voix: "rap",
    tags: ["rap", "lofi", "jazz", "nocturne"],
    energie: 3, etrange: 6, danse: 2 },

  { titre: "good girl, lassie.", artiste: "is it sunday?", album: "good girl, give them reason to stare.",
    lien: "https://music.youtube.com/watch?v=09hEFrUZrXA", note: "",
    ambiance: "electrique", style: "Indie émo", annee: 2023, bpm: 120, voix: "chant",
    tags: ["indie", "rock", "guitares", "mélancolique"],
    energie: 5, etrange: 6, danse: 3 },

  { titre: "Scheherazade, Op. 35: III. The Young Prince and The Young Princess", artiste: "Rimsky-Korsakov, New York Philharmonic", album: "",
    lien: "https://music.youtube.com/watch?v=07pZtrFkfWo", note: "", connu: true,
    ambiance: "brume", style: "Romantique russe", annee: 1888, bpm: 70, voix: "instru",
    tags: ["classique", "orchestre", "cordes", "romantique"],
    energie: 2, etrange: 3, danse: 1 },

  { titre: "Piano Concerto No. 2: I. Moderato", artiste: "Rachmaninoff, Krystian Zimerman", album: "",
    lien: "https://music.youtube.com/watch?v=caR7C2SHdFI", note: "", connu: true,
    ambiance: "epopee", style: "Concerto romantique", annee: 1901, bpm: 70, voix: "instru",
    tags: ["classique", "piano", "orchestre", "romantique"],
    energie: 6, etrange: 2, danse: 0 },

  { titre: "Serenata D.957", artiste: "Schubert, The Royal Schubert Orchestra", album: "",
    lien: "https://music.youtube.com/watch?v=Huy791G17Ak", note: "", connu: true,
    ambiance: "brume", style: "Romantique", annee: 1828, bpm: 70, voix: "instru",
    tags: ["classique", "cordes", "ballade", "romantique"],
    energie: 1, etrange: 2, danse: 0 },

  { titre: "Ma Tfel", artiste: "Ziad Rahbani", album: "",
    lien: "https://music.youtube.com/watch?v=NLurnvYk0aI", note: "",
    ambiance: "ailleurs", style: "Jazz oriental libanais", annee: 1978, bpm: 100, voix: "chant",
    tags: ["monde", "jazz", "funk", "arabe"],
    energie: 5, etrange: 6, danse: 6 },

  { titre: "Close the Door", artiste: "Teddy Pendergrass", album: "",
    lien: "https://music.youtube.com/watch?v=QEbyvA9srrE", note: "",
    ambiance: "soleil", style: "Philly soul", annee: 1978, bpm: 72, voix: "chant",
    tags: ["soul", "philly", "ballade", "nocturne"],
    energie: 2, etrange: 2, danse: 4 },

  { titre: "Motherless Child", artiste: "Marvin Holmes and Justice", album: "",
    lien: "https://music.youtube.com/watch?v=JXwSLmHlu_U", note: "",
    ambiance: "soleil", style: "Funk psychédélique", annee: 1971, bpm: 100, voix: "chant",
    tags: ["funk", "soul", "psyché", "cuivres"],
    energie: 6, etrange: 5, danse: 7 },

  { titre: "You Ought To Know Me", artiste: "David Ruffin", album: "",
    lien: "https://music.youtube.com/watch?v=q7LXyZse14I", note: "",
    ambiance: "soleil", style: "Soul seventies", annee: 1975, bpm: 100, voix: "chant",
    tags: ["soul", "motown", "cordes", "solaire"],
    energie: 5, etrange: 3, danse: 6 },

  { titre: "Les matins d'hiver", artiste: "Gérard Lenorman", album: "",
    lien: "https://music.youtube.com/watch?v=ELF91NCD_-I", note: "",
    ambiance: "soleil", style: "Chanson seventies", annee: 1977, bpm: 90, voix: "chant",
    tags: ["chanson", "ballade", "cordes", "mélancolique"],
    energie: 2, etrange: 3, danse: 1 },

  { titre: "(v)oOOOOOOooo", artiste: "⣎⡇ꉺლ༽இ•̛)ྀ◞ ༎ຶ ༽ৣৢ؞ৢ؞ؖ ꉺლ", album: "",
    lien: "https://music.youtube.com/watch?v=29Sh3yEaBP8", note: "",
    ambiance: "ailleurs", style: "Ambient d'internet", annee: 2018, bpm: 70, voix: "instru",
    tags: ["ambient", "vaporwave", "expérimental", "glitch"],
    energie: 2, etrange: 9, danse: 1 },

  { titre: "err:log", artiste: "cast heal", album: "",
    lien: "https://music.youtube.com/watch?v=DCcAlLqOM8E", note: "",
    ambiance: "ailleurs", style: "Électronique glitch", annee: 2022, bpm: 90, voix: "instru",
    tags: ["electro", "glitch", "expérimental", "ambient"],
    energie: 4, etrange: 8, danse: 3 },

  { titre: "Till", artiste: "Conjunto Capri", album: "",
    lien: "https://music.youtube.com/watch?v=5Ov-yEqFYvk", note: "",
    ambiance: "brume", style: "Lounge latino", annee: 1965, bpm: 80, voix: "instru",
    tags: ["jazz", "lounge", "monde", "orgue"],
    energie: 2, etrange: 5, danse: 3 },

  { titre: "Zelda's Lullaby (Skyward Sword)", artiste: "The Legend of Zelda", album: "",
    lien: "https://music.youtube.com/watch?v=YHO6EDIbGlk", note: "", connu: true,
    ambiance: "brume", style: "Musique de jeu vidéo", annee: 2011, bpm: 60, voix: "instru",
    tags: ["bo", "orchestre", "harpe", "berceuse"],
    energie: 1, etrange: 3, danse: 0 },

  { titre: "Great Fairy's Fountain", artiste: "Sleeping Phoenix", album: "",
    lien: "https://music.youtube.com/watch?v=O5HGP6yf0GA", note: "",
    ambiance: "brume", style: "Jeu vidéo en douceur", annee: 2020, bpm: 70, voix: "instru",
    tags: ["bo", "ambient", "piano", "berceuse"],
    energie: 1, etrange: 4, danse: 0 },

  { titre: "The Flight of the Bumble-bee", artiste: "Rimsky-Korsakov, Neeme Järvi", album: "",
    lien: "https://music.youtube.com/watch?v=kh6gSLInIXo", note: "", connu: true,
    ambiance: "epopee", style: "Virtuosité orchestrale", annee: 1900, bpm: 170, voix: "instru",
    tags: ["classique", "orchestre", "virtuose", "rapide"],
    energie: 8, etrange: 3, danse: 1 },

  { titre: "Tócame (feat. Dillom)", artiste: "Six Sex", album: "",
    lien: "https://music.youtube.com/watch?v=rh6agFmfyhI", note: "",
    ambiance: "piste", style: "Électro-perreo", annee: 2023, bpm: 128, voix: "chant",
    tags: ["electro", "reggaeton", "club", "latin"],
    energie: 8, etrange: 6, danse: 9 },

  { titre: "夜に駆ける", artiste: "YOASOBI", album: "",
    lien: "https://music.youtube.com/watch?v=by4SYYWlhEs", note: "",
    ambiance: "electrique", style: "J-pop", annee: 2019, bpm: 130, voix: "chant",
    tags: ["pop", "japon", "piano", "rapide"],
    energie: 8, etrange: 3, danse: 6 },

  { titre: "Be Ever Wonderful", artiste: "Earth, Wind & Fire", album: "",
    lien: "https://music.youtube.com/watch?v=HLyU8BWfGKA", note: "",
    ambiance: "soleil", style: "Soul ballade", annee: 1977, bpm: 70, voix: "chant",
    tags: ["soul", "ballade", "cuivres", "cordes"],
    energie: 2, etrange: 2, danse: 3 },

  { titre: "Walking With Ice Cream", artiste: "Tupperwave", album: "",
    lien: "https://music.youtube.com/watch?v=7Uv3P8-rhB8", note: "",
    ambiance: "brume", style: "Vaporwave douce", annee: 2017, bpm: 95, voix: "instru",
    tags: ["vaporwave", "ambient", "funk", "synthés"],
    energie: 3, etrange: 6, danse: 4 },

  { titre: "At Doom's Gate", artiste: "Mick Gordon", album: "",
    lien: "https://music.youtube.com/watch?v=Lp-TdtDYGAA", note: "",
    ambiance: "epopee", style: "Metal de jeu vidéo", annee: 2016, bpm: 140, voix: "instru",
    tags: ["metal", "bo", "guitares", "synthés"],
    energie: 10, etrange: 5, danse: 2 },

  { titre: "Have It All (feat. Pharrell)", artiste: "Gucci Mane", album: "",
    lien: "https://music.youtube.com/watch?v=RdAAAUPYti4", note: "",
    ambiance: "bitume", style: "Trap", annee: 2020, bpm: 75, voix: "rap",
    tags: ["rap", "trap", "sud", "solaire"],
    energie: 5, etrange: 3, danse: 6 },

  { titre: "Dove", artiste: "Orca", album: "",
    lien: "https://music.youtube.com/watch?v=4uX1fGGDD9k", note: "",
    ambiance: "bitume", style: "Rap brumeux", annee: 2022, bpm: 80, voix: "rap",
    tags: ["rap", "nocturne", "expérimental", "lofi"],
    energie: 3, etrange: 7, danse: 2 },

  { titre: "remember?", artiste: "svnti", album: "",
    lien: "https://music.youtube.com/watch?v=4qCZ1WcPWr4", note: "",
    ambiance: "bitume", style: "Rap lo-fi", annee: 2022, bpm: 80, voix: "rap",
    tags: ["rap", "lofi", "ambient", "mélancolique"],
    energie: 2, etrange: 6, danse: 2 },

  { titre: "Yesterday I Had the Blues", artiste: "Harold Melvin & The Blue Notes", album: "",
    lien: "https://music.youtube.com/watch?v=jCwDytox1sM", note: "",
    ambiance: "soleil", style: "Philly soul", annee: 1972, bpm: 90, voix: "chant",
    tags: ["soul", "philly", "cordes", "ballade"],
    energie: 4, etrange: 2, danse: 5 },

  { titre: "Clair de Lune", artiste: "Claude Debussy", album: "",
    lien: "https://music.youtube.com/watch?v=WKU8DJzipW4", note: "", connu: true,
    ambiance: "brume", style: "Impressionnisme", annee: 1905, bpm: 60, voix: "instru",
    tags: ["classique", "piano", "ballade", "romantique"],
    energie: 1, etrange: 1, danse: 0 },

  { titre: "Bobby", artiste: "Phoebe Bridgers", album: "",
    lien: "https://music.youtube.com/watch?v=yLbf1Wgida4", note: "",
    ambiance: "brume", style: "Folk indé", annee: 2018, bpm: 80, voix: "chant",
    tags: ["indie", "folk", "guitares", "mélancolique"],
    energie: 1, etrange: 4, danse: 1 },

  { titre: "Stop The Wedding!", artiste: "Ashe", album: "",
    lien: "https://music.youtube.com/watch?v=WNxAvQNsJuM", note: "",
    ambiance: "electrique", style: "Pop", annee: 2023, bpm: 110, voix: "chant",
    tags: ["pop", "piano", "ballade", "rock"],
    energie: 5, etrange: 3, danse: 4 },

  { titre: "Sing", artiste: "Carpenters", album: "",
    lien: "https://music.youtube.com/watch?v=U07qx3MBEoI", note: "",
    ambiance: "soleil", style: "Soft pop seventies", annee: 1973, bpm: 90, voix: "chant",
    tags: ["pop", "ballade", "choeur", "solaire"],
    energie: 2, etrange: 2, danse: 3 },

  { titre: "premium package", artiste: "SOMA", album: "",
    lien: "https://music.youtube.com/watch?v=ycoaG_klmkY", note: "",
    ambiance: "ailleurs", style: "Hyperpop", annee: 2023, bpm: 140, voix: "chant",
    tags: ["electro", "hyperpop", "expérimental", "pop"],
    energie: 7, etrange: 8, danse: 6 },

  { titre: "Gingerbread Boy", artiste: "Miles Davis", album: "",
    lien: "https://music.youtube.com/watch?v=fVndRGAF8Gg", note: "",
    ambiance: "ailleurs", style: "Jazz post-bop", annee: 1966, bpm: 200, voix: "instru",
    tags: ["jazz", "cuivres", "rapide", "expérimental"],
    energie: 7, etrange: 6, danse: 3 },

  { titre: "Forse Domani", artiste: "Giampiero Boneschi & Sergio Farina", album: "",
    lien: "https://music.youtube.com/watch?v=84hFDVEK3jQ", note: "",
    ambiance: "brume", style: "Lounge jazz italien", annee: 1970, bpm: 95, voix: "instru",
    tags: ["jazz", "lounge", "library", "cordes"],
    energie: 3, etrange: 5, danse: 4 },

  { titre: "I See Your Face Before Me", artiste: "Miles Davis", album: "",
    lien: "https://music.youtube.com/watch?v=0us-KJG6UIM", note: "",
    ambiance: "brume", style: "Jazz ballade", annee: 1958, bpm: 60, voix: "instru",
    tags: ["jazz", "ballade", "cuivres", "nocturne"],
    energie: 1, etrange: 3, danse: 1 },

  { titre: "Funky Fanfare", artiste: "Keith Mansfield", album: "",
    lien: "https://music.youtube.com/watch?v=tUFwQjOpqJM", note: "",
    ambiance: "soleil", style: "Funk de librairie", annee: 1968, bpm: 110, voix: "instru",
    tags: ["funk", "cuivres", "library", "jazz"],
    energie: 7, etrange: 4, danse: 8 },

  { titre: "The Empty Room", artiste: "Haruomi Hosono", album: "",
    lien: "https://music.youtube.com/watch?v=CYC30CSXG4o", note: "",
    ambiance: "brume", style: "Ambient japonais", annee: 1985, bpm: 70, voix: "instru",
    tags: ["ambient", "synthés", "japon", "minimal"],
    energie: 1, etrange: 6, danse: 0 },

  { titre: "Symphonie n° 6 : I. Allegro energico, ma non troppo", artiste: "Mahler, Berliner Philharmoniker", album: "",
    lien: "https://music.youtube.com/watch?v=hoVnIDmuwLw", note: "", connu: true,
    ambiance: "epopee", style: "Symphonie tragique", annee: 1904, bpm: 120, voix: "instru",
    tags: ["classique", "orchestre", "cuivres", "romantique"],
    energie: 8, etrange: 4, danse: 1 },

  { titre: "Symphonie n° 2 : IV. Finale (Allegro moderato)", artiste: "Sibelius, Berliner Philharmoniker", album: "",
    lien: "https://music.youtube.com/watch?v=-10jYSvWYeI", note: "", connu: true,
    ambiance: "epopee", style: "Finale symphonique", annee: 1902, bpm: 100, voix: "instru",
    tags: ["classique", "orchestre", "cuivres", "romantique"],
    energie: 6, etrange: 3, danse: 0 },

  { titre: "Resurrections", artiste: "Lena Raine", album: "",
    lien: "https://music.youtube.com/watch?v=-YjgOzSQNQ0", note: "",
    ambiance: "epopee", style: "Musique de jeu vidéo", annee: 2018, bpm: 120, voix: "instru",
    tags: ["bo", "electro", "piano", "synthés"],
    energie: 6, etrange: 4, danse: 4 },

  { titre: "Moments (Voice Memo)", artiste: "Teesa", album: "",
    lien: "https://music.youtube.com/watch?v=R8BmJxhrZdo", note: "",
    ambiance: "brume", style: "Mémo vocal intime", annee: 2022, bpm: 70, voix: "chant",
    tags: ["rnb", "lofi", "mélancolique", "voix aérienne"],
    energie: 1, etrange: 7, danse: 0 },

  { titre: "Wake Up Everybody", artiste: "Harold Melvin & The Blue Notes", album: "",
    lien: "https://music.youtube.com/watch?v=FMR6eMHjqIo", note: "",
    ambiance: "soleil", style: "Philly soul", annee: 1975, bpm: 100, voix: "chant",
    tags: ["soul", "philly", "cordes", "piano"],
    energie: 4, etrange: 2, danse: 5 },

  { titre: "Out Of The Picture", artiste: "Tavares", album: "",
    lien: "https://music.youtube.com/watch?v=w_VZD6RcQI4", note: "",
    ambiance: "soleil", style: "Soul seventies", annee: 1975, bpm: 108, voix: "chant",
    tags: ["soul", "disco", "cordes", "solaire"],
    energie: 5, etrange: 3, danse: 6 },

  { titre: "Swing and Jump", artiste: "Alba Lamar", album: "",
    lien: "https://music.youtube.com/watch?v=pNPw1PZboWI", note: "",
    ambiance: "piste", style: "Électro swing", annee: 2015, bpm: 125, voix: "instru",
    tags: ["electro", "swing", "jazz", "club"],
    energie: 7, etrange: 5, danse: 8 },

  { titre: "Overjoyed", artiste: "Stevie Wonder", album: "",
    lien: "https://music.youtube.com/watch?v=678STgx-Esw", note: "",
    ambiance: "soleil", style: "Soul ballade", annee: 1985, bpm: 72, voix: "chant",
    tags: ["soul", "ballade", "piano", "motown"],
    energie: 2, etrange: 2, danse: 2 },

  { titre: "Concerto pour piano n° 21 : II. Andante", artiste: "Mozart, London Mozart Players", album: "",
    lien: "https://music.youtube.com/watch?v=sgqtFZ9S5sA", note: "", connu: true,
    ambiance: "brume", style: "Classique", annee: 1785, bpm: 60, voix: "instru",
    tags: ["classique", "piano", "orchestre", "ballade"],
    energie: 1, etrange: 1, danse: 0 },

  { titre: "My Cherie Amour", artiste: "Stevie Wonder", album: "",
    lien: "https://music.youtube.com/watch?v=Fjufjv4rH0s", note: "",
    ambiance: "soleil", style: "Motown", annee: 1969, bpm: 110, voix: "chant",
    tags: ["soul", "motown", "cordes", "solaire"],
    energie: 3, etrange: 1, danse: 5 },

  { titre: "Outstanding", artiste: "The Gap Band", album: "",
    lien: "https://music.youtube.com/watch?v=xBcpaB8lq44", note: "",
    ambiance: "soleil", style: "Boogie funk", annee: 1982, bpm: 98, voix: "chant",
    tags: ["funk", "boogie", "synthés", "solaire"],
    energie: 4, etrange: 2, danse: 7 },

  { titre: "Come Outside", artiste: "ScarLip", album: "",
    lien: "https://music.youtube.com/watch?v=q34xnPe-C1g", note: "",
    ambiance: "bitume", style: "Drill new-yorkaise", annee: 2022, bpm: 140, voix: "rap",
    tags: ["rap", "drill", "new york", "nocturne"],
    energie: 8, etrange: 5, danse: 6 },

  { titre: "MINISKIRT", artiste: "Aliyah's Interlude", album: "",
    lien: "https://music.youtube.com/watch?v=WZKXguICxUo", note: "",
    ambiance: "piste", style: "Rap house-pop", annee: 2024, bpm: 125, voix: "rap",
    tags: ["rap", "house", "club", "pop"],
    energie: 7, etrange: 5, danse: 8 },

  { titre: "Les volets clos", artiste: "Paul Mauriat", album: "",
    lien: "https://music.youtube.com/watch?v=lkHNEb72DH0", note: "",
    ambiance: "brume", style: "Orchestre easy listening", annee: 1972, bpm: 80, voix: "instru",
    tags: ["orchestre", "lounge", "cordes", "chanson"],
    energie: 2, etrange: 4, danse: 2 },

  { titre: "Bi Kelma Menak", artiste: "Sherine", album: "",
    lien: "https://music.youtube.com/watch?v=BSHhX8nypcY", note: "",
    ambiance: "ailleurs", style: "Pop égyptienne", annee: 2014, bpm: 95, voix: "chant",
    tags: ["monde", "arabe", "pop", "cordes"],
    energie: 4, etrange: 5, danse: 5 },

  { titre: "Raubíri", artiste: "Marcel Gidote's Holy Crab", album: "",
    lien: "https://music.youtube.com/watch?v=CA1ZmK3DC8o", note: "",
    ambiance: "ailleurs", style: "Rock psyché-jazz tchèque", annee: 2022, bpm: 110, voix: "instru",
    tags: ["rock", "jazz", "psyché", "expérimental"],
    energie: 6, etrange: 8, danse: 4 },

  { titre: "I Miss You (Part 1)", artiste: "David Ruffin", album: "",
    lien: "https://music.youtube.com/watch?v=sbNioahCQlA", note: "",
    ambiance: "soleil", style: "Soul seventies", annee: 1975, bpm: 80, voix: "chant",
    tags: ["soul", "ballade", "cordes", "nocturne"],
    energie: 3, etrange: 3, danse: 3 },

  { titre: "Walk Away From Love", artiste: "David Ruffin", album: "",
    lien: "https://music.youtube.com/watch?v=34yv3D8oYBI", note: "",
    ambiance: "soleil", style: "Soul disco", annee: 1975, bpm: 115, voix: "chant",
    tags: ["soul", "disco", "cordes", "solaire"],
    energie: 6, etrange: 2, danse: 8 },

  { titre: "Through the Fire (A COLORS SHOW)", artiste: "Chaka Khan", album: "",
    lien: "https://music.youtube.com/watch?v=1DqzwJlvX-0", note: "",
    ambiance: "soleil", style: "Soul ballade, en live", annee: 2023, bpm: 70, voix: "chant",
    tags: ["soul", "rnb", "ballade", "piano"],
    energie: 3, etrange: 2, danse: 2 },

  { titre: "Jōdo", artiste: "Hiroshi Sato", album: "",
    lien: "https://music.youtube.com/watch?v=xCJIDvmyKO8", note: "",
    ambiance: "brume", style: "Ambient japonais", annee: 1985, bpm: 80, voix: "instru",
    tags: ["ambient", "japon", "synthés", "jazz"],
    energie: 2, etrange: 6, danse: 2 },

  { titre: "Life goes on", artiste: "Steven Boyd", album: "",
    lien: "https://music.youtube.com/watch?v=uYa_YH9AH3A", note: "",
    ambiance: "soleil", style: "Boogie AOR", annee: 1983, bpm: 105, voix: "chant",
    tags: ["soul", "boogie", "synthés", "solaire"],
    energie: 5, etrange: 5, danse: 6 },

  { titre: "Symphonie n° 1 : I. Allegro (molto moderato)", artiste: "Bruckner, Orchestre Métropolitain", album: "",
    lien: "https://music.youtube.com/watch?v=_Ak0zpy-ICU", note: "", connu: true,
    ambiance: "epopee", style: "Symphonie romantique", annee: 1866, bpm: 100, voix: "instru",
    tags: ["classique", "orchestre", "cuivres", "romantique"],
    energie: 7, etrange: 4, danse: 1 },

  { titre: "Mermaid", artiste: "Sade Adu", album: "",
    lien: "https://music.youtube.com/watch?v=dwTedc_QUOI", note: "",
    ambiance: "soleil", style: "Soul feutrée", annee: 2010, bpm: 75, voix: "chant",
    tags: ["soul", "rnb", "nocturne", "ballade"],
    energie: 2, etrange: 4, danse: 3 },

  { titre: "I Miss You, Pt. 1", artiste: "Harold Melvin & The Blue Notes", album: "",
    lien: "https://music.youtube.com/watch?v=4fIeEVHhGyQ", note: "",
    ambiance: "soleil", style: "Philly soul", annee: 1972, bpm: 75, voix: "chant",
    tags: ["soul", "philly", "ballade", "cordes"],
    energie: 2, etrange: 2, danse: 3 },

  { titre: "The Adults Are Talking", artiste: "The Strokes", album: "",
    lien: "https://music.youtube.com/watch?v=826mxiKjoP0", note: "",
    ambiance: "electrique", style: "Rock indé new-yorkais", annee: 2020, bpm: 165, voix: "chant",
    tags: ["rock", "indie", "guitares", "new york"],
    energie: 6, etrange: 2, danse: 6 },

  { titre: "The Weekend (Radio Edit)", artiste: "Michael Gray", album: "",
    lien: "https://music.youtube.com/watch?v=uDGJ9DyF25I", note: "",
    ambiance: "piste", style: "House disco", annee: 2004, bpm: 127, voix: "chant",
    tags: ["house", "disco", "club", "solaire"],
    energie: 8, etrange: 2, danse: 9 },

  { titre: "The Only Thing They Fear...", artiste: "Banana Jim", album: "",
    lien: "https://music.youtube.com/watch?v=w5k4YLWvOT0", note: "",
    ambiance: "epopee", style: "Metal de jeu vidéo", annee: 2020, bpm: 130, voix: "instru",
    tags: ["metal", "bo", "guitares", "rapide"],
    energie: 10, etrange: 6, danse: 2 },

  { titre: "Reasons", artiste: "Earth, Wind & Fire", album: "",
    lien: "https://music.youtube.com/watch?v=zTeD3RWvE6A", note: "",
    ambiance: "soleil", style: "Soul ballade", annee: 1975, bpm: 68, voix: "chant",
    tags: ["soul", "ballade", "cuivres", "nocturne"],
    energie: 2, etrange: 2, danse: 2 },

  { titre: "ANTIOXYDANT", artiste: "Mairo", album: "",
    lien: "https://music.youtube.com/watch?v=fYky_uuCzVE", note: "",
    ambiance: "bitume", style: "Rap français", annee: 2023, bpm: 90, voix: "rap",
    tags: ["rap", "boom bap", "france", "samples soul"],
    energie: 6, etrange: 5, danse: 5 },

  { titre: "Can't Take My Eyes Off You (Original Extended Version)", artiste: "Boys Town Gang", album: "",
    lien: "https://music.youtube.com/watch?v=i0iD4KzoIqk", note: "",
    ambiance: "piste", style: "Hi-NRG disco", annee: 1982, bpm: 130, voix: "chant",
    tags: ["disco", "club", "cuivres", "solaire"],
    energie: 8, etrange: 3, danse: 10 },

  { titre: "Fantasy", artiste: "Aquarian Dream", album: "",
    lien: "https://music.youtube.com/watch?v=2p8Ev0jm8kM", note: "",
    ambiance: "soleil", style: "Jazz-funk disco", annee: 1978, bpm: 115, voix: "chant",
    tags: ["funk", "disco", "jazz", "solaire"],
    energie: 6, etrange: 4, danse: 8 },

  { titre: "Mutant", artiste: "Arca", album: "",
    lien: "https://music.youtube.com/watch?v=pW4I_y56DC0", note: "",
    ambiance: "ailleurs", style: "Électronique expérimentale", annee: 2015, bpm: 90, voix: "instru",
    tags: ["electro", "expérimental", "glitch", "nocturne"],
    energie: 6, etrange: 9, danse: 2 },

  { titre: "No Voy a Llorar", artiste: "DJ Pablito", album: "",
    lien: "https://music.youtube.com/watch?v=hSUAlPKgeto", note: "",
    ambiance: "piste", style: "Cumbia club", annee: 2023, bpm: 100, voix: "chant",
    tags: ["latin", "club", "electro", "reggaeton"],
    energie: 7, etrange: 6, danse: 8 },

  { titre: "MINIBUS AVEC LES PETITS", artiste: "Igouh", album: "",
    lien: "https://music.youtube.com/watch?v=4xeY7BinY9E", note: "",
    ambiance: "bitume", style: "Rap français", annee: 2024, bpm: 140, voix: "rap",
    tags: ["rap", "france", "trap", "nocturne"],
    energie: 7, etrange: 6, danse: 6 },

  { titre: "STOPLIGHT", artiste: "SUMIN", album: "",
    lien: "https://music.youtube.com/watch?v=Ox3uJaLsXgI", note: "",
    ambiance: "piste", style: "R&B électronique coréen", annee: 2023, bpm: 110, voix: "chant",
    tags: ["rnb", "electro", "pop", "club"],
    energie: 5, etrange: 5, danse: 6 },

  { titre: "Moral Tem Hora", artiste: "Cristina Camargo", album: "",
    lien: "https://music.youtube.com/watch?v=O5FlEwQ1IHo", note: "",
    ambiance: "ailleurs", style: "Musique brésilienne", annee: 1975, bpm: 105, voix: "chant",
    tags: ["monde", "bresil", "funk", "samba"],
    energie: 5, etrange: 6, danse: 6 },

  { titre: "Une pieuvre dans un seau", artiste: "Surprise", album: "",
    lien: "https://music.youtube.com/watch?v=eEXjdCmQ5pU", note: "",
    ambiance: "ailleurs", style: "Pop bizarre", annee: 2022, bpm: 100, voix: "chant",
    tags: ["pop", "expérimental", "france", "chanson"],
    energie: 4, etrange: 7, danse: 3 },

  { titre: "all-american bitch", artiste: "Olivia Rodrigo", album: "",
    lien: "https://music.youtube.com/watch?v=jPzKKSzqYzk", note: "",
    ambiance: "electrique", style: "Pop-rock", annee: 2023, bpm: 130, voix: "chant",
    tags: ["rock", "pop", "guitares", "rapide"],
    energie: 7, etrange: 2, danse: 4 },

  { titre: "honeybee", artiste: "Olivia Rodrigo", album: "",
    lien: "https://music.youtube.com/watch?v=OrNTGMmSpz0", note: "",
    ambiance: "electrique", style: "Pop", annee: 2025, bpm: 100, voix: "chant",
    tags: ["pop", "guitares", "ballade", "indie"],
    energie: 3, etrange: 2, danse: 3 },

  { titre: "264bpm Song", artiste: "Andrew Baena", album: "",
    lien: "https://music.youtube.com/watch?v=kSF0hIIDofM", note: "",
    ambiance: "electrique", style: "Metal à 264 bpm", annee: 2023, bpm: 264, voix: "instru",
    tags: ["metal", "guitares", "rapide", "expérimental"],
    energie: 10, etrange: 8, danse: 3 },

  { titre: "Hooked (Remastered)", artiste: "D.R.I.", album: "",
    lien: "https://music.youtube.com/watch?v=PXIuSHT4YoE", note: "",
    ambiance: "electrique", style: "Crossover thrash", annee: 1987, bpm: 200, voix: "chant",
    tags: ["punk", "metal", "guitares", "rapide"],
    energie: 10, etrange: 5, danse: 3 },

  { titre: "Bird Call (feat. Lil Wayne & Cam'Ron)", artiste: "JR Writer", album: "",
    lien: "https://music.youtube.com/watch?v=jYb-B1j4ul8", note: "",
    ambiance: "bitume", style: "Rap new-yorkais de mixtape", annee: 2005, bpm: 90, voix: "rap",
    tags: ["rap", "new york", "boom bap", "samples soul"],
    energie: 7, etrange: 4, danse: 5 },

  { titre: "Private Valet", artiste: "Larry June", album: "",
    lien: "https://music.youtube.com/watch?v=TIBbr_u9gBc", note: "",
    ambiance: "bitume", style: "Rap West Coast cool", annee: 2023, bpm: 85, voix: "rap",
    tags: ["rap", "samples soul", "solaire", "west coast"],
    energie: 4, etrange: 3, danse: 5 },

  { titre: "All of Me", artiste: "Andrus, Blackwood & Co.", album: "",
    lien: "https://music.youtube.com/watch?v=t2mSibwG6Hg", note: "",
    ambiance: "soleil", style: "Gospel soul", annee: 1977, bpm: 105, voix: "chant",
    tags: ["soul", "gospel", "funk", "jazz"],
    energie: 5, etrange: 5, danse: 6 },

  { titre: "Glue Song (feat. Clairo)", artiste: "beabadoobee", album: "",
    lien: "https://music.youtube.com/watch?v=9Yy4-LCOi34", note: "",
    ambiance: "brume", style: "Folk-pop indé", annee: 2022, bpm: 80, voix: "chant",
    tags: ["indie", "folk", "ballade", "guitares"],
    energie: 2, etrange: 2, danse: 2 },

  { titre: "we fell in love in october", artiste: "girl in red", album: "",
    lien: "https://music.youtube.com/watch?v=FJX0JPXD2nM", note: "",
    ambiance: "electrique", style: "Bedroom pop", annee: 2018, bpm: 105, voix: "chant",
    tags: ["indie", "pop", "guitares", "mélancolique"],
    energie: 2, etrange: 2, danse: 2 },

  { titre: "BEST INTEREST", artiste: "Tyler, The Creator", album: "",
    lien: "https://music.youtube.com/watch?v=37kWL6Qowq4", note: "",
    ambiance: "soleil", style: "Rap néo-soul", annee: 2024, bpm: 90, voix: "rap",
    tags: ["rap", "soul", "rnb", "solaire"],
    energie: 4, etrange: 3, danse: 5 },

  { titre: "A Lot Has Changed (Rough Trade Session)", artiste: "Weyes Blood", album: "",
    lien: "https://music.youtube.com/watch?v=NmFqLz6tyLA", note: "",
    ambiance: "brume", style: "Folk baroque", annee: 2019, bpm: 70, voix: "chant",
    tags: ["indie", "folk", "piano", "cordes"],
    energie: 2, etrange: 4, danse: 1 },

];
