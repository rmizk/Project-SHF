# Prompts Claude Code — mode d'emploi

## ⏯️ REPRENDRE LA SESSION EN COURS

Pour reprendre la session Claude Code là où elle s'est arrêtée (dans `Project SHF/app`) :

```bash
claude --resume 8724f3b2-1b18-4191-9df2-50511d23c2d7
```

État au 16/07/2026 : Prompts 0 (socle) ✅, 1 (auth) ✅, 2 (achats) ✅, 3 (services) ✅, 4 (dépenses) ✅, 5 (comptabilité) ✅, 6 (tableau de bord + profil) ✅, 7 (finitions) ✅.
**La série de prompts est terminée** — prochaine étape : déploiement Vercel.

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

## Dépôt GitHub

`https://github.com/rmizk/Project-SHF.git` (privé)

Après le Prompt 0, dire à Claude Code :

```
Connecte ce projet au dépôt GitHub https://github.com/rmizk/Project-SHF.git et pousse la branche main
```

Ensuite, après chaque module : « pousse sur GitHub ».

## Conseils

- Claude Code lit `CLAUDE.md` automatiquement au démarrage — les règles y sont.
- Si Claude Code propose un plan avant de coder, validez-le d'abord.
- Après chaque prompt : vérifier `npm run dev`, tester à la main, puis laisser Claude Code committer.
- En cas d'erreur, décrire précisément le problème plutôt que relancer le prompt entier.
