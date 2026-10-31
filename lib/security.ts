import {
  createHmac,
  randomBytes,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { NextRequest } from "next/server";
import { consumeRate } from "./database";
import { HttpError, sameOrigin } from "./http";
const COOKIE = "mavro-admin";
function signature(value: string) {
  return createHmac("sha256", process.env.SESSION_SECRET || "")
    .update(value)
    .digest("base64url");
}
function secretReady() {
  return (
    (process.env.SESSION_SECRET?.length || 0) >= 32 &&
    (process.env.ADMIN_PASSWORD?.length || 0) >= 12
  );
}
export function validPassword(password: string) {
  if (!secretReady())
    throw new HttpError(
      503,
      "Configure ADMIN_PASSWORD (12+ characters) and SESSION_SECRET (32+ characters).",
    );
  const a = createHash("sha256").update(password).digest(),
    b = createHash("sha256").update(process.env.ADMIN_PASSWORD!).digest();
  return timingSafeEqual(a, b);
}
export function createSession() {
  const payload = Buffer.from(
    JSON.stringify({
      exp: Date.now() + 8 * 60 * 60 * 1000,
      nonce: randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");
  return `${payload}.${signature(payload)}`;
}
export function isAdmin(req: NextRequest) {
  if (!secretReady()) return false;
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return false;
  const [payload, mac, ...extra] = token.split(".");
  if (!payload || !mac || extra.length) return false;
  const expected = Buffer.from(signature(payload)),
    actual = Buffer.from(mac);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
    return false;
  try {
    return (
      JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now()
    );
  } catch {
    return false;
  }
}
export function requireAdmin(req: NextRequest) {
  if (!isAdmin(req)) throw new HttpError(401, "Sign in to continue");
}
export function sessionOptions() {
  return {
    name: COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 8 * 60 * 60,
  };
}
export async function rateLimit(
  req: NextRequest,
  scope: string,
  maximum: number,
  windowMs = 60 * 60 * 1000,
) {
  // Trust a proxy header only after the host is explicitly configured to overwrite it.
  const ipHeader = process.env.TRUSTED_IP_HEADER;
  const identity = ipHeader ? req.headers.get(ipHeader) || "unknown" : "shared";
  const key = createHash("sha256").update(`${scope}:${identity}`).digest("hex");
  const rate = await consumeRate(key, maximum, windowMs);
  if (!rate.allowed)
    throw new HttpError(
      429,
      `Too many requests. Try again in ${rate.retryAfter} seconds.`,
    );
}
export async function mutationGuard(
  req: NextRequest,
  scope: string,
  maximum = 60,
  admin = false,
) {
  sameOrigin(req);
  if (admin) requireAdmin(req);
  await rateLimit(req, scope, maximum);
}
export function caseAccess(req: NextRequest, id: string) {
  if (isAdmin(req)) return;
  const expected = signature(`case:${id}`),
    actual = req.cookies.get(`mavro-case-${id}`)?.value || "";
  const a = Buffer.from(expected),
    b = Buffer.from(actual);
  if (!secretReady() || a.length !== b.length || !timingSafeEqual(a, b))
    throw new HttpError(401, "This case is private");
}
export function caseToken(id: string) {
  if (!secretReady())
    throw new HttpError(503, "Configure secure sessions before saving cases.");
  return signature(`case:${id}`);
}
