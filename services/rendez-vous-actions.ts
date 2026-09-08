"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import {
  creerRendezVousSchema,
  modifierRendezVousSchema,
  changerStatutRdvSchema,
  compteRenduVisiteSchema,
} from "@/lib/validation/rendez-vous";

export type RendezVousState = { error: string | null };

/** datetime-local → ISO, ou null. */
function toIso(valeur: string | null): string | null {
  if (!valeur) return null;
  const d = new Date(valeur);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function champs(formData: FormData) {
  return {
    titre: formData.get("titre"),
    type: formData.get("type") || undefined,
    debut: formData.get("debut"),
    fin: formData.get("fin") || undefined,
    lieu: formData.get("lieu") || undefined,
    contactId: formData.get("contactId") || undefined,
    bienId: formData.get("bienId") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    notes: formData.get("notes") || undefined,
  };
}

/** Crée un rendez-vous (la visite est un type de rendez-vous). */
export async function creerRendezVous(
  _prevState: RendezVousState,
  formData: FormData
): Promise<RendezVousState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = creerRendezVousSchema.safeParse(champs(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const r = parsed.data;
  const debut = toIso(r.debut);
  if (!debut) return { error: "Date de début invalide." };
  const fin = toIso(r.fin);
  if (fin && fin < debut) return { error: "La fin précède le début." };

  const supabase = await createClient();
  const { data: rdv, error } = await supabase
    .from("rendez_vous")
    .insert({
      agence_id: profil.agenceId,
      titre: r.titre,
      type: r.type,
      debut,
      fin,
      lieu: r.lieu,
      contact_id: r.contactId,
      bien_id: r.bienId,
      assignee_id: r.assigneeId ?? profil.id,
      notes: r.notes,
      cree_par: profil.id,
    })
    .select("id")
    .single();

  if (error || !rdv) {
    console.error("creerRendezVous:", error);
    return { error: "Enregistrement du rendez-vous impossible." };
  }

  revalidatePath("/agenda");
  redirect(`/agenda/${rdv.id}`);
}

/** Modifie un rendez-vous (champs + statut). */
export async function modifierRendezVous(
  id: string,
  _prevState: RendezVousState,
  formData: FormData
): Promise<RendezVousState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = modifierRendezVousSchema.safeParse({
    ...champs(formData),
    statut: formData.get("statut"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const r = parsed.data;
  const debut = toIso(r.debut);
  if (!debut) return { error: "Date de début invalide." };
  const fin = toIso(r.fin);
  if (fin && fin < debut) return { error: "La fin précède le début." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("rendez_vous")
    .update({
      titre: r.titre,
      type: r.type,
      statut: r.statut,
      debut,
      fin,
      lieu: r.lieu,
      contact_id: r.contactId,
      bien_id: r.bienId,
      assignee_id: r.assigneeId,
      notes: r.notes,
    })
    .eq("id", id)
    .is("supprime_le", null);

  if (error) {
    console.error("modifierRendezVous:", error);
    return { error: "Modification du rendez-vous impossible." };
  }

  revalidatePath("/agenda");
  revalidatePath(`/agenda/${id}`);
  redirect(`/agenda/${id}`);
}

/** Change le statut d'un rendez-vous (action rapide). */
export async function changerStatutRdv(
  id: string,
  statut: string
): Promise<RendezVousState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = changerStatutRdvSchema.safeParse({ statut });
  if (!parsed.success) return { error: "Statut invalide." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("rendez_vous")
    .update({ statut: parsed.data.statut })
    .eq("id", id)
    .is("supprime_le", null);

  if (error) {
    console.error("changerStatutRdv:", error);
    return { error: "Changement de statut impossible." };
  }

  revalidatePath("/agenda");
  revalidatePath(`/agenda/${id}`);
  return { error: null };
}

/** Suppression LOGIQUE d'un rendez-vous. Réservée à l'admin. */
export async function supprimerRendezVous(
  id: string
): Promise<RendezVousState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };
  if (profil.role !== "admin") {
    return { error: "Suppression réservée à l'administrateur." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("rendez_vous")
    .update({ supprime_le: new Date().toISOString() })
    .eq("id", id)
    .is("supprime_le", null);

  if (error) {
    console.error("supprimerRendezVous:", error);
    return { error: "Suppression impossible." };
  }

  revalidatePath("/agenda");
  return { error: null };
}

/**
 * Enregistre (ou met à jour) le compte rendu d'une visite. Upsert sur
 * rendez_vous_id (une visite = un compte rendu). Passe aussi le rendez-vous à
 * « réalisé », puisqu'il a bien eu lieu.
 */
export async function enregistrerCompteRendu(
  rendezVousId: string,
  _prevState: RendezVousState,
  formData: FormData
): Promise<RendezVousState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = compteRenduVisiteSchema.safeParse({
    interesse: formData.get("interesse") || undefined,
    niveauInteret: formData.get("niveauInteret") || undefined,
    compteRendu: formData.get("compteRendu"),
    suiteADonner: formData.get("suiteADonner") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const c = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("comptes_rendus_visite").upsert(
    {
      agence_id: profil.agenceId,
      rendez_vous_id: rendezVousId,
      interesse: c.interesse,
      niveau_interet: c.niveauInteret,
      compte_rendu: c.compteRendu,
      suite_a_donner: c.suiteADonner,
      cree_par: profil.id,
      maj_le: new Date().toISOString(),
    },
    { onConflict: "rendez_vous_id" }
  );

  if (error) {
    console.error("enregistrerCompteRendu:", error);
    return { error: "Enregistrement du compte rendu impossible." };
  }

  // La visite a eu lieu → statut réalisé.
  await supabase
    .from("rendez_vous")
    .update({ statut: "realise" })
    .eq("id", rendezVousId)
    .is("supprime_le", null);

  revalidatePath(`/agenda/${rendezVousId}`);
  return { error: null };
}
