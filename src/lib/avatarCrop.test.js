import { describe, it, expect } from "vitest";
import { squareCrop } from "./avatarCrop";

describe("square crop for the profile photo", () => {
  it("keeps the middle of a landscape photo", () => {
    expect(squareCrop(1600, 900)).toEqual({ size: 900, sx: 350, sy: 0 });
  });

  it("keeps the upper part of a portrait photo, where the face usually is", () => {
    expect(squareCrop(900, 1600)).toEqual({ size: 900, sx: 0, sy: 175 });
  });

  it("leaves a square photo alone", () => {
    expect(squareCrop(512, 512)).toEqual({ size: 512, sx: 0, sy: 0 });
  });

  it("never reaches outside the photo", () => {
    for (const [w, h] of [[1, 1], [3, 1000], [1000, 3], [4032, 3024], [3024, 4032], [333, 777]]) {
      const { size, sx, sy } = squareCrop(w, h);
      expect(sx).toBeGreaterThanOrEqual(0);
      expect(sy).toBeGreaterThanOrEqual(0);
      expect(sx + size).toBeLessThanOrEqual(w);
      expect(sy + size).toBeLessThanOrEqual(h);
    }
  });
});
