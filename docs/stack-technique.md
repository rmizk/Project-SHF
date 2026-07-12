# Stack technique — Décision (12/07/2026)

## Stack retenue

| Couche | Choix | Rôle |
|---|---|---|
| Frontend | **Next.js (React)** | Interface, rendu responsive, App Router |
| Backend | **Next.js API routes / Server Actions** | Logique métier (calcul TVA, bénéfice net) — pas de serveur séparé |
| Base de données | **Supabase (PostgreSQL)** | Données multi-tenant, Row Level Security par organisation |
| Stockage fichiers | **Supabase Storage** | Pièces jointes (factures, dépenses) |
| Authentification | **Supabase Auth** (adapté au modèle « ID organisation + mot de passe ») | Connexion, changement/réinitialisation de mot de passe |
| Développement | **Claude Code** | À partir du handoff Claude Design |
| UI | **Tailwind CSS** (généré par Claude Design) + thèmes clair/sombre | Cohérence avec les maquettes |

## Points d'architecture à respecter

1. **Isolation multi-tenant** : chaque table porte un `organization_id`, avec des politiques RLS (Row Level Security) Supabase — une organisation ne voit jamais les données d'une autre.
2. **Auth par organisation (v1)** : un compte Supabase Auth par organisation (email technique interne + mot de passe). Le passage aux comptes individuels (P2) se fera sans casser ce modèle.
3. **Demandes d'inscription** : table `organization_requests` avec statut (en attente / approuvée / refusée) ; l'approbation crée l'organisation et envoie les identifiants par email.
4. **Calculs côté serveur** : TVA du mois et bénéfice net calculés dans les Server Actions (jamais dans le navigateur) pour garantir la cohérence.
5. **Format monétaire** : TND, 3 décimales — stocker les montants en `numeric(14,3)`, jamais en float.

## À faire ensuite

- [ ] Modèle de données détaillé (tables + relations + politiques RLS)
- [ ] Création du projet Supabase
- [ ] Handoff Claude Design → Claude Code
