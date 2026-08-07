# Cahier des charges — Manager Bluebird

**Espace d'administration · pilotage de la carte digitale**

- Projet : Bluebird — bluebird-bar.fr
- Version : 1.1 · 2 août 2026
- Socle : Auth + SQLite en place · Décisions D1–D8 validées
- Version illustrée : voir l'artifact Claude (lien conservé côté équipe)

Un espace unique, protégé par mot de passe, où le bar gère sa carte, ses catégories, son ardoise du moment et son identité — sans toucher au code, avec des modifications qui survivent aux mises en ligne.

---

## 0. Contexte & objectif

Le site Bluebird est une vitrine one-page. Sa carte vit aujourd'hui dans des fichiers de code, figés à la construction : la modifier suppose un développeur et un redéploiement. Le Manager rend la main au bar.

Le gérant gère **sa carte, son ardoise, son identité visuelle et ses catégories depuis une seule interface**, sans compétence technique. Chaque changement est enregistré en base, publié sur le site public, et **survit aux déploiements** (base hors du dépôt git).

**Utilisateur cible :** un seul rôle, le gérant / propriétaire (et le personnel de confiance à qui il confie le mot de passe). Pas de multi-comptes ni de rôles.

**Principes :** simplicité d'abord · modifications explicites (rien de publié sans action claire) · réversibilité (une carte active, historique de versions) · fidélité à la charte Bluebird.

---

## 1. Périmètre & phasage

| Module | Périmètre | Statut |
|---|---|---|
| Authentification (mot de passe, session) | MVP | Fait |
| Persistance SQLite + migrations | MVP | Fait |
| Accueil (tableau de bord) | MVP | À construire |
| Éditeur du menu (catégories, produits, prix, ordre, dispo) | MVP | À construire |
| Publication & carte active + versions | MVP | À construire |
| Ardoise (activer, éditer, enregistrer, afficher) | MVP | À construire |
| Partage (lien + QR) | MVP | À construire |
| Profil établissement | MVP | À construire |
| Export PDF de la carte | V2 | — |
| Personnalisation des couleurs (thèmes) | V2 | — |
| Options avancées (mot de passe, sauvegardes) | V2 | — |

Éditer la carte + l'ardoise couvre ~90 % de l'usage quotidien et débloque l'autonomie du bar. PDF et couleurs apportent du confort sans retarder le cœur.

---

## 2. Architecture de navigation

```
Manager
│
├── Accueil            — tableau de bord, coup d'œil sur l'état
├── Profil             — identité, contacts, horaires du bar
├── La carte
│     ├── Carte active       — ce qui est en ligne
│     ├── Modifier le menu   — éditeur catégories / produits
│     ├── Catégories         — gérer les rubriques
│     ├── Personnalisation   — thèmes couleurs (V2)
│     ├── Export PDF         — version imprimable (V2)
│     └── Ardoise            — message du moment
│           ├── Activation
│           ├── Édition
│           ├── Sauvegarde
│           └── Partage
│
└── Options            — réglages, sécurité, sauvegardes
```

Routes : `/admin` (Accueil), `/admin/profil`, `/admin/carte` (+ sous-routes), `/admin/options`. La garde `proxy.ts` protège déjà tout `/admin/*`.

---

## 3. Modèle de données (SQLite)

La carte est un catalogue unique : catégories → groupes → produits → prix. Les cocktails du parcours « Mon cocktail » sont des produits enrichis de métadonnées (édition à un seul endroit).

| Table | Rôle | Champs clés |
|---|---|---|
| `menu_version` | Instantané complet de la carte ; une seule active | id, label, status (brouillon/active/archivée), created_at, published_at |
| `category` | Rubrique (Cocktails, Bières…), ordonnée, activable | id, label, note?, position, active |
| `product_group` | Sous-groupe optionnel (Signature, Pressions…) | id, category_id, title?, note?, position |
| `product` | Article : nom, description, dispo, ordre | id, group_id, name, description?, available, position |
| `product_price` | Un ou plusieurs prix (25cl/50cl, verre/bouteille) | id, product_id, label?, amount, position |
| `cocktail_meta` | Métadonnées « Mon cocktail » si coché « dans le parcours » | product_id, in_parcours, envies[], corps, tags[] (sensations), intensite (1–5), portrait, signature |
| `ardoise` | Message temporaire indépendant de la carte | id, active, content, updated_at, published_at? |
| `settings` | Réglages clé/valeur (profil, thème) — déjà en base | key, value, updated_at |

