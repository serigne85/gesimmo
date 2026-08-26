"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { type ObjectifBien, type BienEdition } from "@/types/bien";
import type { ZoneOption } from "@/services/reference";
import {
  creerBien,
  modifierBien,
  type CreerBienState,
} from "@/services/biens-actions";
import { champClasse, labelClasse } from "./champsBien";
import ChampsCaracteristiques from "./ChampsCaracteristiques";
import ChampsLocalisation from "./ChampsLocalisation";
import ChampsContactsBien from "./ChampsContactsBien";
import SelecteurPhotos, { type SelecteurPhotosHandle } from "./SelecteurPhotos";

const initialState: CreerBienState = { error: null };

/** Valeurs de pré-remplissage à la CRÉATION (ex. conversion d'une prospection).
 *  Ne bascule pas le formulaire en mode édition, contrairement au prop `bien`. */
export type PrefillBien = {
  titre?: string;
  objectif?: ObjectifBien;
  villeId?: string;
  zoneId?: string;
  proprietaireNom?: string;
  proprietaireTelephone?: string;
  contactNom?: string;
  contactTelephone?: string;
};

/**
 * Formulaire de bien, deux modes : `bien` absent = création, `bien` présent =
 * édition (champs pré-remplis). En édition, les contacts et les photos ne sont
 * pas ici (ils se gèrent depuis la fiche / le module Contacts). `prefill`
 * pré-remplit une création (sans passer en édition).
 */
export default function FormulaireBien({
  zones,
  bien,
  prefill,
  photosSlot,
  peutAjouterReference = false,
}: {
  zones: ZoneOption[];
  bien?: BienEdition;
  prefill?: PrefillBien;
  /** Galerie de photos affichée avant le bouton (édition : le bien existe). */
  photosSlot?: ReactNode;
  /** Autorise l'ajout de ville/zone à la volée (admin/direction). */
  peutAjouterReference?: boolean;
}) {
  const isEdition = !!bien;
  const action = isEdition ? modifierBien.bind(null, bien.id) : creerBien;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const router = useRouter();
  const photosRef = useRef<SelecteurPhotosHandle>(null);
  const [envoiPhotos, setEnvoiPhotos] = useState(false);
  const [erreurPhotos, setErreurPhotos] = useState<string | null>(null);

  const [objectif, setObjectif] = useState<ObjectifBien>(
    bien?.objectif ?? prefill?.objectif ?? "vente"
  );

  // Après création, le bien existe : on envoie les photos en attente (upload
  // différé) puis on file sur sa fiche. Si un envoi échoue, le bien est déjà
  // créé — on va quand même sur sa fiche pour ne pas le perdre, avec un message.
  useEffect(() => {
    const bienId = state.bienId;
    if (!bienId) return;

    (async () => {
      if (photosRef.current && photosRef.current.count() > 0) {
        setEnvoiPhotos(true);
        const err = await photosRef.current.uploadTo(bienId);
        setEnvoiPhotos(false);
        if (err) {
          setErreurPhotos(
            "Bien créé, mais l'envoi d'une photo a échoué. Ajoutez-les depuis sa fiche."
          );
        }
      }
      router.push(`/biens/${bienId}`);
    })();
  }, [state.bienId, router]);

  return (
    <form action={formAction} className="space-y-5">
      {/* Titre */}
      <div>
        <label htmlFor="titre" className={labelClasse}>
          Titre du bien <span className="text-zinc-400">(optionnel)</span>
        </label>
        <input
          id="titre"
          name="titre"
          type="text"
          maxLength={150}
          placeholder="Ex. Villa R+1 avec piscine, Almadies"
          defaultValue={bien?.titre ?? prefill?.titre ?? ""}
          className={champClasse}
        />
      </div>

      {/* Objectif : 2 options → boutons (CLAUDE.md) */}
      <div>
        <span className={labelClasse}>Objectif</span>
        <input type="hidden" name="objectif" value={objectif} />
        <div className="flex gap-2">
          {(["vente", "location"] as ObjectifBien[]).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setObjectif(val)}
              className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                objectif === val
                  ? "border-blue-700 bg-blue-900 text-white"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              {val === "vente" ? "Vente" : "Location"}
            </button>
          ))}
        </div>
      </div>

      {/* Type, surface, chambres, statut juridique, prix, description */}
      <ChampsCaracteristiques bien={bien} />

      {/* Ville, zone, adresse (avec ajout de ville/zone à la volée) */}
      <ChampsLocalisation
        zones={zones}
        defaultVilleId={bien?.villeId ?? prefill?.villeId}
        defaultZoneId={bien?.zoneId ?? prefill?.zoneId}
        defaultAdresse={bien?.adresse}
        peutAjouter={peutAjouterReference}
      />

      {/* Médias : lien vidéo + photos regroupés. Le champ vidéo est présent dans
          les deux modes ; les photos diffèrent (sélecteur en création avec upload
          différé, galerie GaleriePhotos en édition). */}
      <div className="space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <div>
          <label htmlFor="videoUrl" className={labelClasse}>
            Lien vidéo <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input
            id="videoUrl"
            name="videoUrl"
            type="url"
            maxLength={500}
            placeholder="https://youtube.com/..."
            defaultValue={bien?.videoUrl ?? ""}
            className={champClasse}
          />
        </div>

        {!isEdition && (
          <SelecteurPhotos ref={photosRef} disabled={isPending || envoiPhotos} />
        )}
        {photosSlot}
      </div>

      {/* Propriétaire + contact secondaire : à la création seulement. */}
      {!isEdition && (
        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <ChampsContactsBien defauts={prefill} />
        </div>
      )}

      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      {erreurPhotos && (
        <p role="alert" className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          {erreurPhotos}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || envoiPhotos}
        className="w-full rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
      >
        {envoiPhotos
          ? "Envoi des photos…"
          : isPending
            ? "Enregistrement…"
            : isEdition
              ? "Enregistrer les modifications"
              : "Enregistrer le bien"}
      </button>
    </form>
  );
}
