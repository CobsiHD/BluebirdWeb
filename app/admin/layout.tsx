import type { Metadata } from "next";

/**
 * Layout de l'espace admin. Sa seule mission : interdire toute indexation.
 * L'espace ne doit apparaître dans aucun moteur de recherche.
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
