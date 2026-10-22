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
     long     true pour un long moment (un morceau de 20 minutes et plus) :
              il a son bouton à lui sur la radio, « Longs moments ».
     bandcamp le lien Bandcamp du morceau, s'il y est. Il apparaît dans
              « Écouter en entier sur » (sans pub, et l'artiste touche plus).
              Ex : bandcamp: "https://artiste.bandcamp.com/track/morceau"

   Les réglages (de 0 à 10) servent au moteur de découverte.
   Ils ne sont jamais montrés aux visiteurs. Ajuste-les à l'instinct :
     energie  0 = détente, 10 = ça cogne
     etrange  0 = accessible, 10 = barré (d'où ça sort ?)
     danse    0 = on se pose, 10 = impossible de rester assis

   ⚠ Les valeurs actuelles sont une première estimation faite par Claude.
     Corrige-les comme tu le sens, c'est ta sélection, pas la sienne.
   ════════════════════════════════════════════════════════════════════ */

const MORCEAUX = [

  { titre: "Losin' Weight", artiste: "Cam'ron feat. Prodigy", album: "S.D.E.",
    lien: "https://music.youtube.com/watch?v=RQxJfDU66rw", note: "",
    energie: 6, etrange: 3, danse: 4 },

  { titre: "King Back", artiste: "T.I.", album: "King",
    lien: "https://music.youtube.com/watch?v=Q7KuF4aImt8", note: "",
    energie: 8, etrange: 2, danse: 5 },

  { titre: "What We Do", artiste: "Freeway feat. JAY-Z & Beanie Sigel", album: "Philadelphia Freeway",
    lien: "https://music.youtube.com/watch?v=ITSVEXkuadk", note: "",
    energie: 6, etrange: 2, danse: 4 },

  { titre: "Exhibit C", artiste: "Jay Electronica", album: "Exhibit C",
    lien: "https://music.youtube.com/watch?v=b0c9A74BmcU", note: "",
    energie: 8, etrange: 4, danse: 3 },

  { titre: "Larry Bird", artiste: "Roc Marciano feat. Knowledge the Pirate & GREA8GAWD", album: "Marciology",
    lien: "https://music.youtube.com/watch?v=KZ8Xu74Ysrk", note: "",
    energie: 4, etrange: 6, danse: 2 },

  { titre: "Flashback", artiste: "Boldy James & ChanHays", album: "Prisoner of Circumstance",
    lien: "https://music.youtube.com/watch?v=vhAFirTDTSM", note: "",
    energie: 4, etrange: 5, danse: 2 },

  { titre: "Summer's Eve", artiste: "Nicholas Craven & Boldy James", album: "Summer's Eve",
    lien: "https://music.youtube.com/watch?v=J-7XkIQcPUQ", note: "",
    energie: 3, etrange: 5, danse: 2 },

  { titre: "I'm the Devil", artiste: "Lil B", album: "6 Kiss",
    lien: "https://music.youtube.com/watch?v=jMbTbVF0u2A", note: "",
    energie: 6, etrange: 9, danse: 3 },

  { titre: "Got to Be Real", artiste: "Cheryl Lynn", album: "Cheryl Lynn",
    lien: "https://music.youtube.com/watch?v=SxW1I0diFqI", note: "",
    energie: 8, etrange: 2, danse: 10 },

  { titre: "Judy", artiste: "Al Green", album: "Let's Stay Together",
    lien: "https://music.youtube.com/watch?v=lcwGFZQLD9Q", note: "",
    energie: 3, etrange: 3, danse: 5 },

  { titre: "Quiet Storm", artiste: "Smokey Robinson", album: "A Quiet Storm",
    lien: "https://music.youtube.com/watch?v=c52DagmSTdI", note: "",
    energie: 2, etrange: 3, danse: 3 },

  { titre: "Can't Get Enough", artiste: "Alissia & Anderson .Paak", album: "K-POPS!",
    lien: "https://music.youtube.com/watch?v=Jbz_1TH69Q0", note: "",
    energie: 5, etrange: 4, danse: 7 },

  { titre: "YOU HAVE TO LEAVE!!!", artiste: "Hyas et Tactic 24", album: "LOUDER!!!",
    lien: "https://music.youtube.com/watch?v=yM_KeoOHVy8", note: "",
    energie: 10, etrange: 8, danse: 9 },

  { titre: "Feisty", artiste: "Smerz", album: "Feisty",
    lien: "https://music.youtube.com/watch?v=0_KGch347UI", note: "",
    energie: 6, etrange: 7, danse: 7 },

  { titre: "Cassius 1999 (Radio Edit)", artiste: "Cassius", album: "1999",
    lien: "https://music.youtube.com/watch?v=J8fMAXnDocs", note: "",
    energie: 8, etrange: 3, danse: 10 },

  { titre: "SWING", artiste: "Angie", album: "SWING",
    lien: "https://music.youtube.com/watch?v=guDSFndnX_M", note: "",
    energie: 7, etrange: 5, danse: 8 },

  { titre: "CSIRAC", artiste: "Ninajirachi", album: "I Love My Computer",
    lien: "https://music.youtube.com/watch?v=L_rc7qJyFOQ", note: "",
    energie: 9, etrange: 8, danse: 8 },

  { titre: "Nomad", artiste: "Clairo", album: "Charm",
    lien: "https://music.youtube.com/watch?v=RdRD80xT2mc", note: "",
    energie: 3, etrange: 3, danse: 3 },

  { titre: "Heaven is a Home", artiste: "Kali Uchis", album: "Sincerely",
    lien: "https://music.youtube.com/watch?v=3CsPC9C8Oa4", note: "",
    energie: 3, etrange: 5, danse: 3 },

  { titre: "Where I Sit", artiste: "Men I Trust", album: "Equus Caballus",
    lien: "https://music.youtube.com/watch?v=IGrobvR8WtA", note: "",
    energie: 3, etrange: 4, danse: 4 },

  { titre: "The Field", artiste: "Blood Orange feat. Caroline Polachek & Daniel Caesar", album: "Essex Honey",
    lien: "https://music.youtube.com/watch?v=Brt_wrBrSqQ", note: "",
    energie: 3, etrange: 6, danse: 2 },

  { titre: "Six Songs for Invisible Gardens", artiste: "Green-House", album: "Six Songs for Invisible Gardens",
    lien: "https://music.youtube.com/watch?v=nqCTPxdW9tQ", note: "", long: true,
    energie: 1, etrange: 7, danse: 0 },

  { titre: "Plume Valley", artiste: "Windows96", album: "Plume Valley",
    lien: "https://music.youtube.com/watch?v=MFBOtWq7dsE", note: "", long: true,
    energie: 1, etrange: 8, danse: 0 },

  { titre: "Fly-day Chinatown", artiste: "Yasuha", album: "Transit",
    lien: "https://music.youtube.com/watch?v=hci81q8Q49Q", note: "",
    energie: 6, etrange: 4, danse: 8 },

  { titre: "私のすべて", artiste: "Pizzicato Five", album: "The Band of 20th Century",
    lien: "https://music.youtube.com/watch?v=SD_Hk_O5YFA", note: "",
    energie: 5, etrange: 6, danse: 6 },

  { titre: "Euryale", artiste: "Serge Bulot", album: "Euryale",
    lien: "https://music.youtube.com/watch?v=5P2hiU8J5QE", note: "",
    energie: 3, etrange: 7, danse: 3 },

  { titre: "Big City Life", artiste: "Mattafix", album: "Signs of a Struggle",
    lien: "https://music.youtube.com/browse/MPREb_JvDDGFtLBYc", note: "",
    energie: 5, etrange: 2, danse: 6 },

  { titre: "Not Much 2 Say", artiste: "Jadasea", album: "Not Much 2 Say",
    lien: "https://music.youtube.com/watch?v=qQb4ZDpS74Q", note: "",
    energie: 3, etrange: 6, danse: 2 },

  { titre: "good girl, lassie.", artiste: "is it sunday?", album: "good girl, give them reason to stare.",
    lien: "https://music.youtube.com/watch?v=09hEFrUZrXA", note: "",
    energie: 4, etrange: 7, danse: 3 },

  { titre: "Scheherazade, Op. 35: III. The Young Prince and The Young Princess", artiste: "New York Philharmonic", album: "",
    lien: "https://music.youtube.com/watch?v=07pZtrFkfWo", note: "",
    energie: 2, etrange: 3, danse: 1 },

  { titre: "Piano Concerto No. 2: I. Moderato", artiste: "Rachmaninoff, Krystian Zimerman", album: "",
    lien: "https://music.youtube.com/watch?v=caR7C2SHdFI", note: "",
    energie: 5, etrange: 2, danse: 1 },

  { titre: "Serenata D.957", artiste: "Schubert, The Royal Schubert Orchestra", album: "",
    lien: "https://music.youtube.com/watch?v=Huy791G17Ak", note: "",
    energie: 2, etrange: 2, danse: 1 },

  { titre: "Ma Tfel", artiste: "Ziad Rahbani", album: "",
    lien: "https://music.youtube.com/watch?v=NLurnvYk0aI", note: "",
    energie: 4, etrange: 6, danse: 5 },

  { titre: "Close the Door", artiste: "Teddy Pendergrass", album: "",
    lien: "https://music.youtube.com/watch?v=QEbyvA9srrE", note: "",
    energie: 3, etrange: 2, danse: 5 },

  { titre: "Motherless Child", artiste: "Marvin Holmes and Justice", album: "",
    lien: "https://music.youtube.com/watch?v=JXwSLmHlu_U", note: "",
    energie: 5, etrange: 5, danse: 6 },

  { titre: "You Ought To Know Me", artiste: "David Ruffin", album: "",
    lien: "https://music.youtube.com/watch?v=q7LXyZse14I", note: "",
    energie: 4, etrange: 3, danse: 5 },

  { titre: "Les matins d'hiver", artiste: "Gérard Lenorman", album: "",
    lien: "https://music.youtube.com/watch?v=ELF91NCD_-I", note: "",
    energie: 3, etrange: 3, danse: 2 },

  { titre: "(v)oOOOOOOooo", artiste: "⣎⡇ꉺლ༽இ•̛)ྀ◞ ༎ຶ ༽ৣৢ؞ৢ؞ؖ ꉺლ", album: "",
    lien: "https://music.youtube.com/watch?v=29Sh3yEaBP8", note: "",
    energie: 3, etrange: 9, danse: 2 },

  { titre: "err:log", artiste: "cast heal", album: "",
    lien: "https://music.youtube.com/watch?v=DCcAlLqOM8E", note: "",
    energie: 4, etrange: 8, danse: 3 },

  { titre: "Till", artiste: "Conjunto Capri", album: "",
    lien: "https://music.youtube.com/watch?v=5Ov-yEqFYvk", note: "",
    energie: 2, etrange: 5, danse: 3 },

  { titre: "Zelda's Lullaby (Skyward Sword)", artiste: "The Legend of Zelda", album: "",
    lien: "https://music.youtube.com/watch?v=YHO6EDIbGlk", note: "",
    energie: 1, etrange: 4, danse: 0 },

  { titre: "Great Fairy's Fountain", artiste: "Sleeping Phoenix", album: "",
    lien: "https://music.youtube.com/watch?v=O5HGP6yf0GA", note: "",
    energie: 1, etrange: 5, danse: 1 },

  { titre: "The Flight of the Bumble-bee", artiste: "Rimsky-Korsakov, Neeme Järvi", album: "",
    lien: "https://music.youtube.com/watch?v=kh6gSLInIXo", note: "",
    energie: 8, etrange: 4, danse: 3 },

  { titre: "Tócame (feat. Dillom)", artiste: "Six Sex", album: "",
    lien: "https://music.youtube.com/watch?v=rh6agFmfyhI", note: "",
    energie: 8, etrange: 6, danse: 9 },

  { titre: "夜に駆ける", artiste: "YOASOBI", album: "",
    lien: "https://music.youtube.com/watch?v=by4SYYWlhEs", note: "",
    energie: 7, etrange: 3, danse: 7 },

  { titre: "Be Ever Wonderful", artiste: "Earth, Wind & Fire", album: "",
    lien: "https://music.youtube.com/watch?v=HLyU8BWfGKA", note: "",
    energie: 3, etrange: 2, danse: 4 },

  { titre: "Walking With Ice Cream", artiste: "Tupperwave", album: "",
    lien: "https://music.youtube.com/watch?v=7Uv3P8-rhB8", note: "",
    energie: 3, etrange: 6, danse: 4 },

  { titre: "At Doom's Gate", artiste: "Mick Gordon", album: "",
    lien: "https://music.youtube.com/watch?v=Lp-TdtDYGAA", note: "",
    energie: 10, etrange: 6, danse: 6 },

  { titre: "Have It All (feat. Pharrell)", artiste: "Gucci Mane", album: "",
    lien: "https://music.youtube.com/watch?v=RdAAAUPYti4", note: "",
    energie: 5, etrange: 4, danse: 7 },

  { titre: "Dove", artiste: "Orca", album: "",
    lien: "https://music.youtube.com/watch?v=4uX1fGGDD9k", note: "",
    energie: 3, etrange: 7, danse: 3 },

  { titre: "remember?", artiste: "svnti", album: "",
    lien: "https://music.youtube.com/watch?v=4qCZ1WcPWr4", note: "",
    energie: 3, etrange: 6, danse: 3 },

  { titre: "Yesterday I Had the Blues", artiste: "Harold Melvin & The Blue Notes", album: "",
    lien: "https://music.youtube.com/watch?v=jCwDytox1sM", note: "",
    energie: 4, etrange: 2, danse: 5 },

  { titre: "Clair de Lune", artiste: "Claude Debussy", album: "",
    lien: "https://music.youtube.com/watch?v=WKU8DJzipW4", note: "",
    energie: 1, etrange: 2, danse: 0 },

  { titre: "Bobby", artiste: "Phoebe Bridgers", album: "",
    lien: "https://music.youtube.com/watch?v=yLbf1Wgida4", note: "",
    energie: 2, etrange: 4, danse: 1 },

  { titre: "Stop The Wedding!", artiste: "Ashe", album: "",
    lien: "https://music.youtube.com/watch?v=WNxAvQNsJuM", note: "",
    energie: 5, etrange: 3, danse: 5 },

  { titre: "Sing", artiste: "Carpenters", album: "",
    lien: "https://music.youtube.com/watch?v=U07qx3MBEoI", note: "",
    energie: 2, etrange: 2, danse: 3 },

  { titre: "premium package", artiste: "SOMA", album: "",
    lien: "https://music.youtube.com/watch?v=ycoaG_klmkY", note: "",
    energie: 5, etrange: 7, danse: 6 },

  { titre: "Gingerbread Boy", artiste: "Miles Davis", album: "",
    lien: "https://music.youtube.com/watch?v=fVndRGAF8Gg", note: "",
    energie: 7, etrange: 6, danse: 5 },

  { titre: "Forse Domani", artiste: "Giampiero Boneschi & Sergio Farina", album: "",
    lien: "https://music.youtube.com/watch?v=84hFDVEK3jQ", note: "",
    energie: 3, etrange: 5, danse: 4 },

  { titre: "I See Your Face Before Me", artiste: "Miles Davis", album: "",
    lien: "https://music.youtube.com/watch?v=0us-KJG6UIM", note: "",
    energie: 1, etrange: 3, danse: 1 },

  { titre: "Funky Fanfare", artiste: "Keith Mansfield", album: "",
    lien: "https://music.youtube.com/watch?v=tUFwQjOpqJM", note: "",
    energie: 7, etrange: 4, danse: 8 },

  { titre: "The Empty Room", artiste: "Haruomi Hosono", album: "",
    lien: "https://music.youtube.com/watch?v=CYC30CSXG4o", note: "",
    energie: 2, etrange: 6, danse: 1 },

];
