import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { recipientEmail, customerName, pdfBase64, surface, contamination, product } =
      await req.json();

    if (!recipientEmail || !pdfBase64) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const displayName = customerName || "Valued Customer";
    const subjectLine = `Mavro Treatment Plan${customerName ? ` \u2013 ${customerName}` : ""}`;

    const year = new Date().getFullYear();
    const summaryRows = [
      surface
        ? `<tr><td style="padding:10px 14px;background:#f9fafb;font-size:12px;color:#6b7280;font-weight:bold;border-bottom:1px solid #e5e7eb">SURFACE</td><td style="padding:10px 14px;font-size:13px;border-bottom:1px solid #e5e7eb">${surface}</td></tr>`
        : "",
      contamination
        ? `<tr><td style="padding:10px 14px;background:#f9fafb;font-size:12px;color:#6b7280;font-weight:bold;border-bottom:1px solid #e5e7eb">CONTAMINATION</td><td style="padding:10px 14px;font-size:13px;border-bottom:1px solid #e5e7eb">${contamination}</td></tr>`
        : "",
      product
        ? `<tr><td style="padding:10px 14px;background:#f9fafb;font-size:12px;color:#6b7280;font-weight:bold">RECOMMENDED PRODUCT</td><td style="padding:10px 14px;font-size:13px">${product}</td></tr>`
        : "",
    ]
      .filter(Boolean)
      .join("");

    const summaryTable =
      summaryRows.length > 0
        ? `<table style="width:100%;border:1px solid #e5e7eb;border-radius:6px;border-collapse:collapse;margin:0 0 24px">${summaryRows}</table>`
        : "";

    const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#1f2937;max-width:600px;margin:0 auto;padding:0">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="background:#1f2937;padding:24px 32px">
        <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px">MAVRO</span>
        <span style="color:#9ca3af;font-size:12px;margin-left:12px">International</span>
      </td>
    </tr>
    <tr>
      <td style="padding:32px">
        <p style="font-size:16px;margin:0 0 16px">Dear ${displayName},</p>
        <p style="font-size:14px;line-height:1.6;margin:0 0 16px">
          Please find your personalised <strong>Surface Treatment Plan</strong> attached
          to this email, prepared by Mavro International.
        </p>
        ${summaryTable}
        <p style="margin:0 0 24px">
          <a href="https://mavro-int.shop/sl/"
             style="display:inline-block;background:#374151;color:#fff;text-decoration:none;padding:10px 22px;border-radius:6px;font-size:13px;font-weight:bold">
            Order Products Online &rarr;
          </a>
        </p>
        <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0">
          If you have any questions, please contact us:<br>
          <strong>+31 418 680 680</strong> &nbsp;&middot;&nbsp; info@mavro-int.com<br>
          Heksekamp 1, 5301 LX Zaltbommel, Netherlands
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#f3f4f6;padding:16px 32px;border-top:1px solid #e5e7eb">
        <p style="font-size:11px;color:#9ca3af;margin:0">
          &copy; ${year} Mavro International &middot; www.mavro-int.com
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({
      from: `"Mavro International" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: subjectLine,
      html: htmlBody,
      attachments: [
        {
          filename: "Mavro-Treatment-Plan.pdf",
          content: Buffer.from(pdfBase64, "base64"),
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: (error as Error).message },
      { status: 500 }
    );
  }
}
