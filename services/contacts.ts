import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type {
  ContactUnifie,
  ContactDetail,
  ContactIdentite,
  DesignationContact,
  BienLieContact,
  BailLieContact,
  DemandeLieeContact,
  MiseEnRelationLieeContact,
} from "@/types/contact";
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
    { data: demandes, error: eD },
    { data: partenaires, error: eP },
    { data: prospections, error: ePr },
  ] = await Promise.all([
    supabase.from("contacts").select("id, nom_complet, telephone").is("supprime_le", null),
    supabase.from("biens").select("proprietaire_id, contact_id").is("supprime_le", null),
    supabase.from("baux").select("locataire_id").is("supprime_le", null),
    supabase.from("demandes").select("contact_id").is("supprime_le", null),
    supabase.from("partenaires").select("nom, telephone").is("supprime_le", null),
    supabase.from("prospections").select("nom_complet, telephone").is("supprime_le", null),
  ]);

  const erreur = eC || eB || eBa || eD || eP || ePr;
  if (erreur) {
    throw new Error(`Lecture de l'annuaire impossible : ${erreur.message}`);
  }

  // Ensembles d'ids pour déduire les désignations des contacts.
  const proprietaires = new Set<string>();
  const associes = new Set<string>();
  const locataires = new Set<string>();
  const demandeurs = new Set<string>();
  (biens ?? []).forEach((b) => {
    if (b.proprietaire_id) proprietaires.add(b.proprietaire_id as string);
    if (b.contact_id) associes.add(b.contact_id as string);
  });
  (baux ?? []).forEach((b) => {
    if (b.locataire_id) locataires.add(b.locataire_id as string);
  });
  (demandes ?? []).forEach((d) => {
    if (d.contact_id) demandeurs.add(d.contact_id as string);
  });

  const parCle = new Map<string, ContactUnifie>();

  /** Ajoute/fusionne une entrée par clé téléphone. */
  function fusionner(
    nom: string,
    telephone: string,
    designations: DesignationContact[],
    href: string | null,
    contactId: string | null
  ) {
    const cle = cleTelephone(telephone) || `nom:${nom.toLowerCase()}`;
    const existant = parCle.get(cle);
    if (existant) {
      for (const d of designations) {
        if (!existant.designations.includes(d)) existant.designations.push(d);
      }
      if (!existant.href && href) existant.href = href;
      if (!existant.contactId && contactId) existant.contactId = contactId;
      if (!existant.nomComplet && nom) existant.nomComplet = nom;
    } else {
      parCle.set(cle, {
        cle,
        nomComplet: nom,
        telephone,
        designations: [...designations],
        contactId,
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
    if (demandeurs.has(id)) d.push("demandeur");
    fusionner(c.nom_complet as string, c.telephone as string, d, null, id);
  });

  // Partenaires et prospects (tables dédiées).
  (partenaires ?? []).forEach((p) =>
    fusionner(p.nom as string, (p.telephone as string) ?? "", ["partenaire"], null, null)
  );
  (prospections ?? []).forEach((p) =>
    fusionner(p.nom_complet as string, p.telephone as string, ["prospect"], null, null)
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

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/**
 * Fiche détail d'un contact (entité de la table `contacts`) : ses biens (comme
 * propriétaire et comme contact associé), ses baux (comme locataire) et les
 * mises en relation nées de ses demandes. Renvoie null si absent, supprimé, ou
 * hors agence (RLS). Les désignations sont déduites des relations trouvées.
 */
export async function getContactDetail(
  id: string
): Promise<ContactDetail | null> {
  const supabase = await createClient();

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("id, nom_complet, telephone, cree_le, date_naissance, lieu_naissance, cni")
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (error) throw new Error(`Lecture du contact impossible : ${error.message}`);
  if (!contact) return null;

  // Demandes du contact (comme demandeur) → sert aussi à retrouver ses mises en
  // relation.
  const { data: demandes } = await supabase
    .from("demandes")
    .select("id, objectif, statut")
    .eq("contact_id", id)
    .is("supprime_le", null)
    .order("cree_le", { ascending: false });
  const demandeIds = (demandes ?? []).map((d) => d.id as string);
  const demandesLiees: DemandeLieeContact[] = (demandes ?? []).map((d) => ({
    id: d.id as string,
    objectif: d.objectif as string,
    statut: d.statut as string,
  }));

  const [
    { data: biensProp },
    { data: biensAsso },
    { data: baux },
    mer,
  ] = await Promise.all([
    supabase
      .from("biens")
      .select("id, reference, titre, statut")
      .eq("proprietaire_id", id)
      .is("supprime_le", null)
      .order("reference", { ascending: true }),
    supabase
      .from("biens")
      .select("id, reference, titre, statut")
      .eq("contact_id", id)
      .is("supprime_le", null)
      .order("reference", { ascending: true }),
    supabase
      .from("baux")
      .select("id, reference, loyer_mensuel, statut, bien:biens(reference)")
      .eq("locataire_id", id)
      .is("supprime_le", null)
      .order("reference", { ascending: true }),
    demandeIds.length > 0
      ? supabase
          .from("mises_en_relation")
          .select("id, statut, partenaire:partenaires(nom)")
          .in("demande_id", demandeIds)
          .is("supprime_le", null)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const versBien = (rows: Record<string, unknown>[] | null): BienLieContact[] =>
    (rows ?? []).map((b) => ({
      id: b.id as string,
      reference: b.reference as string,
      titre: (b.titre as string | null) ?? null,
      statut: b.statut as string,
    }));

  const biensProprietaire = versBien(biensProp as Record<string, unknown>[] | null);
  const biensAssocie = versBien(biensAsso as Record<string, unknown>[] | null);

  const bauxLies: BailLieContact[] = (
    (baux ?? []) as unknown as Record<string, unknown>[]
  ).map((b) => {
    const bien = premier(
      b.bien as Record<string, unknown> | Record<string, unknown>[] | null
    );
    return {
      id: b.id as string,
      reference: b.reference as string,
      bienReference: (bien?.reference as string | null) ?? null,
      loyerMensuel: (b.loyer_mensuel as number) ?? 0,
      statut: b.statut as string,
    };
  });

  const misesEnRelation: MiseEnRelationLieeContact[] = (
    ((mer.data ?? []) as unknown as Record<string, unknown>[])
  ).map((m) => {
    const partenaire = premier(
      m.partenaire as Record<string, unknown> | Record<string, unknown>[] | null
    );
    return {
      id: m.id as string,
      statut: m.statut as string,
      partenaireNom: (partenaire?.nom as string) ?? "",
    };
  });

  const designations: DesignationContact[] = [];
  if (biensProprietaire.length > 0) designations.push("proprietaire");
  if (biensAssocie.length > 0) designations.push("contact_associe");
  if (bauxLies.length > 0) designations.push("locataire");
  if (demandesLiees.length > 0) designations.push("demandeur");
  if (designations.length === 0) designations.push("contact");

  return {
    id: contact.id as string,
    nomComplet: contact.nom_complet as string,
    telephone: contact.telephone as string,
    creeLe: contact.cree_le as string,
    dateNaissance: (contact.date_naissance as string | null) ?? null,
    lieuNaissance: (contact.lieu_naissance as string | null) ?? null,
    cni: (contact.cni as string | null) ?? null,
    designations,
    biensProprietaire,
    biensAssocie,
    baux: bauxLies,
    demandes: demandesLiees,
    misesEnRelation,
  };
}

/**
 * Identité civile d'un contact, pour pré-remplir le formulaire d'édition.
 * RLS : cloisonné à l'agence.
 */
export async function getContactIdentite(
  id: string
): Promise<ContactIdentite | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, nom_complet, telephone, date_naissance, lieu_naissance, cni")
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (error) throw new Error(`Lecture du contact impossible : ${error.message}`);
  if (!data) return null;

  return {
    id: data.id as string,
    nomComplet: data.nom_complet as string,
    telephone: data.telephone as string,
    dateNaissance: (data.date_naissance as string | null) ?? null,
    lieuNaissance: (data.lieu_naissance as string | null) ?? null,
    cni: (data.cni as string | null) ?? null,
  };
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
