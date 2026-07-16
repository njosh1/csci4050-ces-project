const crypto = require("crypto");

/*
 * Encrypts/decrypts payment card numbers before they touch the database.
 *
 * Algorithm: AES-256-GCM Each encryption uses a fresh random IV, so
 * encrypting the same card number twice produces different ciphertext.
 *
 * Requires CARD_ENCRYPTION_KEY in the environment: a 32-byte key,
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended IV length for GCM

function getKey() {
  const keyB64 = process.env.CARD_ENCRYPTION_KEY;

  if (!keyB64) {
    throw new Error(
      "CARD_ENCRYPTION_KEY is not set. Add a 32-byte base64 key to backend/.env."
    );
  }

  const key = Buffer.from(keyB64, "base64");

  if (key.length !== 32) {
    throw new Error(
      "CARD_ENCRYPTION_KEY must decode to exactly 32 bytes for AES-256."
    );
  }

  return key;
}

/**
 * Encrypts a plaintext card number.
 * Returns a single string safe to store in a database column:
 *   <iv>:<authTag>:<ciphertext>   (all hex-encoded)
 */
function encryptCardNumber(plainCardNumber) {
  if (!plainCardNumber || typeof plainCardNumber !== "string") {
    throw new Error("encryptCardNumber requires a non-empty string.");
  }

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plainCardNumber, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("hex"), authTag.toString("hex"), ciphertext.toString("hex")].join(":");
}

/**
 * Decrypts a value produced by encryptCardNumber.
 * Throws if the value was tampered with or the key is wrong.
 */
function decryptCardNumber(encryptedValue) {
  if (!encryptedValue || typeof encryptedValue !== "string") {
    throw new Error("decryptCardNumber requires a non-empty string.");
  }

  const [ivHex, authTagHex, ciphertextHex] = encryptedValue.split(":");

  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Malformed encrypted card value.");
  }

  const key = getKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

/**
 * Convenience helper: extracts the last 4 digits from a plaintext card
 * number for display purposes and stores this so the UI doesn't need to decrypt 
 */
function lastFourDigits(plainCardNumber) {
  const digitsOnly = String(plainCardNumber).replace(/\D/g, "");
  return digitsOnly.slice(-4);
}

module.exports = {
  encryptCardNumber,
  decryptCardNumber,
  lastFourDigits,
};
