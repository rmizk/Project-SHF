# Comptéo — Application de gestion financière

Application web (React/Next.js + Supabase) de gestion financière pour une société, multi-organisations. **Toute l'interface utilisateur est en français.**

## Documents de référence (à lire avant d'implémenter)

- `docs/PRD-application-gestion-financiere.md` — le PRD complet avec les décisions validées (section 9)
- `docs/modele-donnees.md` — schéma PostgreSQL/Supabase complet (tables, RLS, Storage)
- `docs/stack-technique.md` — stack et points d'architecture
- `docs/critique-design.md` — corrections de design décidées (sections « Correction complémentaire »)

## Maquettes

`design/screens/<module>/` : `connexion`, `tableau-de-bord`, `achats`, `services`, `comptabilite`, `depenses`, `profil`, `formulaire-public`. Chaque module a des versions bureau/mobile et clair/sombre. **Reproduire fidèlement ces maquettes.**

## Stack

- Next.js (App Router, TypeScript) + Tailwind CSS — frontend ET logique métier (Server Actions)
- Supabase : PostgreSQL (RLS), Auth, Storage — projet déjà créé, clés dans `.env.local`
- Déploiement : Vercel (via GitHub)

## Règles métier non négociables

1. **Montants** : TND, 3 décimales, `numeric(14,3)` en base, jamais de float. Format d'affichage : `1 234,567`.
2. **Multi-tenant** : chaque table privée porte `organization_id` + politique RLS (voir modele-donnees.md). Une organisation ne voit jamais les données d'une autre.
3. **Auth v1** : un seul compte par organisation — connexion par `org_code` + mot de passe (résolu en email technique interne pour Supabase Auth). Changement de mot de passe forcé à la première connexion. Pas de comptes individuels, pas de noms de personnes dans l'UI.
4. **TVA du mois** = TVA collectée (attachements du mois) − TVA déductible (factures d'achat du mois) − crédit de TVA **saisi manuellement** (pas de report automatique). Si négatif : afficher « Crédit de TVA ».
5. **Bénéfice net d'un attachement** : calculé au passage à « Payé » — l'utilisateur saisit les retenues/charges ligne par ligne (libellé + montant) ; bénéfice = montant HT − total des retenues. Calcul côté serveur.
6. **Dépenses** : 3 types (`avec facture` / `sans facture` / `particulier`). Pièce jointe obligatoire uniquement si « avec facture ». Les dépenses « particulier » sont marquées visuellement mais incluses dans le fond de roulement recalculé.
7. **Taux de TVA** : 0 / 7 / 13 / 19 %.
8. Calculs financiers **toujours côté serveur** (Server Actions), jamais dans le navigateur.

## Navigation et layout (décisions figées)

- **Sidebar (bureau)** : 5 modules — Tableau de bord, Achats, Services, Dépenses, Comptabilité (dans cet ordre). PAS de « Paramètres » dans la navigation.
- **Profil** : en bas de la sidebar, item avec nom + logo de l'organisation et chevron droit → ouvre la page Profil (état actif quand elle est ouverte). La page s'appelle « Profil » (pas « Paramètres »).
- **Mobile** : bottom nav à 5 onglets (les modules), **présente sur tous les écrans**. Profil accessible via l'avatar en haut à droite.
- **Toggle clair/sombre** : bouton soleil/lune dans la barre du haut, à droite près de l'avatar — **global, sur toutes les pages** (visible uniquement sur les screens `profil/`, mais à implémenter partout via le composant TopBar partagé).
- Le concept d'« écriture » n'existe pas : le tableau de bord agrège les opérations des 4 modules réels.

## Conventions de code

- Composants partagés obligatoires : `Sidebar`, `TopBar`, `BottomNav`, `Modal`, `DataTable`, `MonthYearFilter` (filtre mois/année identique sur les 4 modules), `StatusBadge`, `FileDropzone`, `DatePicker` (remplace tout `<input type="date">` natif), `RowActionsMenu` (menu ⋮ des lignes, rendu via portal), `ConfirmDialog`.
- Thèmes clair/sombre via classe `dark` de Tailwind, persistés.
- Textes UI en français, y compris messages d'erreur et états vides.
- `.env.local` et tout fichier de secrets : jamais commités.
- **Un commit par étape fonctionnelle**, message clair en français (ex. « Module Achats : liste + modal d'ajout »). Lancer `npm run build` avant chaque commit.
