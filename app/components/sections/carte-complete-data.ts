/**
 * LA CARTE COMPLÈTE — données réelles (menu Bluebird, PDF 18 p.).
 * Organisée en catégories → groupes → items. Prix en euros (sans le €,
 * ajouté à l'affichage). Les spiritueux réutilisent `spiritueux-data.ts`.
 */

import { FAMILIES } from "./spiritueux-data";

export type MenuItem = {
  name: string;
  desc?: string;
  /** prix simple (ex. "9") */
  price?: string;
  /** volume associé au prix simple (ex. "4cl") */
  vol?: string;
  /** plusieurs formats/prix (ex. 25cl / 50cl, verre / bouteille) */
  prices?: { label: string; price: string }[];
};
export type MenuGroup = { title?: string; note?: string; items: MenuItem[] };
export type MenuCategory = {
  id: string;
  label: string;
  note?: string;
  groups: MenuGroup[];
};

// Spiritueux : on convertit les familles existantes en groupes.
const spiritueuxGroups: MenuGroup[] = FAMILIES.map((f) => ({
  title: f.label,
  note: f.note,
  items: f.items.map((s) => ({
    name: s.name,
    desc: s.note,
    price: s.price,
    vol: s.vol === "" ? undefined : (s.vol ?? "4cl"),
  })),
}));

