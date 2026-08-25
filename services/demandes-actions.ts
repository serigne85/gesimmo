"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import { trouverOuCreerContact } from "@/services/contacts";
import { creerDemandeSchema } from "@/lib/validation/demande";

export type CreerDemandeState = { error: string | null };

/**
 * Crée une demande client.
 * Étapes : contrôle d'accès → validation → trouver/créer le client (par
 * téléphone) → insérer la demande → insérer les zones et types choisis.
 * Les liaisons sont écrites après la demande (supabase-js n'ouvre pas de
 * transaction multi-requêtes) : si elles échouaient, la demande existe déjà et
 * reste complétable depuis sa fiche.
 */
export async function creerDemande(
  _prevState: CreerDemandeState,
  formData: FormData
): Promise<CreerDemandeState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = creerDemandeSchema.safeParse({
    clientNom: formData.get("clientNom"),
    clientTelephone: formData.get("clientTelephone"),
    objectif: formData.get("objectif"),
    zoneIds: formData.getAll("zoneIds"),
    types: formData.getAll("types"),
    budgetMin: formData.get("budgetMin") || undefined,
    budgetMax: formData.get("budgetMax") || undefined,
    nombreChambresMin: formData.get("nombreChambresMin") || undefined,
    surfaceMin: formData.get("surfaceMin") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const d = parsed.data;

  // Cohérence des budgets.
  if (d.budgetMin !== null && d.budgetMax !== null && d.budgetMin > d.budgetMax) {
    return { error: "Le budget minimum dépasse le budget maximum." };
  }

  const supabase = await createClient();

  // 1. Client (trouver ou créer par téléphone).
  let clientId: string;
  try {
    clientId = await trouverOuCreerContact(
      supabase,
      profil.agenceId,
      d.clientNom,
      d.clientTelephone
    );
  } catch {
    return { error: "Enregistrement du client impossible." };
  }

  // 2. Demande.
  const { data: demande, error: insErr } = await supabase
    .from("demandes")
    .insert({
      agence_id: profil.agenceId,
      contact_id: clientId,
      objectif: d.objectif,
      budget_min: d.budgetMin,
      budget_max: d.budgetMax,
      nombre_chambres_min: d.nombreChambresMin,
      surface_min: d.surfaceMin,
      notes: d.notes ?? null,
    })
    .select("id")
    .single();

  if (insErr || !demande) return { error: "Enregistrement de la demande impossible." };

  // 3. Zones ciblées et types recherchés (liaisons).
  if (d.zoneIds.length > 0) {
    const { error } = await supabase.from("demande_zones").insert(
      d.zoneIds.map((zoneId) => ({
        agence_id: profil.agenceId,
        demande_id: demande.id,
        zone_id: zoneId,
      }))
    );
    if (error) return { error: "Enregistrement des zones impossible." };
  }

  if (d.types.length > 0) {
    const { error } = await supabase.from("demande_types").insert(
      d.types.map((type) => ({
        agence_id: profil.agenceId,
        demande_id: demande.id,
        type,
      }))
    );
    if (error) return { error: "Enregistrement des types impossible." };
  }

  revalidatePath("/demandes");
  redirect("/demandes");
}
