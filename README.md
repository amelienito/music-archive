# Music Discovery

Quelqu'un a fouillé pendant des années. Commence, et écoute ce qu'il a trouvé.

Site en ligne : https://amelienito.github.io/music-archive/

---

## Ce que fait la v0.9

- **L'intro** : on règle le volume (la molette se tourne comme une vraie, ou on touche l'anneau), puis **Commencer**. Les morceaux très énergiques sont baissés automatiquement.
- **La façade** (en haut) : Découvrir / Écouter, les pastilles de teinte, le volume, **Réglages** (teinte + façon d'écouter) et **Mes trouvailles**.
- **Découvrir, par où commencer** : une seule question, « T'as envie de quoi ? » : *Quelque chose d'énergique*, *De la détente*, ou *Surprends-moi*. Plus le morceau du jour, une carte à retourner (le même pour tout le monde, il change chaque jour).
- **Découvrir, la fouille** : une seule page. Le disque qui joue est réuni dans un seul bloc (vidéo, titre, album, **Garder**) qui reste à l'écran sur ordinateur ; sur téléphone, le petit lecteur prend le relais dès qu'on fait défiler. Juste à côté, **la suite** : deux disques, chacun avec une étiquette de disquaire qui dit où il t'emmène (« Dans la même veine », « Plus confidentiel », « Plus calme », « Complètement ailleurs »…). On survole ou on touche « Écouter 30 s » pour entendre un bout, on clique pour choisir. Si on ne choisit pas, le premier démarre tout seul à la fin du morceau (compte à rebours de 5 secondes, « Rester ici » pour l'arrêter). « Aucun des deux » en propose deux autres. Les directions que tu choisis souvent reviennent plus souvent.
- **Les surprises** : de temps en temps une carte mystère (un des deux disques est caché, juste un indice), et un « Coup de cœur » mis de côté pour toi.
- **Le livret** (replié, sous la page) : l'album en une phrase (« Album sorti le 26 octobre 1992 chez Epic. 8 titres, 47 minutes. Au rayon soul. »), sa fiche Wikipédia quand elle existe, la liste des titres avec le morceau en cours surligné (chaque titre s'écoute 30 secondes d'un toucher, et ceux qui sont dans la sélection se lancent en entier), l'artiste, et les liens pour écouter le morceau en entier (YouTube Music, Deezer, Apple Music, Qobuz, Bandcamp) et lire les paroles.
- **Clavier** : 1 ou 2 pour choisir la suite, G pour garder, Espace pour la pause.
- **Mes trouvailles** : les morceaux gardés + l'historique de tout ce que tu as croisé, enregistré dans ton navigateur. On peut les écouter à la suite, les ouvrir en playlist YouTube ou copier la liste.
- **Écouter** : une chaîne inspirée de la pochette *For A Good Time…* d'Odeal. Enceintes en noyer qui bougent avec la musique, magnétophone à bandes derrière un plexi fumé (les bobines tournent quand ça joue, appuie dessus = lecture/pause), afficheur fluorescent qui annonce la suite, **Garder** et **Plus d'infos** (le livret s'ouvre sous la chaîne). Cinq touches, comme les stations d'un vieux poste : **Énergique**, **Détente**, **Surprends-moi**, **Mes trouvailles**, **Longs moments** (20 minutes et plus). On appuie, la radio change de station tout de suite et enchaîne seule d'un morceau proche à l'autre. Dans Découvrir, « Connu / Confidentiel » se mesure tout seul d'après le nombre de fans de l'artiste principal sur Deezer ; on peut forcer avec `connu: true` dans data.js (Mozart, Zelda…).
- **Une radio qui ne se bloque plus** : un morceau qui refuse de se lire (vidéo refusée, extrait périmé, vidéo qui ne démarre pas) est remplacé par son extrait ou sauté au bout de quelques secondes ; après trois ratés d'affilée, la radio s'arrête proprement et dit pourquoi.
- **Réglages** : morceaux complets via YouTube, ou extraits de 30 secondes sans pub ; teinte du site.
- **Trois teintes** : Salon (le jour), Nuit (le mode sombre, choisi tout seul si le téléphone est en mode sombre), Papier.

## La table de tri

**https://amelienito.github.io/music-archive/tri.html**

1. Colle le lien d'une playlist YouTube ou YouTube Music (ou des liens de morceaux, un par ligne), clique sur Charger.
2. Chaque morceau se lance (à 0:40 pour sauter l'intro, décochable). Bouton **vert = oui**, il entre sur le site. **Rouge = non**, il sort. « Pas sûr » le met de côté pour plus tard.
3. Clavier : → oui, ← non, ↓ plus tard, Espace pause, ↑ +30 s, Z annuler. Sur téléphone : glisser la fiche à droite ou à gauche.
4. Un morceau déjà sur le site, ou déjà trié dans n'importe quelle playlist, est sauté tout seul. Tes choix sont enregistrés au fur et à mesure : tu peux fermer et revenir. Recoller la même playlist la reprend là où tu t'étais arrêté (et ajoute les morceaux que tu y as mis depuis).
5. **Ordre aléatoire** (case à cocher) : les morceaux arrivent dans le désordre, pour juger chacun sans être influencé par ceux d'à côté.
6. **Plus de 200 morceaux** : le lecteur YouTube n'en donne que 200 d'un coup. La table redemande la suite toute seule ; si ça bloque quand même, inverse l'ordre de la playlist dans YouTube Music (ou coupe-la en deux) et recolle-la : tout ce qui est déjà trié est sauté.
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
| `pochettes.js` | Va chercher pochettes, extraits, et la fiche de l'album (date, label, titres) | Non |
| `infos.js` | Va chercher les fiches Wikipédia de l'artiste et de l'album | Non |
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
- `liens: ["Judy", "Quiet Storm"]` force le morceau proposé « Dans la même veine ».

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
