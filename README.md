# Cozy

Un lecteur Spotify de bureau, chaleureux et moderne, pour Windows et Linux.

- L'audio est lu par [go-librespot](https://github.com/devgianlu/go-librespot) (protocole Spotify Connect), lancé en sous-processus local — pas de DRM, pas de dépendance à un fork d'Electron.
- La recherche, les playlists et la bibliothèque passent par l'API Web officielle de Spotify (OAuth PKCE, aucun secret stocké côté app).

Nécessite un compte **Spotify Premium**.

## Mise en route

1. Installe les dépendances et récupère le binaire go-librespot pour ta machine :

   ```bash
   npm install
   ```

   (le téléchargement du binaire — et sur Windows, des DLLs audio dont il a besoin — tourne automatiquement via `postinstall`)

2. Crée une app sur le [dashboard développeur Spotify](https://developer.spotify.com/dashboard) (gratuit). Dans ses réglages, ajoute la Redirect URI :

   ```
   http://127.0.0.1:43231/callback
   ```

3. Lance l'app :

   ```bash
   npm run dev
   ```

4. Au premier lancement, colle ton Client ID Spotify quand demandé, puis connecte-toi (ça ouvre ton navigateur pour l'API Web — recherche, playlists, bibliothèque).

5. Un second onglet s'ouvre automatiquement pour autoriser la lecture audio elle-même (go-librespot a son propre client Spotify, séparé de ton Client ID — c'est nécessaire pour obtenir le scope de streaming). Approuve l'accès. Cette étape n'est nécessaire qu'une fois — les identifiants sont ensuite mémorisés localement dans le dossier de config de l'app.

## Fonctionnalités

- Thème sombre chaleureux, fond ambiant qui prend les couleurs de la pochette en cours
- Double-clic pour lire un titre, cœur pour liker
- Mode affichage plein écran (horloge, pochette géante, oscilloscope) — `Espace` pause/lecture, `←`/`→` précédent/suivant, `Échap` pour sortir
- Mini-lecteur flottant toujours au premier plan ; minimiser la fenêtre principale l'ouvre automatiquement

## Build

```bash
npm run build:win     # installeur NSIS Windows
npm run build:linux   # AppImage + .deb
```

Chaque script télécharge d'abord le binaire go-librespot correspondant à la plateforme cible.

## Architecture

```
src/
  main/        processus principal Electron : sous-processus go-librespot,
               OAuth PKCE Spotify, wrapper API Web, IPC, fenêtres
  preload/     pont contextBridge exposé au renderer sous window.cozy
  renderer/    interface React (thème "cozy")
  shared/      types partagés main/renderer
scripts/
  fetch-librespot.mjs   télécharge le binaire go-librespot (+ DLLs Windows)
```
