import crypto from "node:crypto";

/** Generates a URL-safe random token (sent to the user / stored in a cookie). */
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** SHA-256 hash of a token. Only hashes are ever persisted in the database. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
