import { cookies } from "next/headers";

const SESSION_COOKIE = "qr_session";
const SESSION_VALUE = "authenticated";

export function verifyPassword(password: string): boolean {
  const authPassword = process.env.AUTH_PASSWORD;
  if (!authPassword) {
    console.warn("AUTH_PASSWORD not set");
    return false;
  }
  return password === authPassword;
}

export async function createSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });
}

export async function validateSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  return session?.value === SESSION_VALUE;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

export function getSessionValue(): string {
  return SESSION_VALUE;
}
