import { cookies } from "next/headers";
import { readServerSessionCookieSnapshot } from "./session-cookie-store";

export async function readInitialSession() {
  const cookieStore = await cookies();
  return readServerSessionCookieSnapshot(cookieStore);
}
