import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { apiError, HttpError, readJSON, shortText } from "@/lib/http";
import { caseAccess, mutationGuard } from "@/lib/security";
import { getCase } from "@/lib/database";
import { generatePDF } from "@/lib/pdf";
import { copy } from "@/lib/ui-copy";
export async function POST(req: NextRequest) {
  try {
    await mutationGuard(req, "email", 10);
    const data = await readJSON(req, 3000),
      id = shortText(data.caseId, 100),
      to = shortText(data.recipientEmail, 254);
    caseAccess(req, id);
    if (!/^[^\s@<>\r\n,;]+@[^\s@<>\r\n,;]+\.[^\s@<>\r\n,;]+$/.test(to))
      throw new HttpError(400, "Invalid recipient email");
    if (
      !process.env.EMAIL_HOST ||
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_PASSWORD
    )
      throw new HttpError(
        503,
        "Email delivery is not configured. Download the PDF instead.",
      );
    const item = await getCase(id);
    if (!item) throw new HttpError(404, "Case not found");
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_PORT === "465",
      requireTLS: process.env.EMAIL_PORT !== "465",
      connectionTimeout: 15_000,
      socketTimeout: 30_000,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
    });
    const lang = item.input.language;
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: `Mavro — ${copy(lang, "report")}`,
      text: [
        copy(lang, "emailIntro"),
        `${copy(lang, "status")}: ${copy(lang, item.review === "pending" ? "pending" : item.review)}`,
        copy(lang, "review"),
        "Mavro Slovenija · info@mavro-int.si · +386 41 902 700",
      ].join("\n\n"),
      attachments: [
        {
          filename: `Mavro-${id}.pdf`,
          content: await generatePDF(item),
          contentType: "application/pdf",
        },
      ],
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
