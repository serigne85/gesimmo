/**
 * Layout du groupe (auth) : écrans publics (connexion), SANS sidebar ni topbar.
 * Route group : "(auth)" n'apparaît pas dans l'URL (/connexion reste /connexion).
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
