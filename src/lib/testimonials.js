// Shared rules for testimonials: what the public form accepts (the database checks the same things
// again in supabase/testimonial-form.sql) and how a testimonial is presented on the site.

export const RELATIONS = ["lecturer", "student", "client", "colleague"];
export const PHOTO_BUCKET = "testimonial-photos";

export const LIMITS = {
  name: [2, 60],
  relation: [2, 40],
  institution: 80,
  quote: [20, 600],
  photoBytes: 15 * 1024 * 1024, // before it is cropped and shrunk in the browser
};

const tidy = (value) => (value || "").trim().replace(/\s+/g, " ");
const hasLink = (text) => /(https?:\/\/|www\.)/i.test(text);

/**
 * @param {{ name, relation, relationOther, institution, projectId, rating, quote, photo, consent }} values
 * @returns {Record<string, string>} field -> error key (empty when the form can be sent)
 */
export function validateTestimonial(values) {
  const errors = {};
  const name = tidy(values.name);
  if (name.length < LIMITS.name[0] || name.length > LIMITS.name[1]) errors.name = "name";

  if (!values.relation) errors.relation = "relation";
  else if (values.relation === "other") {
    const other = tidy(values.relationOther);
    if (other.length < LIMITS.relation[0] || other.length > LIMITS.relation[1]) errors.relation = "relationOther";
  }

  if (tidy(values.institution).length > LIMITS.institution) errors.institution = "institution";
  if (!values.projectId) errors.project = "project";
  if (!(values.rating >= 1 && values.rating <= 5)) errors.rating = "rating";

  const quote = (values.quote || "").trim();
  if (quote.length < LIMITS.quote[0]) errors.quote = "quoteShort";
  else if (quote.length > LIMITS.quote[1]) errors.quote = "quoteLong";
  else if (hasLink(quote)) errors.quote = "links";

  if (!values.photo) errors.photo = "photo";
  if (!values.consent) errors.consent = "consent";
  return errors;
}

/** The arguments of submit_testimonial(), from the form's values. */
export function toSubmission(values, photoPath) {
  return {
    p_name: tidy(values.name),
    p_relation: values.relation === "other" ? tidy(values.relationOther) : values.relation,
    p_institution: tidy(values.institution),
    p_project_id: Number(values.projectId),
    p_rating: values.rating,
    p_quote: (values.quote || "").trim(),
    p_photo_path: photoPath,
  };
}

/** Photo URL for both kinds of row: `avatar` (added in the dashboard) or `photo_path` (sent through the form). */
export function testimonialPhoto(item, supabaseUrl = import.meta.env.VITE_SUPABASE_URL) {
  if (item.avatar) return item.avatar;
  if (item.photo_path) return `${supabaseUrl}/storage/v1/object/public/${PHOTO_BUCKET}/${item.photo_path}`;
  return null;
}

/** "Dosen · Universitas Ivet Semarang". Rows from the dashboard keep their free-text role. */
export function testimonialDesignation(item, relationLabels) {
  if (!item.relation) return item.role || "";
  const relation = relationLabels[item.relation] ?? item.relation;
  return item.role ? `${relation} · ${item.role}` : relation;
}

/** @returns {{ value: number, count: number } | null} average of the rated testimonials, 1 decimal */
export function averageRating(items) {
  const ratings = items.map((item) => item.rating).filter((r) => Number.isInteger(r) && r >= 1 && r <= 5);
  if (ratings.length === 0) return null;
  const value = Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10;
  return { value, count: ratings.length };
}

/** Maps an error raised by submit_testimonial() to the form's error key. */
export function serverErrorKey(error) {
  const message = error?.message || "";
  const known = {
    invalid_name: "name",
    invalid_relation: "relationOther",
    invalid_institution: "institution",
    invalid_rating: "rating",
    invalid_quote: "quoteShort",
    no_links: "links",
    invalid_project: "project",
    invalid_photo: "photoUpload",
    rate_limited: "rateLimited",
  };
  return Object.entries(known).find(([code]) => message.includes(code))?.[1] ?? "generic";
}
