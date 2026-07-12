# Prompts Claude Code — mode d'emploi

## Avant de commencer

1. Ouvrir un terminal dans `Project SHF/app`
2. Créer `.env.local` avec les clés Supabase (URL + anon key + service role key)
3. Lancer `claude` dans ce dossier
4. Envoyer les prompts dans l'ordre, **un par un** — vérifier le résultat avant de passer au suivant

## Ordre des prompts

| # | Fichier | Contenu | Commit attendu |
|---|---|---|---|
| 0 | `00-socle.md` | Projet Next.js, Supabase, migrations SQL, layout + navigation | « Socle : projet, base de données, layout » |
| 1 | `01-auth.md` | Connexion, formulaire public, changement mot de passe | « Auth organisation » |
| 2 | `02-achats.md` | Module Achats | « Module Achats » |
| 3 | `03-services.md` | Module Services + bénéfice net | « Module Services » |
| 4 | `04-depenses.md` | Module Dépenses | « Module Dépenses » |
| 5 | `05-comptabilite.md` | Module Comptabilité + TVA | « Module Comptabilité » |
| 6 | `06-dashboard-profil.md` | Tableau de bord + page Profil | « Tableau de bord + Profil » |
| 7 | `07-finitions.md` | Responsive, états vides, revue finale | « Finitions v1 » |

## Conseils

- Claude Code lit `CLAUDE.md` automatiquement au démarrage — les règles y sont.
- Si Claude Code propose un plan avant de coder, validez-le d'abord.
- Après chaque prompt : vérifier `npm run dev`, tester à la main, puis laisser Claude Code committer.
- En cas d'erreur, décrire précisément le problème plutôt que relancer le prompt entier.
