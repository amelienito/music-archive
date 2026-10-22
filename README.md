# Music Discovery

Quelqu'un a fouillé pendant des années. Allume, et écoute ce qu'il a trouvé.

Site en ligne : https://amelienito.github.io/music-archive/

---

## Ce que fait la v0.2

- **Allumage** : on allume la machine, le cadran s'éclaire.
- **Découvrir** : « Je te fais confiance » ou trois faders (calme ↔ agressif, familier ↔ étrange, se poser ↔ bouger).
- **Duels** : deux morceaux à la fois, l'un proche de ce que tu cherches, l'autre un pas de côté. Survol (ou bouton « Extrait » sur téléphone) = 30 secondes de pré-écoute.
- **Ruptures de rythme** : tous les 3 duels, il se passe autre chose (un écart, un morceau mis de côté pour toi, une question).
- **Rencontre** : le morceau choisi joue directement sur le site. On y reste. « Et après ? » propose un morceau dans la même pièce et un complètement ailleurs.
- **Le bac** : tout ce que tu croises et tout ce que tu gardes reste en mémoire dans ton navigateur, même des mois plus tard. On peut écouter ses gardés à la suite, les ouvrir en playlist YouTube ou copier la liste.
- **La machine** (Écouter) : une platine, un afficheur, trois touches. La radio enchaîne les morceaux avec un fil (chaque morceau est proche du précédent, avec un écart de temps en temps).
- **La molette** (en bas à droite, en haut sur téléphone) : change la teinte du site. Ambre, Papier, Signal, Vide. Une cinquième se débloque en explorant.

## Les fichiers

| Fichier | À quoi il sert | Tu y touches ? |
|---|---|---|
| `data.js` | Ta banque de morceaux et tes textes | **Oui, c'est le tien** |
| `teintes.css` | Les couleurs et polices de chaque teinte | Si tu veux créer une teinte |
| `styles.css` | La forme des objets (cadran, platine, pochettes) | Rarement |
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

## Ce qu'il faut savoir

- La lecture passe par le lecteur YouTube intégré : gratuit, complet, pour tout le monde, sans compte.
- Certains clips refusent d'être lus hors de YouTube. Le site le détecte : il propose le lien, et la radio passe au suivant.
- Les pochettes HD et les extraits viennent du catalogue public d'Apple Music. Si un morceau n'y est pas, l'image YouTube prend le relais.
- Tout est gratuit : aucun serveur, aucune base de données, hébergé par GitHub Pages.
