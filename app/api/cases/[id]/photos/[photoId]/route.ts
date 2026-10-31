import { NextRequest, NextResponse } from "next/server";
import { getPhoto } from "@/lib/database";
import { caseAccess } from "@/lib/security";
import { apiError, HttpError } from "@/lib/http";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  try {
    const { id, photoId } = await params;
    caseAccess(req, id);
    const data = await getPhoto(id, photoId);
    if (!data) throw new HttpError(404, "Photo not found");
    return new NextResponse(Buffer.from(data.split(",")[1], "base64"), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
