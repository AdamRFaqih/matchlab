import crypto from "node:crypto";

/**
 * Password hashing using scrypt with a per-user random salt.
 *
 * Stored format: `scrypt$<N>$<saltHex>$<hashHex>`
 *
 * Hashes created by the original implementation (static salt, raw hex) are still
 * accepted by `verifyPassword` and flagged by `needsRehash` so they can be upgraded
 * transparently on the next successful login.
 */

const KEY_LENGTH = 32;
const SCRYPT_N = 16384;
const LEGACY_SALT = "matchlab_system_salt_2026";

export const PASSWORD_MIN_LENGTH = 8;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .scryptSync(password, salt, KEY_LENGTH, { N: SCRYPT_N })
    .toString("hex");
  return `scrypt$${SCRYPT_N}$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    if (stored.startsWith("scrypt$")) {
      const [, nStr, salt, hashHex] = stored.split("$");
      const expected = Buffer.from(hashHex, "hex");
      const computed = crypto.scryptSync(password, salt, expected.length, {
        N: Number(nStr),
      });
      return crypto.timingSafeEqual(computed, expected);
    }

    // Legacy static-salt format
    const computed = crypto.scryptSync(password, LEGACY_SALT, KEY_LENGTH).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(stored));
  } catch {
    return false;
  }
}

export function needsRehash(stored: string): boolean {
  return !stored.startsWith(`scrypt$${SCRYPT_N}$`);
}

/** Returns an error message if the password does not satisfy the policy, otherwise null. */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password minimal ${PASSWORD_MIN_LENGTH} karakter.`;
  }
  if (password.length > 128) {
    return "Password terlalu panjang (maksimal 128 karakter).";
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password harus mengandung huruf dan angka.";
  }
  return null;
}
