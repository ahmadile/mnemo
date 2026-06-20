# Mnemo · DataCamp Bridge (Extension Chrome)

Cette extension capture le contenu de vos cours DataCamp et l'envoie directement dans Mnemo pour générer une mission de codage.

## Installation

1. Ouvrez Chrome (ou tout navigateur Chromium : Edge, Brave, Opera)
2. Allez sur `chrome://extensions/`
3. Activez le **Mode développeur** (en haut à droite)
4. Cliquez sur **Charger l'extension non empaquetée**
5. Sélectionnez le dossier `mnemo-datacamp-extension/`
6. L'icône Mnemo apparaît dans votre barre d'extensions

## Configuration

1. Lancez Mnemo en local (`http://localhost:3000`) ou sur votre VPS de production
2. Cliquez sur l'icône Mnemo dans Chrome
3. Vérifiez l'URL du serveur (par défaut `http://localhost:3000`)
4. Le statut doit afficher "Connecté à Mnemo" en vert

## Utilisation

1. Naviguez vers un cours DataCamp (ex: `app.datacamp.com/learn/courses/...`)
2. Un badge "Mnemo prêt à capturer" apparaît en bas à droite
3. Cliquez sur l'icône Mnemo dans la barre d'extensions
4. Sélectionnez le cursus cible (Python, SQL, etc.)
5. Cliquez sur **Capturer & Envoyer**
6. L'extension extrait le contenu, génère une mission, et ouvre Mnemo directement sur la mission

## Comment ça marche

L'extension utilise un content script injecté sur les pages DataCamp qui :
1. Détecte automatiquement la zone de contenu du cours (sélecteurs CSS spécifiques à DataCamp)
2. Extrait le texte nettoyé (instructions, code samples, contexte)
3. Envoie le contenu à l'API Mnemo `/api/missions` avec l'URL source
4. Mnemo génère la mission via l'IA et redirige vers la vue mission

## Limitations

- Nécessite d'être connecté à DataCamp (votre session Chrome est utilisée)
- Ne capture pas les vidéos (uniquement le texte des exercices et instructions)
- Pour les transcriptions vidéo YouTube, utilisez le bouton "YouTube" directement dans Mnemo

## Fichiers

- `manifest.json` — Configuration Manifest V3
- `popup.html` / `popup.js` — Interface popup
- `content.js` — Script injecté sur DataCamp
- `background.js` — Service worker
- `icons/` — Icônes 16/48/128px

## Développement

Pour modifier l'extension :
1. Éditez les fichiers
2. Allez sur `chrome://extensions/`
3. Cliquez sur le bouton "Recharger" de l'extension Mnemo
