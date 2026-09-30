import { useEffect, useState } from "react";
// The Supabase client (~30 KB gzipped) is loaded on first use instead of with the initial bundle,
// so it never delays the first paint of the hero.
export const loadClient = () => import("../supabase").then((m) => m.supabase);

// Every public list the site shows, fetched once per page load and shared by every component
// that asks for it (the hero, About and Portfolio all need the project count, for example).
const QUERIES = {
  projects: (db) => db.from("projects").select("*").order("id", { ascending: false }),
  certificates: (db) => db.from("certificates").select("*").order("id", { ascending: false }),
  experience: (db) =>
    db.from("experience").select("*").order("order_index", { ascending: true }).order("created_at", { ascending: false }),
  testimonials: (db) =>
    db.from("testimonials").select("*").order("order_index", { ascending: true }).order("created_at", { ascending: false }),
  gallery: (db) =>
    db.from("gallery").select("*").order("order_index", { ascending: true }).order("created_at", { ascending: false }),
};

// Projects and certificates are also kept in localStorage: the next visit renders them instantly,
// and the project detail page can open without waiting for the network.
const CACHED = new Set(["projects", "certificates"]);

const readCache = (name) => {
  if (!CACHED.has(name)) return undefined;
  try {
    const raw = localStorage.getItem(name);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
};

const writeCache = (name, data) => {
  if (!CACHED.has(name)) return;
  try {
    localStorage.setItem(name, JSON.stringify(data));
  } catch {
    /* storage full or blocked — the cache is only a speed-up */
  }
};

// Results are shared between components and reused for a short while; after that, the next component
// to mount shows the cached rows immediately and refreshes them in the background (so edits made in
// the dashboard appear on the site without a full reload).
const FRESH_FOR_MS = 30_000;
const store = new Map(); // name -> { data, fetchedAt, promise }

function request(name) {
  const entry = store.get(name);
  if (entry?.promise) return entry.promise;
  if (entry?.data && Date.now() - entry.fetchedAt < FRESH_FOR_MS) return Promise.resolve(entry.data);

  const promise = loadClient()
    .then((db) => QUERIES[name](db))
    .then(({ data, error }) => {
      if (error) throw error;
      const rows = data || [];
      store.set(name, { data: rows, fetchedAt: Date.now(), promise: null });
      writeCache(name, rows);
      return rows;
    })
    .catch((error) => {
      // A missing table (e.g. before the gallery SQL has been run) just means "nothing to show".
      if (error?.code !== "PGRST205") console.error(`Error fetching ${name}:`, error?.message);
      store.set(name, { ...entry, promise: null }); // keep old rows; a later mount retries
      return null;
    });
  store.set(name, { ...entry, promise });
  return promise;
}

/**
 * @param {keyof typeof QUERIES} name
 * @returns {{ data: any[], loading: boolean }}
 */
export function useCollection(name) {
  const [state, setState] = useState(() => {
    const cached = store.get(name)?.data || readCache(name);
    return { data: cached || [], loading: !cached };
  });

  useEffect(() => {
    let active = true;
    request(name).then((data) => {
      if (!active) return;
      setState((prev) => ({ data: data ?? prev.data, loading: false }));
    });
    return () => {
      active = false;
    };
  }, [name]);

  return state;
}
