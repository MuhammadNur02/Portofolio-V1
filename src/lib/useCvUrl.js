import { useEffect, useState } from "react";
import { SITE } from "../config/site";

// The CV uploaded from the dashboard (supabase/cv.sql). Until one exists, the buttons keep using SITE.cvUrl.
export const CV_PUBLIC_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/cv/cv.pdf`;

const KEY = "cv-uploaded";
const read = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

let check; // one HEAD request per page load, shared by every button
const probe = () => {
  check ??= fetch(CV_PUBLIC_URL, { method: "HEAD" })
    .then((res) => res.ok)
    .catch(() => false)
    .then((ok) => {
      try {
        localStorage.setItem(KEY, ok ? "1" : "0");
      } catch {
        /* the cache only avoids a flicker */
      }
      return ok;
    });
  return check;
};

/** @returns {{ url: string, isPdf: boolean }} */
export function useCvUrl() {
  const [uploaded, setUploaded] = useState(read);
  useEffect(() => {
    let active = true;
    probe().then((ok) => active && setUploaded(ok));
    return () => {
      active = false;
    };
  }, []);
  return uploaded ? { url: CV_PUBLIC_URL, isPdf: true } : { url: SITE.cvUrl, isPdf: SITE.cvUrl.startsWith("/") };
}
