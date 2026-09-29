import { describe, it, expect } from "vitest";
import { resolveTech, techKey, MARQUEE_STACK } from "./tech";

describe("resolveTech", () => {
  it.each([
    ["Next.js 16.x", "Next.js"],
    ["Tail WInd", "Tailwind CSS"],
    ["Taillwind", "Tailwind CSS"],
    ["Type Script", "TypeScript"],
    ["Java Script", "JavaScript"],
    ["Shadcn.ui", "shadcn/ui"],
    ["Lemon Squizy", "Lemon Squeezy"],
    ["Uptash", "Upstash"],
    ["Cloudflare R2", "Cloudflare R2"],
  ])("shows %s as %s", (raw, expected) => {
    expect(resolveTech(raw).name).toBe(expected);
  });

  it("keeps unknown technologies as typed, without an icon", () => {
    expect(resolveTech("  Fumadocs ")).toEqual({ name: "Fumadocs", icon: null, color: null });
  });

  it("only strips a trailing version, not digits that are part of the name", () => {
    expect(techKey("Cloudflare R2")).toBe("cloudflarer2");
    expect(techKey("Vue 3")).toBe("vue");
  });

  it("every marquee logo resolves to a known brand icon", () => {
    expect(MARQUEE_STACK.filter((tech) => !tech.icon)).toEqual([]);
  });
});
