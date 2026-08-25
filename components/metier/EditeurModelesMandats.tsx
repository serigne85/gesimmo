"use client";

import { useRef, useState, useTransition } from "react";
import { Save } from "lucide-react";
import { TYPE_MANDAT_LABELS } from "@/types/mandat";
import type { ModeleMandat } from "@/types/modele-mandat";
import type { VariableContrat } from "@/lib/contrats/variables";
import { enregistrerModeleMandat } from "@/services/modeles-mandats-actions";
import { champClasse, labelClasse } from "./champsBien";

/**
 * Éditeur des modèles de contrat, un onglet par nature de mandat. Le texte est
 * libre ; les variables {{cle}} s'insèrent au curseur depuis le panneau de
 * droite et seront remplacées à la génération du PDF. L'enregistrement passe
 * par une Server Action (contrôle admin/direction côté serveur).
 */
export default function EditeurModelesMandats({
  modeles,
  variables,
}: {
  modeles: ModeleMandat[];
  variables: VariableContrat[];
}) {
  const [etat, setEtat] = useState<ModeleMandat[]>(modeles);
  const [idx, setIdx] = useState(0);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(
    null
  );
  const corpsRef = useRef<HTMLTextAreaElement>(null);

  const courant = etat[idx];

  function maj(champ: "titre" | "corps", valeur: string) {
    setEtat((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [champ]: valeur } : m))
    );
    setMessage(null);
  }

  function insererVariable(cle: string) {
    const jeton = `{{${cle}}}`;
    const el = corpsRef.current;
    if (!el) {
      maj("corps", courant.corps + jeton);
      return;
    }
    const debut = el.selectionStart;
    const fin = el.selectionEnd;
    maj("corps", courant.corps.slice(0, debut) + jeton + courant.corps.slice(fin));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = debut + jeton.length;
    });
  }

  function enregistrer() {
    setMessage(null);
    startTransition(async () => {
      const res = await enregistrerModeleMandat(
        courant.type,
        courant.titre,
        courant.corps
      );
      setMessage(
        res.error
          ? { ok: false, texte: res.error }
          : { ok: true, texte: "Modèle enregistré." }
      );
    });
  }

  return (
    <div className="space-y-4">
      {/* Onglets par nature */}
      <div className="flex gap-2">
        {etat.map((m, i) => (
          <button
            key={m.type}
            type="button"
            onClick={() => {
              setIdx(i);
              setMessage(null);
            }}
            className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
              i === idx
                ? "border-blue-700 bg-blue-900 text-white"
                : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
          >
            {TYPE_MANDAT_LABELS[m.type]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="space-y-3">
          <div>
            <label htmlFor="titre-modele" className={labelClasse}>
              Titre du contrat
            </label>
            <input
              id="titre-modele"
              type="text"
              value={courant.titre}
              onChange={(e) => maj("titre", e.target.value)}
              className={champClasse}
            />
          </div>
          <div>
            <label htmlFor="corps-modele" className={labelClasse}>
              Corps du contrat (articles et clauses)
            </label>
            <textarea
              id="corps-modele"
              ref={corpsRef}
              value={courant.corps}
              onChange={(e) => maj("corps", e.target.value)}
              rows={22}
              placeholder="Collez ici le texte du contrat. Insérez les variables depuis le panneau de droite, ex. {{mandant_nom}}."
              className={`${champClasse} font-mono leading-relaxed`}
            />
          </div>
        </div>

        {/* Panneau des variables */}
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Variables — clic pour insérer au curseur
          </p>
          <div className="flex flex-wrap gap-1.5">
            {variables.map((v) => (
              <button
                key={v.cle}
                type="button"
                onClick={() => insererVariable(v.cle)}
                title={v.description}
                className="rounded border border-zinc-300 px-1.5 py-0.5 font-mono text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {`{{${v.cle}}}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={enregistrer}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {pending ? "Enregistrement…" : "Enregistrer ce modèle"}
        </button>
        {message && (
          <span
            role="alert"
            className={`text-sm ${
              message.ok
                ? "text-green-700 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {message.texte}
          </span>
        )}
      </div>
    </div>
  );
}
