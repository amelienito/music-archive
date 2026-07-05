// ── Chaque entrée = un titre que tu aimes ─────────────────────────────────────
// Champs :
//   title   → nom du morceau
//   artist  → artiste(s)
//   album   → album d'origine (pour la pochette auto + contexte)
//   cover   → URL pochette (laisse "" pour la récupération automatique)
//   group   → ta catégorie perso
//   note    → ton commentaire (peut rester vide)
//   link    → lien YouTube Music / Spotify

const tracks = [

  // ── US rap ──────────────────────────────────────────────────────────────────
  {
    title: "Losin' Weight",
    artist: "Cam'ron feat. Prodigy",
    album: "S.D.E.",
    cover: "",
    group: "US rap",
    note: "",
    link: "https://music.youtube.com/watch?v=RQxJfDU66rw"
  },
  {
    title: "King Back",
    artist: "T.I.",
    album: "King",
    cover: "",
    group: "US rap",
    note: "",
    link: "https://music.youtube.com/watch?v=Q7KuF4aImt8"
  },
  {
    title: "What We Do",
    artist: "Freeway feat. JAY-Z & Beanie Sigel",
    album: "Philadelphia Freeway",
    cover: "",
    group: "US rap",
    note: "",
    link: "https://music.youtube.com/watch?v=ITSVEXkuadk"
  },
  {
    title: "The Watcher 2",
    artist: "JAY-Z feat. Dr. Dre, Rakim & Truth Hurts",
    album: "The Blueprint 2: The Gift & The Curse",
    cover: "",
    group: "US rap",
    note: "",
    link: "https://music.youtube.com/watch?v=HXsRd2BI1Dc"
  },
  {
    title: "Exhibit C",
    artist: "Jay Electronica",
    album: "Exhibit C",
    cover: "",
    group: "US rap",
    note: "",
    link: "https://music.youtube.com/watch?v=b0c9A74BmcU"
  },
  {
    title: "Larry Bird",
    artist: "Roc Marciano feat. Knowledge the Pirate & GREA8GAWD",
    album: "Marciology",
    cover: "",
    group: "US rap",
    note: "",
    link: "https://music.youtube.com/watch?v=KZ8Xu74Ysrk"
  },
  {
    title: "Flashback",
    artist: "Boldy James & ChanHays",
    album: "Prisoner of Circumstance",
    cover: "",
    group: "US rap",
    note: "",
    link: "https://music.youtube.com/watch?v=vhAFirTDTSM"
  },
  {
    title: "Summer's Eve",
    artist: "Nicholas Craven & Boldy James",
    album: "Summer's Eve",
    cover: "",
    group: "US rap",
    note: "",
    link: "https://music.youtube.com/watch?v=J-7XkIQcPUQ"
  },
  {
    title: "Banded Up",
    artist: "Chief Keef feat. Tierra Whack",
    album: "Almighty So 2",
    cover: "",
    group: "US rap",
    note: "",
    link: "https://music.youtube.com/watch?v=PtDaNAL1gOg"
  },
  {
    title: "I'm the Devil",
    artist: "Lil B",
    album: "6 Kiss",
    cover: "",
    group: "US rap",
    note: "",
    link: "https://music.youtube.com/watch?v=jMbTbVF0u2A"
  },

  // ── rap FR ───────────────────────────────────────────────────────────────────
  {
    title: "BIBERON",
    artist: "Skefre",
    album: "CAPITALISTE 2",
    cover: "",
    group: "rap FR",
    note: "",
    link: "https://music.youtube.com/watch?v=ucIYVFy6S-c"
  },
  {
    title: "ATL",
    artist: "La Mano 1.9, Gazo & La Rvfleuze",
    album: "ATL",
    cover: "",
    group: "rap FR",
    note: "",
    link: "https://music.youtube.com/watch?v=VtgP0eGO4DI"
  },
  {
    title: "MERCI AU REVOIR",
    artist: "Le Rat Luciano & GRÜNT",
    album: "GRÜNT #74",
    cover: "",
    group: "rap FR",
    note: "",
    link: "https://music.youtube.com/watch?v=2b5hcyJPFAQ"
  },
  {
    title: "Faune marine",
    artist: "JeanJass",
    album: "Les champs de sacs plastique",
    cover: "",
    group: "rap FR",
    note: "",
    link: "https://music.youtube.com/watch?v=LSM1EwVm_7c"
  },
  {
    title: "OCARINA THEME",
    artist: "LEDOUBLE & GAL",
    album: "FCK LABEL MACHINE",
    cover: "",
    group: "rap FR",
    note: "",
    link: "https://music.youtube.com/watch?v=Nrz1YGx5-_Q"
  },

  // ── soul ─────────────────────────────────────────────────────────────────────
  {
    title: "Got to Be Real",
    artist: "Cheryl Lynn",
    album: "In the Night",
    cover: "",
    group: "soul",
    note: "",
    link: "https://music.youtube.com/watch?v=SxW1I0diFqI"
  },
  {
    title: "Judy",
    artist: "Al Green",
    album: "Let's Stay Together",
    cover: "",
    group: "soul",
    note: "",
    link: "https://music.youtube.com/watch?v=lcwGFZQLD9Q"
  },
  {
    title: "The Pride, Pts. 1 & 2",
    artist: "The Isley Brothers",
    album: "Go for Your Guns",
    cover: "",
    group: "soul",
    note: "",
    link: "https://music.youtube.com/watch?v=7GZ-6HAdv7w"
  },
  {
    title: "Pearls",
    artist: "Sade",
    album: "Love Deluxe",
    cover: "",
    group: "soul",
    note: "",
    link: "https://music.youtube.com/watch?v=JcljzvUgoAQ"
  },
  {
    title: "Quiet Storm",
    artist: "Smokey Robinson",
    album: "A Quiet Storm",
    cover: "",
    group: "soul",
    note: "",
    link: "https://music.youtube.com/watch?v=c52DagmSTdI"
  },
  {
    title: "Can't Get Enough",
    artist: "Alissia & Anderson .Paak",
    album: "K-POPS!",
    cover: "",
    group: "soul",
    note: "",
    link: "https://music.youtube.com/watch?v=Jbz_1TH69Q0"
  },

  // ── club ─────────────────────────────────────────────────────────────────────
  {
    title: "YOU HAVE TO LEAVE!!!",
    artist: "Hyas et Tactic 24",
    album: "LOUDER!!!",
    cover: "",
    group: "club",
    note: "",
    link: "https://music.youtube.com/watch?v=yM_KeoOHVy8"
  },
  {
    title: "Feisty",
    artist: "Smerz",
    album: "Feisty",
    cover: "",
    group: "club",
    note: "",
    link: "https://music.youtube.com/watch?v=0_KGch347UI"
  },
  {
    title: "Cassius 1999",
    artist: "Cassius",
    album: "1999",
    cover: "",
    group: "club",
    note: "",
    link: "https://music.youtube.com/watch?v=J8fMAXnDocs"
  },
  {
    title: "MUSIC",
    artist: "LinLin",
    album: "DISCO INFERNO",
    cover: "",
    group: "club",
    note: "",
    link: "https://music.youtube.com/watch?v=QAla_ISKiyo"
  },
  {
    title: "SWING",
    artist: "Angie",
    album: "SWING",
    cover: "",
    group: "club",
    note: "",
    link: "https://music.youtube.com/watch?v=guDSFndnX_M"
  },
  {
    title: "Sexy Nana",
    artist: "Aya Nakamura & La Rvfleuze",
    album: "Sexy Nana",
    cover: "",
    group: "club",
    note: "",
    link: "https://music.youtube.com/watch?v=ygyno6J_AyQ"
  },
  {
    title: "Sing Good",
    artist: "Ninajirachi",
    album: "I Love My Computer",
    cover: "",
    group: "club",
    note: "",
    link: "https://music.youtube.com/watch?v=tCj86Ij-tA0"
  },
  {
    title: "CSIRAC",
    artist: "Ninajirachi",
    album: "I Love My Computer",
    cover: "",
    group: "club",
    note: "",
    link: "https://music.youtube.com/watch?v=L_rc7qJyFOQ"
  },

  // ── indie ────────────────────────────────────────────────────────────────────
  {
    title: "Nomad",
    artist: "Clairo",
    album: "Charm",
    cover: "",
    group: "indie",
    note: "",
    link: "https://music.youtube.com/watch?v=RdRD80xT2mc"
  },
  {
    title: "Heaven is a Home",
    artist: "Kali Uchis",
    album: "Sincerely",
    cover: "",
    group: "indie",
    note: "",
    link: "https://music.youtube.com/watch?v=3CsPC9C8Oa4"
  },
  {
    title: "Where I Sit",
    artist: "Men I Trust",
    album: "Equus Caballus",
    cover: "",
    group: "indie",
    note: "",
    link: "https://music.youtube.com/watch?v=IGrobvR8WtA"
  },
  {
    title: "The Field",
    artist: "Blood Orange feat. Caroline Polachek & Daniel Caesar",
    album: "Essex Honey",
    cover: "",
    group: "indie",
    note: "",
    link: "https://music.youtube.com/watch?v=Brt_wrBrSqQ"
  },
  {
    title: "Sin",
    artist: "070 Shake",
    album: "Petrichor",
    cover: "",
    group: "indie",
    note: "",
    link: "https://music.youtube.com/watch?v=R9Y6Hb7UjsQ"
  },
  {
    title: "how long will it take to walk a mile?",
    artist: "Lola Young",
    album: "I'm Only F**king Myself",
    cover: "",
    group: "indie",
    note: "",
    link: "https://music.youtube.com/watch?v=lM133qamEhM"
  },
  {
    title: "Dark",
    artist: "Maddie Ashman",
    album: "Dark",
    cover: "",
    group: "indie",
    note: "",
    link: "https://music.youtube.com/watch?v=9PJYdRVq9Ik"
  },

  // ── ambient ──────────────────────────────────────────────────────────────────
  {
    title: "Six Songs for Invisible Gardens",
    artist: "Green-House",
    album: "Six Songs for Invisible Gardens",
    cover: "",
    group: "ambient",
    note: "",
    link: "https://music.youtube.com/watch?v=nqCTPxdW9tQ"
  },
  {
    title: "Plume Valley",
    artist: "Windows96",
    album: "Plume Valley",
    cover: "",
    group: "ambient",
    note: "",
    link: "https://music.youtube.com/watch?v=MFBOtWq7dsE"
  },
  {
    title: "\u3164\u3164\u3164",
    artist: "Emma Vansen",
    album: "\u3164",
    cover: "",
    group: "ambient",
    note: "",
    link: "https://music.youtube.com/watch?v=3MsW-OuXiIo"
  },

  // ── Japan ────────────────────────────────────────────────────────────────────
  {
    title: "Fly-day Chinatown",
    artist: "Yasuha",
    album: "Transit",
    cover: "",
    group: "Japan",
    note: "",
    link: "https://music.youtube.com/watch?v=hci81q8Q49Q"
  },
  {
    title: "\u3055\u3088\u306a\u3089\u7802\u5c71",
    artist: "Takeo Yamashita",
    album: "\u3055\u3088\u306a\u3089\u7802\u5c71",
    cover: "",
    group: "Japan",
    note: "",
    link: "https://music.youtube.com/watch?v=t0XXkZaC25o"
  },
  {
    title: "\u79c1\u306e\u3059\u3079\u3066",
    artist: "Pizzicato Five",
    album: "The Band of 20th Century",
    cover: "",
    group: "Japan",
    note: "",
    link: "https://music.youtube.com/watch?v=SD_Hk_O5YFA"
  },
  {
    title: "Euryale",
    artist: "Serge Bulot",
    album: "Euryale",
    cover: "",
    group: "Japan",
    note: "",
    link: "https://music.youtube.com/watch?v=5P2hiU8J5QE"
  },

  // ── sans étiquette ───────────────────────────────────────────────────────────
  {
    title: "Big city life",
    artist: "Mattafix",
    album: "Signs of a Struggle",
    cover: "",
    group: "sans \u00e9tiquette",
    note: "",
    link: "https://music.youtube.com/browse/MPREb_JvDDGFtLBYc"
  },
  {
    title: "Not Much 2 Say",
    artist: "Jadasea",
    album: "Not Much 2 Say",
    cover: "",
    group: "sans \u00e9tiquette",
    note: "",
    link: "https://music.youtube.com/watch?v=qQb4ZDpS74Q"
  },
  {
    title: "good girl, lassie.",
    artist: "is it sunday?",
    album: "good girl, give them reason to stare.",
    cover: "",
    group: "sans \u00e9tiquette",
    note: "",
    link: "https://music.youtube.com/watch?v=09hEFrUZrXA"
  },
  {
    title: "je fais pleurer les hommes",
    artist: "ar\u00f8ne",
    album: "je fais pleurer les hommes",
    cover: "",
    group: "sans \u00e9tiquette",
    note: "",
    link: "https://music.youtube.com/watch?v=inHes0rZVtM"
  },
  {
    title: "50cl",
    artist: "ABSOLEM",
    album: "Champagne en canette",
    cover: "",
    group: "sans \u00e9tiquette",
    note: "",
    link: "https://music.youtube.com/watch?v=OOQ4wWMoYjw"
  },

];

