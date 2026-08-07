import Image from "next/image";
import Link from "next/link";

/**
 * Chrome commun aux pages légales (mentions, CGU, confidentialité).
 * Le contenu passé en enfant est stylé via des variantes d'attributs Tailwind :
 * on écrit du HTML sémantique simple dans les pages, la mise en forme est ici.
 */
export default function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-6 py-14 sm:py-20 lg:py-28">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="Bluebird — accueil">
          <Image
            src="/brand/logos/bluebird-cocktailbar-white.png"
            alt="Bluebird — Cocktail Bar"
            width={810}
            height={251}
            className="h-auto w-40 sm:w-48"
          />
        </Link>
        <Link
          href="/"
          className="font-body text-[0.6rem] uppercase tracking-[0.3em] text-bb-white/60 transition-colors hover:text-bb-red"
        >
          ← Retour
        </Link>
      </div>

      <header className="mt-14 border-b border-bb-gray-900/60 pb-8">
        <h1 className="font-display text-4xl uppercase leading-none tracking-wide text-bb-white sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="font-body mt-4 text-[0.62rem] uppercase tracking-[0.3em] text-bb-gray-500">
          Dernière mise à jour : {updated}
        </p>
      </header>

      <div className="mt-10 space-y-2 [&_a]:text-bb-red [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mb-3 [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-xl [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-bb-white [&_li]:font-body [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-bb-white/75 [&_p]:font-body [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-bb-white/75 [&_strong]:font-normal [&_strong]:text-bb-white [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_p]:mt-3">
        {children}
      </div>

      <p className="font-body mt-16 border-t border-bb-gray-900/60 pt-8 text-center text-[0.58rem] uppercase tracking-[0.22em] text-bb-gray-500">
        L&apos;abus d&apos;alcool est dangereux pour la santé. À consommer avec
        modération. — Vente d&apos;alcool interdite aux mineurs de moins de 18 ans.
      </p>
    </main>
  );
}
