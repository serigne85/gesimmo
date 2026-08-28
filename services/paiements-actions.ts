"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import { recalculerStatutEcheance } from "@/services/paiements";
import { creerPaiementSchema } from "@/lib/validation/paiement";

export type PaiementState = { error: string | null };

/**
 * Enregistre un paiement sur une échéance, puis recalcule le statut de
 * l'échéance (payé / partiel / impayé) — jamais saisi à la main. Le bail et
 * l'agence sont déduits de l'échéance ; l'encaisseur est l'utilisateur connecté.
 */
export async function enregistrerPaiement(
  echeanceId: string,
  _prevState: PaiementState,
  formData: FormData
): Promise<PaiementState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = creerPaiementSchema.safeParse({
    montant: formData.get("montant"),
    datePaiement: formData.get("datePaiement"),
    mode: formData.get("mode"),
    referenceTransaction: formData.get("referenceTransaction") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const d = parsed.data;
  const supabase = await createClient();

  // L'échéance appartient-elle à l'agence ? (RLS) On récupère le bail.
  const { data: echeance } = await supabase
    .from("echeances_loyer")
    .select("id, bail_id")
    .eq("id", echeanceId)
    .maybeSingle();

  if (!echeance) return { error: "Échéance introuvable." };

  const { error } = await supabase.from("paiements").insert({
    agence_id: profil.agenceId,
    echeance_id: echeance.id,
    bail_id: echeance.bail_id,
    montant: d.montant,
    date_paiement: d.datePaiement,
    mode: d.mode,
    reference_transaction: d.referenceTransaction ?? null,
    note: d.note ?? null,
    encaisse_par: profil.id,
  });

  if (error) return { error: "Enregistrement du paiement impossible." };

  await recalculerStatutEcheance(supabase, echeance.id);

  revalidatePath(`/gestion-locative/echeance/${echeance.id}`);
  revalidatePath(`/gestion-locative/${echeance.bail_id}`);
  redirect(`/gestion-locative/echeance/${echeance.id}`);
}

/**
 * Annule (suppression logique) un paiement, puis recalcule le statut de son
 * échéance. Jamais de DELETE physique (CLAUDE.md).
 */
export async function supprimerPaiement(
  paiementId: string,
  _prevState: PaiementState,
  _formData: FormData
): Promise<PaiementState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const supabase = await createClient();

  const { data: paiement } = await supabase
    .from("paiements")
    .select("id, echeance_id")
    .eq("id", paiementId)
    .is("supprime_le", null)
    .maybeSingle();

  if (!paiement) return { error: "Paiement introuvable." };

  const { error } = await supabase
    .from("paiements")
    .update({ supprime_le: new Date().toISOString() })
    .eq("id", paiementId)
    .is("supprime_le", null);

  if (error) return { error: "Annulation du paiement impossible." };

  await recalculerStatutEcheance(supabase, paiement.echeance_id);

  revalidatePath(`/gestion-locative/echeance/${paiement.echeance_id}`);
  redirect(`/gestion-locative/echeance/${paiement.echeance_id}`);
}
