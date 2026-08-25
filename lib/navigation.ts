import {
  LayoutDashboard,
  Building2,
  Users,
  FileSignature,
  Target,
  Search,
  ListTodo,
  Calendar,
  KeyRound,
  Wallet,
  BarChart3,
  UserCog,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types/roles";

/**
 * Une entrée du menu principal.
 *
 * `icon` n'est pas une image ni du texte : c'est le COMPOSANT icône lui-même
 * (une fonction React). La sidebar le rendra avec <item.icon />. C'est ce qui
 * permet de décrire toute la navigation ici, en donnée, sans écrire de JSX.
 */
export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Rôles autorisés à voir cette entrée. */
  roles: Role[];
};

/**
 * Source unique de vérité de la navigation.
 *
 * Ajouter une entrée de menu = ajouter une ligne ici. Aucun composant à
 * modifier. Même philosophie que les "pipelines configurables" de CLAUDE.md :
 * la structure est de la donnée, pas du code figé.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/tableau-de-bord",
    icon: LayoutDashboard,
    roles: ["admin", "direction", "agent", "gestionnaire", "comptable"],
  },
  {
    label: "Biens",
    href: "/biens",
    icon: Building2,
    roles: ["admin", "direction", "agent", "gestionnaire", "comptable"],
  },
  {
    label: "Contacts",
    href: "/contacts",
    icon: Users,
    roles: ["admin", "direction", "agent", "gestionnaire", "comptable"],
  },
  {
    label: "Mandats",
    href: "/mandats",
    icon: FileSignature,
    roles: ["admin", "direction", "agent", "gestionnaire"],
  },
  {
    label: "Demandes",
    href: "/demandes",
    icon: Search,
    roles: ["admin", "direction", "agent", "gestionnaire"],
  },
  {
    label: "Opportunités",
    href: "/opportunites",
    icon: Target,
    roles: ["admin", "direction", "agent"],
  },
  {
    label: "Tâches",
    href: "/taches",
    icon: ListTodo,
    roles: ["admin", "direction", "agent", "gestionnaire", "comptable"],
  },
  {
    label: "Agenda",
    href: "/agenda",
    icon: Calendar,
    roles: ["admin", "direction", "agent", "gestionnaire"],
  },
  {
    label: "Gestion locative",
    href: "/gestion-locative",
    icon: KeyRound,
    roles: ["admin", "direction", "gestionnaire", "comptable"],
  },
  {
    label: "Paiements",
    href: "/paiements",
    icon: Wallet,
    roles: ["admin", "direction", "gestionnaire", "comptable"],
  },
  {
    label: "Rapports",
    href: "/rapports",
    icon: BarChart3,
    roles: ["admin", "direction"],
  },
  {
    label: "Utilisateurs",
    href: "/utilisateurs",
    icon: UserCog,
    roles: ["admin"],
  },
  {
    label: "Paramètres",
    href: "/parametres",
    icon: Settings,
    roles: ["admin"],
  },
];

/**
 * Renvoie les seules entrées de menu autorisées pour un rôle donné.
 * C'est ici, et nulle part dans les composants, que vit le filtrage.
 */
export function getNavigationForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
