import { getPublicArdoise } from "../lib/ardoise-repo";

/**
 * Bandeau « ardoise » en haut du site public — message du moment (cocktail du
 * jour, Happy Hour, concert…). Ne s'affiche QUE si l'ardoise est active et non
 * vide (cf. `getPublicArdoise`). Le contenu est du HTML déjà assaini à
 * l'écriture (voir ardoise-repo) : l'injection est donc sûre ici.
 *
 * Server Component : lecture directe en base ; la sauvegarde côté admin
 * revalide « / ».
 */
export default function ArdoiseBanner() {
  const ardoise = getPublicArdoise();
  if (!ardoise) return null;

  return (
    <div
      role="status"
      className="relative z-50 border-b border-bb-red/40 bg-bb-red-deeper/90 px-4 py-2 text-center backdrop-blur"
    >
      <div
        className="font-body mx-auto max-w-3xl text-[0.72rem] uppercase tracking-[0.2em] text-bb-white/90 [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: ardoise.content }}
      />
    </div>
  );
}
