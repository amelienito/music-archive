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
              (c'est lui qui permet de l'écouter directement sur le site)

   Champs facultatifs (tu peux les laisser vides ou les supprimer)
     album    l'album d'origine (aide à trouver la bonne pochette)
     note     TON texte. Trois mots, un pavé, ou rien du tout.
              Rien du tout, c'est très bien aussi : le morceau parle seul.
     liens    titres d'autres morceaux de la banque vers lesquels
              celui-ci doit mener. Ex : liens: ["Pearls", "Judy"]

   Les réglages (de 0 à 10) servent au moteur de découverte.
   Ils ne sont jamais montrés aux visiteurs. Ajuste-les à l'instinct :
     energie  0 = immobile, 10 = ça cogne
     etrange  0 = familier, 10 = d'où ça sort ?
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

  { titre: "The Watcher 2", artiste: "JAY-Z feat. Dr. Dre, Rakim & Truth Hurts", album: "The Blueprint 2: The Gift & The Curse",
    lien: "https://music.youtube.com/watch?v=HXsRd2BI1Dc", note: "",
    energie: 5, etrange: 3, danse: 3 },

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

  { titre: "Banded Up", artiste: "Chief Keef feat. Tierra Whack", album: "Almighty So 2",
    lien: "https://music.youtube.com/watch?v=PtDaNAL1gOg", note: "",
    energie: 7, etrange: 6, danse: 5 },

  { titre: "I'm the Devil", artiste: "Lil B", album: "6 Kiss",
    lien: "https://music.youtube.com/watch?v=jMbTbVF0u2A", note: "",
    energie: 6, etrange: 8, danse: 3 },

  { titre: "BIBERON", artiste: "Skefre", album: "CAPITALISTE 2",
    lien: "https://music.youtube.com/watch?v=ucIYVFy6S-c", note: "",
    energie: 7, etrange: 6, danse: 5 },

  { titre: "ATL", artiste: "La Mano 1.9, Gazo & La Rvfleuze", album: "ATL",
    lien: "https://music.youtube.com/watch?v=VtgP0eGO4DI", note: "",
    energie: 8, etrange: 4, danse: 7 },

  { titre: "MERCI AU REVOIR", artiste: "Le Rat Luciano & GRÜNT", album: "GRÜNT #74",
    lien: "https://music.youtube.com/watch?v=2b5hcyJPFAQ", note: "",
    energie: 6, etrange: 5, danse: 4 },

  { titre: "Faune marine", artiste: "JeanJass", album: "Les champs de sacs plastique",
    lien: "https://music.youtube.com/watch?v=LSM1EwVm_7c", note: "",
    energie: 4, etrange: 5, danse: 3 },

  { titre: "OCARINA THEME", artiste: "LEDOUBLE & GAL", album: "FCK LABEL MACHINE",
    lien: "https://music.youtube.com/watch?v=Nrz1YGx5-_Q", note: "",
    energie: 6, etrange: 6, danse: 5 },

  { titre: "Got to Be Real", artiste: "Cheryl Lynn", album: "Cheryl Lynn",
    lien: "https://music.youtube.com/watch?v=SxW1I0diFqI", note: "",
    energie: 8, etrange: 2, danse: 10 },

  { titre: "Judy", artiste: "Al Green", album: "Let's Stay Together",
    lien: "https://music.youtube.com/watch?v=lcwGFZQLD9Q", note: "",
    energie: 3, etrange: 3, danse: 5 },

  { titre: "The Pride, Pts. 1 & 2", artiste: "The Isley Brothers", album: "Go for Your Guns",
    lien: "https://music.youtube.com/watch?v=7GZ-6HAdv7w", note: "",
    energie: 7, etrange: 2, danse: 9 },

  { titre: "Pearls", artiste: "Sade", album: "Love Deluxe",
    lien: "https://music.youtube.com/watch?v=JcljzvUgoAQ", note: "",
    energie: 2, etrange: 4, danse: 1 },

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

  { titre: "Cassius 1999", artiste: "Cassius", album: "1999",
    lien: "https://music.youtube.com/watch?v=J8fMAXnDocs", note: "",
    energie: 8, etrange: 3, danse: 10 },

  { titre: "MUSIC", artiste: "LinLin", album: "DISCO INFERNO",
    lien: "https://music.youtube.com/watch?v=QAla_ISKiyo", note: "",
    energie: 8, etrange: 6, danse: 9 },

  { titre: "SWING", artiste: "Angie", album: "SWING",
    lien: "https://music.youtube.com/watch?v=guDSFndnX_M", note: "",
    energie: 7, etrange: 5, danse: 8 },

  { titre: "Sexy Nana", artiste: "Aya Nakamura & La Rvfleuze", album: "Sexy Nana",
    lien: "https://music.youtube.com/watch?v=ygyno6J_AyQ", note: "",
    energie: 7, etrange: 4, danse: 9 },

  { titre: "Sing Good", artiste: "Ninajirachi", album: "I Love My Computer",
    lien: "https://music.youtube.com/watch?v=tCj86Ij-tA0", note: "",
    energie: 8, etrange: 6, danse: 8 },

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

  { titre: "Sin", artiste: "070 Shake", album: "Petrichor",
    lien: "https://music.youtube.com/watch?v=R9Y6Hb7UjsQ", note: "",
    energie: 6, etrange: 6, danse: 4 },

  { titre: "how long will it take to walk a mile?", artiste: "Lola Young", album: "I'm Only F**king Myself",
    lien: "https://music.youtube.com/watch?v=lM133qamEhM", note: "",
    energie: 4, etrange: 3, danse: 2 },

  { titre: "Dark", artiste: "Maddie Ashman", album: "Dark",
    lien: "https://music.youtube.com/watch?v=9PJYdRVq9Ik", note: "",
    energie: 4, etrange: 6, danse: 3 },

  { titre: "Six Songs for Invisible Gardens", artiste: "Green-House", album: "Six Songs for Invisible Gardens",
    lien: "https://music.youtube.com/watch?v=nqCTPxdW9tQ", note: "",
    energie: 1, etrange: 7, danse: 0 },

  { titre: "Plume Valley", artiste: "Windows96", album: "Plume Valley",
    lien: "https://music.youtube.com/watch?v=MFBOtWq7dsE", note: "",
    energie: 1, etrange: 8, danse: 0 },

  { titre: "ㅤㅤㅤ", artiste: "Emma Vansen", album: "ㅤ",
    lien: "https://music.youtube.com/watch?v=3MsW-OuXiIo", note: "",
    energie: 1, etrange: 9, danse: 0 },

  { titre: "Fly-day Chinatown", artiste: "Yasuha", album: "Transit",
    lien: "https://music.youtube.com/watch?v=hci81q8Q49Q", note: "",
    energie: 6, etrange: 4, danse: 8 },

  { titre: "さよなら砂山", artiste: "Takeo Yamashita", album: "さよなら砂山",
    lien: "https://music.youtube.com/watch?v=t0XXkZaC25o", note: "",
    energie: 3, etrange: 6, danse: 1 },

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

  { titre: "je fais pleurer les hommes", artiste: "arøne", album: "je fais pleurer les hommes",
    lien: "https://music.youtube.com/watch?v=inHes0rZVtM", note: "",
    energie: 5, etrange: 7, danse: 5 },

  { titre: "50cl", artiste: "ABSOLEM", album: "Champagne en canette",
    lien: "https://music.youtube.com/watch?v=OOQ4wWMoYjw", note: "",
    energie: 6, etrange: 6, danse: 4 },

];
