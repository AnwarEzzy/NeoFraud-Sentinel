# Documentation Technique - GraphShield

## Architecture du Système

GraphShield utilise une structure client-serveur avec une base de données orientée graphe.

### Backend (Node.js/Express)
Le backend est structuré selon les principes de Clean Architecture :

1.  **Routes** : Point d'entrée des requêtes HTTP (`src/routes`).
2.  **Controllers** : Gestion de la requête/réponse, validation des entrées (`src/controllers`).
3.  **Services** : Logique métier et interaction avec la base de données (`src/services`).
4.  **Models** : Abstraction des données (bien que Neo4j soit schemaless, des classes modèles sont utilisées pour l'organisation).
5.  **Middlewares** : Gestion transversale (Auth, Erreurs).

### Frontend (React)
Application SPA créée avec Vite :

1.  **Context API** : Gestion de l'état global d'authentification (`AuthContext`).
2.  **Components/Pages** : Séparation logique entre les vues (Pages) et les éléments réutilisables (Components).
3.  **Axios Interceptors** : Gestion automatique des tokens JWT et des redirections 401.

### Base de Données (Neo4j)
Le modèle de données est centré sur la relation :

-   **Nodes** : `User`, `Account`, `Transaction`, `Merchant`, `Device`, `IP`, `Alert`.
-   **Relations** : 
    -   `(:User)-[:OWNS]->(:Account)`
    -   `(:Account)-[:PERFORMED]->(:Transaction)`
    -   `(:Transaction)-[:TO_MERCHANT]->(:Merchant)`
    -   `(:Transaction)-[:FROM_DEVICE]->(:Device)`
    -   `(:Transaction)-[:FROM_IP]->(:IP)`
    -   `(:Transaction)-[:HAS_ALERT]->(:Alert)`

## Règles de Détection (Cypher)

Les règles sont implémentées sous forme de requêtes Cypher dans `DetectionService.js`.

1.  **High Amount** : Détection simple basée sur un seuil.
2.  **Device Sharing** (Multi-Account Device) :
    \`\`\`cypher
    MATCH (d:Device)<-[:FROM_DEVICE]-(t:Transaction)<-[:PERFORMED]-(a:Account)
    WITH d, count(distinct a) as accountCount WHERE accountCount > 1 ...
    \`\`\`
3.  **Code Velocity** : (Approximation) Détection de pics d'activité sur un compte.

## Sécurité

-   **JWT** : Tokens signés avec expiration (24h).
-   **Bcrypt** : Hashage des mots de passe (salt rounds: 10).
-   **Helmet** : Sécurisation des headers HTTP.
-   **Cors** : Restriction des origines (configuré pour localhost).

## Extensions Futures

-   Ajout de WebSocket pour les alertes temps réel.
-   Visualisation de graphe interactive (D3.js / Cytoscape).
-   Machine Learning pour détection d'anomalies non supervisée.
