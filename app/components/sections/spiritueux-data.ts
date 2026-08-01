/**
 * Carte des spiritueux — données réelles (menu Bluebird, PDF).
 * vol par défaut "4cl". note = accord/dégustation (facultatif).
 */

export type Spirit = { name: string; price: string; vol?: string; note?: string };
export type Family = { id: string; label: string; note?: string; items: Spirit[] };

export const FAMILIES: Family[] = [
  {
    id: "rhums",
    label: "Rhums",
    note: "+1 € pour le diluant",
    items: [
      { name: "Mathusalem 15 Ans", price: "11", note: "Vieilli en fût — caramel, fruits secs et vanille." },
      { name: "Centenario 20ème Anniversaire", price: "12", note: "Costa Rica — miel, caramel, fruits mûrs, texture soyeuse." },
      { name: "Angostura 1919", price: "12", note: "Ambré raffiné — miel, chêne et épices, grande rondeur." },
      { name: "Appleton 12 Ans", price: "13", note: "Jamaïcain — caramel, noix grillées et zeste d'orange." },
      { name: "Ron Libertad", price: "14", note: "Mexicain artisanal — canne mûre, épices douces, fruits confits." },
      { name: "Santa Teresa", price: "14", note: "Vénézuélien — fruits secs, cacao et épices délicates." },
      { name: "Zacapa 23 Ans", price: "15", note: "Guatémaltèque — caramel, vanille et fruits secs, vieilli en altitude." },
    ],
  },
  {
    id: "whiskys",
    label: "Whiskys",
    note: "+1 € pour le diluant",
    items: [
      { name: "Monkey Shoulder Classic", price: "9", note: "Blended malt écossais — vanille, miel, épices douces." },
      { name: "The Deacon", price: "12", note: "Scotch équilibré — tourbé et fumé, douceur maltée." },
      { name: "Bulleit Bourbon", price: "10", note: "Bourbon audacieux — vanille, chêne toasté, finale sèche." },
      { name: "Bulleit Rye", price: "10", note: "Rye audacieux — vanille, chêne toasté, finale structurée." },
      { name: "Glenfiddich 12 Ans", price: "13", note: "Single malt — poire, miel, finale boisée subtile." },
      { name: "Glenfiddich 15 Ans", price: "14", note: "Single malt — poire, miel, finale boisée subtile." },
      { name: "Glenfiddich 18 Ans", price: "15", note: "Single malt — poire, miel, finale boisée subtile." },
      { name: "Ailsa Bay", price: "13", note: "Single malt innovant — finesse tourbée et douceur maltée." },
      { name: "Blanton's", price: "15", note: "Bourbon raffiné — vanille, agrumes, pointe de miel." },
      { name: "Sequoia Black Cat", price: "14", note: "Édition limitée bio tourbée — fumé, caramel, pointe iodée." },
      { name: "Sequoia Craft", price: "14", note: "Single malt bio français — fruits mûrs et épices douces." },
      { name: "Bellevoye Bleue", price: "13", note: "Triple malt français — fruits secs, miel et épices." },
      { name: "Bellevoye Blanche", price: "14", note: "Triple malt français — fruits secs, miel et épices." },
      { name: "Bellevoye Rouge", price: "15", note: "Triple malt français — fruits secs, miel et épices." },
    ],
  },
  {
    id: "tequilas",
    label: "Tequilas",
    note: "+1 € pour le diluant",
    items: [
      { name: "Milagro Silver", price: "9", note: "Cristalline — agave frais et citron vert." },
      { name: "Espolón Reposado", price: "12", note: "Riche et chaleureuse — vanille, épices douces, caramel." },
      { name: "Patrón Platinum", price: "50", note: "Ultra-premium — agave rôti, finale soyeuse." },
      { name: "Patrón Silver", price: "13", note: "Pure et cristalline — agave frais, poivre blanc, citron vert." },
      { name: "Patrón Reposado", price: "14", note: "Vieillie en fût — vanille, agrumes et épices douces." },
    ],
  },
  {
    id: "gins",
    label: "Gins & Tonic",
    items: [
      { name: "Hendrick's", price: "10", note: "Rose et concombre — floral, frais et rond." },
      { name: "Hendrick's Orbium", price: "10", note: "Quinine, lotus et absinthe — herbacé, légèrement amer." },
      { name: "Hendrick's Neptunia", price: "10", note: "Végétal et floral — pointe d'agrumes, grande finesse." },
      { name: "Hendrick's Flora Adora", price: "10", note: "Rose, jasmin, fleurs sauvages — douceur d'agrumes." },
      { name: "Hendrick's Grand Cabaret", price: "10", note: "Fleurs, fruits rouges et épices douces — captivant." },
      { name: "4 Hendrick's Tonic", price: "35", vol: "", note: "Servis dans le mythique service à thé." },
      { name: "Kinobi", price: "10", note: "Japonais — yuzu, thé vert et poivre du Sichuan." },
      { name: "Après 92 Black Raspberry", price: "11", note: "Frais et floral — agrumes, plantes, touche d'épices." },
      { name: "Après 92 Spices & Orange", price: "11", note: "Fruité et épicé — baies rouges et cannelle." },
      { name: "June Pastèque", price: "10", note: "Léger et fruité — pastèque juteuse, touche florale." },
      { name: "June Poire & Cardamome", price: "10", note: "Douceur de poire et épices de cardamome." },
      { name: "June Mangue & Passion", price: "10", note: "Solaire — mangue mûre et fruit de la passion." },
      { name: "June Pêche de Vigne", price: "10", note: "Pêche de vigne charnue — fraîcheur florale." },
      { name: "Tanqueray Ten", price: "10", note: "Agrumes frais, genièvre — raffiné et équilibré." },
      { name: "Renais", price: "11", note: "Anglais — marc de raisin, notes florales et fruitées." },
      { name: "Birdie", price: "11", note: "Français délicat — plantes, agrumes, touche florale." },
    ],
  },
  {
    id: "liqueurs",
    label: "Liqueurs",
    items: [
      { name: "Get 27", price: "7", note: "Menthe verte — fraîche, finale mentholée." },
      { name: "Génépi", price: "8", note: "Liqueur alpine — plantes de montagne, fraîcheur herbacée." },
      { name: "Chartreuse Verte", price: "8", note: "Riche en plantes — herbes, épices, forte intensité." },
      { name: "Chartreuse Jaune", price: "8", note: "Plus douce — arômes fruités, légèrement sucrée." },
      { name: "Chartreuse Vep", price: "40", vol: "2cl", note: "Vieillie en fût — rondeur et intensité herbacée." },
      { name: "Pastis des Alpes", price: "3", vol: "2cl", note: "Anis étoilé, réglisse, génépi et hysope." },
      { name: "La Guilde du Cognac Fins Bois 2011", price: "15", vol: "", note: "Fruits mûrs, miel et épices douces — finale soyeuse." },
      { name: "Martell VSOP Cognac", price: "14", vol: "", note: "Élégant — fruits secs, chêne et vanille." },
      { name: "Patrón XO Café", price: "8", note: "Tequila et café — douceur torréfiée, puissance envoûtante." },
    ],
  },
];
