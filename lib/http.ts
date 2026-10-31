import { NextRequest, NextResponse } from "next/server";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  console.error(
    "Request failed:",
    error instanceof Error ? error.name : "unknown",
  );
  return NextResponse.json(
    { error: "Service unavailable. Please try again or contact Mavro." },
    { status: 503 },
  );
}
export async function readJSON(
  req: NextRequest,
  maxBytes = 100_000,
): Promise<Record<string, unknown>> {
  if (!req.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "Expected JSON");
  if (Number(req.headers.get("content-length")) > maxBytes)
    throw new HttpError(413, "Request too large");
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "Missing request");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new HttpError(413, "Request too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let value: unknown;
  try {
    value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new HttpError(400, "Expected object");
  return value as Record<string, unknown>;
}
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const expected = process.env.APP_ORIGIN || req.nextUrl.origin;
  if (!origin || origin !== expected)
    throw new HttpError(403, "Invalid request origin");
}
export function shortText(value: unknown, max = 200): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string" || value.length > max)
    throw new HttpError(400, "Invalid text");
  return value.trim();
}
