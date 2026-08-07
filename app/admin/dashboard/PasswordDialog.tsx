"use client";

import { useState, useTransition } from "react";
import { changePassword } from "../actions";
import { Button, ErrorNote, Modal, useToast } from "./ui";

/**
 * Changement du mot de passe de l'espace (CDC US-020).
 *
 *  • l'ancien mot de passe est exigé — un appareil laissé ouvert ne suffit pas
 *    à verrouiller le gérant hors de chez lui ;
 *  • le serveur n'enregistre qu'une empreinte : le mot de passe reste
 *    irrécupérable, y compris par nous ;
 *  • toutes les autres sessions tombent aussitôt (téléphone du bar, poste
 *    resté connecté ailleurs) ; l'appareil courant, lui, reste connecté.
 */

const MIN = 10;

/** Champ mot de passe autonome — l'UI générique ne gère que du texte visible. */
function SecretField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: "current-password" | "new-password";
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-body text-[0.58rem] uppercase tracking-[0.28em] text-bb-white/70">
        {label}
      </span>
      <input
        type="password"
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border-2 border-bb-white/30 bg-bb-white/5 px-3.5 py-2.5 font-body text-base text-bb-white outline-none transition-colors duration-200 focus:border-bb-red"
      />
    </label>
  );
}

export default function PasswordDialog({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function submit() {
    setError(null);
    if (next !== confirm) {
      setError("Les deux saisies du nouveau mot de passe diffèrent.");
      return;
    }
    if (next.length < MIN) {
      setError(`Le nouveau mot de passe doit faire au moins ${MIN} caractères.`);
      return;
    }
    startTransition(async () => {
      const res = await changePassword(current, next);
      if (res.ok) {
        toast("Mot de passe modifié. Les autres appareils sont déconnectés.");
        onClose();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Modal
      title="Changer le mot de passe"
      intro="Il n'est stocké nulle part en clair : le serveur n'en garde qu'une empreinte, impossible à inverser."
      onClose={onClose}
      footer={
        <>
          <Button variant="quiet" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            disabled={pending || !current || !next || !confirm}
          >
            {pending ? "Enregistrement…" : "Changer"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <SecretField
          label="Mot de passe actuel"
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
        />
        <SecretField
          label={`Nouveau mot de passe (${MIN} caractères minimum)`}
          value={next}
          onChange={setNext}
          autoComplete="new-password"
        />
        <SecretField
          label="Confirmez le nouveau"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
        <p className="font-body text-xs leading-relaxed text-bb-white/70">
          Après le changement, les sessions ouvertes sur les autres appareils
          seront fermées. Celui-ci reste connecté.
        </p>
        <ErrorNote>{error}</ErrorNote>
      </div>
    </Modal>
  );
}
