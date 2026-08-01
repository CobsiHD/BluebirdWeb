import type { Metadata, Viewport } from "next";
import { Cormorant, Josefin_Sans } from "next/font/google";
import "./globals.css";

/**
 * Typographies de la charte Bluebird (alternatives web fidèles) :
 *  - Titres « Nelphim »       → Cormorant    (serif élégant, haut contraste)
 *  - Corps  « Caviar Dreams »  → Josefin Sans (sans-serif géométrique fin)
 * Remplaçables par les fichiers d'origine via next/font/local sans toucher au reste.
 */
const fontDisplay = Cormorant({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-src",
});

const fontBody = Josefin_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600"],
  variable: "--font-body-src",
});

export const metadata: Metadata = {
  // Domaine réel de production (certificat Let's Encrypt sur l'apex) : c'est
  // lui qui préfixe les URL absolues des aperçus de partage.
  metadataBase: new URL("https://bluebird-bar.fr"),
  title: {
    default: "Bluebird — Cocktails Bar",
    template: "%s · Bluebird",
  },
  description:
    "Bluebird, bar à cocktails. Un oiseau dans le cœur qui voudrait sortir. Ambiance intime, cocktails d'auteur, univers sombre et sensuel inspiré de Bukowski.",
  keywords: ["Bluebird", "cocktails bar", "bar à cocktails", "mixologie", "Bukowski"],
  openGraph: {
    title: "Bluebird — Cocktails Bar",
    description:
      "Un oiseau dans le cœur qui voudrait sortir. Bar à cocktails, ambiance intime et sensuelle.",
    siteName: "Bluebird",
    locale: "fr_FR",
    type: "website",
    // Sans image, un partage Facebook/WhatsApp n'affiche qu'un rectangle vide
    // — et c'est aussi ce qui donne un sens à `metadataBase`, qui sert à
    // transformer ce chemin relatif en URL absolue.
    images: [
      {
        url: "/brand/photos/cocktail-red.jpg",
        width: 1386,
        height: 1600,
        alt: "Cocktail rouge sur fond de velours, bar Bluebird",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${fontDisplay.variable} ${fontBody.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
