import type { Metadata } from "next";
import LegalShell from "../components/LegalShell";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité et cookies du site Bluebird — Cocktail Bar.",
  robots: { index: false },
};

export default function Confidentialite() {
  return (
    <LegalShell title="Confidentialité & cookies" updated="août 2026">
      <p>
        La présente politique décrit la manière dont le site{" "}
        <strong>bluebird-bar.fr</strong> traite les données personnelles,
        conformément au Règlement (UE) 2016/679 (RGPD) et à la loi
        « Informatique et Libertés ».
      </p>

      <h2>Responsable de traitement</h2>
      <p>
        Le responsable de traitement est la société <strong>IBH</strong> (voir{" "}
        <a href="/mentions-legales">mentions légales</a>). Pour toute question :{" "}
        <strong>[À COMPLÉTER — email]</strong>.
      </p>

      <h2>Données collectées</h2>
      <p>
        Ce site est un site <strong>vitrine</strong>. Il ne comporte ni
        formulaire, ni compte, ni réservation ou paiement en ligne, et
        n&apos;utilise <strong>aucun outil de mesure d&apos;audience</strong>{" "}
        (analytics). En conséquence, <strong>aucune donnée personnelle
        n&apos;est collectée</strong> directement par l&apos;éditeur lors de
        votre navigation.
      </p>

      <h2>Journaux techniques</h2>
      <p>
        Pour des raisons de sécurité et de bon fonctionnement, l&apos;hébergeur{" "}
        <strong>OVH</strong> est susceptible de conserver des journaux de
        connexion (dont l&apos;adresse IP) pendant une durée limitée,
        conformément à la réglementation. Ces données ne sont pas exploitées à
        des fins commerciales.
      </p>

      <h2>Cookies</h2>
      <p>
        Le Site ne dépose <strong>aucun cookie de mesure ou de publicité</strong>.
        Seuls d&apos;éventuels cookies strictement nécessaires au fonctionnement
        peuvent être utilisés. L&apos;affichage de contenus ou de liens{" "}
        <strong>Instagram</strong> peut toutefois entraîner le dépôt de cookies
        par la société Meta ; nous vous invitons à consulter la{" "}
        <a
          href="https://privacycenter.instagram.com/policy"
          target="_blank"
          rel="noopener noreferrer"
        >
          politique de confidentialité d&apos;Instagram
        </a>
        .
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez d&apos;un droit d&apos;accès, de rectification,
        d&apos;effacement, d&apos;opposition, de limitation et de portabilité de
        vos données. Ces droits peuvent être exercés auprès du responsable de
        traitement à l&apos;adresse indiquée ci-dessus.
      </p>
      <p>
        Vous pouvez également introduire une réclamation auprès de la CNIL —{" "}
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
          cnil.fr
        </a>
        .
      </p>

      <h2>Modifications</h2>
      <p>
        La présente politique peut être mise à jour à tout moment. La version
        applicable est celle publiée sur cette page.
      </p>
    </LegalShell>
  );
}
