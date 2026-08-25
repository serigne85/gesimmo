"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUtilisateurConnecte } from "@/services/auth";
import { trouverOuCreerContact } from "@/services/contacts";
import {
  creerDemandeSchema,
  modifierDemandeSchema,
} from "@/lib/validation/demande";

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
    dateDemande: formData.get("dateDemande") || undefined,
    dateEcheance: formData.get("dateEcheance") || undefined,
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
  // Date de la demande : celle saisie, sinon aujourd'hui (Africa/Dakar).
  const aujourdhui = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Dakar",
  });

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
      date_demande: d.dateDemande || aujourdhui,
      date_echeance: d.dateEcheance || null,
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

/**
 * Modifie une demande (hors client, non modifiable ici) : critères, dates,
 * statut, plus resynchronisation des zones et types. La mise à jour passe par le
 * client admin RESTREINT à l'agence (l'UPDATE `authenticated` sur `demandes` est
 * bloqué sur cette base) ; la propriété de la demande est vérifiée d'abord via
 * le client de session (RLS).
 */
export async function modifierDemande(
  id: string,
  _prevState: CreerDemandeState,
  formData: FormData
): Promise<CreerDemandeState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = modifierDemandeSchema.safeParse({
    objectif: formData.get("objectif"),
    statut: formData.get("statut"),
    zoneIds: formData.getAll("zoneIds"),
    types: formData.getAll("types"),
    budgetMin: formData.get("budgetMin") || undefined,
    budgetMax: formData.get("budgetMax") || undefined,
    nombreChambresMin: formData.get("nombreChambresMin") || undefined,
    surfaceMin: formData.get("surfaceMin") || undefined,
    dateDemande: formData.get("dateDemande") || undefined,
    dateEcheance: formData.get("dateEcheance") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const d = parsed.data;
  if (d.budgetMin !== null && d.budgetMax !== null && d.budgetMin > d.budgetMax) {
    return { error: "Le budget minimum dépasse le budget maximum." };
  }

  const supabase = await createClient();

  // La demande appartient-elle à l'agence de l'utilisateur ? (RLS)
  const { data: existante } = await supabase
    .from("demandes")
    .select("id")
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();
  if (!existante) return { error: "Demande introuvable." };

  const admin = createAdminClient();

  const { error: majErr } = await admin
    .from("demandes")
    .update({
      objectif: d.objectif,
      statut: d.statut,
      budget_min: d.budgetMin,
      budget_max: d.budgetMax,
      nombre_chambres_min: d.nombreChambresMin,
      surface_min: d.surfaceMin,
      date_demande: d.dateDemande || undefined,
      date_echeance: d.dateEcheance || null,
      notes: d.notes ?? null,
    })
    .eq("id", id)
    .eq("agence_id", profil.agenceId);

  if (majErr) {
    console.error("modifierDemande:", majErr);
    return { error: "Modification de la demande impossible." };
  }

  // Resynchronisation des zones et types : on repart d'une table propre.
  await admin.from("demande_zones").delete().eq("demande_id", id).eq("agence_id", profil.agenceId);
  await admin.from("demande_types").delete().eq("demande_id", id).eq("agence_id", profil.agenceId);

  if (d.zoneIds.length > 0) {
    await admin.from("demande_zones").insert(
      d.zoneIds.map((zoneId) => ({
        agence_id: profil.agenceId,
        demande_id: id,
        zone_id: zoneId,
      }))
    );
  }
  if (d.types.length > 0) {
    await admin.from("demande_types").insert(
      d.types.map((type) => ({
        agence_id: profil.agenceId,
        demande_id: id,
        type,
      }))
    );
  }

  revalidatePath("/demandes");
  revalidatePath(`/demandes/${id}`);
  redirect(`/demandes/${id}`);
}

export type SupprimerDemandesState = { error: string | null };

/**
 * Suppression LOGIQUE de demandes (marque `supprime_le`), jamais de DELETE
 * physique (CLAUDE.md). Réservée à l'admin : contrôle côté serveur, la vraie
 * barrière. La RLS garantit qu'on n'agit que sur les demandes de son agence.
 */
export async function supprimerDemandes(
  ids: string[]
): Promise<SupprimerDemandesState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };
  if (profil.role !== "admin") {
    return { error: "Suppression réservée à l'administrateur." };
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return { error: "Aucune demande sélectionnée." };
  }

  // Écriture privilégiée via service_role (contourne la RLS) : on RESTREINT donc
  // explicitement à l'agence de l'admin pour ne jamais toucher une autre agence.
  const admin = createAdminClient();
  const { error } = await admin
    .from("demandes")
    .update({ supprime_le: new Date().toISOString() })
    .in("id", ids)
    .eq("agence_id", profil.agenceId)
    .is("supprime_le", null);

  if (error) {
    console.error("supprimerDemandes:", error);
    return { error: "Suppression impossible." };
  }

  revalidatePath("/demandes");
  return { error: null };
}
