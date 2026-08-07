"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../lib/admin-guard";
import { saveArdoise, type Ardoise } from "../lib/ardoise-repo";

/**
 * Server Actions de l'ardoise. Comme pour la carte : une action = endpoint POST
 * public, donc `requireAdmin()` en tête. Le contenu est assaini dans le repo.
 */

export type ArdoiseResult =
  | { ok: true; ardoise: Ardoise }
  | { ok: false; error: string };

export async function saveArdoiseAction(
  active: boolean,
  content: string,
): Promise<ArdoiseResult> {
  await requireAdmin();
  try {
    const ardoise = saveArdoise({ active, content });
    // L'ardoise s'affiche sur le site public (bandeau) : on rafraîchit / et
    // le tableau de bord admin.
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, ardoise };
  } catch (err) {
    const error =
      err instanceof Error && err.message ? err.message : "Enregistrement impossible.";
    return { ok: false, error };
  }
}
