// Turns whatever photo is picked in the dashboard into a small square, ready to be shown in a circle.

const encode = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/** The square region to keep from a width × height photo. */
export function squareCrop(width, height) {
  const size = Math.min(width, height);
  return {
    size,
    sx: Math.round((width - size) / 2),
    // In a portrait photo the face is usually in the upper part, so keep the top rather than the middle.
    sy: Math.round((height - size) * 0.25),
  };
}

/** @returns {Promise<Blob>} a square WebP (JPEG where the browser can't encode WebP), at most `outSize` px wide */
export async function cropToSquare(file, outSize = 512) {
  const bitmap = await createImageBitmap(file);
  const { sx, sy, size } = squareCrop(bitmap.width, bitmap.height);
  const target = Math.min(outSize, size);
  const canvas = document.createElement("canvas");
  canvas.width = target;
  canvas.height = target;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, target, target);
  bitmap.close?.();

  let blob = await encode(canvas, "image/webp", 0.9);
  if (!blob || blob.type !== "image/webp") blob = await encode(canvas, "image/jpeg", 0.9);
  if (!blob) throw new Error("This browser could not process the image.");
  return blob;
}
