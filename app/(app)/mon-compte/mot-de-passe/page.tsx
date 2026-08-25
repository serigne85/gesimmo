import FormulaireMotDePasse from "@/components/metier/FormulaireMotDePasse";

/**
 * Page libre-service « Changer mon mot de passe ».
 *
 * Accessible à tout utilisateur connecté (le layout (app) garantit la session).
 * La Server Action agit uniquement sur le compte courant : aucun contrôle de
 * rôle à faire ici, on ne peut changer que son propre mot de passe.
 */
export default function MotDePassePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Changer mon mot de passe
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Choisissez un mot de passe personnel, différent de celui fourni à
          l&apos;ouverture de votre compte.
        </p>
      </div>

      <FormulaireMotDePasse />
    </div>
  );
}
