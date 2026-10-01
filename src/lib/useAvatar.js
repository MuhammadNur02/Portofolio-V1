import { useEffect, useState } from "react";
import { loadClient } from "./useCollection";

// The profile photo uploaded from the dashboard (supabase/avatar.sql). Until one exists the site keeps
// showing the 侍 seal. The bucket is asked what it holds — rather than guessing the file's URL — so a
// visitor never hits a 404, and the file's own timestamp goes into the URL: a replaced photo shows up
// straight away instead of after the CDN cache expires.
const FILE = "avatar.webp";
const KEY = "avatar-url"; // last answer, remembered so the next visit draws the right logo at once: a URL or "none"

const readCache = () => {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === null ? undefined : saved === "none" ? null : saved;
  } catch {
    return undefined;
  }
};

const writeCache = (url) => {
  try {
    localStorage.setItem(KEY, url ?? "none");
  } catch {
    /* the cache only avoids a flicker */
  }
};

/** @returns {Promise<string | null | undefined>} the photo's URL, null if there is none, undefined if unknown */
export async function fetchAvatarUrl(db) {
  const { data, error } = await db.storage.from("avatar").list("", { limit: 100, search: "avatar" });
  if (error) return undefined;
  const file = data?.find((object) => object.name === FILE);
  if (!file) return null;
  const { publicUrl } = db.storage.from("avatar").getPublicUrl(FILE).data;
  return `${publicUrl}?v=${encodeURIComponent(file.updated_at ?? file.created_at ?? "")}`;
}

let lookup; // one request per page load, shared by every logo on the page

/** Called by the dashboard after the photo changed, so the next logo drawn uses the new answer. */
export function rememberAvatar(url) {
  lookup = undefined;
  if (url !== undefined) writeCache(url);
}

/** @returns {string | null | undefined} the photo's URL; null = none uploaded; undefined = not known yet */
export function useAvatar() {
  const [url, setUrl] = useState(readCache);

  useEffect(() => {
    let active = true;
    lookup ??= loadClient().then(fetchAvatarUrl).catch(() => undefined);
    lookup.then((answer) => {
      if (!active) return;
      if (answer === undefined) {
        // The lookup failed (offline, or the bucket doesn't exist yet): keep what was remembered, and
        // with nothing remembered show the seal rather than leaving an empty circle. Not cached.
        setUrl((known) => (known === undefined ? null : known));
        return;
      }
      writeCache(answer);
      setUrl(answer);
    });
    return () => {
      active = false;
    };
  }, []);

  return url;
}
