"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { supprimerBail } from "@/services/baux-actions";

/**
 * Actions réservées à l'admin sur une ligne de bail : modifier et supprimer
 * (suppression logique, avec confirmation). Le contrôle d'accès réel est côté
 * serveur ; ces boutons ne s'affichent que pour l'admin.
 */
export default function ActionsBailAdmin({
  bailId,
  bailReference,
}: {
  bailId: string;
  bailReference: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function supprimer() {
    if (!window.confirm(`Supprimer le bail ${bailReference} ?`)) return;
    startTransition(async () => {
      const res = await supprimerBail(bailId);
      if (res.error) window.alert(res.error);
      else router.refresh();
    });
  }

  return (
    <>
      <Link
        href={`/gestion-locative/${bailId}/modifier`}
        title="Modifier"
        className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-blue-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={supprimer}
        disabled={pending}
        title="Supprimer"
        className="rounded-md p-2 text-zinc-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-red-950"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </>
  );
}
