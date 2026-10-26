import { headers } from "next/headers";

export async function getClientIp(): Promise<string | undefined> {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    undefined
  );
}

export async function getUserAgent(): Promise<string | undefined> {
  const h = await headers();
  return h.get("user-agent")?.slice(0, 500) || undefined;
}

/** Absolute public base URL of the app, without trailing slash. */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}
