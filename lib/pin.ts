import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

export const DEFAULT_ADMIN_PIN = "YPUofPOR";
export const PIN_COOKIE_NAME = "admin_pin_verified";
const PIN_COOKIE_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

function getSecret(): string {
  const secret = process.env.ADMIN_PIN_COOKIE_SECRET;
  if (!secret) throw new Error("ADMIN_PIN_COOKIE_SECRET is not set");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/** Signed, stateless proof that `userId` already entered the correct PIN this
 * session — no server-side session table needed. */
export function signPinToken(userId: string): { value: string; maxAge: number } {
  const expiresAt = Date.now() + PIN_COOKIE_MAX_AGE_SECONDS * 1000;
  const payload = `${userId}.${expiresAt}`;
  return { value: `${payload}.${sign(payload)}`, maxAge: PIN_COOKIE_MAX_AGE_SECONDS };
}

export function verifyPinToken(userId: string, token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [tokenUserId, expiresAtRaw, signature] = parts;
  if (tokenUserId !== userId) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expectedSignature = sign(`${tokenUserId}.${expiresAtRaw}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  return a.length === b.length && timingSafeEqual(a, b);
}
