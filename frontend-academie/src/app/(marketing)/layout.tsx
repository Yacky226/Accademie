import { readInitialSession } from "@/core/auth/read-initial-session";
import { AuthProviders } from "@/core/providers/AuthProviders";

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialSession = await readInitialSession();

  return <AuthProviders initialSession={initialSession}>{children}</AuthProviders>;
}
