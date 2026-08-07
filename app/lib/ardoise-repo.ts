import "server-only";
import { getDb } from "./db";

/**
 * ─────────────────────────────────────────────────────────────
 *  Ardoise — message temporaire, indépendant de la carte.
 *
 *  Le contenu est du HTML restreint (gras / italique / souligné / sauts de
 *  ligne). Il est ASSAINI À L'ÉCRITURE puis stocké tel quel : l'affichage
 *  public peut alors l'injecter sans risque. Jamais l'inverse.
 * ─────────────────────────────────────────────────────────────
 */

export type Ardoise = {
  active: boolean;
  content: string; // HTML déjà assaini
  updatedAt: string | null;
  publishedAt: string | null;
};

type ArdoiseRow = {
  active: number;
  content: string;
  updated_at: string | null;
  published_at: string | null;
};

/**
 * Assainit le contenu de l'ardoise.
 *
 *  Stratégie « refuser par défaut » : on échappe D'ABORD tout le HTML (plus
 *  aucune balise ni attribut ne survit), PUIS on restaure uniquement une liste
 *  blanche de balises de mise en forme, sans attribut. Impossible d'injecter un
 *  <script>, un gestionnaire d'événement ou une URL piégée.
 */
export function sanitizeArdoise(raw: string): string {
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Balises de mise en forme autorisées (ouvrantes et fermantes), sans attribut.
  const allowed = [
    "b", "strong", "i", "em", "u", "p",
    "ul", "ol", "li",
  ];
  let out = escaped;
  for (const tag of allowed) {
    out = out
      .replaceAll(`&lt;${tag}&gt;`, `<${tag}>`)
      .replaceAll(`&lt;/${tag}&gt;`, `</${tag}>`);
  }
  // Sauts de ligne : <br> et <br/>.
  out = out
    .replaceAll("&lt;br&gt;", "<br>")
    .replaceAll("&lt;br/&gt;", "<br>")
    .replaceAll("&lt;br /&gt;", "<br>");

  return out.trim();
}

/** Longueur brute (sans balises) du contenu — pour détecter une ardoise « vide ». */
export function ardoisePlainLength(content: string): number {
  return content.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/g, " ").trim().length;
}

/** État courant de l'ardoise (la ligne unique id=1). */
export function getArdoise(): Ardoise {
  const row = getDb()
    .prepare("SELECT active, content, updated_at, published_at FROM ardoise WHERE id = 1")
    .get() as ArdoiseRow | undefined;
  if (!row) return { active: false, content: "", updatedAt: null, publishedAt: null };
  return {
    active: row.active === 1,
    content: row.content,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

/** Ce que le site public affiche : rien si l'ardoise est inactive ou vide. */
export function getPublicArdoise(): { content: string } | null {
  const a = getArdoise();
  if (!a.active || ardoisePlainLength(a.content) === 0) return null;
  return { content: a.content };
}

/**
 * Enregistre l'ardoise : contenu (assaini) + état actif/inactif. Met à jour
 * `updated_at`, et `published_at` lorsqu'elle passe active.
 */
export function saveArdoise(input: { active: boolean; content: string }): Ardoise {
  const clean = sanitizeArdoise(input.content);
  const db = getDb();
  db.prepare(
    `UPDATE ardoise
        SET active = ?, content = ?, updated_at = datetime('now'),
            published_at = CASE WHEN ? = 1 THEN datetime('now') ELSE published_at END
      WHERE id = 1`,
  ).run(input.active ? 1 : 0, clean, input.active ? 1 : 0);
  return getArdoise();
}
