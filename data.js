// ─── MUSIC DISCOVERY ─ DATA.JS ─────────────────────────────────────────────
// Données des morceaux : titre, artiste, durée, URL audio (ou fallback tone.js)
// ─────────────────────────────────────────────────────────────────────────────

const TRACKS = [
  {
    id: 1,
    title: "Nuits d'été",
    artist: "Lune Éclatée",
    duration: 195,
    // Demo URL via archive.org (licence libre) — remplace par un service de preview
    audioUrl: "https://archive.org/download/Torune/Torune-08.mp3"
  },
  {
    id: 2,
    title: "Échos lointains",
    artist: "Solstice",
    duration: 228,
    audioUrl: "https://archive.org/download/musicforprogramming/musicforprogramming-48.mp3"
  },
  {
    id: 3,
    title: "Brume matinale",
    artist: "Clair de Lune",
    duration: 312,
    audioUrl: "https://archive.org/download/testmp3_201706/SoundHelix-Song-1.mp3"
  },
  {
    id: 4,
    title: "Rues oubliées",
    artist: "Noctambule",
    duration: 267,
    audioUrl: "https://archive.org/download/musicforprogramming/musicforprogramming-45.mp3"
  },
  {
    id: 5,
    title: "Café de l'aube",
    artist: "Matinale",
    duration: 189,
    audioUrl: "https://archive.org/download/Torune/Torune-10.mp3"
  },
  {
    id: 6,
    title: "Horizon lointain",
    artist: "Voyageur",
    duration: 304,
    audioUrl: "https://archive.org/download/musicforprogramming/musicforprogramming-51.mp3"
  },
  {
    id: 7,
    title: "Foules silencieuses",
    artist: "Urbaniste",
    duration: 241,
    audioUrl: "https://archive.org/download/testmp3_201706/SoundHelix-Song-4.mp3"
  },
  {
    id: 8,
    title: "Refuge",
    artist: "Ancre",
    duration: 276,
    audioUrl: "https://archive.org/download/Torune/Torune-03.mp3"
  },
  {
    id: 9,
    title: "Lumière tamisée",
    artist: "Flâneur",
    duration: 198,
    audioUrl: "https://archive.org/download/musicforprogramming/musicforprogramming-46.mp3"
  },
  {
    id: 10,
    title: "Cartographie",
    artist: "Cartographe",
    duration: 255,
    audioUrl: "https://archive.org/download/testmp3_201706/SoundHelix-Song-7.mp3"
  },
  {
    id: 11,
    title: "Plage déserte",
    artist: "Marée Basse",
    duration: 223,
    audioUrl: "https://archive.org/download/Torune/Torune-06.mp3"
  },
  {
    id: 12,
    title: "Cascade digitale",
    artist: "Binarité",
    duration: 289,
    audioUrl: "https://archive.org/download/musicforprogramming/musicforprogramming-52.mp3"
  },
  {
    id: 13,
    title: "Fenetre sur cour",
    artist: "Voisin",
    duration: 211,
    audioUrl: "https://archive.org/download/testmp3_201706/SoundHelix-Song-2.mp3"
  },
  {
    id: 14,
    title: "Métropolis",
    artist: "Béton",
    duration: 334,
    audioUrl: "https://archive.org/download/Torune/Torune-07.mp3"
  },
  {
    id: 15,
    title: "Arbre seul",
    artist: "Forêt",
    duration: 267,
    audioUrl: "https://archive.org/download/musicforprogramming/musicforprogramming-47.mp3"
  },
  {
    id: 16,
    title: "Souvenir deesterday",
    artist: "Passé Simple",
    duration: 196,
    audioUrl: "https://archive.org/download/Torune/Torune-05.mp3"
  },
  {
    id: 17,
    title: "Bruit blanc",
    artist: "Fréquence",
    duration: 178,
    audioUrl: "https://archive.org/download/testmp3_201706/SoundHelix-Song-9.mp3"
  },
  {
    id: 18,
    title: "Passage souterrain",
    artist: "Labyrinthe",
    duration: 302,
    audioUrl: "https://archive.org/download/musicforprogramming/musicforprogramming-50.mp3"
  },
  {
    id: 19,
    title: "Témoin",
    artist: "Oculaire",
    duration: 244,
    audioUrl: "https://archive.org/download/Torune/Torune-04.mp3"
  },
  {
    id: 20,
    title: "Dernière Danse",
    artist: "Finale",
    duration: 298,
    audioUrl: "https://archive.org/download/musicforprogramming/musicforprogramming-53.mp3"
  }
];

// Données simulées : quand le audioUrl échoue, on utilise ce fallback
const FALLBACK_TRACK = {
  title: "Prévisualisation indisponible",
  artist: "—",
  duration: 30,
  fallback: true
};
