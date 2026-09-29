// Shrinks an image in the browser before it is uploaded from the dashboard: the longest side is capped
// at `maxSize` and the file is re-encoded as WebP (JPEG where the browser can't encode WebP).
// A 1 MB certificate photo typically becomes ~150 KB — visitors on phones download far less.
// Anything that isn't a raster image, or that wouldn't get smaller, is returned untouched.

const encode = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

export const safeFileName = (name) => name.replace(/[^\w.-]+/g, "_");

export async function compressImage(file, { maxSize = 1600, quality = 0.82 } = {}) {
  if (!file?.type?.startsWith("image/") || /gif|svg/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    let blob = await encode(canvas, "image/webp", quality);
    if (!blob || blob.type !== "image/webp") blob = await encode(canvas, "image/jpeg", quality);
    if (!blob || blob.size >= file.size) return file;

    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${safeFileName(file.name.replace(/\.[^.]+$/, ""))}.${ext}`, { type: blob.type });
  } catch {
    return file;
  }
}
