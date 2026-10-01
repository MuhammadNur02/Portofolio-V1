import { describe, it, expect } from "vitest";
import {
  averageRating,
  serverErrorKey,
  testimonialDesignation,
  testimonialPhoto,
  toSubmission,
  validateTestimonial,
} from "./testimonials";

const VALID = {
  name: "Adi Nova Trisetiyanto",
  relation: "lecturer",
  relationOther: "",
  institution: "Universitas Ivet Semarang",
  projectId: "1",
  rating: 5,
  quote: "Websitenya rapi, cepat, dan mudah dikelola lewat dashboard.",
  photo: { size: 1 },
  consent: true,
};

describe("validateTestimonial", () => {
  it("accepts a complete form", () => {
    expect(validateTestimonial(VALID)).toEqual({});
  });

  it("reports every missing required field at once", () => {
    expect(validateTestimonial({})).toEqual({
      name: "name",
      relation: "relation",
      project: "project",
      rating: "rating",
      quote: "quoteShort",
      photo: "photo",
      consent: "consent",
    });
  });

  it("requires the relation to be spelled out when 'other' is chosen", () => {
    expect(validateTestimonial({ ...VALID, relation: "other", relationOther: " " }).relation).toBe("relationOther");
    expect(validateTestimonial({ ...VALID, relation: "other", relationOther: "Mentor" })).toEqual({});
  });

  it("checks lengths the same way the database does", () => {
    expect(validateTestimonial({ ...VALID, name: "A" }).name).toBe("name");
    expect(validateTestimonial({ ...VALID, name: "x".repeat(61) }).name).toBe("name");
    expect(validateTestimonial({ ...VALID, institution: "x".repeat(81) }).institution).toBe("institution");
    expect(validateTestimonial({ ...VALID, quote: "Bagus." }).quote).toBe("quoteShort");
    expect(validateTestimonial({ ...VALID, quote: "x".repeat(601) }).quote).toBe("quoteLong");
  });

  it("counts the message after trimming, so spaces can't pad it to the minimum", () => {
    expect(validateTestimonial({ ...VALID, quote: `   ${"a".repeat(19)}          ` }).quote).toBe("quoteShort");
  });

  it("refuses links in the message", () => {
    expect(validateTestimonial({ ...VALID, quote: "Mantap sekali, kunjungi https://spam.example ya" }).quote).toBe("links");
    expect(validateTestimonial({ ...VALID, quote: "Mantap sekali, kunjungi www.spam.example ya" }).quote).toBe("links");
  });

  it("only accepts a rating from 1 to 5", () => {
    expect(validateTestimonial({ ...VALID, rating: 0 }).rating).toBe("rating");
    expect(validateTestimonial({ ...VALID, rating: 6 }).rating).toBe("rating");
    expect(validateTestimonial({ ...VALID, rating: 1 }).rating).toBeUndefined();
  });
});

describe("toSubmission", () => {
  it("tidies the text and sends the custom relation in place of 'other'", () => {
    expect(
      toSubmission({ ...VALID, name: "  Adi   Nova ", relation: "other", relationOther: " Mentor  magang ", quote: "  Sangat membantu proyek kami.  " }, "form/a.webp")
    ).toEqual({
      p_name: "Adi Nova",
      p_relation: "Mentor magang",
      p_institution: "Universitas Ivet Semarang",
      p_project_id: 1,
      p_rating: 5,
      p_quote: "Sangat membantu proyek kami.",
      p_photo_path: "form/a.webp",
    });
  });
});

describe("presenting a testimonial", () => {
  const labels = { lecturer: "Dosen", student: "Mahasiswa", client: "Klien", colleague: "Rekan kerja" };

  it("builds the photo URL for form rows and keeps the full URL of dashboard rows", () => {
    expect(testimonialPhoto({ photo_path: "form/a.webp" }, "https://x.supabase.co")).toBe(
      "https://x.supabase.co/storage/v1/object/public/testimonial-photos/form/a.webp"
    );
    expect(testimonialPhoto({ avatar: "https://cdn/a.jpg", photo_path: "form/a.webp" })).toBe("https://cdn/a.jpg");
    expect(testimonialPhoto({})).toBe(null);
  });

  it("translates the relation and adds the institution", () => {
    expect(testimonialDesignation({ relation: "lecturer", role: "UNISVET" }, labels)).toBe("Dosen · UNISVET");
    expect(testimonialDesignation({ relation: "client", role: "" }, labels)).toBe("Klien");
    expect(testimonialDesignation({ relation: "Mentor magang", role: "" }, labels)).toBe("Mentor magang");
    expect(testimonialDesignation({ role: "Mahasiswa Unisvet" }, labels)).toBe("Mahasiswa Unisvet");
  });

  it("averages only the rated testimonials, to one decimal", () => {
    expect(averageRating([{ rating: 5 }, { rating: 4 }, { rating: 4 }, { rating: null }, {}])).toEqual({ value: 4.3, count: 3 });
    expect(averageRating([{ rating: null }])).toBe(null);
    expect(averageRating([])).toBe(null);
  });
});

describe("serverErrorKey", () => {
  it("maps the database's error codes to messages the form can show", () => {
    expect(serverErrorKey({ message: "rate_limited" })).toBe("rateLimited");
    expect(serverErrorKey({ message: "invalid_photo" })).toBe("photoUpload");
    expect(serverErrorKey({ message: "Failed to fetch" })).toBe("generic");
    expect(serverErrorKey(null)).toBe("generic");
  });
});
