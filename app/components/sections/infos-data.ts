/**
 * ⚠️ COORDONNÉES RÉELLES — À COMPLÉTER AVANT MISE EN LIGNE ⚠️
 *
 * Aucune de ces informations ne figure dans le dossier client (ni dans le menu,
 * ni dans la charte) : les valeurs marquées `TODO` sont des espaces réservés,
 * elles s'affichent telles quelles sur le site. Il suffit de les remplacer ici,
 * aucune autre modification n'est nécessaire ailleurs dans le code.
 *
 * À fournir : adresse, ville, lien Maps, téléphone, Instagram, horaires réels.
 */
const TODO = "— à compléter —";

export type Horaire = {
  /** Libellé affiché du ou des jours. */
  jours: string;
  /** Ouverture au format 24 h, ex. "18:00". `null` = fermé. */
  ouvre: string | null;
  /** Fermeture, éventuellement après minuit, ex. "02:00". */
  ferme: string | null;
  /** Index JS des jours concernés (0 = dimanche) — sert au statut « ouvert ». */
  index: number[];
};

export const CONTACT = {
  nom: "Bluebird — Cocktail Bar",
  adresse: "209 Carré Curial",
  codePostalVille: "73000 Chambéry",
  /** Lien de navigation (Google Maps, Apple Plans…). Vide = bouton masqué. */
  maps: "https://www.google.com/maps/search/?api=1&query=Bluebird+209+Carr%C3%A9+Curial+73000+Chamb%C3%A9ry",
  /**
   * Lien « laisser un avis ».
   *
   * Celui-ci ouvre la fiche Google, d'où l'avis se dépose en deux gestes.
   * Pour un lien qui ouvre directement le formulaire de notation, récupérer
   * celui de la fiche d'établissement Google : « Demander des avis » → copier
   * le lien (de la forme `https://g.page/r/XXXXXXXX/review`) et le coller ici.
   */
  avis: "https://www.google.com/maps/search/?api=1&query=Bluebird+Chamb%C3%A9ry",
  /** Format international pour le lien `tel:`, ex. "+33XXXXXXXXX". Vide = masqué. */
  telephone: "",
  /** Affichage lisible du téléphone. */
  telephoneAffiche: TODO,
  instagram: {
    /**
     * URL canonique du profil. Le lien d'origine portait `?igsh=…&utm_source=qr`,
     * paramètres de suivi du partage par QR code : retirés volontairement.
     */
    url: "https://www.instagram.com/bluebird.chambery/",
    pseudo: "@bluebird.chambery",
  },
  email: "",
};

/**
 * Horaires d'ouverture. `ouvre`/`ferme` à `null` pour un jour de fermeture.
 * Une fermeture antérieure à l'ouverture (02:00 < 18:00) est comprise comme
 * « le lendemain matin ».
 */
export const HORAIRES: Horaire[] = [
  { jours: "Lundi", ouvre: null, ferme: null, index: [1] },
  { jours: "Mardi", ouvre: "17:00", ferme: "01:00", index: [2] },
  { jours: "Mercredi", ouvre: "17:00", ferme: "01:00", index: [3] },
  { jours: "Jeudi", ouvre: "17:00", ferme: "01:00", index: [4] },
  { jours: "Vendredi", ouvre: "17:00", ferme: "01:00", index: [5] },
  { jours: "Samedi", ouvre: "17:00", ferme: "01:00", index: [6] },
  { jours: "Dimanche", ouvre: null, ferme: null, index: [0] },
];

/** Tant que les horaires ne sont pas renseignés, on n'affiche pas de statut. */
export const HORAIRES_RENSEIGNES = HORAIRES.some((h) => h.ouvre !== null);

/** "17:00" → "17h", "01:30" → "1h30" — lecture d'enseigne, pas de tableau. */
const enHeures = (heure: string) => {
  const [h, m] = heure.split(":");
  return `${Number(h)}h${m === "00" ? "" : m}`;
};

/**
 * Résumé des horaires en une phrase, pour le bandeau du menu.
 *
 * Les jours consécutifs partageant les mêmes horaires sont regroupés en
 * plages (« du mardi au samedi »), et les jours fermés listés à part. Comme
 * tout est dérivé de `HORAIRES`, le bandeau ne peut pas diverger de la liste
 * affichée dans la section Infos.
 */
export const HORAIRES_RESUME = (() => {
  const plages: { debut: string; fin: string; ouvre: string; ferme: string }[] = [];
  let courante: (typeof plages)[number] | null = null;

  for (const jour of HORAIRES) {
    if (!jour.ouvre || !jour.ferme) {
      courante = null; // un jour fermé interrompt la plage
      continue;
    }
    if (courante && courante.ouvre === jour.ouvre && courante.ferme === jour.ferme) {
      courante.fin = jour.jours;
    } else {
      courante = { debut: jour.jours, fin: jour.jours, ouvre: jour.ouvre, ferme: jour.ferme };
      plages.push(courante);
    }
  }

  const ouverture = plages
    .map((p) => {
      const quand =
        p.debut === p.fin
          ? p.debut.toLowerCase()
          : `du ${p.debut.toLowerCase()} au ${p.fin.toLowerCase()}`;
      return `${quand}, ${enHeures(p.ouvre)} — ${enHeures(p.ferme)}`;
    })
    .join(" · ");

  const fermes = HORAIRES.filter((j) => !j.ouvre).map((j) => j.jours.toLowerCase());
  const fermeture =
    fermes.length === 0
      ? ""
      : `fermé ${fermes.length === 1 ? fermes[0] : `${fermes.slice(0, -1).join(", ")} et ${fermes.at(-1)}`}`;

  return { ouverture, fermeture };
})();

export const EST_A_COMPLETER = (valeur: string) => valeur === TODO;
