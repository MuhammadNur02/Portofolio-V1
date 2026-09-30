import { useEffect, useState } from "react";
import { loadClient } from "./useCollection";
import { getDeviceTraits, getVisitorId } from "../utils/visitorId";

// The last total this browser saw. Shown straight away on the next visit, so the number does not pop
// in (and nudge the navbar links) once the request returns.
const COUNT_KEY = "visitor-count";

const readCachedCount = () => {
  try {
    return Number(localStorage.getItem(COUNT_KEY)) || null;
  } catch {
    return null;
  }
};

// One call per page load, shared by every component that shows the number. The database decides
// whether this device is new (supabase/visitors.sql) and answers with the total — the browser never
// sends a count of its own.
let request;
function recordVisit() {
  if (!request) {
    request = Promise.all([loadClient(), getDeviceTraits()])
      .then(([db, traits]) => db.rpc("record_visit", { p_device_id: getVisitorId(), p_traits: traits }))
      .then(({ data, error }) => {
        if (error) return null; // e.g. visitors.sql has not been run yet: the counter stays hidden
        try {
          localStorage.setItem(COUNT_KEY, String(data));
        } catch {
          /* the cache is only a nicety */
        }
        return data;
      })
      .catch(() => null);
  }
  return request;
}

/** @returns {number | null} devices that have opened the site, or null while unknown */
export function useVisitorCount() {
  const [count, setCount] = useState(readCachedCount);

  useEffect(() => {
    let active = true;
    recordVisit().then((total) => {
      if (active && total != null) setCount(total);
    });
    return () => {
      active = false;
    };
  }, []);

  return count;
}
