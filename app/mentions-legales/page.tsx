import type { Metadata } from "next";
import LegalShell from "../components/LegalShell";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site Bluebird — Cocktail Bar.",
  robots: { index: false },
};

export default function MentionsLegales() {
  return (
    <LegalShell title="Mentions légales" updated="août 2026">
      <p>
        Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
        l&apos;économie numérique (LCEN), les informations suivantes sont portées
        à la connaissance des utilisateurs du site{" "}
        <strong>bluebird-bar.fr</strong>.
      </p>

      <h2>Éditeur du site</h2>
      <p>
        Le site est édité par <strong>IBH</strong>, société à responsabilité
        limitée (SARL) au capital de <strong>[À COMPLÉTER] €</strong>.
      </p>
      <ul>
        <li>Siège social : 3 place Pasteur, 38000 Grenoble</li>
        <li>
          Établissement exploité : <strong>Bluebird — Cocktail Bar</strong>, 209
          Carré Curial, 73000 Chambéry
        </li>
        <li>SIREN : 894 673 862 — SIRET (siège) : 894 673 862 00021</li>
        <li>Immatriculée au RCS de Grenoble sous le n° 894 673 862</li>
        <li>N° de TVA intracommunautaire : FR73 894 673 862</li>
        <li>Code APE / NAF : 70.22Z</li>
        <li>
          Directeur de la publication :{" "}
          <strong>[À COMPLÉTER — nom du gérant]</strong>
        </li>
        <li>
          Contact : <strong>[À COMPLÉTER — email]</strong> —{" "}
          <strong>[À COMPLÉTER — téléphone]</strong>
        </li>
      </ul>

      <h2>Hébergeur</h2>
      <p>
        Le site est hébergé par <strong>OVH SAS</strong>, 2 rue Kellermann,
        59100 Roubaix, France — Téléphone : 1007 —{" "}
        <a href="https://www.ovhcloud.com" target="_blank" rel="noopener noreferrer">
          ovhcloud.com
        </a>{" "}
        (RCS Lille Métropole 424 761 419).
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;identité visuelle, le logotype, les illustrations et gravures ont
        été créés par <strong>Malorie Visuals</strong> (2024). L&apos;ensemble
        des éléments du site (structure, textes, visuels, marques) est protégé
        par le droit de la propriété intellectuelle. Toute reproduction,
        représentation ou exploitation, totale ou partielle, sans autorisation
        écrite préalable est interdite et constitue une contrefaçon.
      </p>

      <h2>Débit de boissons</h2>
      <p>
        L&apos;établissement dispose d&apos;une licence de débit de boissons{" "}
        <strong>[À COMPLÉTER — type et n° de licence]</strong>. Conformément à
        l&apos;article L. 3342-1 du Code de la santé publique, la vente de
        boissons alcooliques à des mineurs de moins de 18 ans est interdite.
        L&apos;abus d&apos;alcool est dangereux pour la santé, à consommer avec
        modération.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement des données et l&apos;usage des cookies sont détaillés dans
        notre{" "}
        <a href="/confidentialite">politique de confidentialité</a>. Ce site
        vitrine ne collecte aucune donnée personnelle via formulaire.
      </p>

      <h2>Crédits</h2>
      <p>
        Conception graphique &amp; direction artistique : Malorie Visuals (2024).
      </p>
    </LegalShell>
  );
}
