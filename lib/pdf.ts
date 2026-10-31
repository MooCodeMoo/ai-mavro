import PDFDocument from "pdfkit";
import path from "node:path";
import type { SavedCase } from "./domain";
import { copy } from "./ui-copy";
import { translations } from "./translations";
import { findProduct } from "./products";
export async function generatePDF(item: SavedCase): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    autoFirstPage: true,
    info: { Title: "Mavro — " + copy(item.input.language, "report") },
  });
  const chunks: Buffer[] = [];
  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  doc.font(path.join(process.cwd(), "public/fonts/DejaVuSans.ttf"));
  const lang = item.input.language,
    t = translations[lang];
  const section = (title: string) => {
    if (doc.y > 700) doc.addPage();
    doc
      .moveDown()
      .fontSize(12)
      .fillColor("#344e5c")
      .text(title)
      .moveDown(0.3)
      .fontSize(9)
      .fillColor("#17232c");
  };
  const line = (label: string, value: string) => {
    doc.text(`${label}: ${value}`).moveDown(0.3);
  };
  doc.fontSize(24).fillColor("#344e5c").text("MAVRO");
  doc.fontSize(15).text(copy(lang, "report")).moveDown();
  doc.fontSize(9).fillColor("#17232c");
  line("ID", item.id);
  line(t.customerInfo.customerName, item.input.customerName || "—");
  line(t.customerInfo.projectLocation, item.input.location || "—");
  line(t.customerInfo.contactInfo, item.input.contactInfo || "—");
  line(
    copy(lang, "status"),
    copy(lang, item.review === "pending" ? "pending" : item.review),
  );
  if (item.reviewNote) doc.text(item.reviewNote);
  doc.text(
    new Date(item.createdAt).toLocaleDateString(
      lang === "sl"
        ? "sl-SI"
        : lang === "hr"
          ? "hr-HR"
          : lang === "nl"
            ? "nl-NL"
            : "en-GB",
    ),
  );
  section(t.step4.surface);
  doc.text(t.surfaces[item.input.substrate] || item.input.substrate);
  doc.text(
    t.contaminations[item.input.contamination] || item.input.contamination,
  );
  if (item.input.area) line(copy(lang, "area"), String(item.input.area));
  const treatment = item.treatment;
  if (treatment) {
    section(treatment.product);
    line(t.step4.dilution, treatment.dilution);
    line(copy(lang, "water"), String(item.input.waterParts));
    section(t.step4.applicationSteps);
    treatment.steps.forEach((step, i) =>
      doc.text(`${i + 1}. ${step}`).moveDown(0.3),
    );
    section(t.step4.safety);
    doc.text(treatment.safety);
    section(copy(lang, "estimate"));
    if (treatment.estimate) {
      const estimate = treatment.estimate;
      doc.text(`${estimate.min}–${estimate.max} ${estimate.unit}`);
      doc.text(copy(lang, "packs"));
      estimate.packs.forEach((pack) =>
        doc.text(`${pack.count} × ${pack.size} ${estimate.unit}`),
      );
    } else doc.text(copy(lang, "noEstimate"));
    section(copy(lang, "source"));
    doc.text(treatment.sourceUrl, { link: treatment.sourceUrl });
    line(copy(lang, "checked"), treatment.checkedAt);
    doc.text(`Revision: ${treatment.updatedAt}`);
    if (treatment.protectionId) {
      const product = findProduct(treatment.protectionId)!;
      section(copy(lang, "protection"));
      doc.text(product.name);
      doc.text(product.description[lang]);
      doc.text(product.sourceUrl, { link: product.sourceUrl });
    }
  } else {
    section(copy(lang, "unavailable"));
  }
  if (item.input.aiAnalysis) {
    section("AI");
    doc.text(
      `${Math.round(item.input.aiAnalysis.confidence * 100)}% — ${item.input.aiAnalysis.notes}`,
    );
  }
  section(copy(lang, "review"));
  doc.text(copy(lang, "price"));
  doc.moveDown().text("Mavro Slovenija · +386 41 902 700 · info@mavro-int.si");
  for (const photo of item.photos) {
    doc.addPage();
    doc.fontSize(12).text(photo.name);
    doc.moveDown();
    const { getPhoto } = await import("./database");
    const data = await getPhoto(item.id, photo.id);
    if (data) {
      try {
        doc.image(Buffer.from(data.split(",")[1], "base64"), 48, 90, {
          fit: [499, 650],
          align: "center",
        });
      } catch {
        doc.fontSize(9).text("Photo unavailable");
      }
    }
  }
  doc.end();
  return result;
}