export const MENU: MenuCategory[] = [
  {
    id: "cocktails",
    label: "Cocktails",
    note: "Un classique, une création, une folie ? Le bar s'adapte à toutes vos envies.",
    groups: [
      {
        title: "Signature",
        items: [
          {
            name: "Le Bluebird",
            price: "10.5",
            vol: "14cl",
            desc: "Bourbon infusé hibiscus, liqueur de fleur de sureau, prosecco, citron, sirop de miel maison.",
          },
        ],
      },
      {
        title: "Créations",
        items: [
          { name: "How Is Your Heart", price: "11", desc: "Tequila Milagro, liqueur Chambord, citron, miel, purée de passion." },
          { name: "Alone With Everybody", price: "11", desc: "Gin Hendrick's, liqueur fruit de la passion, sirop de fleur de sureau, jus de poire, citron." },
          { name: "A Smile To Remember", price: "12", desc: "Hendrick's Orbium, sirop de rose, liqueur de marasquin, jus de litchi, citron, Schweppes pomelo & baies roses." },
          { name: "I Will Remember", price: "12", desc: "Liqueur de mandarine, cognac, sirop de noisette, jus de pomme, sirop de vanille." },
          { name: "Raw with Love", price: "11", desc: "Vodka Absolut, tabasco, tomate acide, sirop de pêche, eau pétillante." },
          { name: "More, Much More", price: "11", desc: "Rhum infusé peanut butter, jus d'ananas infusé à la cannelle, purée de coco." },
        ],
      },
      {
        title: "Classiques",
        items: [
          { name: "Mojito", price: "9", desc: "Rhum Havana, cassonade, menthe, citron vert, eau pétillante." },
          { name: "Negroni & ses variations", price: "12", desc: "Gin Tanqueray Ten, Campari, vermouth Del Professor rouge." },
          { name: "Old Fashioned & ses variations", price: "10", desc: "Bourbon Bulleit, sucre, Angostura bitter." },
          { name: "Apérol Spritz", price: "8", desc: "Apérol, prosecco, eau pétillante." },
          { name: "Campari Spritz", price: "9", desc: "Campari, prosecco, eau pétillante." },
          { name: "Italicus Spritz", price: "9", desc: "Italicus, prosecco, eau pétillante." },
          { name: "St Germain Spritz", price: "9", desc: "St Germain, prosecco, eau pétillante." },
          { name: "Limoncello Spritz", price: "8", desc: "Limoncello, prosecco, eau pétillante." },
          { name: "Melonade Spritz", price: "9", desc: "Melonade, prosecco, eau pétillante." },
          { name: "Margarita", price: "11", desc: "Tequila Milagro, Cointreau, citron." },
          { name: "Pina Colada", price: "10", desc: "Rhum Havana 7 ans, purée de coco, jus d'ananas, citron." },
          { name: "Cosmopolitan", price: "11", desc: "Vodka Cîroc, Cointreau, jus de cranberry, citron." },
        ],
      },
    ],
  },
  {
    id: "sans-alcool",
    label: "Sans alcool",
    groups: [
      {
        title: "Cocktails sans alcool",
        items: [
          { name: "Roll The Dice", price: "8.5", desc: "Tanqueray 0%, sirop de rose, jus de litchi, citron, tonic pomelo & baies roses." },
          { name: "Cause And Effect", price: "8.5", desc: "Sirop fleur de sureau, purée de passion, jus de poire, citron." },
          { name: "Virgin More, Much More", price: "8.5", desc: "Captain Morgan infusé peanut butter, ananas, coco." },
        ],
      },
    ],
  },
  {
    id: "bieres",
    label: "Bières",
    note: "Bluebird's Hour, 17h–21h : tarifs réduits sur les pressions.",
    groups: [
      {
        title: "Pressions",
        items: [
          { name: "Bud", desc: "Blonde artisanale, légère, notes de céréales, amertume équilibrée.", prices: [{ label: "25cl", price: "3.5" }, { label: "50cl", price: "5.5" }] },
          { name: "Hoegaarden Rosé", desc: "Blanche fruitée aux notes de framboise, délicatement sucrée.", prices: [{ label: "25cl", price: "5" }, { label: "50cl", price: "8" }] },
          { name: "Kasteel Framboise", desc: "Fruitée à la framboise, sucrée et acidulée, belle fraîcheur.", prices: [{ label: "25cl", price: "5" }, { label: "50cl", price: "8" }] },
          { name: "Mont-Blanc Rousse", desc: "Rousse — caramel, pain grillé et fruits secs, belle rondeur.", prices: [{ label: "25cl", price: "5" }, { label: "50cl", price: "8" }] },
          { name: "La Bagarre", desc: "Double IPA houblonnée, agrumes et fruits exotiques.", prices: [{ label: "25cl", price: "5" }, { label: "50cl", price: "8" }] },
          { name: "Delirium Tremens", desc: "Blonde belge, fruitée et épicée, belle rondeur.", prices: [{ label: "25cl", price: "5.5" }, { label: "50cl", price: "8.5" }] },
          { name: "La Ballon d'Orge", desc: "Blonde artisanale légère, céréales et pain frais.", prices: [{ label: "25cl", price: "5" }, { label: "50cl", price: "8" }] },
        ],
      },
      {
        title: "Bouteilles",
        items: [
          { name: "Kasteel 0%", price: "6", vol: "33cl", desc: "Sans alcool — Rouge ou tropicale." },
        ],
      },
    ],
  },
  {
    id: "vins",
    label: "Vins",
    groups: [
      {
        title: "Rouges",
        items: [
          { name: "Côtes de Bœuf", desc: "Gourmand et fruité — fruits noirs, épices douces, garrigue.", prices: [{ label: "Verre", price: "4.5" }, { label: "Bouteille", price: "23" }] },
          { name: "Crozes Hermitage", prices: [{ label: "Verre", price: "6" }, { label: "Bouteille", price: "30" }] },
          { name: "Syrah", prices: [{ label: "Verre", price: "4.5" }, { label: "Bouteille", price: "23" }] },
        ],
      },
      {
        title: "Rosé",
        items: [
          { name: "Studio Rosé", desc: "Raffiné et lumineux — fruits rouges frais, pointe d'agrumes.", prices: [{ label: "Verre", price: "6" }, { label: "Bouteille", price: "30" }] },
          { name: "Cap des Pins", prices: [{ label: "Verre", price: "4" }, { label: "Bouteille", price: "21" }] },
        ],
      },
      {
        title: "Blancs",
        items: [
          { name: "Chardonnay Bphr", desc: "Frais et équilibré — fruits blancs, finale légèrement beurrée.", prices: [{ label: "Verre", price: "4.5" }, { label: "Bouteille", price: "23" }] },
          { name: "Orélie", prices: [{ label: "Verre", price: "4" }, { label: "Bouteille", price: "21" }] },
          { name: "Uby", prices: [{ label: "Verre", price: "4.5" }, { label: "Bouteille", price: "23" }] },
          { name: "Studio Blanc", prices: [{ label: "Verre", price: "6" }, { label: "Bouteille", price: "28" }] },
        ],
      },
    ],
  },
  {
    id: "champagne",
    label: "Champagne",
    groups: [
      {
        items: [
          { name: "Lallier", price: "100", vol: "75cl", desc: "Brut élégant — bulles fines, agrumes, fleurs blanches." },
          { name: "Veuve Clicquot", price: "130", vol: "75cl" },
          { name: "Moët Impérial", price: "110", vol: "75cl" },
          { name: "Moët Impérial Rosé", price: "110", vol: "75cl" },
        ],
      },
    ],
  },
  {
    id: "spiritueux",
    label: "Spiritueux",
    groups: spiritueuxGroups,
  },
  {
    id: "softs",
    label: "Softs",
    groups: [
      {
        title: "Classiques",
        items: [
          { name: "Limonade", price: "3.2" },
          { name: "Coca-Cola", price: "3.5" },
          { name: "Coca-Cola Zéro", price: "3.5" },
          { name: "Badoit fines bulles", price: "3.5" },
          { name: "Sirop", price: "2.5", desc: "Fraise, grenadine, menthe, pêche, citron." },
          { name: "Diabolo", price: "3.5", desc: "Fraise, grenadine, menthe, pêche, citron." },
          { name: "Jus de fruits Granini", price: "3.5", desc: "Tomate, orange, pomme." },
        ],
      },
      {
        title: "Schweppes",
        items: [
          { name: "Schweppes Tonic", price: "4.5", desc: "Amertume caractéristique, fines bulles." },
          { name: "Schweppes Soda Pomelo", price: "4.5", desc: "Pétillant et vif, pamplemousse rose." },
          { name: "Schweppes Ginger Beer", price: "4.5", desc: "Puissant et épicé — gingembre, touche citronnée." },
        ],
      },
    ],
  },
  {
    id: "snacks",
    label: "À grignoter",
    groups: [
      {
        items: [
          { name: "Frites maison", price: "5", desc: "Coupées main, dorées. Sauces au choix." },
          { name: "Frites maison XXL", price: "10", desc: "Portion généreuse. Sauces au choix." },
          { name: "Chilli cheese", price: "7", vol: "6 pièces", desc: "Cœur fondant, robe dorée, deux sauces maison au choix." },
          { name: "Tenders de poulet", price: "7", vol: "4 pièces", desc: "Poulet mariné et pané, deux sauces maison au choix." },
          { name: "Plateau charcuterie & fromage", desc: "Fromages artisanaux, viandes séchées locales, cornichons, olives, pain artisanal.", prices: [{ label: "Petite", price: "14.5" }, { label: "Grande", price: "20.5" }] },
        ],
      },
    ],
  },
];
