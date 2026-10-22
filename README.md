# Music Discovery

Quelqu'un a fouillé pendant des années. Allume, et écoute ce qu'il a trouvé.

Site en ligne : https://amelienito.github.io/music-archive/

---

## Ce que fait la v0.6

- **Allumage** : on règle le volume avec la molette, puis on allume. Les morceaux très énergiques sont baissés automatiquement.
- **La façade** (en haut) : Découvrir / Écouter, les pastilles de teinte, le volume, **Réglages** (teinte + façon d'écouter) et **Mes trouvailles**.
- **Le morceau du jour** : une carte à retourner, la même pour tout le monde, elle change chaque jour.
- **Découvrir** : « Je te fais confiance » ou trois faders (calme ↔ agressif, familier ↔ étrange, se poser ↔ bouger).
- **Duels** : deux morceaux à la fois, de la même énergie, l'un familier, l'autre un pas de côté. Survol (ou « Écouter un extrait » sur téléphone) = 30 secondes de pré-écoute.
- **Cartes mystère** et **ruptures de rythme** tous les 3 duels.
- **La page d'un morceau** : il joue tout de suite. Juste sous le titre, **Garder** et le gros bouton **Morceau suivant** (qui se lance aussi tout seul à la fin). Puis **Écouter en entier sur** YouTube Music, Deezer, Apple Music, Qobuz ou Bandcamp, des directions (plus calme, plus étrange, plus dansant, complètement ailleurs), et **Plus d'infos** : album, année, genre, durée, qui est l'artiste (Wikipédia), paroles sur Genius.
- **Mes trouvailles** : les morceaux gardés + l'historique de tout ce que tu as croisé, enregistré dans ton navigateur. On peut les écouter à la suite, les ouvrir en playlist YouTube ou copier la liste.
- **Écouter** : une chaîne inspirée de la pochette *For A Good Time…* d'Odeal. Enceintes en noyer qui bougent avec la musique, platine CD verticale à couvercle fumé (appuie dessus = lecture/pause), unité avec afficheur fluorescent, touches, **Garder** et **Plus d'infos** intégrés. Pas de catégories : trois molettes règlent ce qui passe (calme ↔ intense, familier ↔ étrange, assis ↔ debout), le morceau en cours continue et la suite s'adapte. Interrupteur « Toute la sélection / Mes trouvailles / Au hasard ». L'afficheur annonce le morceau suivant.
- **Réglages** : morceaux complets via YouTube, ou extraits de 30 secondes sans pub ; teinte du site.
- **Trois teintes** : Salon (le jour), Nuit (le mode sombre, choisi tout seul si le téléphone est en mode sombre), Papier.

## La table de tri

**https://amelienito.github.io/music-archive/tri.html**

1. Colle le lien d'une playlist YouTube ou YouTube Music (ou des liens de morceaux, un par ligne), clique sur Charger.
2. Chaque morceau se lance (à 0:40 pour sauter l'intro, décochable). Bouton **vert = oui**, il entre sur le site. **Rouge = non**, il sort. « Pas sûr » le met de côté pour plus tard.
3. Clavier : → oui, ← non, ↓ plus tard, Espace pause, ↑ +30 s, Z annuler. Sur téléphone : glisser la fiche à droite ou à gauche.
4. Un morceau déjà sur le site, ou déjà trié dans n'importe quelle playlist, est sauté tout seul. Tes choix sont enregistrés au fur et à mesure : tu peux fermer et revenir. Recoller la même playlist la reprend là où tu t'étais arrêté (et ajoute les morceaux que tu y as mis depuis).
5. Sous chaque titre, la table dit si la vidéo vient d'une chaîne officielle (YouTube Music, l'artiste, le label). Si elle doute, cherche la version officielle avant de dire oui.
6. **Trier aussi les morceaux déjà sur le site** : repasse la sélection actuelle. Vert, il reste ; rouge, il sort.
7. Mode sombre par défaut, bouton « Mode clair » en haut.
8. Quand tu veux, **Copier pour Claude**, et colle le texte dans la conversation : Claude ajoute les oui dans `data.js` avec leurs réglages.

## Les fichiers

| Fichier | À quoi il sert | Tu y touches ? |
|---|---|---|
| `data.js` | Ta banque de morceaux et tes textes | **Oui, c'est le tien** |
| `teintes.css` | Les couleurs et polices de chaque teinte | Si tu veux créer une teinte |
| `styles.css` | La forme des objets (façade, chaîne, pochettes) | Rarement |
| `app.js` | Le fonctionnement | Non |
| `pochettes.js` | Va chercher pochettes, extraits, album, année, genre | Non |
| `infos.js` | Va chercher la fiche de l'artiste sur Wikipédia | Non |
| `tri.html` + `tri.js` | La table de tri des playlists | Non |
| `index.html` | La page | Non |

## Ajouter un morceau

Dans `data.js`, copie un bloc, colle-le avant le `];` final, remplis :

```js
{ titre: "Pearls", artiste: "Sade", album: "Love Deluxe",
  lien: "https://music.youtube.com/watch?v=JcljzvUgoAQ",
  note: "Ce que tu veux en dire. Ou rien.",
  energie: 2, etrange: 4, danse: 1 },
```

- La **pochette** et l'**extrait** se trouvent tout seuls (pas besoin de les fournir).
- La **note** est facultative. Un morceau sans texte, c'est très bien aussi.
- `liens: ["Judy", "Quiet Storm"]` force les morceaux proposés dans « Et après ? ».

## Vérifier que tous les morceaux se lisent

Ouvre **https://amelienito.github.io/music-archive/verif.html** et clique sur « Lancer la vérification ». La page teste chaque morceau et te dit lesquels refusent d'être lus sur un autre site, avec un lien pour chercher une autre version. Remplace le lien dans `data.js`, c'est tout.

## Dans les clous

- **Le site n'héberge aucune musique.** Il intègre le lecteur officiel de YouTube, comme un article de blog intègre une vidéo. En Europe, intégrer une vidéo mise en ligne avec l'accord des ayants droit est légal (Cour de justice de l'UE, arrêts Svensson 2014 et BestWater 2014). D'où l'importance de choisir des versions **officielles** (la table de tri les signale).
- **Les règles du lecteur YouTube sont respectées** : la vidéo est toujours visible quand elle joue (au moins 200 × 200 pixels, rien par-dessus), jamais de lecture cachée, et le site ne pousse plus à bloquer les pubs (c'est interdit par ces règles, et ce sont ces pubs qui paient les artistes). Replier le petit lecteur met la vidéo en pause.
- **Les extraits de 30 secondes** viennent de Deezer et d'Apple Music, qui les fournissent pour faire découvrir : le site indique toujours d'où vient l'extrait, avec le lien pour écouter le morceau en entier chez eux.
- **Pour aller plus loin (payant)** : une vraie webradio, comme Radiooooo, qui diffuse ses propres fichiers. En France, pour une webradio associative sans recettes : environ 80 € HT par an à la SACEM (forfait 2021) et au moins 300 € HT par an à la SPRE (barème 2019), plus l'hébergement du flux. Ça ne couvrirait qu'Écouter (une radio, où l'on ne choisit pas le morceau) ; Découvrir resterait sur YouTube.

## Ce qu'il faut savoir

- La lecture passe par le lecteur YouTube intégré : gratuit, complet, pour tout le monde, sans compte. Pas de Spotify.
- Certains morceaux refusent d'être lus hors de YouTube. Le site le détecte et joue à la place l'extrait de 30 secondes, avec le lien vers la version complète. Le vérificateur te dit lesquels remplacer.
- Les morceaux complets passent par YouTube, qui peut afficher des pubs. Un visiteur connecté à YouTube Premium n'en a pas. Sinon : le mode extraits, ou les liens Deezer, Apple Music, Qobuz et Bandcamp de chaque morceau (le site l'explique la première fois).
- Les extraits viennent d'Apple Music, et de Deezer quand Apple ne trouve pas.
- Écouter n'a plus de catégories à nommer : ce sont les réglages energie / etrange / danse de chaque morceau qui décident ce que les molettes font passer.
- Sur iPhone, une page web ne peut pas régler le volume : ce sont les boutons du téléphone qui comptent.
- Les pochettes HD viennent d'Apple Music ou de Deezer. Si un morceau n'y est pas, l'image YouTube prend le relais.
- Tout est gratuit : aucun serveur, aucune base de données, hébergé par GitHub Pages.
