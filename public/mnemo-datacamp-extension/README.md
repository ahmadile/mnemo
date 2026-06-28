# Mnemo · DataCamp Bridge v1.3.1

Extension Chrome qui capture vos cours DataCamp et les envoie à Mnemo pour générer automatiquement des missions de codage.

## Nouveautés v1.3.1

- **Support Vercel** : ajout de `https://*.vercel.app/*` dans les host_permissions (corrige « Serveur Mnemo injoignable » en production)
- **Messages d'erreur** : hints distincts pour localhost vs déploiement distant (Vercel, Render, etc.)

## Nouveautés v1.2

- **Détection automatique du contexte** : l'extension reconnaît le cursus, le cours et le chapitre DataCamp que vous suivez
- **Création automatique de cursus** : si le cursus n'existe pas dans Mnemo, il est créé automatiquement avec la bonne couleur et le bon langage
- **Correction "Serveur injoignable"** : ajout de `localhost:3000` et `127.0.0.1:3000` dans les host_permissions
- **Correction `executeScript`** : ajout de la permission `scripting` dans le manifest
- **UI améliorée** : affiche le cours détecté en temps réel, badge sur les pages DataCamp, gestion d'erreurs claire

## Installation

1. Téléchargez et décompressez `mnemo-datacamp-extension.zip`
2. Ouvrez `chrome://extensions/` dans Chrome
3. Activez le **Mode développeur** (en haut à droite)
4. Cliquez sur **Charger l'extension non empaquetée**
5. Sélectionnez le dossier `mnemo-datacamp-extension/` décompressé
6. L'icône Mnemo (vert avec "M") apparaît dans votre barre d'extensions

## Utilisation

1. Configurez l'URL Mnemo dans le popup :
   - **Local** : `http://localhost:3000` (`npm run dev`)
   - **Production** : `https://votre-app.vercel.app` (sans slash final)
2. Naviguez sur `app.datacamp.com` (connectez-vous à votre compte)
3. Un badge vert "Mnemo prêt" apparaît en bas à droite des pages DataCamp
4. Cliquez sur l'icône Mnemo dans la barre d'extensions Chrome
5. Le popup affiche le cours détecté :
   - Titre du cours
   - Cursus parent (si détecté)
   - Langage (Python, SQL, R...)
   - Type de page (course, exercise, curriculum)
6. Cliquez sur **Capturer & Envoyer**
7. Mnemo s'ouvre dans un nouvel onglet sur la mission générée

## Comportement automatique

- **Cursus auto-créé** : si le cursus DataCamp n'existe pas dans Mnemo, il est créé avec :
  - Le titre du cursus ou du cours DataCamp
  - La couleur correspondant au langage (Python = bleu, SQL = vert, R = bleu foncé...)
  - Le langage par défaut pour les futures missions
- **Langage détecté** : l'extension analyse le titre + l'URL + le contenu pour choisir le bon langage
- **Missions générées** : le contenu extrait est envoyé à l'IA qui génère une mission scénarisée style GTA

## Dépannage

### "Serveur Mnemo injoignable"
- **Vercel / production** : utilisez `https://...` (pas `http://`) et installez l'extension **v1.3.1+**
- Rechargez l'extension dans `chrome://extensions/` après mise à jour
- **Local** : vérifiez que Mnemo tourne (`npm run dev` → `http://localhost:3000`)
- Vérifiez l'URL dans le champ "Serveur Mnemo" du popup (sans slash final)

### "Permission scripting manquante"
- Vérifiez que le `manifest.json` contient `"scripting"` dans `permissions`
- Rechargez l'extension dans `chrome://extensions/`

### "Contenu trop court"
- Vous n'êtes probablement pas sur un exercice/cours mais sur une page d'accueil
- Naviguez vers un cours spécifique dans DataCamp

### Le badge "Mnemo prêt" n'apparaît pas
- Rechargez la page DataCamp (F5)
- L'extension a peut-être besoin d'être rechargée dans `chrome://extensions/`

## Fichiers

- `manifest.json` — Configuration Manifest V3 (v1.2)
- `popup.html` — Interface du popup (380px)
- `popup.js` — Logique de détection + capture + envoi
- `content.js` — Badge injecté sur les pages DataCamp
- `background.js` — Service worker
- `icons/` — Icônes 16/48/128px

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Page DataCamp (app.datacamp.com/learn/courses/...)     │
│  + content.js badge "Mnemo prêt"                        │
└─────────────────────────────────────────────────────────┘
                          │
                          │ (clic sur l'icône extension)
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Popup (380px)                                          │
│  1. Détecte le contexte (cursus, cours, chapitre)       │
│  2. Vérifie la connexion serveur Mnemo                  │
│  3. Affiche le cours détecté                            │
│  4. Bouton "Capturer & Envoyer"                         │
└─────────────────────────────────────────────────────────┘
                          │
                          │ (clic sur Capturer & Envoyer)
                          ▼
┌─────────────────────────────────────────────────────────┐
│  1. POST /api/datacamp/detect                           │
│     → trouve ou crée le cursus Mnemo correspondant      │
│  2. Extraction du contenu via chrome.scripting          │
│  3. POST /api/missions                                  │
│     → génère la mission via l'IA                        │
│  4. Ouvre Mnemo sur la mission dans un nouvel onglet    │
└─────────────────────────────────────────────────────────┘
```
