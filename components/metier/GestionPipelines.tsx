"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Power,
} from "lucide-react";
import {
  TYPES_ETAPE,
  TYPE_ETAPE_LABELS,
  type PipelineAdmin,
  type EtapePipeline,
  type TypeEtape,
} from "@/types/opportunite";
import {
  creerPipeline,
  renommerPipeline,
  definirActifPipeline,
  ajouterEtape,
  renommerEtape,
  changerTypeEtape,
  deplacerEtape,
  supprimerEtape,
  type PipelineActionResult,
} from "@/services/pipelines-actions";
import { champClasse } from "./champsBien";

/**
 * Écran d'administration des pipelines et de leurs étapes (admin/direction).
 * Chaque mutation appelle une Server Action ; en cas de succès, on rafraîchit la
 * page pour relire les données côté serveur. Les erreurs s'affichent en haut.
 */
export default function GestionPipelines({
  pipelines,
}: {
  pipelines: PipelineAdmin[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [nouveauPipeline, setNouveauPipeline] = useState("");

  /** Exécute une action et rafraîchit si elle réussit. */
  function run(fn: () => Promise<PipelineActionResult>) {
    setErreur(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setErreur(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {erreur && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {erreur}
        </p>
      )}

      {/* Ajouter un pipeline */}
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-end dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex-1">
          <label htmlFor="nouveauPipeline" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nouveau pipeline
          </label>
          <input
            id="nouveauPipeline"
            value={nouveauPipeline}
            onChange={(e) => setNouveauPipeline(e.target.value)}
            placeholder="Ex. Acquisition de mandat"
            className={champClasse}
          />
        </div>
        <button
          type="button"
          disabled={pending || nouveauPipeline.trim().length < 2}
          onClick={() =>
            run(async () => {
              const r = await creerPipeline(nouveauPipeline);
              if (!r.error) setNouveauPipeline("");
              return r;
            })
          }
          className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ajouter
        </button>
      </div>

      {pipelines.map((p) => (
        <CartePipeline key={p.id} pipeline={p} pending={pending} run={run} />
      ))}
    </div>
  );
}

/** Une carte de pipeline : en-tête (nom, actif) + étapes + ajout d'étape. */
function CartePipeline({
  pipeline,
  pending,
  run,
}: {
  pipeline: PipelineAdmin;
  pending: boolean;
  run: (fn: () => Promise<PipelineActionResult>) => void;
}) {
  const [nom, setNom] = useState(pipeline.nom);

  return (
    <section
      className={`rounded-lg border bg-white p-4 dark:bg-zinc-900 ${
        pipeline.actif
          ? "border-zinc-200 dark:border-zinc-800"
          : "border-dashed border-zinc-300 opacity-70 dark:border-zinc-700"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          onBlur={() => {
            if (nom.trim() && nom !== pipeline.nom)
              run(() => renommerPipeline(pipeline.id, nom));
          }}
          className="flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-zinc-900 hover:border-zinc-300 focus:border-zinc-300 focus:outline-none dark:text-zinc-100 dark:hover:border-zinc-700"
        />
        {!pipeline.actif && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            Désactivé
          </span>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => definirActifPipeline(pipeline.id, !pipeline.actif))}
          title={pipeline.actif ? "Désactiver" : "Activer"}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Power className="h-3.5 w-3.5" aria-hidden="true" />
          {pipeline.actif ? "Désactiver" : "Activer"}
        </button>
      </div>

      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {pipeline.etapes.map((etape, i) => (
          <EtapeLigne
            key={etape.id}
            etape={etape}
            premier={i === 0}
            dernier={i === pipeline.etapes.length - 1}
            pending={pending}
            run={run}
          />
        ))}
      </ul>

      <AjoutEtape pipelineId={pipeline.id} pending={pending} run={run} />
    </section>
  );
}

/** Une ligne d'étape éditable : nom, type, déplacement, suppression. */
function EtapeLigne({
  etape,
  premier,
  dernier,
  pending,
  run,
}: {
  etape: EtapePipeline;
  premier: boolean;
  dernier: boolean;
  pending: boolean;
  run: (fn: () => Promise<PipelineActionResult>) => void;
}) {
  const [nom, setNom] = useState(etape.nom);

  return (
    <li className="flex flex-wrap items-center gap-2 py-2">
      <div className="flex flex-col">
        <button
          type="button"
          disabled={pending || premier}
          onClick={() => run(() => deplacerEtape(etape.id, "haut"))}
          title="Monter"
          className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 dark:hover:text-zinc-200"
        >
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={pending || dernier}
          onClick={() => run(() => deplacerEtape(etape.id, "bas"))}
          title="Descendre"
          className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 dark:hover:text-zinc-200"
        >
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <input
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        onBlur={() => {
          if (nom.trim() && nom !== etape.nom)
            run(() => renommerEtape(etape.id, nom));
        }}
        className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm text-zinc-800 hover:border-zinc-300 focus:border-zinc-300 focus:outline-none dark:text-zinc-200 dark:hover:border-zinc-700"
      />

      <select
        value={etape.type}
        disabled={pending}
        onChange={(e) =>
          run(() => changerTypeEtape(etape.id, e.target.value as TypeEtape))
        }
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
      >
        {TYPES_ETAPE.map((t) => (
          <option key={t} value={t}>
            {TYPE_ETAPE_LABELS[t]}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm(`Supprimer l'étape « ${etape.nom} » ?`))
            run(() => supprimerEtape(etape.id));
        }}
        title="Supprimer l'étape"
        className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-700 disabled:opacity-60 dark:hover:bg-red-950"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </li>
  );
}

/** Formulaire d'ajout d'une étape en fin de pipeline. */
function AjoutEtape({
  pipelineId,
  pending,
  run,
}: {
  pipelineId: string;
  pending: boolean;
  run: (fn: () => Promise<PipelineActionResult>) => void;
}) {
  const [nom, setNom] = useState("");
  const [type, setType] = useState<TypeEtape>("normale");

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
      <input
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Nouvelle étape…"
        className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as TypeEtape)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
      >
        {TYPES_ETAPE.map((t) => (
          <option key={t} value={t}>
            {TYPE_ETAPE_LABELS[t]}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending || nom.trim().length < 1}
        onClick={() =>
          run(async () => {
            const r = await ajouterEtape(pipelineId, nom, type);
            if (!r.error) setNom("");
            return r;
          })
        }
        className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Étape
      </button>
    </div>
  );
}
