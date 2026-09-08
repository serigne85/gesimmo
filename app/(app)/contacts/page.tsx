import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import { listContactsUnifies } from "@/services/contacts";
import {
  DESIGNATIONS_CONTACT,
  DESIGNATION_CONTACT_LABELS,
  type DesignationContact,
} from "@/types/contact";
import { telHref, whatsappHref } from "@/lib/utils/format";
import BadgeDesignation from "@/components/metier/BadgeDesignation";

const PAGE_SIZE = 25;

/**
 * Annuaire unifié : tous les contacts de l'agence, toutes sources confondues
 * (propriétaires, contacts associés, locataires, partenaires, prospects),
 * fusionnés par téléphone. Server Component (RLS active) : filtrage par
 * désignation, recherche et pagination faits côté serveur sur la liste agrégée.
 */
export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; designation?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const designation =
    sp.designation && sp.designation in DESIGNATION_CONTACT_LABELS
      ? (sp.designation as DesignationContact)
      : undefined;
  const q = (sp.q ?? "").trim().toLowerCase();

  const tous = await listContactsUnifies();
  const filtres = tous.filter((c) => {
    if (designation && !c.designations.includes(designation)) return false;
    if (
      q &&
      !c.nomComplet.toLowerCase().includes(q) &&
      !c.telephone.toLowerCase().includes(q)
    )
      return false;
    return true;
  });

  const total = filtres.length;
  const nbPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageCourante = Math.min(page, nbPages);
  const from = (pageCourante - 1) * PAGE_SIZE;
  const lignes = filtres.slice(from, from + PAGE_SIZE);

  const paramsBase = new URLSearchParams();
  if (designation) paramsBase.set("designation", designation);
  if (q) paramsBase.set("q", q);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Contacts
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {total} contact{total > 1 ? "s" : ""} · annuaire unifié de l&apos;agence
        </p>
      </div>

      {/* Recherche */}
      <form method="get" className="flex gap-2">
        {designation && (
          <input type="hidden" name="designation" value={designation} />
        )}
        <input
          type="search"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Rechercher un nom ou un téléphone…"
          className="w-full max-w-sm rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <button
          type="submit"
          className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
        >
          Rechercher
        </button>
      </form>

      {/* Filtre par désignation */}
      <div className="flex flex-wrap gap-2 text-sm">
        <FiltreLien label="Toutes" actif={!designation} href={hrefAvec({ q }, {})} />
        {DESIGNATIONS_CONTACT.map((d) => (
          <FiltreLien
            key={d}
            label={DESIGNATION_CONTACT_LABELS[d]}
            actif={designation === d}
            href={hrefAvec({ q }, { designation: d })}
          />
        ))}
      </div>

      {lignes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Aucun contact ne correspond.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="px-3 py-2 font-medium">Nom complet</th>
                <th className="px-3 py-2 font-medium">Téléphone</th>
                <th className="px-3 py-2 font-medium">Désignation</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-700 dark:divide-zinc-800 dark:text-zinc-300">
              {lignes.map((c) => (
                <tr
                  key={c.cle}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                    {c.contactId ? (
                      <Link href={`/contacts/${c.contactId}`} className="hover:underline">
                        {c.nomComplet || "—"}
                      </Link>
                    ) : c.href ? (
                      <Link href={c.href} className="hover:underline">
                        {c.nomComplet || "—"}
                      </Link>
                    ) : (
                      c.nomComplet || "—"
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {c.telephone || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {c.designations.map((d) => (
                        <BadgeDesignation key={d} designation={d} />
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {c.telephone && (
                        <>
                          <a
                            href={telHref(c.telephone)}
                            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            title={`Appeler ${c.telephone}`}
                          >
                            <Phone className="h-4 w-4" aria-hidden="true" />
                          </a>
                          <a
                            href={whatsappHref(c.telephone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" aria-hidden="true" />
                          </a>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {nbPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <PaginationLien page={pageCourante - 1} disabled={pageCourante <= 1} label="Précédent" paramsBase={paramsBase} />
          <span className="text-zinc-500 dark:text-zinc-400">
            Page {pageCourante} / {nbPages}
          </span>
          <PaginationLien page={pageCourante + 1} disabled={pageCourante >= nbPages} label="Suivant" paramsBase={paramsBase} />
        </div>
      )}
    </div>
  );
}

/** Construit un href /contacts en conservant la recherche. */
function hrefAvec(
  garder: { q?: string },
  ajout: { designation?: string }
): string {
  const p = new URLSearchParams();
  if (garder.q) p.set("q", garder.q);
  if (ajout.designation) p.set("designation", ajout.designation);
  const qs = p.toString();
  return qs ? `/contacts?${qs}` : "/contacts";
}

function FiltreLien({
  label,
  actif,
  href,
}: {
  label: string;
  actif: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-md border px-3 py-1.5 font-medium transition-colors ${
        actif
          ? "border-blue-700 bg-blue-900 text-white"
          : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
      }`}
    >
      {label}
    </Link>
  );
}

function PaginationLien({
  page,
  disabled,
  label,
  paramsBase,
}: {
  page: number;
  disabled: boolean;
  label: string;
  paramsBase: URLSearchParams;
}) {
  if (disabled) {
    return <span className="text-zinc-300 dark:text-zinc-700">{label}</span>;
  }
  const params = new URLSearchParams(paramsBase);
  params.set("page", String(page));
  return (
    <Link
      href={`/contacts?${params.toString()}`}
      className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {label}
    </Link>
  );
}
