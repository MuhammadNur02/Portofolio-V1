#!/usr/bin/env node
// Regenerates public/sitemap.xml before every build: the homepage plus one entry per published
// project, so Google can discover and index individual project pages — not just the homepage.
// Runs automatically via the "prebuild" npm script (see package.json).
//
// Previously the sitemap listed hash-fragment URLs (.../#Home, .../#About, ...). Google treats a URL
// fragment as part of the SAME page as the bare URL, so those four entries were indexed as duplicates
// of "/" and never helped any section — or the real project pages — get found individually.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = "https://julian.vercel.app";

// Mirrors src/utils/slug.js — kept in sync manually since this script runs outside Vite/Babel and
// can't import project source directly without extra build tooling.
const toSlug = (title) =>
  String(title)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

function readEnvFile() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      })
  );
}

async function fetchProjects() {
  const env = { ...readEnvFile(), ...process.env };
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[sitemap] No Supabase credentials found — writing a homepage-only sitemap.");
    return [];
  }
  try {
    const res = await fetch(`${url}/rest/v1/projects?select=Title,created_at`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    // A CI placeholder URL, an outage, or a network-less sandbox all land here — never fail the build over it.
    console.warn(`[sitemap] Could not fetch projects (${error.message}) — writing a homepage-only sitemap.`);
    return [];
  }
}

const urls = [{ loc: `${SITE_URL}/`, priority: "1.0", changefreq: "weekly" }];

for (const project of await fetchProjects()) {
  if (!project?.Title) continue;
  urls.push({
    loc: `${SITE_URL}/project/${toSlug(project.Title)}`,
    priority: "0.7",
    changefreq: "monthly",
    lastmod: project.created_at ? project.created_at.slice(0, 10) : undefined,
  });
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
  )
  .join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(root, "public/sitemap.xml"), xml);
console.log(`[sitemap] Wrote ${urls.length} URL(s) to public/sitemap.xml`);