// ── Playlist radio ────────────────────────────────────────────────────────────
// Liste ordonnée des titres pour le mode radio.
// Tu peux la réorganiser à ta guise — c'est juste les noms des morceaux.
// Si tu laisses ce tableau vide [], tous les titres seront utilisés dans l'ordre.

const playlist = [
  "Quiet Storm",
  "Pearls",
  "Got to Be Real",
  "Judy",
  "The Pride, Pts. 1 & 2",
  "Can't Get Enough",
  "Fly-day Chinatown",
  "さよなら砂山",
  "私のすべて",
  "Euryale",
  "Six Songs for Invisible Gardens",
  "Plume Valley",
  "ㅤㅤㅤ",
  "Exhibit C",
  "Losin' Weight",
  "Larry Bird",
  "Summer's Eve",
  "Flashback",
  "Nomad",
  "Heaven is a Home",
  "Where I Sit",
  "Sin",
  "Dark",
  "YOU HAVE TO LEAVE!!!",
  "Feisty",
  "Cassius 1999",
  "MUSIC",
  "SWING",
  "Sing Good",
  "CSIRAC",
  "BIBERON",
  "ATL",
  "MERCI AU REVOIR",
  "Faune marine",
  "OCARINA THEME",
  "King Back",
  "What We Do",
  "The Watcher 2",
  "Banded Up",
  "I'm the Devil",
  "The Field",
  "how long will it take to walk a mile?",
  "Sexy Nana",
  "Big city life",
  "Not Much 2 Say",
  "good girl, lassie.",
  "je fais pleurer les hommes",
  "50cl",
];
