export async function jsonRequest<T>(
  url: string,
  body?: unknown,
  method = "POST",
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}
export async function compressPhoto(
  file: File,
): Promise<{ name: string; data: string }> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 20_000_000
  )
    throw new Error("Use JPEG, PNG or WebP files up to 20 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image processing is unavailable");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let quality = 0.8;
    let data = canvas.toDataURL("image/jpeg", quality);
    while (data.length > 800_000 && quality > 0.25) {
      quality -= 0.1;
      data = canvas.toDataURL("image/jpeg", quality);
    }
    if (data.length > 800_000)
      throw new Error("Photo is too large. Try a smaller image.");
    return { name: file.name.slice(0, 120), data };
  } finally {
    bitmap.close();
  }
}
export async function downloadResponse(response: Response, filename: string) {
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Download failed");
  }
  const url = URL.createObjectURL(await response.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