Les spiritueux (familles) et les prix multiples déjà présents s'expriment nativement (catégorie → groupe = famille, produit, `product_price`). L'amorçage initial importe la carte actuelle telle quelle.

---

## 4. Décisions validées (2026-08-02)

| # | Question | Décision |
|---|---|---|
| **D1** | Unifier les deux sources de la carte ? | **Oui** — source unique ; cocktail coché « dans le parcours » alimente aussi le quiz |
| **D2** | 8 catégories fines ou 4 de la maquette ? | **Libre** — catégories gérables, 8 actuelles au départ |
| **D3** | « Bluebird's Hour » : catégorie ou note ? | **Catégorie** à part entière, activable seule |
| **D4** | Où afficher l'ardoise sur le site ? | **Bandeau** haut de page, visible si active |
| **D5** | Couleurs : libres ou thèmes validés ? | **Thèmes** prédéfinis validés (V2) |
| **D6** | Export PDF : impression ou PDF serveur ? | **Impression** (route dédiée, V2) |
| **D7** | Partage : lien ou réseaux sociaux ? | **Lien** public copiable ; QR en option |
| **D8** | Quiz « Mon cocktail » : refondre ou garder ? | **Conservé** — avec/sans alcool → envie (4 fixes) → léger/corsé |

---

## 5. User stories

Format : *En tant que … je veux … afin de …*, avec critères d'acceptation.

### Authentification (Fait)

- **US-01 — Se connecter.** Lien « Admin » discret en pied de page → écran mot de passe. Mot de passe correct → session (cookie signé, 7 j) + Accueil. Incorrect → « Mot de passe incorrect ». Espace en noindex. Bouton « Déconnexion ».

### Accueil

- **US-02 — Voir l'état en un coup d'œil.** Carte active + date de publication affichées à l'arrivée ; état ardoise (ON/OFF + extrait) ; modification non publiée signalée avec accès direct ; raccourcis en un clic.

### La carte — vue active & publication

- **US-03 — Publier mes modifications.** Bouton « Publier » applique le brouillon ; version précédente archivée (non supprimée) ; site public reflété sans redéploiement ; confirmation horodatée.
- **US-04 — Revenir à une version précédente.** Liste des versions archivées ; « Restaurer » remet en brouillon prêt à republier ; aucune version perdue.

### Éditeur du menu

- **US-05 — Ouvrir l'éditeur avec mes données.** À l'ouverture, toutes catégories/groupes/produits chargés ; organisation visible et pliable.
- **US-06 — Ajouter / modifier / retirer un produit.** Champs : nom, description, prix (un ou plusieurs), volume/format, disponibilité ; suppression confirmée ; changements en brouillon jusqu'à publication ; validation (nom requis, prix positif).
- **US-07 — Plusieurs prix par produit.** Ajout/suppression de lignes libellé + montant ; ou prix simple avec/sans volume.
- **US-08 — Réordonner (glisser-déposer).** DnD (ou flèches en secours) sur produits, groupes, catégories ; ordre reflété à l'identique côté public.
- **US-09 — Marquer indisponible.** Interrupteur « disponible » masque au public sans supprimer ; produit grisé dans l'éditeur.
- **US-10 — Mettre un cocktail « dans le parcours ».** Case « dans le parcours » ouvre : envie(s) (4 fixes), corps (léger/corsé), intensité (1–5), tags (sensations), portrait. Case décochée → cocktail sur la carte mais hors quiz. Quiz public inchangé. Édition met à jour carte complète **et** « Mon cocktail ».

### Catégories

- **US-11 — Créer, renommer, réordonner, masquer.** Créer (nom + note), renommer, réordonner ; masquer retire du site sans perdre les produits ; supprimer une catégorie non vide demande confirmation + déplacement des produits.
- **US-12 — Gérer une catégorie à part (Happy Hour).** Note de créneau (« 17h–21h ») ; activation/désactivation indépendante.

