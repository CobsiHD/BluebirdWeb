import Image from "next/image";
import { getPostsInstagram } from "../../lib/instagram";
import { InstagramEmbeds } from "../ui/instagram-embed";
import { CONTACT } from "./infos-data";
import { POSTS_MANUELS, PUBLICATIONS, PUBLICATIONS_VISIBLES } from "./instagram-data";

/**
 * Feed Instagram — composant serveur (le jeton éventuel ne quitte jamais le
 * serveur).
 *
 * Sources, dans l'ordre :
 *   1. les embeds officiels si des liens sont listés dans `instagram-data.ts`
 *      (aucun jeton nécessaire, compte public suffisant) ;
 *   2. l'API Instagram si `INSTAGRAM_TOKEN` est défini ;
 *   3. la sélection manuelle de visuels ;
 *   4. à défaut, une simple invitation à suivre le compte.
 *
 * Aucune publication n'est jamais inventée : si rien n'est disponible, on
 * n'affiche pas de vignette.
 */
export default async function InstagramFeed() {
  // Les cartes Instagram sont hautes (~600 px) : quatre suffisent à donner le
  // ton sans transformer le bas de page en mur infini. L'interrupteur de
  // instagram-data.ts ne masque que la grille : l'entête et le bouton
  // « Suivre » restent, eux, toujours affichés.
  const embeds = PUBLICATIONS_VISIBLES ? PUBLICATIONS.slice(0, 4) : [];
  const viaApi = !PUBLICATIONS_VISIBLES || embeds.length > 0 ? [] : await getPostsInstagram(6);
  const posts =
    !PUBLICATIONS_VISIBLES ? [] : viaApi.length > 0 ? viaApi : POSTS_MANUELS.slice(0, 6);
  const profil = CONTACT.instagram.url;

  return (
    <div className="mx-auto mt-20 max-w-4xl border-t border-bb-gray-900/60 pt-14">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="font-body text-[0.6rem] uppercase tracking-[0.35em] text-bb-red">
          Instagram
        </span>
        <p className="font-display text-2xl uppercase tracking-wide text-bb-white sm:text-3xl">
          {CONTACT.instagram.pseudo}
        </p>
        <p className="font-body mt-1 max-w-xs text-xs leading-relaxed text-bb-gray-500">
          Les soirées, les nouveautés de la carte et les invités du week-end.
        </p>
      </div>

      {embeds.length > 0 && <InstagramEmbeds liens={embeds} />}

      {embeds.length === 0 && posts.length > 0 && (
        <ul className="mt-10 grid grid-cols-3 gap-2 sm:gap-3">
          {posts.map((post) => (
            <li key={post.id}>
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden rounded-lg bg-bb-gray-900/50 ring-1 ring-bb-white/[0.07] outline-none focus-visible:ring-2 focus-visible:ring-bb-red"
              >
                <Image
                  src={post.image}
                  alt={post.alt}
                  fill
                  // Optimisées, donc servies depuis notre domaine : le
                  // navigateur du visiteur n'appelle jamais les serveurs Meta.
                  // Si des vignettes cassaient (URL Instagram signée expirée
                  // entre deux revalidations), passer à `unoptimized`.
                  sizes="(min-width: 768px) 15vw, 32vw"
                  className="object-cover brightness-[0.85] transition duration-700 ease-out group-hover:scale-105 group-hover:brightness-100"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-bb-red/0 transition-colors duration-500 group-hover:bg-bb-red/20"
                />
                {post.video && (
                  <span
                    aria-hidden
                    className="absolute right-2 top-2 text-xs leading-none text-bb-white/90 drop-shadow"
                  >
                    ▶
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 flex justify-center">
        {profil ? (
          <a
            href={profil}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body inline-flex items-center gap-2 rounded-full border border-bb-gray-900 px-6 py-3 text-[0.62rem] uppercase tracking-[0.25em] text-bb-white/80 transition-colors duration-300 hover:border-bb-red hover:text-bb-white"
          >
            Suivre le Bluebird
            <span aria-hidden>↗</span>
          </a>
        ) : (
          <p className="font-body text-[0.6rem] uppercase tracking-[0.25em] text-bb-gray-500">
            Compte Instagram à renseigner
          </p>
        )}
      </div>
    </div>
  );
}
