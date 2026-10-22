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
    lien: "https://music.youtube.com/watch?v=7-1nLlYjpKY", note: "",
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

  { titre: "Scheherazade, Op. 35: III. The Young Prince and The Young Princess", artiste: "Rimsky-Korsakov, New York Philharmonic", album: "",
    lien: "https://music.youtube.com/watch?v=07pZtrFkfWo", note: "", connu: true,
    energie: 2, etrange: 3, danse: 1 },

  { titre: "Piano Concerto No. 2: I. Moderato", artiste: "Rachmaninoff, Krystian Zimerman", album: "",
    lien: "https://music.youtube.com/watch?v=caR7C2SHdFI", note: "", connu: true,
    energie: 5, etrange: 2, danse: 1 },

  { titre: "Serenata D.957", artiste: "Schubert, The Royal Schubert Orchestra", album: "",
    lien: "https://music.youtube.com/watch?v=Huy791G17Ak", note: "", connu: true,
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
    lien: "https://music.youtube.com/watch?v=YHO6EDIbGlk", note: "", connu: true,
    energie: 1, etrange: 4, danse: 0 },

  { titre: "Great Fairy's Fountain", artiste: "Sleeping Phoenix", album: "",
    lien: "https://music.youtube.com/watch?v=O5HGP6yf0GA", note: "",
    energie: 1, etrange: 5, danse: 1 },

  { titre: "The Flight of the Bumble-bee", artiste: "Rimsky-Korsakov, Neeme Järvi", album: "",
    lien: "https://music.youtube.com/watch?v=kh6gSLInIXo", note: "", connu: true,
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
    lien: "https://music.youtube.com/watch?v=WKU8DJzipW4", note: "", connu: true,
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

  { titre: "Symphonie n° 6 : I. Allegro energico, ma non troppo", artiste: "Mahler, Berliner Philharmoniker", album: "",
    lien: "https://music.youtube.com/watch?v=hoVnIDmuwLw", note: "", connu: true,
    energie: 7, etrange: 4, danse: 2 },

  { titre: "Symphonie n° 2 : IV. Finale (Allegro moderato)", artiste: "Sibelius, Berliner Philharmoniker", album: "",
    lien: "https://music.youtube.com/watch?v=-10jYSvWYeI", note: "", connu: true,
    energie: 6, etrange: 3, danse: 1 },

  { titre: "Resurrections", artiste: "Lena Raine", album: "",
    lien: "https://music.youtube.com/watch?v=-YjgOzSQNQ0", note: "",
    energie: 6, etrange: 4, danse: 4 },

  { titre: "Moments (Voice Memo)", artiste: "Teesa", album: "",
    lien: "https://music.youtube.com/watch?v=R8BmJxhrZdo", note: "",
    energie: 2, etrange: 7, danse: 1 },

  { titre: "Wake Up Everybody", artiste: "Harold Melvin & The Blue Notes", album: "",
    lien: "https://music.youtube.com/watch?v=FMR6eMHjqIo", note: "",
    energie: 4, etrange: 2, danse: 5 },

  { titre: "Out Of The Picture", artiste: "Tavares", album: "",
    lien: "https://music.youtube.com/watch?v=w_VZD6RcQI4", note: "",
    energie: 4, etrange: 3, danse: 5 },

  { titre: "Swing and Jump", artiste: "Alba Lamar", album: "",
    lien: "https://music.youtube.com/watch?v=pNPw1PZboWI", note: "",
    energie: 6, etrange: 6, danse: 7 },

  { titre: "Overjoyed", artiste: "Stevie Wonder", album: "",
    lien: "https://music.youtube.com/watch?v=678STgx-Esw", note: "",
    energie: 2, etrange: 2, danse: 2 },

  { titre: "Concerto pour piano n° 21 : II. Andante", artiste: "Mozart, London Mozart Players", album: "",
    lien: "https://music.youtube.com/watch?v=sgqtFZ9S5sA", note: "", connu: true,
    energie: 1, etrange: 2, danse: 0 },

  { titre: "My Cherie Amour", artiste: "Stevie Wonder", album: "",
    lien: "https://music.youtube.com/watch?v=Fjufjv4rH0s", note: "",
    energie: 3, etrange: 1, danse: 5 },

  { titre: "Outstanding", artiste: "The Gap Band", album: "",
    lien: "https://music.youtube.com/watch?v=xBcpaB8lq44", note: "",
    energie: 5, etrange: 2, danse: 7 },

  { titre: "Come Outside", artiste: "ScarLip", album: "",
    lien: "https://music.youtube.com/watch?v=q34xnPe-C1g", note: "",
    energie: 8, etrange: 5, danse: 6 },

  { titre: "MINISKIRT", artiste: "Aliyah's Interlude", album: "",
    lien: "https://music.youtube.com/watch?v=WZKXguICxUo", note: "",
    energie: 7, etrange: 5, danse: 8 },

  { titre: "Les volets clos", artiste: "Paul Mauriat", album: "",
    lien: "https://music.youtube.com/watch?v=lkHNEb72DH0", note: "",
    energie: 2, etrange: 4, danse: 2 },

  { titre: "Bi Kelma Menak", artiste: "Sherine", album: "",
    lien: "https://music.youtube.com/watch?v=BSHhX8nypcY", note: "",
    energie: 4, etrange: 5, danse: 4 },

  { titre: "Raubíri", artiste: "Marcel Gidote's Holy Crab", album: "",
    lien: "https://music.youtube.com/watch?v=CA1ZmK3DC8o", note: "",
    energie: 5, etrange: 8, danse: 5 },

  { titre: "I Miss You (Part 1)", artiste: "David Ruffin", album: "",
    lien: "https://music.youtube.com/watch?v=sbNioahCQlA", note: "",
    energie: 3, etrange: 3, danse: 3 },

  { titre: "Walk Away From Love", artiste: "David Ruffin", album: "",
    lien: "https://music.youtube.com/watch?v=34yv3D8oYBI", note: "",
    energie: 5, etrange: 2, danse: 7 },

  { titre: "Through the Fire (A COLORS SHOW)", artiste: "Chaka Khan", album: "",
    lien: "https://music.youtube.com/watch?v=1DqzwJlvX-0", note: "",
    energie: 3, etrange: 2, danse: 2 },

  { titre: "Jōdo", artiste: "Hiroshi Sato", album: "",
    lien: "https://music.youtube.com/watch?v=xCJIDvmyKO8", note: "",
    energie: 3, etrange: 6, danse: 4 },

  { titre: "Life goes on", artiste: "Steven Boyd", album: "",
    lien: "https://music.youtube.com/watch?v=uYa_YH9AH3A", note: "",
    energie: 4, etrange: 5, danse: 5 },

  { titre: "Symphonie n° 1 : I. Allegro (molto moderato)", artiste: "Bruckner, Orchestre Métropolitain", album: "",
    lien: "https://music.youtube.com/watch?v=_Ak0zpy-ICU", note: "", connu: true,
    energie: 6, etrange: 4, danse: 1 },

  { titre: "Mermaid", artiste: "Sade Adu", album: "",
    lien: "https://music.youtube.com/watch?v=dwTedc_QUOI", note: "",
    energie: 2, etrange: 4, danse: 2 },

  { titre: "I Miss You, Pt. 1", artiste: "Harold Melvin & The Blue Notes", album: "",
    lien: "https://music.youtube.com/watch?v=4fIeEVHhGyQ", note: "",
    energie: 3, etrange: 2, danse: 3 },

  { titre: "The Adults Are Talking", artiste: "The Strokes", album: "",
    lien: "https://music.youtube.com/watch?v=826mxiKjoP0", note: "",
    energie: 6, etrange: 2, danse: 6 },

  { titre: "The Weekend (Radio Edit)", artiste: "Michael Gray", album: "",
    lien: "https://music.youtube.com/watch?v=uDGJ9DyF25I", note: "",
    energie: 7, etrange: 2, danse: 9 },

  { titre: "The Only Thing They Fear...", artiste: "Banana Jim", album: "",
    lien: "https://music.youtube.com/watch?v=w5k4YLWvOT0", note: "",
    energie: 9, etrange: 7, danse: 5 },

  { titre: "Reasons", artiste: "Earth, Wind & Fire", album: "",
    lien: "https://music.youtube.com/watch?v=zTeD3RWvE6A", note: "",
    energie: 3, etrange: 2, danse: 3 },

  { titre: "ANTIOXYDANT", artiste: "Mairo", album: "",
    lien: "https://music.youtube.com/watch?v=fYky_uuCzVE", note: "",
    energie: 6, etrange: 5, danse: 6 },

  { titre: "Can't Take My Eyes Off You (Original Extended Version)", artiste: "Boys Town Gang", album: "",
    lien: "https://music.youtube.com/watch?v=i0iD4KzoIqk", note: "",
    energie: 7, etrange: 3, danse: 9 },

  { titre: "Fantasy", artiste: "Aquarian Dream", album: "",
    lien: "https://music.youtube.com/watch?v=2p8Ev0jm8kM", note: "",
    energie: 5, etrange: 4, danse: 7 },

  { titre: "Mutant", artiste: "Arca", album: "",
    lien: "https://music.youtube.com/watch?v=pW4I_y56DC0", note: "",
    energie: 6, etrange: 9, danse: 3 },

  { titre: "No Voy a Llorar", artiste: "DJ Pablito", album: "",
    lien: "https://music.youtube.com/watch?v=hSUAlPKgeto", note: "",
    energie: 7, etrange: 6, danse: 8 },

  { titre: "MINIBUS AVEC LES PETITS", artiste: "Igouh", album: "",
    lien: "https://music.youtube.com/watch?v=4xeY7BinY9E", note: "",
    energie: 6, etrange: 6, danse: 6 },

  { titre: "STOPLIGHT", artiste: "SUMIN", album: "",
    lien: "https://music.youtube.com/watch?v=Ox3uJaLsXgI", note: "",
    energie: 5, etrange: 5, danse: 6 },

  { titre: "Moral Tem Hora", artiste: "Cristina Camargo", album: "",
    lien: "https://music.youtube.com/watch?v=O5FlEwQ1IHo", note: "",
    energie: 5, etrange: 6, danse: 6 },

  { titre: "Une pieuvre dans un seau", artiste: "Surprise", album: "",
    lien: "https://music.youtube.com/watch?v=eEXjdCmQ5pU", note: "",
    energie: 4, etrange: 7, danse: 4 },

  { titre: "all-american bitch", artiste: "Olivia Rodrigo", album: "",
    lien: "https://music.youtube.com/watch?v=jPzKKSzqYzk", note: "",
    energie: 6, etrange: 2, danse: 4 },

  { titre: "honeybee", artiste: "Olivia Rodrigo", album: "",
    lien: "https://music.youtube.com/watch?v=OrNTGMmSpz0", note: "",
    energie: 4, etrange: 2, danse: 4 },

  { titre: "264bpm Song", artiste: "Andrew Baena", album: "",
    lien: "https://music.youtube.com/watch?v=kSF0hIIDofM", note: "",
    energie: 9, etrange: 8, danse: 6 },

  { titre: "Hooked (Remastered)", artiste: "D.R.I.", album: "",
    lien: "https://music.youtube.com/watch?v=PXIuSHT4YoE", note: "",
    energie: 10, etrange: 5, danse: 5 },

  { titre: "Bird Call (feat. Lil Wayne & Cam'Ron)", artiste: "JR Writer", album: "",
    lien: "https://music.youtube.com/watch?v=jYb-B1j4ul8", note: "",
    energie: 7, etrange: 4, danse: 5 },

  { titre: "Private Valet", artiste: "Larry June", album: "",
    lien: "https://music.youtube.com/watch?v=TIBbr_u9gBc", note: "",
    energie: 4, etrange: 3, danse: 5 },

  { titre: "All of Me", artiste: "Andrus, Blackwood & Co.", album: "",
    lien: "https://music.youtube.com/watch?v=t2mSibwG6Hg", note: "",
    energie: 4, etrange: 5, danse: 4 },

  { titre: "Glue Song (feat. Clairo)", artiste: "beabadoobee", album: "",
    lien: "https://music.youtube.com/watch?v=9Yy4-LCOi34", note: "",
    energie: 2, etrange: 2, danse: 2 },

  { titre: "we fell in love in october", artiste: "girl in red", album: "",
    lien: "https://music.youtube.com/watch?v=FJX0JPXD2nM", note: "",
    energie: 3, etrange: 2, danse: 3 },

  { titre: "BEST INTEREST", artiste: "Tyler, The Creator", album: "",
    lien: "https://music.youtube.com/watch?v=37kWL6Qowq4", note: "",
    energie: 4, etrange: 3, danse: 5 },

  { titre: "A Lot Has Changed (Rough Trade Session)", artiste: "Weyes Blood", album: "",
    lien: "https://music.youtube.com/watch?v=NmFqLz6tyLA", note: "",
    energie: 2, etrange: 4, danse: 1 },

];
