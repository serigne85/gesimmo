import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSuiviLoyers } from "@/services/suivi-loyers";
import { moisCourant } from "@/types/suivi";
import { STATUT_BIEN_LABELS } from "@/types/bien";
import type { TypeMandat } from "@/types/mandat";
import type { TypeRendezVous } from "@/types/rendez-vous";
import {
  ORDRE_STATUTS_PORTEFEUILLE,
  SEUIL_DORMANT_JOURS,
  HORIZON_EXPIRATION_JOURS,
  type CompteurStatut,
  type MandatExpirant,
  type RdvJour,
  type TableauDeBord,
} from "@/types/dashboard";

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/** Date du jour en Africa/Dakar au format AAAA-MM-JJ (UTC+0, pas de décalage). */
function aujourdhuiDakar(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Dakar" });
}

/** Décale une date AAAA-MM-JJ de `jours` jours (Dakar = UTC+0). */
function decalerJours(dateIso: string, jours: number): string {
  const base = new Date(`${dateIso}T00:00:00Z`).getTime();
  return new Date(base + jours * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Agrège le tableau de bord opérationnel de l'agence (RLS cloisonnée). Toutes
 * les requêtes partent en parallèle. Aucune écriture, aucune migration : on ne
 * fait que lire et compter des données déjà en base.
 */
export async function getTableauDeBord(): Promise<TableauDeBord> {
  const supabase = await createClient();
  const aujourdhui = aujourdhuiDakar();
  const mois = moisCourant();
  const seuilDormant = decalerJours(aujourdhui, -SEUIL_DORMANT_JOURS);
  const seuilDormantMs = new Date(`${seuilDormant}T00:00:00Z`).getTime();
  const horizonMandat = decalerJours(aujourdhui, HORIZON_EXPIRATION_JOURS);

  const [
    biensRes,
    mandatsRes,
    tachesRes,
    loyers,
    rdvRes,
    prospectionsRes,
  ] = await Promise.all([
    // Portefeuille : tous les biens vivants, réduits aux colonnes utiles.
    supabase
      .from("biens")
      .select("statut, cree_le")
      .is("supprime_le", null),
    // Mandats actifs expirant bientôt (ou déjà dépassés), les plus urgents d'abord.
    supabase
      .from("mandats")
      .select("id, reference, type, date_fin, biens(reference, titre)")
      .eq("statut", "actif")
      .not("date_fin", "is", null)
      .lte("date_fin", horizonMandat)
      .is("supprime_le", null)
      .order("date_fin", { ascending: true }),
    // Tâches en retard : non terminées et échéance passée (comptage seul).
    supabase
      .from("taches")
      .select("id", { count: "exact", head: true })
      .in("statut", ["a_faire", "en_cours"])
      .not("date_echeance", "is", null)
      .lt("date_echeance", aujourdhui)
      .is("supprime_le", null),
    // Loyers du mois : on réutilise le service de suivi (pas de duplication).
    getSuiviLoyers(mois),
    // Rendez-vous et visites du jour (bornes de journée en UTC = Dakar).
    supabase
      .from("rendez_vous")
      .select("id, titre, type, debut, contact:contacts(nom_complet), bien:biens(reference)")
      .gte("debut", `${aujourdhui}T00:00:00Z`)
      .lte("debut", `${aujourdhui}T23:59:59Z`)
      .not("statut", "in", "(annule,reporte)")
      .is("supprime_le", null)
      .order("debut", { ascending: true }),
    // Prospection terrain : statut + date de relance, agrégés en mémoire.
    supabase
      .from("prospections")
      .select("statut, date_relance")
      .is("supprime_le", null),
  ]);

  if (biensRes.error) {
    throw new Error(`Lecture des biens impossible : ${biensRes.error.message}`);
  }
  if (mandatsRes.error) {
    throw new Error(`Lecture des mandats impossible : ${mandatsRes.error.message}`);
  }
  if (tachesRes.error) {
    throw new Error(`Lecture des tâches impossible : ${tachesRes.error.message}`);
  }
  if (rdvRes.error) {
    throw new Error(`Lecture des rendez-vous impossible : ${rdvRes.error.message}`);
  }
  if (prospectionsRes.error) {
    throw new Error(`Lecture des prospections impossible : ${prospectionsRes.error.message}`);
  }

  // --- Portefeuille : comptage par statut + biens dormants ---
  const biens = (biensRes.data ?? []) as { statut: string; cree_le: string }[];
  const parStatut = new Map<string, number>();
  let biensDormants = 0;
  for (const b of biens) {
    parStatut.set(b.statut, (parStatut.get(b.statut) ?? 0) + 1);
    if (
      b.statut === "disponible" &&
      new Date(b.cree_le).getTime() < seuilDormantMs
    ) {
      biensDormants += 1;
    }
  }
  const compteurs: CompteurStatut[] = ORDRE_STATUTS_PORTEFEUILLE.map((statut) => ({
    statut,
    label: STATUT_BIEN_LABELS[statut],
    nombre: parStatut.get(statut) ?? 0,
  }));

  // --- Mandats expirant ---
  const mandatsExpirantListe: MandatExpirant[] = (
    (mandatsRes.data ?? []) as unknown as Record<string, unknown>[]
  ).map((m) => {
    const bien = premier(
      m.biens as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const dateFin = m.date_fin as string | null;
    const joursRestants = dateFin
      ? Math.round(
          (new Date(`${dateFin}T00:00:00Z`).getTime() -
            new Date(`${aujourdhui}T00:00:00Z`).getTime()) /
            86_400_000
        )
      : 0;
    return {
      id: m.id as string,
      reference: m.reference as string,
      type: m.type as TypeMandat,
      dateFin,
      joursRestants,
      bienReference: (bien?.reference as string) ?? "",
      bienTitre: (bien?.titre as string | null) ?? null,
    };
  });

  // --- Rendez-vous du jour ---
  const rdvAujourdhui: RdvJour[] = (
    (rdvRes.data ?? []) as unknown as Record<string, unknown>[]
  ).map((r) => {
    const contact = premier(
      r.contact as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const bien = premier(
      r.bien as Record<string, unknown> | Record<string, unknown>[] | null
    );
    return {
      id: r.id as string,
      titre: r.titre as string,
      type: r.type as TypeRendezVous,
      debut: r.debut as string,
      contactNom: (contact?.nom_complet as string | null) ?? null,
      bienReference: (bien?.reference as string | null) ?? null,
    };
  });

  // --- Prospection ---
  const prospections = (prospectionsRes.data ?? []) as {
    statut: string;
    date_relance: string | null;
  }[];
  let prospectsARelancer = 0;
  let prospectsDisponibles = 0;
  for (const p of prospections) {
    if (p.statut === "disponible") prospectsDisponibles += 1;
    if (p.statut === "a_relancer" && p.date_relance && p.date_relance <= aujourdhui) {
      prospectsARelancer += 1;
    }
  }

  return {
    portefeuille: {
      total: biens.length,
      compteurs,
    },
    alertes: {
      biensDormants,
      mandatsExpirant: mandatsExpirantListe.length,
      loyersRetardNb: loyers.totaux.nbEnRetard,
      loyersRetardMontant: loyers.totaux.montantEnRetard,
      tachesEnRetard: tachesRes.count ?? 0,
    },
    loyersMois: {
      mois,
      du: loyers.totaux.du,
      encaisse: loyers.totaux.regle,
      reste: loyers.totaux.reste,
    },
    prospection: {
      aRelancer: prospectsARelancer,
      disponibles: prospectsDisponibles,
      total: prospections.length,
    },
    mandatsExpirantListe: mandatsExpirantListe.slice(0, 6),
    rdvAujourdhui,
  };
}
