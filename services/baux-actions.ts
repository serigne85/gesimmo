"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import { trouverOuCreerContact } from "@/services/contacts";
import { creerBailSchema, modifierBailSchema } from "@/lib/validation/bail";
import { transitionAutorisee } from "@/services/statuts-bail";
import { genererEcheances } from "@/services/echeances";
import type { StatutBail } from "@/types/bail";

export type CreerBailState = { error: string | null };

// Statuts de bien qui interdisent un nouveau bail (déjà loué, vendu, archivé).
const STATUTS_BIEN_EXCLUS = ["loue", "vendu", "archive"];

/**
 * Crée un bail pour un bien de l'agence.
 * Étapes : contrôle d'accès → validation → contrôles métier (le bien existe, est
 * en location et pas déjà loué/vendu/archivé) → locataire trouvé-ou-créé par
 * téléphone → référence unique BX-AAAA-0001 → insertion. Le bail naît en
 * `brouillon` ; il deviendra `actif` via les transitions (étape suivante).
 */
export async function creerBail(
  _prevState: CreerBailState,
  formData: FormData
): Promise<CreerBailState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = creerBailSchema.safeParse({
    bienId: formData.get("bienId"),
    locataireNom: formData.get("locataireNom"),
    locataireTelephone: formData.get("locataireTelephone"),
    dateDebut: formData.get("dateDebut") || undefined,
    dateFin: formData.get("dateFin") || undefined,
    loyerMensuel: formData.get("loyerMensuel"),
    chargesMensuelles: formData.get("chargesMensuelles") || undefined,
    cautionMois: formData.get("cautionMois") || undefined,
    jourEcheance: formData.get("jourEcheance") || undefined,
    modePaiement: formData.get("modePaiement") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const d = parsed.data;

  // Cohérence des dates si les deux sont fournies.
  if (d.dateDebut && d.dateFin && d.dateFin < d.dateDebut) {
    return { error: "La date de fin ne peut pas précéder la date de début." };
  }

  const supabase = await createClient();

  // Le bien appartient-il à l'agence ? (RLS) Est-il louable ?
  const { data: bien } = await supabase
    .from("biens")
    .select("id, objectif, statut")
    .eq("id", d.bienId)
    .is("supprime_le", null)
    .maybeSingle();

  if (!bien) return { error: "Bien introuvable." };
  if (bien.objectif !== "location") {
    return { error: "Ce bien n'est pas destiné à la location." };
  }
  if (STATUTS_BIEN_EXCLUS.includes(bien.statut)) {
    return { error: "Ce bien n'est pas disponible à la location (déjà loué, vendu ou archivé)." };
  }

  // Locataire : trouvé-ou-créé par téléphone (le téléphone est la clé naturelle).
  let locataireId: string;
  try {
    locataireId = await trouverOuCreerContact(
      supabase,
      profil.agenceId,
      d.locataireNom,
      d.locataireTelephone
    );
  } catch {
    return { error: "Enregistrement du locataire impossible." };
  }

  // Référence unique. On part du nombre de baux existants et on réessaie en cas
  // de collision (une référence peut être occupée par un bail supprimé, invisible
  // via la RLS).
  const { count } = await supabase
    .from("baux")
    .select("id", { count: "exact", head: true });
  const base = (count ?? 0) + 1;
  const annee = new Date().getFullYear();

  let cree = false;
  for (let i = 0; i < 6 && !cree; i++) {
    const reference = `BX-${annee}-${String(base + i).padStart(4, "0")}`;
    const { error } = await supabase.from("baux").insert({
      agence_id: profil.agenceId,
      reference,
      bien_id: bien.id,
      locataire_id: locataireId,
      date_debut: d.dateDebut || null,
      date_fin: d.dateFin || null,
      loyer_mensuel: d.loyerMensuel,
      charges_mensuelles: d.chargesMensuelles,
      caution_mois: d.cautionMois,
      jour_echeance: d.jourEcheance,
      mode_paiement: d.modePaiement ?? null,
      notes: d.notes ?? null,
    });

    if (!error) {
      cree = true;
    } else if (error.code !== "23505") {
      return { error: "Enregistrement du bail impossible." };
    }
  }

  if (!cree) return { error: "Génération de la référence impossible." };

  revalidatePath("/gestion-locative");
  redirect("/gestion-locative");
}

/**
 * Modifie les conditions d'un bail encore en brouillon (loyer, charges, caution,
 * échéance, mode, dates, notes). Interdit dès qu'il est activé : ses échéances
 * sont alors figées, changer le loyer les désynchroniserait. Le bien et le
 * locataire ne se modifient pas ici.
 */
export async function modifierBail(
  id: string,
  _prevState: CreerBailState,
  formData: FormData
): Promise<CreerBailState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const supabase = await createClient();

  const { data: bail } = await supabase
    .from("baux")
    .select("statut")
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (!bail) return { error: "Bail introuvable." };
  if (bail.statut !== "brouillon") {
    return {
      error:
        "Seul un bail en brouillon peut être modifié (ses échéances sont figées une fois activé).",
    };
  }

  const parsed = modifierBailSchema.safeParse({
    dateDebut: formData.get("dateDebut") || undefined,
    dateFin: formData.get("dateFin") || undefined,
    loyerMensuel: formData.get("loyerMensuel"),
    chargesMensuelles: formData.get("chargesMensuelles") || undefined,
    cautionMois: formData.get("cautionMois") || undefined,
    jourEcheance: formData.get("jourEcheance") || undefined,
    modePaiement: formData.get("modePaiement") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const d = parsed.data;
  if (d.dateDebut && d.dateFin && d.dateFin < d.dateDebut) {
    return { error: "La date de fin ne peut pas précéder la date de début." };
  }

  const { error } = await supabase
    .from("baux")
    .update({
      date_debut: d.dateDebut || null,
      date_fin: d.dateFin || null,
      loyer_mensuel: d.loyerMensuel,
      charges_mensuelles: d.chargesMensuelles,
      caution_mois: d.cautionMois,
      jour_echeance: d.jourEcheance,
      mode_paiement: d.modePaiement ?? null,
      notes: d.notes ?? null,
    })
    .eq("id", id)
    .is("supprime_le", null);

  if (error) return { error: "Modification du bail impossible." };

  revalidatePath("/gestion-locative");
  revalidatePath(`/gestion-locative/${id}`);
  redirect(`/gestion-locative/${id}`);
}

// Statuts de bien qui empêchent l'activation d'un bail (rien à louer).
const STATUTS_BIEN_NON_LOUABLES = ["vendu", "archive"];

/**
 * Fait évoluer le statut d'un bail dans sa machine à états, et synchronise le
 * statut du bien :
 *  - activation (→ actif) : le bien passe à « loué ». On exige une date de début,
 *    et on interdit un second bail actif sur le même bien.
 *  - fin de bail (résiliation / expiration depuis « actif ») : le bien revient à
 *    « disponible » s'il était bien « loué ».
 * Contrôle serveur systématique : l'interface ne fait que proposer les cibles.
 */
export async function changerStatutBail(
  id: string,
  _prevState: CreerBailState,
  formData: FormData
): Promise<CreerBailState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const cible = formData.get("cible") as StatutBail;
  const supabase = await createClient();

  // Statut actuel + bien + champs nécessaires à la génération des échéances
  // (RLS : forcément dans l'agence).
  const { data: bail } = await supabase
    .from("baux")
    .select("statut, bien_id, date_debut, date_fin, loyer_mensuel, charges_mensuelles, jour_echeance")
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (!bail) return { error: "Bail introuvable." };

  const actuel = bail.statut as StatutBail;
  if (!transitionAutorisee(actuel, cible)) {
    return { error: "Transition de statut non autorisée." };
  }

  // --- Activation : contrôles et bascule du bien en « loué » ---
  if (cible === "actif") {
    if (!bail.date_debut) {
      return { error: "Renseignez une date de début avant d'activer le bail." };
    }

    const { data: bien } = await supabase
      .from("biens")
      .select("statut")
      .eq("id", bail.bien_id)
      .is("supprime_le", null)
      .maybeSingle();

    if (!bien) return { error: "Bien introuvable." };
    if (STATUTS_BIEN_NON_LOUABLES.includes(bien.statut)) {
      return { error: "Ce bien est vendu ou archivé : impossible d'activer le bail." };
    }

    // Un seul bail actif par bien.
    const { count } = await supabase
      .from("baux")
      .select("id", { count: "exact", head: true })
      .eq("bien_id", bail.bien_id)
      .eq("statut", "actif")
      .is("supprime_le", null)
      .neq("id", id);

    if ((count ?? 0) > 0) {
      return { error: "Ce bien a déjà un bail actif." };
    }

    const { error: eBien } = await supabase
      .from("biens")
      .update({ statut: "loue" })
      .eq("id", bail.bien_id)
      .is("supprime_le", null);
    if (eBien) return { error: "Mise à jour du statut du bien impossible." };
  }

  // --- Fin d'un bail actif : le bien redevient disponible s'il était loué ---
  if (actuel === "actif" && (cible === "resilie" || cible === "expire")) {
    await supabase
      .from("biens")
      .update({ statut: "disponible" })
      .eq("id", bail.bien_id)
      .eq("statut", "loue")
      .is("supprime_le", null);
  }

  const { error } = await supabase
    .from("baux")
    .update({ statut: cible })
    .eq("id", id)
    .is("supprime_le", null);

  if (error) return { error: "Changement de statut impossible." };

  // À l'activation, on génère les échéances de loyer (idempotent : réactiver ne
  // duplique pas). date_debut est garanti non nul par le contrôle plus haut.
  if (cible === "actif") {
    await genererEcheances(supabase, profil.agenceId, {
      id,
      dateDebut: bail.date_debut as string,
      dateFin: (bail.date_fin as string | null) ?? null,
      loyerMensuel: bail.loyer_mensuel as number,
      chargesMensuelles: bail.charges_mensuelles as number,
      jourEcheance: bail.jour_echeance as number,
    });
  }

  revalidatePath("/gestion-locative");
  revalidatePath(`/gestion-locative/${id}`);
  redirect(`/gestion-locative/${id}`);
}
