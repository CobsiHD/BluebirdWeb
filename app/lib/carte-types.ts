/**
 * ─────────────────────────────────────────────────────────────
 *  Types de la carte — contrat partagé du « Manager Bluebird ».
 *
 *  Deux familles de types :
 *    • Types de SORTIE (Menu, MenuCategory, …, ParcoursCocktail) : ce que
 *      renvoie la couche d'accès (`carte-repo.ts`). Volontairement PLATS et
 *      SÉRIALISABLES (que des chaînes / nombres / booléens / tableaux) afin de
 *      traverser sans heurt la frontière Server Component → Client Component.
 *    • Types d'ENTRÉE (…Input / …Patch) : les charges utiles des mutations de
 *      l'éditeur. `Patch` = champs optionnels (mise à jour partielle) ; un
 *      `null` explicite efface la valeur, un champ absent la laisse inchangée.
 *
 *  Aucun import runtime ici : ce module ne contient que des types.
 * ─────────────────────────────────────────────────────────────
 */

/** Envies du parcours « Quel oiseau, ce soir ? ». */
export type EnvieId = "floral" | "fruite" | "gourmand" | "audacieux";

/** Corps du cocktail (léger / corsé). */
export type CorpsId = "leger" | "corse";

/** Statut d'une version de carte. */
export type MenuStatus = "draft" | "active" | "archived";

// ── Sortie : la carte servie / éditée ────────────────────────────────────

/** Un format tarifaire d'un produit (ex. « 25cl » → « 5 »). */
export type MenuItemPrice = { label: string; price: string };

/**
 * Un produit de la carte. Deux façons d'exprimer le prix, exclusives :
 *   • `price` (+ `vol` facultatif) pour un tarif unique ;
 *   • `prices[]` pour plusieurs formats (verre/bouteille, 25cl/50cl…).
 */
export type MenuItem = {
  id: number;
  name: string;
  desc?: string;
  price?: string;
  vol?: string;
  prices?: MenuItemPrice[];
  /** Produit disponible ce soir (sinon grisé / masqué à l'affichage). */
  available: boolean;
};

/** Un sous-ensemble titré de produits dans une catégorie. */
export type MenuGroup = {
  id: number;
  title?: string;
  note?: string;
  position: number;
  items: MenuItem[];
};

/** Une catégorie de la carte (Cocktails, Bières, Vins…). */
export type MenuCategory = {
  id: number;
  /** Identifiant stable lisible, sert d'ancre sur la page publique. */
  slug: string;
  label: string;
  note?: string;
  position: number;
  /** Catégorie affichée sur le site public. */
  active: boolean;
  groups: MenuGroup[];
};

/** La carte complète d'une version. */
export type Menu = {
  versionId: number;
  status: MenuStatus;
  label: string;
  categories: MenuCategory[];
};

/**
 * Portrait d'un cocktail du parcours (présentation, pas recette). Assemble un
 * produit et ses métadonnées `cocktail_meta`. `ingredients` reprend la
 * description du produit.
 */
export type ParcoursCocktail = {
  productId: number;
  name: string;
  envies: EnvieId[];
  corps: CorpsId | null;
  tags: string[];
  intensite: number | null;
  price: string;
  portrait: string;
  ingredients?: string;
  signature: boolean;
  sansAlcool: boolean;
};

/** Fiche synthétique d'une version, pour l'historique de l'éditeur. */
export type MenuVersionInfo = {
  id: number;
  label: string;
  status: MenuStatus;
  createdAt: string;
  publishedAt: string | null;
};

// ── Entrée : charges utiles des mutations ────────────────────────────────

export type CategoryInput = {
  label: string;
  slug?: string;
  note?: string;
  active?: boolean;
};

export type CategoryPatch = {
  label?: string;
  slug?: string;
  note?: string | null;
  active?: boolean;
};

export type GroupInput = {
  title?: string;
  note?: string;
};

export type GroupPatch = {
  title?: string | null;
  note?: string | null;
};

export type ProductInput = {
  name: string;
  description?: string;
  available?: boolean;
};

export type ProductPatch = {
  name?: string;
  description?: string | null;
};

export type PriceInput = {
  label?: string;
  amount: string;
  vol?: string;
};

export type PricePatch = {
  label?: string | null;
  amount?: string;
  vol?: string | null;
};

export type CocktailMetaInput = {
  inParcours: boolean;
  envies: EnvieId[];
  corps: CorpsId | null;
  tags: string[];
  intensite: number | null;
  portrait: string | null;
  signature: boolean;
  sansAlcool: boolean;
};
