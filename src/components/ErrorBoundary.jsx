import { Component } from "react";
import { RotateCcw } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const RELOAD_KEY = "chunkReloadAt";

// After a new deploy, a tab that is still open asks for hashed chunk files that no longer exist.
const isChunkLoadError = (error) =>
  /dynamically imported module|Importing a module script failed|Loading chunk|Failed to fetch/i.test(String(error?.message || error));

function Fallback({ compact }) {
  const { t } = useLanguage();
  return (
    <div role="alert" className={compact ? "container-site py-24" : "flex min-h-screen items-center justify-center px-6"}>
      <div className="surface mx-auto max-w-md p-8 text-center">
        <p className="font-display text-xl font-bold text-washi">{t.errors.title}</p>
        <p className="mt-2 text-sm text-washi-muted">{t.errors.text}</p>
        <button type="button" onClick={() => window.location.reload()} className="btn-primary mt-6">
          <RotateCcw className="h-4 w-4" />
          {t.errors.reload}
        </button>
      </div>
    </div>
  );
}

/**
 * Keeps one failing part of the page from blanking the whole site. A stale-chunk error reloads the page
 * once (to pick up the new deploy); anything else shows a small "something went wrong" card.
 */
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error)) {
      try {
        const last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
        if (Date.now() - last > 10_000) {
          sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
          window.location.reload();
          return;
        }
      } catch {
        /* storage blocked — fall through to the fallback card */
      }
    }
    console.error(error);
  }

  render() {
    if (this.state.failed) return this.props.silent ? null : <Fallback compact={this.props.compact} />;
    return this.props.children;
  }
}

export const SectionBoundary = ({ children }) => <ErrorBoundary compact>{children}</ErrorBoundary>;
