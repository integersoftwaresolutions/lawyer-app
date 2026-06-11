import crypto from "crypto";
import { env } from "../../config/env.js";
import { ApiError } from "../../helpers/apiError.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function getKeyBuffer() {
  const keyHex = env.encryptionKey;
  if (!keyHex || keyHex.length !== KEY_LENGTH * 2) {
    throw new ApiError(500, "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }
  return Buffer.from(keyHex, "hex");
}

export function encrypt(plaintext) {
  if (plaintext == null || plaintext === "") return plaintext;

  const key = getKeyBuffer();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(payload) {
  if (payload == null || payload === "") return payload;
  if (!String(payload).includes(":")) return payload;

  const key = getKeyBuffer();
  const [ivHex, tagHex, dataHex] = String(payload).split(":");
  if (!ivHex || !tagHex || !dataHex) return payload;

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const data = Buffer.from(dataHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

export function isEncryptionConfigured() {
  return Boolean(env.encryptionKey && env.encryptionKey.length === KEY_LENGTH * 2);
}
