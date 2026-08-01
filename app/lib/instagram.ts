/**
 * Récupération du feed Instagram — côté serveur uniquement.
 *
 * ⚠️ Ne jamais importer ce module depuis un composant `"use client"` :
 * `INSTAGRAM_TOKEN` n'a pas de préfixe `NEXT_PUBLIC_`, il vaudrait donc
 * `undefined` côté navigateur (le jeton ne fuiterait pas, mais le feed
 * disparaîtrait silencieusement). Le paquet `server-only`, qui transformerait
 * cette règle en erreur de compilation, n'est pas installé sur ce projet.
 *
 * Contexte : l'API « Basic Display » est fermée depuis décembre 2024 et
 * Instagram a supprimé l'embed de profil. Il ne reste que l'« Instagram API
 * with Instagram Login » (graph.instagram.com), qui exige :
 *   1. un compte professionnel (Business ou Créateur) ;
 *   2. une app Meta et une autorisation OAuth ;
 *   3. un jeton longue durée valable 60 jours, à rafraîchir.
 *
 * Le jeton reste sur le serveur (module `server-only`) : il ne doit jamais
 * partir dans le bundle client.
 */

export type PostInstagram = {
  id: string;
  /** Lien vers la publication sur instagram.com. */
  permalink: string;
  /** URL de l'image (ou de la vignette pour une vidéo). */
  image: string;
  /** Texte alternatif — extrait de la légende. */
  alt: string;
  /** Vidéo ou Reel : on affiche un marqueur de lecture. */
  video?: boolean;
  /** `true` si l'image est hébergée par Instagram (URL signée, expire). */
  distante: boolean;
};

type MediaApi = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
};

/** Légende Instagram → texte alternatif court et lisible. */
function alternatif(caption?: string) {
  const propre = (caption ?? "")
    .replace(/#[\p{L}\p{N}_]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!propre) return "Publication Instagram du Bluebird";
  return propre.length > 120 ? `${propre.slice(0, 117)}…` : propre;
}

/**
 * Interroge l'API Instagram. Renvoie un tableau vide en cas d'absence de
 * jeton, de jeton expiré ou d'erreur réseau : le feed est un agrément, il ne
 * doit jamais faire tomber la page ni bloquer le build.
 */
export async function getPostsInstagram(limite = 6): Promise<PostInstagram[]> {
  const token = process.env.INSTAGRAM_TOKEN;
  if (!token) return [];

  const url = new URL("https://graph.instagram.com/me/media");
  url.searchParams.set(
    "fields",
    "id,caption,media_type,media_url,thumbnail_url,permalink",
  );
  url.searchParams.set("limit", String(limite));
  url.searchParams.set("access_token", token);

  try {
    const reponse = await fetch(url, {
      // Une heure de cache : largement suffisant pour un bar, et cela évite
      // de brûler le quota d'appels de l'app Meta.
      next: { revalidate: 3600, tags: ["instagram"] },
    });

    if (!reponse.ok) {
      // Surtout ne rien logger qui contienne l'URL : elle porte le jeton.
      console.warn(
        `[instagram] réponse ${reponse.status} — jeton expiré ou compte non professionnel ?`,
      );
      return [];
    }

    const donnees = (await reponse.json()) as { data?: MediaApi[] };
    return (donnees.data ?? [])
      .map((media): PostInstagram | null => {
        const image =
          media.media_type === "VIDEO" ? media.thumbnail_url : media.media_url;
        if (!image) return null;
        return {
          id: media.id,
          permalink: media.permalink,
          image,
          alt: alternatif(media.caption),
          video: media.media_type !== "IMAGE",
          distante: true,
        };
      })
      .filter((post): post is PostInstagram => post !== null)
      .slice(0, limite);
  } catch (erreur) {
    console.warn("[instagram] appel impossible :", (erreur as Error).message);
    return [];
  }
}
