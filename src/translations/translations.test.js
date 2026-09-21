import { describe, it, expect } from "vitest";
import { translations } from "./index";

// "hero.words" -> every leaf path in a nested translation object.
const leafPaths = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? leafPaths(value, `${prefix}${key}.`)
      : [`${prefix}${key}`]
  );

const valueAt = (obj, path) => path.split(".").reduce((node, key) => node?.[key], obj);

describe("translations", () => {
  const idPaths = leafPaths(translations.id).sort();
  const enPaths = leafPaths(translations.en).sort();

  it("Indonesian and English define exactly the same keys", () => {
    expect(enPaths.filter((p) => !idPaths.includes(p))).toEqual([]); // only in English
    expect(idPaths.filter((p) => !enPaths.includes(p))).toEqual([]); // only in Indonesian
  });

  it.each(["id", "en"])("%s has no empty strings", (lang) => {
    const empty = leafPaths(translations[lang]).filter((path) => valueAt(translations[lang], path) === "");
    expect(empty).toEqual([]);
  });

  it("has the strings the welcome screen, 404 and project-not-found views rely on", () => {
    for (const lang of ["id", "en"]) {
      const t = translations[lang];
      expect(t.welcome.skip).toBeTruthy();
      expect(t.a11y.skipToContent).toBeTruthy();
      expect(t.notFound.title).toBeTruthy();
      expect(t.notFound.backHome).toBeTruthy();
      expect(t.projectDetail.notFoundTitle).toBeTruthy();
      expect(t.contact.cooldownTitle).toBeTruthy();
    }
  });
});
