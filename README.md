# Music Discovery

Quelqu'un a fouillé pendant des années. Allume, et écoute ce qu'il a trouvé.

Site en ligne : https://amelienito.github.io/music-archive/

---

## Ce que fait la v0.4

- **Allumage** : on règle le volume avec la molette, puis on allume. Les morceaux très énergiques sont baissés automatiquement.
- **La façade** (en haut) : le sélecteur Découvrir / Écouter, la molette Volume, la molette Teinte, le Bac.
- **Le morceau du jour** : une carte à retourner, la même pour tout le monde, elle change chaque jour.
- **Découvrir** : « Je te fais confiance » ou trois faders (calme ↔ agressif, familier ↔ étrange, se poser ↔ bouger).
- **Duels** : deux morceaux à la fois, l'un proche de ce que tu cherches, l'autre un pas de côté. Survol (ou bouton « Extrait » sur téléphone) = 30 secondes de pré-écoute.
- **Cartes mystère** : parfois une des deux pochettes est cachée, avec juste un indice. On la retourne, elle se lance.
- **Ruptures de rythme** : tous les 3 duels, il se passe autre chose (un écart, un morceau mis de côté pour toi, une question).
- **Rencontre** : le morceau choisi joue directement sur le site. On y reste. « Et après ? » propose des directions (plus calme, plus étrange, plus dansant, complètement ailleurs). À la fin du morceau, ça enchaîne tout seul.
- **Le bac** : tout ce que tu croises et tout ce que tu gardes reste en mémoire dans ton navigateur, même des mois plus tard. On peut écouter ses gardés à la suite, les ouvrir en playlist YouTube ou copier la liste.
- **Écouter** : une chaîne hi-fi avec un lecteur CD à changeur. Chaque disque est une sélection (Brume, Velours, Bitume, Groove, Déflagration, Toutes, Ton bac). Afficheur fluorescent avec piste et temps, touches précédent / lecture / stop / suivant / éjecter, boîtier CD avec la pochette.
- **Comment écouter** (dans le Bac) : morceaux complets via YouTube, ou extraits de 30 secondes sans aucune pub.
- **Les teintes** : Ambre, Papier, Signal, Vide. Une cinquième se débloque en explorant.

## Les fichiers

| Fichier | À quoi il sert | Tu y touches ? |
|---|---|---|
| `data.js` | Ta banque de morceaux et tes textes | **Oui, c'est le tien** |
| `teintes.css` | Les couleurs et polices de chaque teinte | Si tu veux créer une teinte |
| `styles.css` | La forme des objets (façade, lecteur CD, pochettes) | Rarement |
| `app.js` | Le fonctionnement | Non |
| `pochettes.js` | Va chercher pochettes et extraits tout seul | Non |
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
- La liste des disques (stations) se règle en bas de `data.js`.
- Sur iPhone, une page web ne peut pas régler le volume : ce sont les boutons du téléphone qui comptent.
- Les pochettes HD viennent d'Apple Music ou de Deezer. Si un morceau n'y est pas, l'image YouTube prend le relais.
- Tout est gratuit : aucun serveur, aucune base de données, hébergé par GitHub Pages.
