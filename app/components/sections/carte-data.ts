/**
 * ─────────────────────────────────────────────────────────────
 *  PARCOURS « Quel oiseau, ce soir ? »
 *  Le visiteur choisit une ENVIE puis un CORPS ; on lui désigne
 *  le cocktail qui correspond, présenté en portrait (pas en recette).
 *
 *  Cocktails = Signature + Créations + Sans alcool de la vraie carte.
 *  Ingrédients & prix = RÉELS (menu). Les champs d'interprétation
 *  (envies / corps / sensations / intensite / portrait) sont
 *  ajustables librement.
 * ─────────────────────────────────────────────────────────────
 */

export type EnvieId = "floral" | "fruite" | "gourmand" | "audacieux";
export type CorpsId = "leger" | "corse";

export const ENVIES: { id: EnvieId; label: string; hint: string }[] = [
  { id: "floral", label: "Floral", hint: "rose, sureau, délicat" },
  { id: "fruite", label: "Fruité", hint: "fruits, frais, acidulé" },
  { id: "gourmand", label: "Gourmand", hint: "vanille, noisette, rond" },
  { id: "audacieux", label: "Audacieux", hint: "épicé, inattendu" },
];

export const CORPS: { id: CorpsId; label: string; hint: string }[] = [
  { id: "leger", label: "Léger", hint: "aérien, à siroter" },
  { id: "corse", label: "Corsé", hint: "puissant, spiritueux" },
];

export type Cocktail = {
  name: string;
  envies: EnvieId[];
  corps: CorpsId;
  sensations: string[];
  intensite: number; // 1..5
  price: string;
  portrait: string;
  ingredients?: string;
  signature?: boolean;
  sansAlcool?: boolean;
};

export const COCKTAILS: Cocktail[] = [
  {
    name: "Le Bluebird",
    envies: ["floral", "gourmand"],
    corps: "leger",
    sensations: ["Floral", "Miellé", "Pétillant"],
    intensite: 3,
    price: "10.5",
    portrait:
      "Bourbon-hibiscus, fleur de sureau et prosecco — un envol floral et miellé.",
    ingredients:
      "Bourbon infusé hibiscus, liqueur de fleur de sureau, prosecco, citron, sirop de miel maison.",
    signature: true,
  },
  {
    name: "How Is Your Heart",
    envies: ["fruite"],
    corps: "leger",
    sensations: ["Framboise", "Passion", "Tendre"],
    intensite: 2,
    price: "11",
    portrait: "Framboise, fruit de la passion et miel, tout en tendresse.",
    ingredients: "Tequila Milagro, liqueur Chambord, citron, miel, purée de passion.",
  },
  {
    name: "Alone With Everybody",
    envies: ["floral", "fruite"],
    corps: "leger",
    sensations: ["Floral", "Poire", "Frais"],
    intensite: 2,
    price: "11",
    portrait: "Gin floral, fruit de la passion et poire. Frais et solitaire.",
    ingredients:
      "Gin Hendrick's, liqueur fruit de la passion, sirop de fleur de sureau, jus de poire, citron.",
  },
  {
    name: "A Smile To Remember",
    envies: ["floral", "fruite"],
    corps: "leger",
    sensations: ["Rose", "Litchi", "Délicat"],
    intensite: 2,
    price: "12",
    portrait: "Rose, litchi et pomelo. Floral, délicat, pétillant.",
    ingredients:
      "Hendrick's Orbium, sirop de rose, liqueur de marasquin, jus de litchi, citron, Schweppes pomelo & baies roses.",
  },
  {
    name: "I Will Remember",
    envies: ["gourmand", "audacieux"],
    corps: "corse",
    sensations: ["Noisette", "Vanillé", "Rond"],
    intensite: 4,
    price: "12",
    portrait: "Cognac, noisette et vanille. Gourmand et chaleureux.",
    ingredients:
      "Liqueur de mandarine, cognac, sirop de noisette, jus de pomme, sirop de vanille.",
  },
  {
    name: "Raw with Love",
    envies: ["audacieux", "fruite"],
    corps: "corse",
    sensations: ["Épicé", "Tomate", "Vif"],
    intensite: 3,
    price: "11",
    portrait: "Vodka tabasco, tomate acide et pêche. Vif et provocant.",
    ingredients: "Vodka Absolut, tabasco, tomate acide, sirop de pêche, eau pétillante.",
  },
  {
    name: "More, Much More",
    envies: ["gourmand", "audacieux"],
    corps: "corse",
    sensations: ["Cacahuète", "Coco", "Gourmand"],
    intensite: 3,
    price: "11",
    portrait: "Rhum cacahuète, ananas-cannelle et coco. Riche et enveloppant.",
    ingredients:
      "Rhum infusé peanut butter, jus d'ananas infusé à la cannelle, purée de coco.",
  },
  {
    name: "Roll The Dice",
    envies: ["floral", "fruite"],
    corps: "leger",
    sensations: ["Rose", "Litchi", "Frais"],
    intensite: 1,
    price: "8.5",
    portrait: "Rose, litchi et tonic pomelo. Floral et pétillant.",
    ingredients:
      "Tanqueray 0%, sirop de rose, jus de litchi, citron, tonic pomelo & baies roses.",
    sansAlcool: true,
  },
  {
    name: "Cause And Effect",
    envies: ["floral", "fruite"],
    corps: "leger",
    sensations: ["Sureau", "Passion", "Poire"],
    intensite: 1,
    price: "8.5",
    portrait: "Fleur de sureau, fruit de la passion et poire. Frais et fruité.",
    ingredients: "Sirop fleur de sureau, purée de passion, jus de poire, citron.",
    sansAlcool: true,
  },
  {
    name: "Virgin More, Much More",
    envies: ["gourmand", "audacieux"],
    corps: "leger",
    sensations: ["Cacahuète", "Ananas", "Coco"],
    intensite: 1,
    price: "8.5",
    portrait: "Cacahuète, ananas et coco. Riche et gourmand.",
    ingredients: "Captain Morgan infusé peanut butter, ananas, coco.",
    sansAlcool: true,
  },
];

/** Classe les cocktails (filtrés avec/sans alcool) du plus au moins pertinent. */
export function rankCocktails(
  envie: EnvieId,
  corps: CorpsId,
  sansAlcool: boolean,
): Cocktail[] {
  return COCKTAILS.filter((c) => Boolean(c.sansAlcool) === sansAlcool)
    .map((c) => ({
      c,
      score:
        (c.envies.includes(envie) ? 2 : 0) +
        (c.corps === corps ? 1 : 0) +
        (c.signature ? 0.1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.c);
}
