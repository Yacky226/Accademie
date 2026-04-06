import { readInitialSession } from "@/core/auth/read-initial-session";
import { ApplicationProviders } from "@/core/providers/ApplicationProviders";

export default async function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialSession = await readInitialSession();

  return <ApplicationProviders initialSession={initialSession}>{children}</ApplicationProviders>;
}
