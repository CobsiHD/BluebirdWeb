"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  verifyPassword,
} from "../lib/admin-session";

/**
 * Server Actions de l'espace admin. Point important (Next 16) : une Server
 * Action est un point d'entrée POST public — l'authentification se fait DONC
 * ici, dans l'action, et non seulement au rendu de la page.
 */

export type LoginState = { error?: string };

/**
 * Connexion : vérifie le mot de passe, pose le cookie de session signé,
 * puis redirige vers le tableau de bord. En cas d'échec, renvoie un message
 * (affiché par le formulaire via useActionState).
 */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get("password");

  if (typeof password !== "string" || password.length === 0) {
    return { error: "Renseignez le mot de passe." };
  }

  if (!verifyPassword(password)) {
    return { error: "Mot de passe incorrect." };
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE,
    value: createSessionToken(),
    httpOnly: true,
    // En production le site est servi en HTTPS (Let's Encrypt) : cookie
    // réservé aux connexions sûres. En dev (http://localhost) `secure` casserait
    // la pose du cookie, on l'active donc seulement hors développement.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/admin");
}

/** Déconnexion : efface le cookie de session et revient à l'écran de login. */
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/admin");
}
