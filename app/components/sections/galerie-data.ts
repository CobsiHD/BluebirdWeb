import type { LayoutGridCard } from "../ui/layout-grid";

import alcove from "@/public/brand/gallery/alcove.jpg";
import backBar from "@/public/brand/gallery/back-bar.jpg";
import barRouge from "@/public/brand/gallery/bar-rouge.jpg";
import comptoir from "@/public/brand/gallery/comptoir.jpg";
import creation from "@/public/brand/gallery/creation.jpg";
import entree from "@/public/brand/gallery/entree.jpg";
import geste from "@/public/brand/gallery/geste.jpg";
import lustre from "@/public/brand/gallery/lustre.jpg";
import reflet from "@/public/brand/gallery/reflet.jpg";
import salle from "@/public/brand/gallery/salle.jpg";
import sante from "@/public/brand/gallery/sante.jpg";
import service from "@/public/brand/gallery/service.jpg";

/**
 * Quatre hauteurs de tuile, choisies pour coller au cadrage :
 * `tall` et `mid` aux portraits, `short` et `flat` aux paysages.
 * Elles grandissent avec l'écran pour garder le même rapport en colonne.
 */
const H = {
  tall: "h-64 sm:h-80 lg:h-96",
  mid: "h-52 sm:h-64 lg:h-80",
  short: "h-40 sm:h-52 lg:h-64",
  flat: "h-32 sm:h-40 lg:h-52",
};

/**
 * Galerie « ambiance » — mur en colonnes (masonry CSS).
 *
 * Les photos coulent dans 2 colonnes (4 à partir de lg) et chacune a sa propre
 * hauteur : les tuiles ne se répondent jamais horizontalement. L'ordre alterne
 * les formats pour qu'aucune colonne ne cumule les portraits ou les paysages.
 */
export const GALLERY: LayoutGridCard[] = [
  {
    id: "entree",
    src: entree,
    height: H.short,
    alt: "Porte noire du Bluebird sous une voûte de pierre, mur rouge et lustre de cristal",
    title: "L'entrée",
    caption:
      "Une porte noire sous une voûte de pierre, un lustre de cristal et des murs rouge sang. Le seuil du nid.",
  },
  {
    id: "service",
    src: service,
    height: H.tall,
    alt: "Barman versant un cocktail crémeux du shaker dans une flûte",
    title: "Le service",
    caption:
      "Le shaker se vide, la mousse se dépose. Trente secondes de silence avant la première gorgée.",
  },
  {
    id: "sante",
    src: sante,
    height: H.mid,
    alt: "Plusieurs mains levant des cocktails pour trinquer autour d'une table",
    title: "Santé",
    caption:
      "Les verres se croisent au-dessus de la table. C'est souvent là que la soirée commence vraiment.",
  },
  {
    id: "comptoir",
    src: comptoir,
    height: H.flat,
    alt: "Shakers, jigger et cocktail orange alignés sur le comptoir éclairé de néon rouge",
    title: "Le comptoir",
    caption:
      "Acier, laiton et néon rouge : l'atelier du barman, à hauteur de regard.",
  },
  {
    id: "bar-rouge",
    src: barRouge,
    height: H.tall,
    alt: "Barmaid derrière le bar du Bluebird, étagères de bouteilles baignées de lumière rouge",
    title: "Derrière le bar",
    caption:
      "Une silhouette, deux coupes, et toute la réserve qui rougeoie en arrière-plan.",
  },
  {
    id: "geste",
    src: geste,
    height: H.mid,
    position: "object-[center_40%]",
    alt: "Main déposant une paille et de la menthe dans un verre tiki noir",
    title: "Le geste",
    caption: "La menthe, la paille, le verre noir. Tout se joue dans les mains.",
  },
  {
    id: "lustre",
    src: lustre,
    height: H.tall,
    alt: "Gros plan sur un lustre en cristal aux pampilles allumées",
    title: "Le lustre",
    caption:
      "Cristal et pampilles : l'élégance ancienne du lieu, suspendue au-dessus des verres.",
  },
  {
    id: "salle",
    src: salle,
    height: H.flat,
    alt: "Salle du Bluebird : banquettes sombres, tables rondes, miroirs dorés et murs rouges",
    title: "La salle",
    caption:
      "Banquettes profondes, miroirs anciens, murs rouge profond. On s'y assied, on n'en repart plus.",
  },
  {
    id: "back-bar",
    src: backBar,
    height: H.short,
    alt: "Étagères du bar garnies de bouteilles de whisky et coupes à cocktail au premier plan",
    title: "La réserve",
    caption:
      "Whiskies rares, rhums et amers : les étagères du fond, à portée de main du barman.",
  },
  {
    id: "creation",
    src: creation,
    height: H.tall,
    position: "object-[center_35%]",
    alt: "Reproduction de La Création d'Adam accrochée au mur, éclairée par une lampe à franges",
    title: "La Création",
    caption:
      "Michel-Ange au mur, une lampe à franges, un guéridon noir. Le détail qui fait le lieu.",
  },
  {
    id: "alcove",
    src: alcove,
    height: H.flat,
    position: "object-[62%_center]",
    alt: "Alcôve du Bluebird : voûtes de pierre, rideaux sombres et enseigne lumineuse",
    title: "L'alcôve",
    caption:
      "Derrière les colonnes de pierre, un rideau, une table pour deux et une rose. Le coin qu'on se garde.",
  },
  {
    id: "reflet",
    src: reflet,
    height: H.mid,
    position: "object-[center_35%]",
    alt: "Miroir doré reflétant un lustre, une applique et deux lampes à abat-jour",
    title: "Le reflet",
    caption:
      "Dans le miroir ancien : le lustre, les abat-jour, et vous quelque part au milieu.",
  },
];
