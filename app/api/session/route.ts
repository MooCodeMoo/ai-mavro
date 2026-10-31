import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  isAdmin,
  mutationGuard,
  sessionOptions,
  validPassword,
} from "@/lib/security";
import { apiError, HttpError, readJSON, shortText } from "@/lib/http";
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { authenticated: isAdmin(req) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(req: NextRequest) {
  try {
    await mutationGuard(req, "login", 10, false);
    const data = await readJSON(req, 2000);
    if (!validPassword(shortText(data.password, 256)))
      throw new HttpError(401, "Incorrect password");
    const res = NextResponse.json({ success: true });
    res.cookies.set({ ...sessionOptions(), value: createSession() });
    return res;
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    await mutationGuard(req, "logout");
    const res = NextResponse.json({ success: true });
    res.cookies.set({ ...sessionOptions(), value: "", maxAge: 0 });
    return res;
  } catch (e) {
    return apiError(e);
  }
}
