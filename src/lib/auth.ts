// Minimal shared-password gate. No accounts, no database: the cookie holds a hash
// derived from the app password + a server secret, so the password itself never sits
// in the browser. Good enough for a personal tool behind a public Vercel URL — not a
// substitute for real auth if this ever needs per-user access.

export const AUTH_COOKIE = "rt_auth";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** The cookie value a signed-in browser should carry. Returns null if auth isn't configured. */
export async function computeAuthToken(): Promise<string | null> {
  const password = process.env.APP_PASSWORD;
  if (!password) return null;
  const secret = process.env.AUTH_SECRET ?? password;
  return sha256Hex(`${password}:${secret}`);
}
