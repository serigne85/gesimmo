import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { ContactUnifie, DesignationContact } from "@/types/contact";
import { DESIGNATIONS_CONTACT } from "@/types/contact";

/** Option légère d'un contact pour un sélecteur. */
export type ContactOption = { id: string; nomComplet: string; telephone: string };

/**
 * Contacts de l'agence, forme légère pour un sélecteur (rendez-vous, etc.).
 * RLS : cloisonné automatiquement à l'agence de l'utilisateur.
 */
export async function listContactsOptions(): Promise<ContactOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, nom_complet, telephone")
    .is("supprime_le", null)
    .order("nom_complet", { ascending: true });

  if (error) throw new Error(`Lecture des contacts impossible : ${error.message}`);

  return (data ?? []).map((c) => ({
    id: c.id as string,
    nomComplet: c.nom_complet as string,
    telephone: c.telephone as string,
  }));
}

/** Clé de rapprochement : les seuls chiffres du téléphone. */
function cleTelephone(telephone: string): string {
  return telephone.replace(/\D/g, "");
}

/**
 * Annuaire UNIFIÉ de tous les contacts de l'agence, toutes sources confondues :
 *  - table `contacts` (propriétaires, contacts associés, locataires…),
 *  - table `partenaires`, table `prospections`.
 * Les désignations se déduisent des relations (pas de table contact_roles) et
 * les entrées sont fusionnées par téléphone (une même personne = une ligne,
 * avec toutes ses désignations). RLS : chaque source est cloisonnée à l'agence.
 */
export async function listContactsUnifies(): Promise<ContactUnifie[]> {
  const supabase = await createClient();

  const [
    { data: contacts, error: eC },
    { data: biens, error: eB },
    { data: baux, error: eBa },
    { data: partenaires, error: eP },
    { data: prospections, error: ePr },
  ] = await Promise.all([
    supabase.from("contacts").select("id, nom_complet, telephone").is("supprime_le", null),
    supabase.from("biens").select("proprietaire_id, contact_id").is("supprime_le", null),
    supabase.from("baux").select("locataire_id").is("supprime_le", null),
    supabase.from("partenaires").select("nom, telephone").is("supprime_le", null),
    supabase.from("prospections").select("nom_complet, telephone").is("supprime_le", null),
  ]);

  const erreur = eC || eB || eBa || eP || ePr;
  if (erreur) {
    throw new Error(`Lecture de l'annuaire impossible : ${erreur.message}`);
  }

  // Ensembles d'ids pour déduire les désignations des contacts.
  const proprietaires = new Set<string>();
  const associes = new Set<string>();
  const locataires = new Set<string>();
  (biens ?? []).forEach((b) => {
    if (b.proprietaire_id) proprietaires.add(b.proprietaire_id as string);
    if (b.contact_id) associes.add(b.contact_id as string);
  });
  (baux ?? []).forEach((b) => {
    if (b.locataire_id) locataires.add(b.locataire_id as string);
  });

  const parCle = new Map<string, ContactUnifie>();

  /** Ajoute/fusionne une entrée par clé téléphone. */
  function fusionner(
    nom: string,
    telephone: string,
    designations: DesignationContact[],
    href: string | null
  ) {
    const cle = cleTelephone(telephone) || `nom:${nom.toLowerCase()}`;
    const existant = parCle.get(cle);
    if (existant) {
      for (const d of designations) {
        if (!existant.designations.includes(d)) existant.designations.push(d);
      }
      if (!existant.href && href) existant.href = href;
      if (!existant.nomComplet && nom) existant.nomComplet = nom;
    } else {
      parCle.set(cle, {
        cle,
        nomComplet: nom,
        telephone,
        designations: [...designations],
        href,
      });
    }
  }

  // Contacts : désignations déduites (peut être vide → repli plus bas).
  (contacts ?? []).forEach((c) => {
    const id = c.id as string;
    const d: DesignationContact[] = [];
    if (proprietaires.has(id)) d.push("proprietaire");
    if (associes.has(id)) d.push("contact_associe");
    if (locataires.has(id)) d.push("locataire");
    fusionner(c.nom_complet as string, c.telephone as string, d, null);
  });

  // Partenaires et prospects (tables dédiées).
  (partenaires ?? []).forEach((p) =>
    fusionner(p.nom as string, (p.telephone as string) ?? "", ["partenaire"], null)
  );
  (prospections ?? []).forEach((p) =>
    fusionner(p.nom_complet as string, p.telephone as string, ["prospect"], null)
  );

  // Repli « contact » pour les entrées sans aucune désignation, puis tri des
  // désignations dans l'ordre d'affichage et tri des lignes par nom.
  const rang = (d: DesignationContact) => DESIGNATIONS_CONTACT.indexOf(d);
  const lignes = Array.from(parCle.values()).map((e) => {
    if (e.designations.length === 0) e.designations.push("contact");
    e.designations.sort((a, b) => rang(a) - rang(b));
    return e;
  });
  lignes.sort((a, b) => a.nomComplet.localeCompare(b.nomComplet, "fr"));
  return lignes;
}

/**
 * Trouve un contact par téléphone dans l'agence, ou le crée s'il n'existe pas.
 * Le téléphone est la clé naturelle (CLAUDE.md) : deux biens du même
 * propriétaire pointent vers le même contact.
 *
 * On reçoit le client Supabase de session (RLS active) : la recherche et la
 * création restent cloisonnées à l'agence de l'utilisateur.
 */
export async function trouverOuCreerContact(
  supabase: SupabaseClient,
  agenceId: string,
  nomComplet: string,
  telephone: string
): Promise<string> {
  const { data: existant } = await supabase
    .from("contacts")
    .select("id")
    .eq("telephone", telephone)
    .is("supprime_le", null)
    .maybeSingle();

  if (existant) return existant.id;

  const { data: cree, error } = await supabase
    .from("contacts")
    .insert({ agence_id: agenceId, nom_complet: nomComplet, telephone })
    .select("id")
    .single();

  if (error) {
    // Course entre deux créations simultanées : le doublon a été inséré
    // entre-temps, on relit et on renvoie l'existant.
    if (error.code === "23505") {
      const { data: retrouve } = await supabase
        .from("contacts")
        .select("id")
        .eq("telephone", telephone)
        .is("supprime_le", null)
        .single();
      if (retrouve) return retrouve.id;
    }
    throw new Error(`Création du contact impossible : ${error.message}`);
  }

  return cree.id;
}
