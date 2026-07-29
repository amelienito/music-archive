/**
 * MUSIC DISCOVERY — DATA
 * Data layer for index (3).html / script.js
 * Provides tracks, playlist, moments, suggestions, and player state.
 * Exported as window.appData so script.js can access everything.
 */

(function () {
  "use strict";

  /* ─── TRACKS ──────────────────────────────────────────────── */

  const tracks = [
    // US rap
    { id: 0,  title: "Losin' Weight",        artist: "Cam'ron feat. Prodigy",      album: "S.D.E.",                   cover: "", group: "usrap", note: "" },
    { id: 1,  title: "King Back",            artist: "T.I.",                        album: "King",                     cover: "", group: "usrap", note: "" },
    { id: 2,  title: "What We Do",           artist: "Freeway feat. JAY-Z & Bean", album: "Philadelphia Freeway",     cover: "", group: "usrap", note: "" },
    { id: 3,  title: "The Watcher 2",        artist: "JAY-Z feat. Dr. Dre",         album: "The Blueprint 2",           cover: "", group: "usrap", note: "" },
    { id: 4,  title: "Exhibit C",            artist: "Jay Electronica",             album: "Exhibit C",                cover: "", group: "usrap", note: "" },
    { id: 5,  title: "Larry Bird",           artist: "Boldy James",                 album: "Marciology",               cover: "", group: "usrap", note: "" },
    { id: 6,  title: "Flashback",            artist: "Boldy James & ChanHays",      album: "Prisoner of Circumstance",  cover: "", group: "usrap", note: "" },
    { id: 7,  title: "Summer's Eve",         artist: "Nicholas Craven & Boldy",    album: "Summer's Eve",             cover: "", group: "usrap", note: "" },
    { id: 8,  title: "Banded Up",            artist: "Chief Keef feat. Tierra Whack",album: "Almighty So 2",            cover: "", group: "usrap", note: "" },
    { id: 9,  title: "I'm the Devil",        artist: "Lil B",                       album: "6 Kiss",                  cover: "", group: "usrap", note: "" },
    // rap FR
    { id: 10, title: "BIBERON",              artist: "Skefre",                      album: "CAPITALISTE 2",            cover: "", group: "rapfr", note: "" },
    { id: 11, title: "ATL",                  artist: "La Mano 1.9, Gazo & La Rvfleuze",album: "ATL",                     cover: "", group: "rapfr", note: "" },
    { id: 12, title: "MERCI AU REVOIR",      artist: "Le Rat Luciano & GRÜNT",      album: "GRÜNT #74",                cover: "", group: "rapfr", note: "" },
    { id: 13, title: "Faune marine",          artist: "JeanJass",                     album: "Les champs de sacs plastique", cover: "", group: "rapfr", note: "" },
    { id: 14, title: "OCARINA THEME",         artist: "LEDOUBLE & GAL",              album: "FCK LABEL MACHINE",        cover: "", group: "rapfr", note: "" },
    // soul
    { id: 15, title: "Got to Be Real",       artist: "Cheryl Lynn",                  album: "In the Night",             cover: "", group: "soul", note: "" },
    { id: 16, title: "Judy",                artist: "Al Green",                     album: "Let's Stay Together",      cover: "", group: "soul", note: "" },
    { id: 17, title: "The Pride, Pts 1 & 2",artist: "The Isley Brothers",           album: "Go for Your Guns",         cover: "", group: "soul", note: "" },
    { id: 18, title: "Pearls",              artist: "Sade",                        album: "Love Deluxe",              cover: "", group: "soul", note: "" },
    { id: 19, title: "Quiet Storm",         artist: "Smokey Robinson",              album: "A Quiet Storm",            cover: "", group: "soul", note: "" },
    { id: 20, title: "Can't Get Enough",    artist: "Alissia & Anderson .Paak",     album: "K-POPS!",                  cover: "", group: "soul", note: "" },
    // club
    { id: 21, title: "YOU HAVE TO LEAVE!!!",artist: "Hyas et Tactic 24",            album: "LOUDER!!!",                cover: "", group: "club", note: "" },
    { id: 22, title: "Feisty",              artist: "Smerz",                       album: "Feisty",                   cover: "", group: "club", note: "" },
    { id: 23, title: "Cassius 1999",        artist: "Cassius",                      album: "1999",                     cover: "", group: "club", note: "" },
    { id: 24, title: "MUSIC",               artist: "LinLin",                      album: "DISCO INFERNO",            cover: "", group: "club", note: "" },
    { id: 25, title: "SWING",               artist: "Angie",                       album: "SWING",                    cover: "", group: "club", note: "" },
    { id: 26, title: "Sexy Nana",           artist: "Aya Nakamura & La Rvfleuze",  album: "Sexy Nana",                cover: "", group: "club", note: "" },
    { id: 27, title: "Sing Good",           artist: "Ninajirachi",                  album: "I Love My Computer",       cover: "", group: "club", note: "" },
    { id: 28, title: "CSIRAC",              artist: "Ninajirachi",                  album: "I Love My Computer",       cover: "", group: "club", note: "" },
    // indie
    { id: 29, title: "Nomad",               artist: "Clairo",                       album: "Charm",                    cover: "", group: "indie", note: "" },
    { id: 30, title: "Heaven is a Home",    artist: "Kali Uchis",                   album: "Sincerely",                cover: "", group: "indie", note: "" },
    { id: 31, title: "Where I Sit",         artist: "Men I Trust",                  album: "Equus Caballus",           cover: "", group: "indie", note: "" },
    { id: 32, title: "The Field",           artist: "Essex Honey",                  album: "Essex Honey",              cover: "", group: "indie", note: "" },
    { id: 33, title: "Sin",                artist: "070 Shake",                     album: "Petrichor",                cover: "", group: "indie", note: "" },
    { id: 34, title: "how long will it take to walk a mile?", artist: "Lola Young", album: "I'm Only F**king Myself", cover: "", group: "indie", note: "" },
    { id: 35, title: "Dark",                artist: "Maddie Ashman",                 album: "Dark",                     cover: "", group: "indie", note: "" },
    // ambient
    { id: 36, title: "Six Songs for Invisible Gardens", artist: "Green-House",        album: "Six Songs for Invisible Gardens", cover: "", group: "ambient", note: "" },
    { id: 37, title: "Plume Valley",        artist: "Windows96",                    album: "Plume Valley",             cover: "", group: "ambient", note: "" },
    { id: 38, title: "ㅤㅤㅤ",               artist: "Emma Vansen",                   album: "ㅤ",                       cover: "", group: "ambient", note: "" },
    // Japan
    { id: 39, title: "Fly-day Chinatown",   artist: "Yasuha",                       album: "Transit",                  cover: "", group: "japan", note: "" },
    { id: 40, title: "さよなら砂山",         artist: "Takeo Yamashita",               album: "さよなら砂山",             cover: "", group: "japan", note: "" },
    { id: 41, title: "私のすべて",           artist: "Pizzicato Five",                album: "The Band of 20th Century",  cover: "", group: "japan", note: "" },
    { id: 42, title: "Euryale",            artist: "Serge Bulot",                   album: "Euryale",                  cover: "", group: "japan", note: "" },
    // sans etiquette
    { id: 43, title: "Big city life",       artist: "Mattafix",                      album: "Signs of a Struggle",       cover: "", group: "other", note: "" },
    { id: 44, title: "Not Much 2 Say",      artist: "Jadasea",                       album: "Not Much 2 Say",            cover: "", group: "other", note: "" },
    { id: 45, title: "good girl, lassie.", artist: "is it sunday?",                 album: "good girl, give them reason to stare.", cover: "", group: "other", note: "" },
    { id: 46, title: "je fais pleurer les hommes", artist: "arøne",               album: "je fais pleurer les hommes", cover: "", group: "other", note: "" },
    { id: 47, title: "50cl",               artist: "ABSOLEM",                       album: "Champagne en canette",      cover: "", group: "other", note: "" },
  ];

  /* ─── MOMENTS ──────────────────────────────────────────────── */

  const moments = [
    { id: "reveil",     label: "Réveil",         icon: "☀", count: 12, groups: ["soul", "indie"] },
    { id: "concentration", label: "Concentration", icon: "◎", count: 24, groups: ["ambient", "indie"] },
    { id: "transit",    label: "En transit",       icon: "⛱", count: 18, groups: ["usrap", "rapfr", "japan"] },
    { id: "energie",    label: "Énergie",           icon: "⚡", count: 31, groups: ["club", "soul"] },
    { id: "crepuscule", label: "Crépuscule",        icon: "🌅", count: 21, groups: ["japan", "soul", "ambient"] },
    { id: "nuit",       label: "Nuit profonde",     icon: "☾", count: 15, groups: ["indie", "ambient"] },
  ];

  /* ─── DIRECTIONS ───────────────────────────────────────────── */

  const directions = {
    up: {
      label: "Monter",
      tags: ["Crescendo", "Tension", "Montée"],
      description: "Quelque chose qui monte, qui prend de l'ampleur.",
      groups: ["soul", "club", "ambient"],
    },
    down: {
      label: "Descendre",
      tags: ["Calme", "Mélancolie", "Respiration"],
      description: "Quelque chose qui respire, qui se pose.",
      groups: ["indie", "ambient", "japan"],
    },
  };

  /* ─── PLAYLIST (ordered) ───────────────────────────────────── */

  const playlist = [
    19, 18, 15, 16, 17, 20,  // soul
    39, 40, 41, 42,          // japan
    36, 37, 38,              // ambient
    4, 0, 5, 7, 6,          // rap
    29, 30, 31, 33, 35, 34, 32, // indie
    21, 22, 23, 24, 25, 26, 27, 28, // club
    10, 11, 12, 13, 14,      // rapfr
    1, 2, 3, 8, 9,           // usrap
    43, 44, 45, 46, 47,      // other
  ];

  /* ─── RADIO QUEUE (initial state) ─────────────────────────── */

  const radioQueueInit = [
    { title: "Quiet Storm",  artist: "Smokey Robinson" },
    { title: "Teardrop",     artist: "Massive Attack" },
    { title: "Pearls",       artist: "Sade" },
  ];

  /* ─── SUGGESTIONS ──────────────────────────────────────────── */

  const suggestions = [
    {
      label: "Monter le son",
      description: "Si tu veux quelque chose qui monte et qui prend de l'ampleur.",
      groups: ["soul", "club"],
      trackIds: [20, 23, 17],
    },
    {
      label: "Ralentir",
      description: "Si tu veux quelque chose qui respire et qui se pose.",
      groups: ["indie", "ambient", "japan"],
      trackIds: [29, 36, 39],
    },
    {
      label: "Le mur du son",
      description: "Si tu veux quelque chose de fort, de dense, d'inattendu.",
      groups: ["usrap", "club"],
      trackIds: [3, 21, 8],
    },
  ];

  /* ─── STEPS ────────────────────────────────────────────────── */

  const steps = [
    {
      number: 1,
      title: "Choisis un moment",
      description: "Le matin, le soir, en concentration… Each moment changes the tone.",
    },
    {
      number: 2,
      title: "Branche-toi",
      description: "Décide si tu veux monter, descendre, ou te laisser porter.",
    },
    {
      number: 3,
      title: "Écoute et garde",
      description: "Uns cliques sur un lien YouTube Music. Ajoute à ta sélection.",
    },
  ];

  /* ─── PLAYER STATE ─────────────────────────────────────────── */

  let state = {
    currentIndex: 0,
    queue: [...radioQueueInit],
    isPlaying: false,
    volume: 0.8,
    muted: false,
  };

  /* ─── HELPERS ──────────────────────────────────────────────── */

  function getTracksByGroups(groups) {
    return tracks.filter((t) => groups.includes(t.group));
  }

  function getTrackById(id) {
    return tracks.find((t) => t.id === id) || null;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function initials(name) {
    if (!name) return "?";
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  /* ─── PUBLIC API ───────────────────────────────────────────── */

  window.appData = {
    tracks,
    moments,
    directions,
    playlist,
    radioQueueInit,
    suggestions,
    steps,
    state,

    getTracksByGroups,
    getTrackById,
    shuffle,
    initials,

    getMoment(id) {
      return moments.find((m) => m.id === id) || null;
    },

    getTracksForMoment(momentId) {
      const moment = this.getMoment(momentId);
      if (!moment) return [];
      return getTracksByGroups(moment.groups);
    },

    getSuggestionForDirection(direction) {
      const dir = directions[direction];
      if (!dir) return null;
      return {
        label: direction === "up" ? "Monter le son" : "Ralentir",
        groups: dir.groups,
      };
    },

    getRelated(track) {
      if (!track) return [];
      const pool = tracks.filter(
        (t) => t.group === track.group && t.id !== track.id
      );
      return shuffle(pool).slice(0, 3);
    },

    getRadioQueue() {
      return [...state.queue];
    },

    nextRadio() {
      state.queue.shift();
      // Append a random track
      const nextTrack = tracks[Math.floor(Math.random() * tracks.length)];
      state.queue.push({
        title: nextTrack.title,
        artist: nextTrack.artist,
      });
      return [...state.queue];
    },
  };
})();
