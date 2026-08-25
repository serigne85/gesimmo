"use client";

import { useMemo, useState } from "react";
import { Plus, Check, X } from "lucide-react";
import type { ZoneOption } from "@/services/reference";
import { creerVille, creerZone } from "@/services/reference-actions";
import { champClasse, labelClasse } from "./champsBien";

/**
 * Localisation du bien : ville → zone (cascade) + adresse. Ville et zone
 * viennent d'une table de référence (jamais de texte libre) ; on peut en
 * ajouter à la volée via les boutons « + », qui appellent des Server Actions
 * (création côté serveur). La zone sélectionnée est soumise par le <select
 * name="zoneId">. L'adresse, elle, est un champ libre.
 */
export default function ChampsLocalisation({
  zones: zonesInitiales,
  defaultVilleId,
  defaultZoneId,
  defaultAdresse,
  peutAjouter = false,
}: {
  zones: ZoneOption[];
  defaultVilleId?: string;
  defaultZoneId?: string;
  defaultAdresse?: string | null;
  /** Autorise l'ajout de ville/zone (réservé admin/direction). Le contrôle
   *  serveur reste la vraie barrière ; ici on masque juste les boutons. */
  peutAjouter?: boolean;
}) {
  const [zones, setZones] = useState<ZoneOption[]>(zonesInitiales);
  // Une ville tout juste créée n'a pas encore de zone : elle n'apparaîtrait pas
  // si on déduisait les villes des seules zones. On la garde donc à part.
  const [villesAjoutees, setVillesAjoutees] = useState<
    { id: string; nom: string }[]
  >([]);

  const villes = useMemo(() => {
    const map = new Map<string, string>();
    zones.forEach((z) => map.set(z.villeId, z.villeNom));
    villesAjoutees.forEach((v) => map.set(v.id, v.nom));
    return Array.from(map, ([id, nom]) => ({ id, nom }));
  }, [zones, villesAjoutees]);

  const [villeId, setVilleId] = useState(
    defaultVilleId ?? zonesInitiales[0]?.villeId ?? ""
  );
  const [zoneId, setZoneId] = useState(defaultZoneId ?? "");
  const zonesFiltrees = zones.filter((z) => z.villeId === villeId);

  // États des mini-formulaires d'ajout.
  const [busy, setBusy] = useState(false);
  const [ajoutVille, setAjoutVille] = useState(false);
  const [nomVille, setNomVille] = useState("");
  const [errVille, setErrVille] = useState<string | null>(null);
  const [ajoutZone, setAjoutZone] = useState(false);
  const [nomZone, setNomZone] = useState("");
  const [errZone, setErrZone] = useState<string | null>(null);

  function changerVille(id: string) {
    setVilleId(id);
    const premiere = zones.find((z) => z.villeId === id);
    setZoneId(premiere?.id ?? "");
  }

  async function confirmerVille() {
    setErrVille(null);
    setBusy(true);
    const res = await creerVille(nomVille);
    setBusy(false);
    if (res.error || !res.ville) {
      setErrVille(res.error ?? "Création impossible.");
      return;
    }
    setVillesAjoutees((p) => [...p, res.ville!]);
    setVilleId(res.ville.id);
    setZoneId(""); // nouvelle ville : encore aucune zone
    setNomVille("");
    setAjoutVille(false);
    setAjoutZone(true); // on enchaîne : sans zone, le bien n'est pas localisable
  }

  async function confirmerZone() {
    setErrZone(null);
    setBusy(true);
    const res = await creerZone(villeId, nomZone);
    setBusy(false);
    if (res.error || !res.zone) {
      setErrZone(res.error ?? "Création impossible.");
      return;
    }
    setZones((p) =>
      p.some((z) => z.id === res.zone!.id) ? p : [...p, res.zone!]
    );
    setZoneId(res.zone.id);
    setNomZone("");
    setAjoutZone(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Ville */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="ville" className={labelClasse}>
              Ville
            </label>
            {peutAjouter && (
              <BoutonAjouter onClick={() => setAjoutVille((v) => !v)} />
            )}
          </div>
          <select
            id="ville"
            value={villeId}
            onChange={(e) => changerVille(e.target.value)}
            className={champClasse}
          >
            {villes.length === 0 && <option value="">Aucune ville</option>}
            {villes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nom}
              </option>
            ))}
          </select>
          {ajoutVille && (
            <ChampAjout
              placeholder="Nom de la ville"
              valeur={nomVille}
              onChange={setNomVille}
              onConfirmer={confirmerVille}
              onAnnuler={() => {
                setAjoutVille(false);
                setErrVille(null);
              }}
              busy={busy}
              erreur={errVille}
            />
          )}
        </div>

        {/* Zone */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="zoneId" className={labelClasse}>
              Zone
            </label>
            {peutAjouter && (
              <BoutonAjouter
                onClick={() => setAjoutZone((v) => !v)}
                disabled={!villeId}
              />
            )}
          </div>
          <select
            id="zoneId"
            name="zoneId"
            required
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className={champClasse}
          >
            <option value="" disabled>
              {zonesFiltrees.length === 0
                ? "Ajoutez une zone"
                : "Choisir une zone"}
            </option>
            {zonesFiltrees.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nom}
              </option>
            ))}
          </select>
          {ajoutZone && (
            <ChampAjout
              placeholder="Nom de la zone"
              valeur={nomZone}
              onChange={setNomZone}
              onConfirmer={confirmerZone}
              onAnnuler={() => {
                setAjoutZone(false);
                setErrZone(null);
              }}
              busy={busy}
              erreur={errZone}
            />
          )}
        </div>
      </div>

      <div>
        <label htmlFor="adresse" className={labelClasse}>
          Adresse
        </label>
        <input
          id="adresse"
          name="adresse"
          type="text"
          maxLength={200}
          placeholder="Rue, quartier, point de repère…"
          defaultValue={defaultAdresse ?? ""}
          className={champClasse}
        />
      </div>
    </div>
  );
}

/** Petit bouton « + » à côté d'un libellé. */
function BoutonAjouter({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 text-xs font-medium text-blue-800 hover:underline disabled:opacity-40 dark:text-blue-300"
    >
      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      Ajouter
    </button>
  );
}

/** Mini-formulaire inline : saisie d'un nom + valider / annuler. */
function ChampAjout({
  placeholder,
  valeur,
  onChange,
  onConfirmer,
  onAnnuler,
  busy,
  erreur,
}: {
  placeholder: string;
  valeur: string;
  onChange: (v: string) => void;
  onConfirmer: () => void;
  onAnnuler: () => void;
  busy: boolean;
  erreur: string | null;
}) {
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          autoFocus
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            // Entrée valide, Échap annule — sans soumettre le formulaire parent.
            if (e.key === "Enter") {
              e.preventDefault();
              onConfirmer();
            } else if (e.key === "Escape") {
              onAnnuler();
            }
          }}
          placeholder={placeholder}
          className={champClasse}
        />
        <button
          type="button"
          onClick={onConfirmer}
          disabled={busy}
          title="Valider"
          className="rounded-md bg-blue-900 p-2 text-white hover:bg-blue-800 disabled:opacity-60"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onAnnuler}
          disabled={busy}
          title="Annuler"
          className="rounded-md border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {erreur && (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {erreur}
        </p>
      )}
    </div>
  );
}
