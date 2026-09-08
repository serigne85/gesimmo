import {
  DESIGNATION_CONTACT_LABELS,
  type DesignationContact,
} from "@/types/contact";

/** Pastille neutre de désignation d'un contact (catégorie, pas un statut). */
const COULEURS: Record<DesignationContact, string> = {
  proprietaire: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  contact_associe:
    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  locataire: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  partenaire:
    "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  prospect: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  contact: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

export default function BadgeDesignation({
  designation,
}: {
  designation: DesignationContact;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COULEURS[designation]}`}
    >
      {DESIGNATION_CONTACT_LABELS[designation]}
    </span>
  );
}
