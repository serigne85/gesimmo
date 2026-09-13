"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import { creerReversementSchema } from "@/lib/validation/reversement";
import { montantReverse } from "@/types/reversement";

export type ReversementState = { error: string | null };

/**
 * Enregistre le reversement d'un propriétaire pour un mois (grain courant, cf.
 * 0033). `montantLoyer` et `commission` sont les totaux du mois. Le net reversé
 * = loyer − commission. Un seul reversement vivant par propriétaire et par mois
 * (index unique) : un doublon renvoie un message clair.
 */
export async function creerReversementProprietaire(
  proprietaireId: string,
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

  // Le propriétaire doit exister dans l'agence (RLS : cloisonné).
  const { data: proprio } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", proprietaireId)
    .is("supprime_le", null)
    .maybeSingle();
  if (!proprio) return { error: "Propriétaire introuvable." };

  const { error } = await supabase.from("reversements").insert({
    agence_id: profil.agenceId,
    bail_id: null,
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

  if (error) {
    // 23505 = violation d'unicité (déjà reversé ce mois-ci).
    if (error.code === "23505") {
      return { error: "Un reversement existe déjà pour ce propriétaire ce mois-ci." };
    }
    return { error: "Enregistrement du reversement impossible." };
  }

  revalidatePath("/paiements/proprietaires");
  redirect(`/paiements/proprietaires?mois=${d.periode}`);
}

/** Annule (suppression logique) le reversement d'un propriétaire. */
export async function supprimerReversementProprietaire(
  id: string,
  mois: string,
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

  revalidatePath("/paiements/proprietaires");
  redirect(`/paiements/proprietaires?mois=${mois}`);
}
