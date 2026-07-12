# Prompt 0 — Socle

Lis CLAUDE.md et docs/modele-donnees.md, puis mets en place le socle du projet :

1. Initialise un projet Next.js (App Router, TypeScript, Tailwind) dans ce dossier, avec un `.gitignore` complet (node_modules, .env*, /design/screens).
2. Initialise le dépôt Git avec un premier commit.
3. Installe et configure le client Supabase (`.env.local` existe déjà — ne le lis pas, utilise juste les variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. Écris la migration SQL complète du schéma décrit dans docs/modele-donnees.md (tables, contraintes, index, politiques RLS, buckets Storage) dans `supabase/migrations/`, et applique-la au projet Supabase.
5. Crée le layout de l'application d'après les screens `design/screens/tableau-de-bord/` : Sidebar (5 modules + item Profil en bas avec chevron), TopBar (recherche, toggle clair/sombre, avatar), BottomNav mobile (5 onglets, visible sur tous les écrans), thèmes clair/sombre persistés.
6. Pages vides pour chaque module (placeholder) pour valider la navigation.

Vérifie `npm run build`, teste la navigation, puis commit.
