# Mnemo — Guide de la base de données

## Comment ça marche actuellement

Mnemo utilise **SQLite** (fichier local `db/custom.db`) via **Prisma ORM**. Aucune configuration externe nécessaire — la base est créée automatiquement au premier démarrage.

```
Votre ordinateur
└── /home/z/my-project/db/custom.db  ← fichier SQLite (vos données)
```

### Vous n'avez PAS besoin de clé API pour la base de données

- ❌ La base de données = fichier local, pas de serveur, pas de clé
- ✅ La clé API Z.ai (`z-ai-web-dev-sdk`) = pour l'IA uniquement (génération missions, chat agents)
- ✅ Ces deux choses sont totalement indépendantes

## Faut-il mettre la clé API Z.ai ?

**Oui**, pour que l'IA fonctionne (génération de missions, évaluation de code, chat avec agents).

Créez un fichier `.z-ai-config` à la racine du projet :

```json
{
  "apiKey": "VOTRE_CLE_API_Z_AI"
}
```

Obtenez votre clé sur https://z.ai → API Keys.

**Sans cette clé** :
- ❌ Générer une mission → erreur "Configuration file not found"
- ❌ Évaluer du code → erreur
- ❌ Chat avec agent → erreur
- ✅ Créer un cursus manuellement → OK (pas d'IA)
- ✅ Exécuter du Python (Pyodide) → OK (pas d'IA)
- ✅ Le monde 2D → OK (pas d'IA)

## Est-ce que chaque agent aura sa propre base de données ?

**Non, mais chaque agent a ses propres données isolées.**

Tous les agents partagent la même base SQLite, mais leurs données sont séparées par des relations :

```
Base SQLite unique (db/custom.db)
│
├── Curriculum (Python, SQL, IA, Data, Web, Rust, etc.)
│   ├── id: "cursus-python-123"
│   ├── name: "Python"
│   ├── xp: 1500
│   ├── level: 3
│   │
│   ├── Mission[] (toutes les missions de CE cursus)
│   │   ├── id: "mission-456"
│   │   ├── title: "Opération Variables"
│   │   ├── status: "completed"
│   │   └── MissionSubmission[] (toutes les tentatives)
│   │
│   └── Agent? (UN agent par cursus, né au niveau 3)
│       ├── id: "agent-789"
│       ├── name: "PY-3K"
│       ├── persona: "Je suis ton futur toi Python..."
│       ├── skills: ["variables", "boucles", "fonctions"]
│       └── AgentConversation[] (l'historique des discussions)
│           ├── role: "user" | "agent"
│           └── content: "Qu'est-ce qu'on a appris?"
```

### Isolation des données par agent

Chaque agent-mémoire a :
- **Son propre persona** (généré par l'IA selon le cursus)
- **Ses propres compétences** (basées sur les missions accomplies)
- **Son propre historique de conversations** (stocké dans `AgentConversation`)
- **Sa propre mémoire** (les 30 derniers messages sont chargés à chaque chat)

Quand vous discutez avec l'agent Python, il ne voit PAS les conversations de l'agent SQL. Chaque agent est isolé.

## Schéma complet de la base

| Table | Rôle | Contenu |
|-------|------|---------|
| **Curriculum** | Cursus d'apprentissage | Python, SQL, IA, Data, Web, ou custom |
| **Mission** | Exercice généré par l'IA | Briefing, objectifs, code de départ, statut |
| **MissionSubmission** | Tentative de l'utilisateur | Code soumis, feedback IA, passed/failed |
| **Agent** | Agent-mémoire (1 par cursus niveau 3+) | Persona, compétences, niveau |
| **AgentConversation** | Messages échangés avec un agent | Historique persistant (mémoire) |
| **DailyQuest** | Quêtes quotidiennes | Auto-générées chaque jour |
| **Achievement** | Badges débloqués | 17 succès possibles |

## Migration vers PostgreSQL (production)

Quand vous déploierez sur VPS pour le multi-joueurs :

### Étape 1 : Créer une base PostgreSQL
```bash
# Sur Render, Railway, ou Supabase
# Créez une base PostgreSQL gratuite
# Récupérez l'URL de connexion :
# postgresql://user:password@host:5432/dbname
```

### Étape 2 : Modifier le fichier .env
```env
# Avant (SQLite)
DATABASE_URL="file:./db/custom.db"

# Après (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

### Étape 3 : Migrer le schéma
```bash
bun run db:push  # Crée les tables dans PostgreSQL
```

### Étape 4 : Ajouter l'authentification (NextAuth.js)
```env
NEXTAUTH_SECRET="votre-secret-jwt"
NEXTAUTH_URL="https://votre-app.com"
```

## Sécurité des données

### En local (maintenant)
- ✅ Vos données restent sur votre machine (fichier SQLite)
- ✅ Jamais envoyées sur un serveur externe
- ⚠️ Sauf les appels IA (votre code/cours est envoyé à Z.ai pour génération)

### En production (VPS multi-joueurs)
- 🔒 Chaque utilisateur a ses propres cursus/agents/conversations
- 🔒 Authentification obligatoire (NextAuth.js)
- 🔒 Base PostgreSQL avec permissions par utilisateur
- 🔒 Clé API Z.ai en variable d'environnement (jamais dans le code Git)

## Sauvegarde et export

### Exporter vos données (JSON)
Menu **Réglages → Base de données → Exporter les données**

### Réinitialiser
Menu **Réglages → Zone dangereuse → Réinitialiser la base**

### Sauvegarde manuelle (local)
Copiez simplement le fichier `db/custom.db` — c'est toute votre base dans un seul fichier.
