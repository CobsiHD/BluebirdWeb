import type { Metadata } from "next";
import LegalShell from "../components/LegalShell";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description:
    "Conditions générales d'utilisation du site vitrine Bluebird — Cocktail Bar.",
  robots: { index: false },
};

export default function CGU() {
  return (
    <LegalShell title="Conditions d'utilisation" updated="août 2026">
      <p>
        Les présentes conditions générales d&apos;utilisation (« CGU ») encadrent
        l&apos;accès et l&apos;utilisation du site{" "}
        <strong>bluebird-bar.fr</strong> (le « Site »), édité par la société IBH
        (voir <a href="/mentions-legales">mentions légales</a>). Le Site est un
        support de présentation : il ne propose <strong>aucune vente ni
        réservation en ligne</strong>.
      </p>

      <h2>1. Acceptation</h2>
      <p>
        L&apos;accès au Site implique l&apos;acceptation pleine et entière des
        présentes CGU. L&apos;éditeur se réserve le droit de les modifier à tout
        moment ; la version applicable est celle en ligne lors de la
        consultation.
      </p>

      <h2>2. Accès au Site</h2>
      <p>
        Le Site est accessible gratuitement. L&apos;éditeur s&apos;efforce
        d&apos;en assurer la disponibilité mais ne saurait être tenu responsable
        des interruptions, notamment pour maintenance, mise à jour ou cas de
        force majeure.
      </p>

      <h2>3. Contenu &amp; informations</h2>
      <p>
        Les informations diffusées (présentation du lieu, carte des cocktails et
        spiritueux, tarifs, horaires) sont fournies à titre indicatif et{" "}
        <strong>non contractuel</strong>. La carte et les prix sont susceptibles
        d&apos;évoluer ; seuls ceux affichés dans l&apos;établissement font foi.
      </p>

      <h2>4. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus du Site (textes, visuels, logo, gravures,
        illustrations — identité visuelle Malorie Visuals, 2024) est protégé.
        Toute reproduction ou réutilisation sans autorisation est interdite.
      </p>

      <h2>5. Liens externes</h2>
      <p>
        Le Site peut renvoyer vers des sites tiers (notamment Instagram, un
        service de cartographie). L&apos;éditeur n&apos;exerce aucun contrôle sur
        ces sites et décline toute responsabilité quant à leur contenu.
      </p>

      <h2>6. Responsabilité</h2>
      <p>
        L&apos;éditeur ne saurait être tenu responsable des dommages directs ou
        indirects résultant de l&apos;accès ou de l&apos;utilisation du Site, ni
        d&apos;éventuelles erreurs ou omissions dans les informations publiées.
      </p>

      <h2>7. Accès à l&apos;établissement &amp; alcool</h2>
      <p>
        La vente de boissons alcooliques est interdite aux mineurs de moins de 18
        ans. L&apos;abus d&apos;alcool est dangereux pour la santé, à consommer
        avec modération.
      </p>

      <h2>8. Données personnelles</h2>
      <p>
        Le traitement des données et les cookies sont décrits dans la{" "}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>

      <h2>9. Droit applicable</h2>
      <p>
        Les présentes CGU sont soumises au droit français. À défaut de résolution
        amiable, tout litige relève de la compétence des tribunaux français.
      </p>
    </LegalShell>
  );
}
