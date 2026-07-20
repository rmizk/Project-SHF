# Prompt 12 — UI mobile + améliorations admin

## 1. Espace admin (mobile)

1. **Tableaux → cards sur mobile** : les listes de /admin/demandes ET /admin/organisations deviennent des cards empilées sur mobile (aucun scroll horizontal). Sur bureau, les tableaux restent.
2. **Badges d'état** : plus jamais de retour à la ligne (`white-space: nowrap`), padding réduit sur mobile si nécessaire.
3. **Boutons Approuver/Refuser sur mobile** : icône seule — ✓ (vert) pour approuver, ✗ (rouge) pour refuser — avec `aria-label`. Sur bureau, garde icône + texte.

## 2. Espace admin (fonctionnalité)

**Suppression des demandes traitées** : dans /admin/demandes, les demandes approuvées ou refusées peuvent être supprimées une par une (icône corbeille + confirmation) et un bouton « Tout effacer » supprime toutes les demandes traitées du filtre courant (confirmation obligatoire). Les demandes **en attente ne sont jamais supprimables**.

## 3. Tableau de bord utilisateur

1. **Mobile : cards compactes** — réduis nettement la hauteur des 4 cards (padding et typographie réduits, grille 2×2 si possible).
2. **Fond de roulement masqué par défaut** : le montant s'affiche en ●●●●●● avec une icône œil pour le révéler/masquer (mobile ET bureau, préférence mémorisée en localStorage).
3. **FAB à la place des actions rapides** (mobile) : bouton flottant `+` en bas à droite (au-dessus de la bottom nav). Un tap → déploie en « speed dial » les 3 actions : Nouvelle facture, Nouvel attachement, Nouvelle dépense (chacune ouvre le modal du module concerné). Nouveau tap sur le FAB ou tap en dehors → referme. Animation fluide, backdrop léger.

## 4. Modules Achats, Services, Dépenses, Comptabilité

**FAB « + » aligné à droite sur mobile** remplaçant le bouton « Ajouter … » (qui reste visible sur bureau). Même position et style que le FAB du tableau de bord, une seule action directe (pas de speed dial) : il ouvre le modal d'ajout du module.

## 5. Comptabilité — bloc TVA

Déplace la carte « TVA du mois » **en dessous** de la liste des paiements, dans une section repliable avec chevron — **repliée par défaut**, état mémorisé (localStorage), mobile et bureau. Le champ « Crédit de TVA à reporter » reste dedans.

## 6. Bottom sheets (modals mobile)

- Hauteur maximale : **85 % de la hauteur d'écran**. Les modals courts gardent leur hauteur naturelle.
- Pour les modals longs : en-tête (titre + croix) et pied (boutons Annuler/Enregistrer) **fixes**, seul le contenu central scrolle.
- Applique ça à tous les modals de l'application (composant Modal partagé).

## 7. Vérification

- `npm run build` sans erreur.
- Teste sur viewport mobile (375px) : admin en cards, badges sur une ligne, FAB sur les 5 pages (ouverture/fermeture du speed dial), TVA repliée/dépliée avec mémoire, fond de roulement œil, bottom sheet long (modal paiement attachement) avec boutons toujours visibles.
- Commit « UI mobile : FAB, cards admin, bottom sheets » puis **push** (inclut aussi les commits précédents non poussés).
