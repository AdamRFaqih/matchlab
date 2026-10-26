import crypto from "node:crypto";

const SALT = "matchlab_system_salt_2026";

export function hashPassword(password: string): string {
  return crypto.scryptSync(password, SALT, 32).toString("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    const computed = hashPassword(password);
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}
