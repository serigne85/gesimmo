"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import { creerReversementSchema } from "@/lib/validation/reversement";
import { montantReverse } from "@/types/reversement";

export type ReversementState = { error: string | null };

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/**
 * Enregistre un reversement de loyer au propriétaire pour un bail et un mois.
 * Le propriétaire est celui du bien ; le net reversé = loyer − commission.
 */
export async function creerReversement(
  bailId: string,
  _prevState: ReversementState,
  formData: FormData
): Promise<ReversementState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = creerReversementSchema.safeParse({
    periode: formData.get("periode"),
    montantLoyer: formData.get("montantLoyer"),
    commission: formData.get("commission") || undefined,
    dateReversement: formData.get("dateReversement"),
    mode: formData.get("mode"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const d = parsed.data;
  if (d.commission > d.montantLoyer) {
    return { error: "La commission ne peut pas dépasser le loyer encaissé." };
  }

  const supabase = await createClient();

  // Bail + propriétaire du bien (RLS : forcément dans l'agence).
  const { data: bail } = await supabase
    .from("baux")
    .select("id, biens(proprietaire_id)")
    .eq("id", bailId)
    .is("supprime_le", null)
    .maybeSingle();

  if (!bail) return { error: "Bail introuvable." };
  const bien = premier(
    (bail as Record<string, unknown>).biens as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | null
  );
  const proprietaireId = bien?.proprietaire_id as string | undefined;
  if (!proprietaireId) return { error: "Propriétaire du bien introuvable." };

  const { error } = await supabase.from("reversements").insert({
    agence_id: profil.agenceId,
    bail_id: bailId,
    proprietaire_id: proprietaireId,
    periode: `${d.periode}-01`,
    montant_loyer: d.montantLoyer,
    commission: d.commission,
    montant_reverse: montantReverse(d.montantLoyer, d.commission),
    date_reversement: d.dateReversement,
    mode: d.mode,
    note: d.note ?? null,
    cree_par: profil.id,
  });

  if (error) return { error: "Enregistrement du reversement impossible." };

  revalidatePath(`/gestion-locative/${bailId}`);
  redirect(`/gestion-locative/${bailId}`);
}

/** Annule (suppression logique) un reversement. */
export async function supprimerReversement(
  id: string,
  bailId: string,
  _prevState: ReversementState,
  _formData: FormData
): Promise<ReversementState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("reversements")
    .update({ supprime_le: new Date().toISOString() })
    .eq("id", id)
    .is("supprime_le", null);

  if (error) return { error: "Annulation du reversement impossible." };

  revalidatePath(`/gestion-locative/${bailId}`);
  redirect(`/gestion-locative/${bailId}`);
}
