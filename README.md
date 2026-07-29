# Music Discovery — Prototype

Application mobile-first de découverte musicale.  
Fonctionne entièrement en local, sans serveur (mais recommandé pour le chargement des assets).

---

## Lancement local

```bash
cd /chemin/vers/projet
python3 -m http.server 8080
```

Ouvrir **http://localhost:8080** dans le navigateur.

---

## Structure des fichiers

| Fichier       | Rôle                                              |
|---------------|---------------------------------------------------|
| `index.html`  | Structure HTML, charge styles et scripts          |
| `styles.css`  | Styles (variables CSS, composants mobile-first)   |
| `data.js`     | Données des titres (TRACKS, FALLBACK_TRACK)       |
| `app.js`      | Logique complète (IIFE, navigation, actions)      |
| `README.md`    | Ce fichier                                        |

---

## Fonctionnement

- **Découverte** : affiche 2 titres côte à côte. Actions : Passer / Garder / Choisir (avance de 2).
- **Compteur** : mis à jour après chaque encounter (en-tête).
- **Jalons** : message en bannière à 5 et 20 titres découverts.
- **Onglets** : Découverte · Rencontrés · Gardés · Radio (générés dynamiquement).
- **Radio** : lit un titre gardé (ou aléatoire si liste vide).

---

## Ajouter des titres

Dans `data.js`, ajouter des objets dans `TRACKS` :

```js
{
  id: 21,
  title: "Mon Morceau",
  artist: "Mon Artiste",
  duration: 240,
  audioUrl: "https://example.com/mon-morceau.mp3"
}
```

Le champ `audioUrl` est optionnel. Sans lui, un bouton « Simuler » est affiché.
