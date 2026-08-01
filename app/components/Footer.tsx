import Image from "next/image";
import Link from "next/link";
import { CONTACT } from "./sections/infos-data";

/** Ancres réellement présentes dans la page (la section Spiritueux a été
 *  absorbée par la Carte, son ancre `#spiritueux` n'existe plus). */
const LIENS = [
  { href: "#le-lieu", label: "Le lieu" },
  { href: "#carte", label: "La carte" },
  { href: "#sur-mesure", label: "Sur-mesure" },
  { href: "#galerie", label: "Galerie" },
  { href: "#infos", label: "Infos" },
];

/**
 * Pied de page — signature, navigation de secours et mentions.
 * Composant serveur : aucun état, l'année est figée à la génération.
 */
export default function Footer() {
  const annee = new Date().getFullYear();

  return (
    <footer className="border-t border-bb-gray-900/60 px-6 pb-10 pt-16 sm:pt-20">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-10">
        <a href="#accueil" aria-label="Bluebird — retour en haut">
          <Image
            src="/brand/logos/bluebird-cocktailbar-white.png"
            alt="Bluebird — Cocktail Bar"
            width={810}
            height={251}
            className="h-auto w-52 opacity-90 transition-opacity duration-500 hover:opacity-100 sm:w-64"
          />
        </a>

        <nav aria-label="Pied de page">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {LIENS.map((lien) => (
              <li key={lien.href}>
                <a
                  href={lien.href}
                  className="font-body text-[0.62rem] uppercase tracking-[0.3em] text-bb-white/60 transition-colors duration-300 hover:text-bb-red"
                >
                  {lien.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {CONTACT.instagram.url && (
          <a
            href={CONTACT.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-[0.62rem] uppercase tracking-[0.3em] text-bb-white/60 transition-colors duration-300 hover:text-bb-red"
          >
            Instagram {CONTACT.instagram.pseudo}
          </a>
        )}

        <p className="font-display max-w-xs text-center text-base italic leading-snug text-bb-white/50">
          « Il y a dans mon cœur un oiseau bleu qui voudrait sortir. »
        </p>

        <div className="flex w-full flex-col items-center gap-3 border-t border-bb-gray-900/60 pt-8">
          <nav
            aria-label="Informations légales"
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          >
            {[
              { href: "/mentions-legales", label: "Mentions légales" },
              { href: "/cgu", label: "CGU" },
              { href: "/confidentialite", label: "Confidentialité" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-body text-[0.58rem] uppercase tracking-[0.22em] text-bb-white/55 transition-colors duration-300 hover:text-bb-red"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Mention obligatoire pour toute communication sur des boissons alcoolisées. */}
          <p className="font-body text-center text-[0.58rem] uppercase tracking-[0.22em] text-bb-gray-500">
            L&apos;abus d&apos;alcool est dangereux pour la santé. À consommer avec
            modération.
          </p>
          <p className="font-body text-center text-[0.58rem] uppercase tracking-[0.22em] text-bb-gray-500">
            © {annee} {CONTACT.nom} · Identité visuelle : Malorie Visuals, 2024
          </p>
        </div>
      </div>
    </footer>
  );
}
