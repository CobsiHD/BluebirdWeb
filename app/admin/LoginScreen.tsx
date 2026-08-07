"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const INITIAL: LoginState = {};

/**
 * Écran de connexion à l'espace admin. Formulaire minimal (un mot de passe),
 * câblé sur la Server Action `login` via useActionState pour afficher l'erreur
 * sans rechargement complet.
 */
export default function LoginScreen() {
  const [state, formAction, pending] = useActionState(login, INITIAL);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/brand/logos/bluebird-cocktailbar-white.png"
            alt="Bluebird — Cocktail Bar"
            width={810}
            height={251}
            className="h-auto w-44 opacity-90"
            priority
          />
          <span className="font-body mt-8 text-[0.6rem] uppercase tracking-[0.45em] text-bb-red">
            Espace admin
          </span>
        </div>

        <form action={formAction} className="mt-10 flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-body text-[0.6rem] uppercase tracking-[0.3em] text-bb-gray-500">
              Mot de passe
            </span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              autoFocus
              required
              aria-invalid={state.error ? true : undefined}
              className="rounded-xl border border-bb-gray-900/70 bg-transparent px-4 py-3 font-body text-sm text-bb-white outline-none transition-colors duration-300 focus:border-bb-red"
            />
          </label>

          {state.error && (
            <p
              role="alert"
              className="font-body text-xs leading-relaxed text-bb-red"
            >
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-full border border-bb-white/15 bg-bb-red px-7 py-3 font-body text-[0.62rem] uppercase tracking-[0.3em] text-bb-white transition-opacity duration-300 hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Connexion…" : "Entrer"}
          </button>
        </form>
      </div>
    </main>
  );
}
