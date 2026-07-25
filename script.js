/* =========================================================
   MUSIC DISCOVERY — MINI PROTOTYPE
   ========================================================= */


/* =========================================================
   DATA
   ========================================================= */

const discoveries = [

  {
    title: "Exhibit C",

    artist: "Jay Electronica",

    album: "Exhibit C",

    initials: "EC",

    note:
      "Il y a des morceaux qu'on écoute. " +
      "Et puis il y a ceux qui donnent immédiatement " +
      "envie de savoir ce que la personne qui les a choisis " +
      "écoute d'autre.",

    link:
      "https://music.youtube.com/watch?v=b0c9A74BmcU"
  },


  {
    title: "CSIRAC",

    artist: "Ninajirachi",

    album: "I Love My Computer",

    initials: "CS",

    note:
      "Un morceau qui semble avoir été conçu " +
      "par quelqu'un qui aurait passé trop de temps " +
      "à imaginer à quoi ressemblerait la musique " +
      "d'un ordinateur amoureux.",

    link:
      "https://music.youtube.com/watch?v=L_rc7qJyFOQ"
  },


  {
    title: "Pearls",

    artist: "Sade",

    album: "Love Deluxe",

    initials: "P",

    note:
      "Il y a des chansons qui ne demandent rien. " +
      "Tu t'assois. Tu écoutes. " +
      "Et soudain, tu as l'impression que le monde " +
      "a baissé le volume.",

    link:
      "https://music.youtube.com/watch?v=JcljzvUgoAQ"
  },


  {
    title: "Fly-day Chinatown",

    artist: "Yasuha",

    album: "Transit",

    initials: "FC",

    note:
      "Une de ces chansons qui donne immédiatement " +
      "envie d'être quelque part où tu n'es pas. " +
      "La nuit. Une ville étrangère. " +
      "Et aucune raison de rentrer.",

    link:
      "https://music.youtube.com/watch?v=hci81q8Q49Q"
  }

];


/* =========================================================
   STATE
   ========================================================= */

let currentIndex = 0;


/* =========================================================
   DOM
   ========================================================= */

const intro =
  document.getElementById("intro");

const app =
  document.getElementById("app");

const enterBtn =
  document.getElementById("enterBtn");

const anotherBtn =
  document.getElementById("anotherBtn");

const playBtn =
  document.getElementById("playBtn");

const keepBtn =
  document.getElementById("keepBtn");

const radioBtn =
  document.getElementById("radioBtn");

const radioPanel =
  document.getElementById("radioPanel");

const closeRadio =
  document.getElementById("closeRadio");

const radioStart =
  document.getElementById("radioStart");

const trackTitle =
  document.getElementById("trackTitle");

const trackArtist =
  document.getElementById("trackArtist");

const trackAlbum =
  document.getElementById("trackAlbum");

const trackNote =
  document.getElementById("trackNote");

const albumInitials =
  document.getElementById("albumInitials");

const choiceSection =
  document.getElementById("choiceSection");


/* =========================================================
   INTRO
   ========================================================= */

enterBtn.addEventListener(
  "click",
  () => {

    intro.style.opacity = "0";

    intro.style.transition =
      "opacity 0.6s ease";

    setTimeout(
      () => {

        intro.classList.add("hidden");

        app.classList.remove("hidden");

      },
      600
    );

  }
);


/* =========================================================
   LOAD DISCOVERY
   ========================================================= */

function loadDiscovery(index) {

  const track =
    discoveries[index];

  trackTitle.textContent =
    track.title;

  trackArtist.textContent =
    track.artist;

  trackAlbum.textContent =
    "— " + track.album;

  trackNote.textContent =
    track.note;

  albumInitials.textContent =
    track.initials;

}


/* =========================================================
   NEXT DISCOVERY
   ========================================================= */

anotherBtn.addEventListener(
  "click",
  () => {

    currentIndex++;

    if (
      currentIndex >=
      discoveries.length
    ) {

      currentIndex = 0;

    }

    loadDiscovery(
      currentIndex
    );

    choiceSection.classList.remove(
      "hidden"
    );

    window.scrollTo({

      top: 0,

      behavior: "smooth"

    });

  }
);


/* =========================================================
   PLAY
   ========================================================= */

playBtn.addEventListener(
  "click",
  () => {

    const track =
      discoveries[currentIndex];

    window.open(
      track.link,
      "_blank"
    );

  }
);


/* =========================================================
   KEEP
   ========================================================= */

keepBtn.addEventListener(
  "click",
  () => {

    keepBtn.textContent =
      "✓ Gardée";

    keepBtn.style.color =
      "var(--paper)";

  }
);


/* =========================================================
   CHOICES
   ========================================================= */

document
  .querySelectorAll(".choice-card")
  .forEach(
    card => {

      card.addEventListener(
        "click",
        () => {

          const choice =
            card.dataset.choice;

          if (
            choice === "left"
          ) {

            currentIndex =
              (currentIndex + 1)
              % discoveries.length;

          }

          else {

            currentIndex =
              (currentIndex + 2)
              % discoveries.length;

          }

          loadDiscovery(
            currentIndex
          );

          window.scrollTo({

            top: 0,

            behavior: "smooth"

          });

        }
      );

    }
  );


/* =========================================================
   RADIO OPEN
   ========================================================= */

radioBtn.addEventListener(
  "click",
  () => {

    radioPanel.classList.remove(
      "hidden"
    );

  }
);


/* =========================================================
   RADIO CLOSE
   ========================================================= */

closeRadio.addEventListener(
  "click",
  () => {

    radioPanel.classList.add(
      "hidden"
    );

  }
);


/* =========================================================
   RADIO START
   ========================================================= */

radioStart.addEventListener(
  "click",
  () => {

    const track =
      discoveries[
        Math.floor(
          Math.random()
          *
          discoveries.length
        )
      ];

    window.open(
      track.link,
      "_blank"
    );

  }
);


/* =========================================================
   INITIAL LOAD
   ========================================================= */

loadDiscovery(
  currentIndex
);
