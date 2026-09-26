import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import type { Request } from "express";
import { parse } from "cookie";
import type { User } from "../../drizzle/schema";
import { ENV } from "./env";

export const MINDLOOM_SESSION_COOKIE = "mindloom_session";
const SESSION_DAYS = 30;

function secret() {
  return new TextEncoder().encode(ENV.cookieSecret || "mindloom-local-development-secret");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string) {
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function createNativeSession(user: User) {
  return new SignJWT({ type: "mindloom", email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function getNativeUserId(req: Request) {
  const cookies = parse(req.headers.cookie ?? "");
  const token = cookies[MINDLOOM_SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.type !== "mindloom" || !payload.sub) return null;
    return Number(payload.sub);
  } catch {
    return null;
  }
}

export function sessionCookieOptions(req: Request) {
  const forwarded = String(req.headers["x-forwarded-proto"] ?? "").split(",")[0].trim();
  const secure = req.protocol === "https" || forwarded === "https";
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" as const : "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function clearNativeSession(res: { clearCookie: (name: string, options?: Record<string, unknown>) => void }, req: Request) {
  res.clearCookie(MINDLOOM_SESSION_COOKIE, { ...sessionCookieOptions(req), maxAge: -1 });
}

export function hashSessionForDiagnostics(token: string) {
  return createHash("sha256").update(token).digest("hex").slice(0, 12);
}
