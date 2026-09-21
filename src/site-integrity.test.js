import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Guards against the kind of silent breakage that is easy to miss: a favicon, preview image or
// wallpaper that points at a file which no longer exists, or a sitemap that is not valid XML.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const existsInPublic = (urlPath) => fs.existsSync(path.join(root, "public", decodeURIComponent(urlPath.replace(/^\//, ""))));

const SITE = "https://portofolio-v1-one-gamma.vercel.app";
// Components that no page renders (their assets may be gone). Remove an entry once the file is deleted.
const UNUSED_COMPONENTS = ["src/components/PresenceWidget.jsx"];

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.(jsx?|css)$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(rel);
  }
  return out;
};

describe("index.html", () => {
  const html = read("index.html");

  it("every local icon / preload / preview image it points at exists in /public", () => {
    const localPaths = [...html.matchAll(/(?:href|src)="(\/[^"#?]+\.(?:png|jpe?g|webp|svg|ico))"/g)].map((m) => m[1]);
    const sitePaths = [...html.matchAll(new RegExp(`content="${SITE}(/[^"]+\\.(?:png|jpe?g|webp))"`, "g"))].map((m) => m[1]);
    const all = [...new Set([...localPaths, ...sitePaths])];

    expect(all.length).toBeGreaterThan(0);
    expect(all.filter((p) => !existsInPublic(p))).toEqual([]);
  });

  it("uses the real domain everywhere (no leftover template domains)", () => {
    expect(html).not.toMatch(/ekizr|ibb\.co/);
    expect(html).toContain(`<link rel="canonical" href="${SITE}/" />`);
  });
});

describe("sitemap.xml and robots.txt", () => {
  const sitemap = read("public/sitemap.xml");
  const robots = read("public/robots.txt");

  it("sitemap is well-formed: XML declaration first, nothing after </urlset>", () => {
    expect(sitemap.startsWith("<?xml")).toBe(true);
    expect(sitemap.trim().endsWith("</urlset>")).toBe(true);
  });

  it("every sitemap URL and the robots.txt Sitemap line use the real domain", () => {
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(0);
    expect(locs.filter((u) => !u.startsWith(SITE))).toEqual([]);
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  });
});

describe("assets referenced from source", () => {
  it("every /file.ext string in the app's code points at a file that exists in /public", () => {
    const files = walk("src").filter((f) => !UNUSED_COMPONENTS.includes(f));
    const missing = [];
    for (const file of files) {
      const text = read(file);
      for (const m of text.matchAll(/["'`(]\/([A-Za-z0-9_\-. ]+\.(?:png|jpe?g|webp|gif|svg|json|webm|mp4))["'`)]/g)) {
        if (!existsInPublic(`/${m[1]}`)) missing.push(`${file} -> /${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
