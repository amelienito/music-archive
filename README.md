# Music Discovery

Quelqu'un a fouillé pendant des années. Allume, et écoute ce qu'il a trouvé.

Site en ligne : https://amelienito.github.io/music-archive/

---

## Ce que fait la v0.5

- **Allumage** : on règle le volume avec la molette, puis on allume. Les morceaux très énergiques sont baissés automatiquement.
- **La façade** (en haut) : Découvrir / Écouter, les pastilles de teinte, le volume, **Réglages** (teinte + façon d'écouter) et **Mes trouvailles**.
- **Le morceau du jour** : une carte à retourner, la même pour tout le monde, elle change chaque jour.
- **Découvrir** : « Je te fais confiance » ou trois faders (calme ↔ agressif, familier ↔ étrange, se poser ↔ bouger).
- **Duels** : deux morceaux à la fois, de la même énergie, l'un familier, l'autre un pas de côté. Survol (ou « Écouter un extrait » sur téléphone) = 30 secondes de pré-écoute.
- **Cartes mystère** et **ruptures de rythme** tous les 3 duels.
- **La page d'un morceau** : il joue tout de suite. Juste sous le titre, **Garder** et le gros bouton **Morceau suivant** (qui se lance aussi tout seul à la fin). Puis des directions (plus calme, plus étrange, plus dansant, complètement ailleurs), et **Plus d'infos** : album, année, genre, durée, qui est l'artiste (Wikipédia), paroles sur Genius, liens YouTube Music.
- **Mes trouvailles** : les morceaux gardés + l'historique de tout ce que tu as croisé, enregistré dans ton navigateur. On peut les écouter à la suite, les ouvrir en playlist YouTube ou copier la liste.
- **Écouter** : une chaîne inspirée de la pochette *For A Good Time…* d'Odeal. Enceintes en noyer qui bougent avec la musique, platine CD verticale à couvercle fumé (appuie dessus = lecture/pause), unité avec afficheur fluorescent, touches, **Garder** et **Plus d'infos** intégrés. Pas de catégories : trois molettes règlent ce qui passe (calme ↔ intense, familier ↔ étrange, assis ↔ debout), le morceau en cours continue et la suite s'adapte. Interrupteur « Toute la sélection / Mes trouvailles ».
- **Réglages** : morceaux complets via YouTube, ou extraits de 30 secondes sans pub ; teinte du site.
- **Les teintes** : Salon (par défaut), Ambre, Papier, Signal, Vide. Une sixième se débloque en explorant.

## La table de tri

**https://amelienito.github.io/music-archive/tri.html**

1. Colle le lien d'une playlist YouTube ou YouTube Music (ou des liens de morceaux, un par ligne), clique sur Charger.
2. Chaque morceau se lance (à 0:40 pour sauter l'intro, décochable). Bouton **vert = oui**, il entre sur le site. **Rouge = non**, il sort. « Pas sûr » le met de côté pour plus tard.
3. Clavier : → oui, ← non, ↓ plus tard, Espace pause, ↑ +30 s, Z annuler. Sur téléphone : glisser la fiche à droite ou à gauche.
4. Les morceaux déjà sur le site sont sautés tout seuls. Tes choix sont enregistrés au fur et à mesure : tu peux fermer et revenir.
5. Quand tu veux, **Copier pour Claude**, et colle le texte dans la conversation : Claude ajoute les oui dans `data.js` avec leurs réglages.

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

## Ce qu'il faut savoir

- La lecture passe par le lecteur YouTube intégré : gratuit, complet, pour tout le monde, sans compte.
- Certains morceaux refusent d'être lus hors de YouTube. Le site le détecte et joue à la place l'extrait de 30 secondes, avec le lien vers la version complète. Le vérificateur te dit lesquels remplacer.
- Les morceaux complets passent par YouTube, qui peut afficher des pubs. Un visiteur connecté à YouTube Premium n'en a pas. Sinon : un bloqueur de pub, ou le mode extraits (le site l'explique dans un encart la première fois).
- Les extraits viennent d'Apple Music, et de Deezer quand Apple ne trouve pas.
- Écouter n'a plus de catégories à nommer : ce sont les réglages energie / etrange / danse de chaque morceau qui décident ce que les molettes font passer.
- Sur iPhone, une page web ne peut pas régler le volume : ce sont les boutons du téléphone qui comptent.
- Les pochettes HD viennent d'Apple Music ou de Deezer. Si un morceau n'y est pas, l'image YouTube prend le relais.
- Tout est gratuit : aucun serveur, aucune base de données, hébergé par GitHub Pages.
