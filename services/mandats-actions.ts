"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import { creerMandatSchema } from "@/lib/validation/mandat";

export type CreerMandatState = { error: string | null };

/**
 * Crée un mandat pour un bien de l'agence.
 * Étapes : contrôle d'accès → validation → contrôles métier (le bien existe,
 * et un mandat de vente exige un statut juridique renseigné) → référence unique
 * → insertion. Le mandant est le propriétaire du bien. Le mandat naît en
 * `brouillon` ; il avancera dans son cycle via les transitions (étape suivante).
 */
export async function creerMandat(
  _prevState: CreerMandatState,
  formData: FormData
): Promise<CreerMandatState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = creerMandatSchema.safeParse({
    bienId: formData.get("bienId"),
    type: formData.get("type"),
    exclusif: formData.get("exclusif") === "on",
    dateDebut: formData.get("dateDebut") || undefined,
    dateFin: formData.get("dateFin") || undefined,
    commissionValeur: formData.get("commissionValeur") || undefined,
    commissionUnite: formData.get("commissionUnite") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const d = parsed.data;
  const supabase = await createClient();

  // Le bien appartient-il à l'agence ? (RLS) On récupère aussi de quoi appliquer
  // les règles métier : propriétaire (= mandant) et statut juridique.
  const { data: bien } = await supabase
    .from("biens")
    .select("id, proprietaire_id, statut_juridique")
    .eq("id", d.bienId)
    .is("supprime_le", null)
    .maybeSingle();

  if (!bien) return { error: "Bien introuvable." };

  // Règle CLAUDE.md : pas de mandat de vente sans statut juridique du bien.
  if (d.type === "vente" && !bien.statut_juridique) {
    return {
      error:
        "Statut juridique du bien requis pour un mandat de vente. Renseignez-le d'abord sur la fiche du bien.",
    };
  }

  // Cohérence de la rémunération : valeur et unité vont de pair.
  if ((d.commissionValeur !== null) !== !!d.commissionUnite) {
    return { error: "Rémunération incomplète : indiquez une valeur ET une unité." };
  }

  // Référence unique. On part du nombre de mandats existants et on réessaie en
  // cas de collision (une référence peut être occupée par un mandat supprimé,
  // invisible via la RLS).
  const { count } = await supabase
    .from("mandats")
    .select("id", { count: "exact", head: true });
  const base = (count ?? 0) + 1;
  const annee = new Date().getFullYear();

  let cree = false;
  for (let i = 0; i < 6 && !cree; i++) {
    const reference = `MN-${annee}-${String(base + i).padStart(4, "0")}`;
    const { error } = await supabase.from("mandats").insert({
      agence_id: profil.agenceId,
      reference,
      bien_id: bien.id,
      mandant_id: bien.proprietaire_id,
      type: d.type,
      exclusif: d.exclusif,
      date_debut: d.dateDebut || null,
      date_fin: d.dateFin || null,
      commission_valeur: d.commissionValeur,
      commission_unite: d.commissionUnite ?? null,
      notes: d.notes ?? null,
    });

    if (!error) {
      cree = true;
    } else if (error.code !== "23505") {
      return { error: "Enregistrement du mandat impossible." };
    }
  }

  if (!cree) return { error: "Génération de la référence impossible." };

  revalidatePath("/mandats");
  redirect("/mandats");
}
