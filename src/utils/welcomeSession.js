// The welcome screen is shown once per browser tab/session, not on every reload or return visit.
// sessionStorage can throw (private mode, blocked storage) — then we simply show the welcome screen.
const KEY = "welcomeSeen";

export const hasSeenWelcome = () => {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export const markWelcomeSeen = () => {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
};
