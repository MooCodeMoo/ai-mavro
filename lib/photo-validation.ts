import sharp from "sharp";
import type { CaseInput } from "./domain";
import { HttpError } from "./http";
export async function normalizePhotos(
  photos: CaseInput["photos"],
): Promise<CaseInput["photos"]> {
  return Promise.all(
    photos.map(async (photo) => {
      try {
        const bytes = Buffer.from(photo.data.split(",")[1], "base64");
        const output = await sharp(bytes, {
          limitInputPixels: 16_000_000,
          failOn: "error",
        })
          .rotate()
          .resize({
            width: 1200,
            height: 1200,
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 80 })
          .toBuffer();
        if (output.length > 650_000) throw new Error("too large");
        return {
          name: photo.name,
          data: `data:image/jpeg;base64,${output.toString("base64")}`,
        };
      } catch {
        throw new HttpError(400, "Invalid or oversized photo");
      }
    }),
  );
}
