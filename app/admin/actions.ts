"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "../lib/admin-guard";
import {
  PASSWORD_MIN,
  hasPassword,
  setPassword,
  verifyAdminPassword,
} from "../lib/admin-password";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
} from "../lib/admin-session";

/**
 * Server Actions de l'espace admin. Point important (Next 16) : une Server
 * Action est un point d'entrée POST public — l'authentification se fait DONC
 * ici, dans l'action, et non seulement au rendu de la page.
 */

export type LoginState = { error?: string };

/** Attributs communs du cookie de session (pose et renouvellement). */
function sessionCookie(value: string) {
  return {
    name: SESSION_COOKIE,
    value,
    httpOnly: true,
    // En production le site est servi en HTTPS (Let's Encrypt) : cookie
    // réservé aux connexions sûres. En dev (http://localhost) `secure` casserait
    // la pose du cookie, on l'active donc seulement hors développement.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

/**
 * Connexion : vérifie le mot de passe (contre l'empreinte en base), pose le
 * cookie de session signé, puis redirige vers le tableau de bord. En cas
 * d'échec, renvoie un message (affiché par le formulaire via useActionState).
 */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get("password");

  if (typeof password !== "string" || password.length === 0) {
    return { error: "Renseignez le mot de passe." };
  }

  if (!hasPassword()) {
    return {
      error:
        "Aucun mot de passe n'est défini pour cet espace. Lancez « npm run admin:motdepasse » sur le serveur.",
    };
  }

  if (!verifyAdminPassword(password)) {
    return { error: "Mot de passe incorrect." };
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookie(createSessionToken()));

  redirect("/admin");
}

/** Déconnexion : efface le cookie de session et revient à l'écran de login. */
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/admin");
}

export type PasswordResult = { ok: true } | { ok: false; error: string };

/**
 * Changement de mot de passe (CDC US-020).
 *
 *  • l'ancien mot de passe est exigé — un cookie volé ne suffit pas à
 *    verrouiller le gérant hors de son espace ;
 *  • le nouveau est enregistré haché, ce qui change l'empreinte de session :
 *    TOUTES les sessions ouvertes tombent, sur tous les appareils ;
 *  • on réémet aussitôt le cookie de l'appareil courant, pour que celui qui
 *    vient de changer son mot de passe ne se déconnecte pas lui-même.
 */
export async function changePassword(
  current: string,
  next: string,
): Promise<PasswordResult> {
  await requireAdmin();

  if (!verifyAdminPassword(current)) {
    return { ok: false, error: "Mot de passe actuel incorrect." };
  }
  if (next.length < PASSWORD_MIN) {
    return {
      ok: false,
      error: `Le nouveau mot de passe doit faire au moins ${PASSWORD_MIN} caractères.`,
    };
  }
  if (next === current) {
    return { ok: false, error: "Le nouveau mot de passe est identique à l'ancien." };
  }

  setPassword(next);

  const cookieStore = await cookies();
  cookieStore.set(sessionCookie(createSessionToken()));

  return { ok: true };
}
