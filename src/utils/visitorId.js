// How this browser introduces itself to the visitor counter (supabase/visitors.sql). The database
// combines both values below with what it sees on the request itself (network address, browser) and
// only counts a device when all of it is new — so neither value can add a visitor on its own.

// A random id this browser keeps: recognises a returning device even after its IP address changes.
// Clearing it, or opening a private window, does not count as a new visitor.
const KEY = "visitor-id";

export const getVisitorId = () => {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null; // storage blocked or a very old browser: the database falls back to its own fingerprint
  }
};

// What tells two devices apart when they share a Wi-Fi and run the same browser build (every Android
// phone on the same Chrome version sends an identical user-agent): the screen size, the same in either
// orientation, and the device model where the browser offers it.
export const getDeviceTraits = async () => {
  try {
    const size = [screen.width, screen.height].sort((a, b) => a - b).join("x");
    const model = await navigator.userAgentData?.getHighEntropyValues(["model"]).then(
      (values) => values.model,
      () => ""
    );
    return [size, model].filter(Boolean).join(" ");
  } catch {
    return "";
  }
};