### Personnalisation (V2)

- **US-13 — Choisir un thème validé.** Galerie de thèmes (contrastes garantis) ; aperçu en direct ; retour au thème Bluebird d'origine en un clic.

### Export PDF (V2)

- **US-14 — Télécharger la carte en PDF.** Reflète la carte active ; mise en page charte, lisible en impression ; téléchargement (nom explicite). Réalisation : route d'impression (feuille « print »).

### Ardoise

- **US-15 — Activer / masquer.** Interrupteur ON/OFF pilote l'affichage public (bandeau haut de page) ; OFF conserve le contenu ; état publié après enregistrement.
- **US-16 — Rédiger le contenu.** Zone libre (placeholder « Entrez le contenu de votre ardoise ici ») ; retours à la ligne + mise en forme légère ; contenu nettoyé (anti-injection).
- **US-17 — Enregistrer.** « Enregistrer » sauvegarde contenu **et** état ON/OFF ; indicateur « modifications non enregistrées » ; confirmation.
- **US-18 — Partager.** Lien public copiable vers la carte (ancre ardoise si active) — mécanisme retenu (D7) ; QR téléchargeable en option ; réseaux sociaux hors périmètre pour l'instant.

### Profil

- **US-19 — Mettre à jour les infos du bar.** Champs : nom, adresse, téléphone, e-mail, horaires, Instagram ; reflétés dans « Infos » et le pied de page ; validation des formats.

### Options (V2)

- **US-20 — Changer le mot de passe.** Ancien + nouveau ; sessions existantes invalidées après changement.
- **US-21 — Sauvegarder / exporter.** Export JSON de la carte + ardoise ; réimport pour restaurer.

---

## 6. États & transitions

- **Carte :** chargement · active (en ligne) · brouillon en cours · publication en cours · archivée.
- **Ardoise :** inactive · active · modifiée (non enregistrée) · enregistrée · partagée.
- **Export (V2) :** inactif · génération · terminé/téléchargé · échec.

---

## 7. Règles métier

- Une seule carte active à la fois.
- Chaque catégorie gérée indépendamment.
- Ardoise optionnelle : l'activer/désactiver n'affecte jamais la carte.
- Toute modification exige un enregistrement / une publication explicite ; rien d'automatique.
- Export PDF = vue dérivée de la carte active.
- Personnalisation couleurs s'applique à l'ensemble de la carte.
- Publication réversible : version remplacée archivée, jamais détruite.
- Produit indisponible = masqué au public, conservé en base.

---

## 8. Exigences transverses

- **Sécurité :** auth vérifiée côté serveur sur chaque écriture ; contenu ardoise nettoyé ; espace noindex.
- **Persistance :** base SQLite hors dépôt (survit au déploiement) ; migrations versionnées ; sauvegardes exportables.
- **Mobile-first :** utilisable au téléphone derrière le bar (édition tactile, DnD avec secours).
- **Performance :** site public rapide ; carte lue depuis la base sans pénaliser le visiteur (revalidation à la publication).
- **Accessibilité :** contrastes conformes, navigation clavier, libellés explicites, `prefers-reduced-motion`.
- **Langue & ton :** français, sobre, univers Bluebird.
- **Réversibilité :** aucune action destructrice sans confirmation ; historique et restauration.

---

## 9. Roadmap

- **Phase 0 · Fait** — Auth mot de passe, session signée, SQLite + migrations, garde `proxy.ts`, page `/admin` d'aperçu.
- **Phase 1 · MVP** — Modèle carte + amorçage depuis la carte actuelle ; éditeur (catégories, produits, prix, ordre, dispo, parcours) ; brouillon → publication → versions ; site public lit depuis la base ; navigation Manager (Accueil / La carte).
- **Phase 2 · MVP** — Ardoise (activation, édition, enregistrement) + affichage public ; profil éditable ; partage lien public + QR.
- **Phase 3 · V2** — Export PDF, thèmes couleurs, Options (mot de passe, sauvegardes import/export), partage réseaux sociaux.
