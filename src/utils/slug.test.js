import { describe, it, expect } from "vitest";
import { toSlug } from "./slug";

describe("toSlug", () => {
  it("lowercases and joins words with dashes", () => {
    expect(toSlug("Admin Dashboard Prodi Informatika UNISVET")).toBe("admin-dashboard-prodi-informatika-unisvet");
  });

  it("drops characters other than a-z, 0-9 and dashes", () => {
    expect(toSlug("Web Kampus (v2)!")).toBe("web-kampus-v2");
  });

  it("turns any run of whitespace into a single dash", () => {
    expect(toSlug("Portofolio   Web\tBaru")).toBe("portofolio-web-baru");
  });

  it("is stable: slugging a slug changes nothing (project links keep working)", () => {
    const slug = toSlug("Web Kampus Prodi Informatika UNISVET");
    expect(toSlug(slug)).toBe(slug);
  });
});
