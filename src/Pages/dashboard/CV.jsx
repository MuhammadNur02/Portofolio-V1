import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { CV_PUBLIC_URL } from "../../lib/useCvUrl";
import { FileText, Upload, Trash2, ExternalLink, AlertTriangle } from "lucide-react";

// The PDF behind every "Download CV" button. Needs the `cv` storage bucket — run supabase/cv.sql once.
const MAX_BYTES = 5 * 1024 * 1024;

const Card = ({ children }) => (
  <div className="relative group">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f59e0b] to-[#dc2626] rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-500" />
    <div className="relative bg-[#120c07]/60 backdrop-blur-xl border border-white/12 rounded-2xl">{children}</div>
  </div>
);

export default function CV() {
  const [current, setCurrent] = useState(null); // { updated_at, size } | null
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const refresh = async () => {
    const { data, error: listError } = await supabase.storage.from("cv").list("", { search: "cv.pdf" });
    if (listError) setError(listError.message.toLowerCase().includes("not found") ? "missing-bucket" : listError.message);
    const found = data?.find((o) => o.name === "cv.pdf");
    setCurrent(found ? { updated_at: found.updated_at, size: found.metadata?.size } : null);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const pick = (f) => {
    setDone(false);
    if (!f) return;
    if (f.type !== "application/pdf") return setError("Only PDF files are accepted.");
    if (f.size > MAX_BYTES) return setError("The PDF is larger than 5 MB.");
    setError("");
    setFile(f);
  };

  const upload = async () => {
    setUploading(true);
    setError("");
    const { error: uploadError } = await supabase.storage
      .from("cv")
      .upload("cv.pdf", file, { upsert: true, contentType: "application/pdf", cacheControl: "60" });
    setUploading(false);
    if (uploadError) return setError(uploadError.message);
    try {
      localStorage.setItem("cv-uploaded", "1");
    } catch {
      /* ignore */
    }
    setFile(null);
    setDone(true);
    refresh();
  };

  const remove = async () => {
    if (!confirm("Delete the CV? The buttons will go back to the fallback link.")) return;
    const { error: removeError } = await supabase.storage.from("cv").remove(["cv.pdf"]);
    if (removeError) return setError(removeError.message);
    try {
      localStorage.setItem("cv-uploaded", "0");
    } catch {
      /* ignore */
    }
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f59e0b] to-[#dc2626] rounded-xl blur opacity-50" />
          <div className="relative w-9 h-9 bg-[#0a0705] rounded-xl border border-white/15 flex items-center justify-center">
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">CV</h1>
          <p className="text-gray-500 text-xs">The PDF behind every &quot;Download CV&quot; button</p>
        </div>
      </div>

      {error === "missing-bucket" ? (
        <Card>
          <div className="p-5 flex items-start gap-3 text-sm text-amber-200">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <p>
              The <code className="text-amber-300">cv</code> bucket doesn&apos;t exist yet. Open Supabase → SQL Editor, paste{" "}
              <code className="text-amber-300">supabase/cv.sql</code> and run it once.
            </p>
          </div>
        </Card>
      ) : (
        error && <p className="text-sm text-red-400">{error}</p>
      )}
      {done && <p className="text-sm text-emerald-400">Uploaded. The site now links to this PDF.</p>}

      <Card>
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Current CV</p>
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : current ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-300">
                cv.pdf
                {current.size ? ` · ${(current.size / 1024).toFixed(0)} KB` : ""}
                {current.updated_at ? ` · updated ${new Date(current.updated_at).toLocaleDateString()}` : ""}
              </p>
              <div className="flex gap-2">
                <a
                  href={`${CV_PUBLIC_URL}?t=${Date.now()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:text-white text-xs"
                >
                  <ExternalLink className="w-3 h-3" /> Open
                </a>
                <button
                  onClick={remove}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">None uploaded yet — the buttons use the fallback link from src/config/site.js.</p>
          )}

          <label className="flex flex-col items-center justify-center w-full min-h-[120px] rounded-xl border-2 border-dashed border-white/12 bg-white/4 hover:border-amber-500/35 cursor-pointer text-center p-4">
            <FileText className="w-5 h-5 text-amber-400 mb-2" />
            <p className="text-sm text-gray-300">{file ? file.name : "Click to choose a PDF"}</p>
            <p className="text-xs text-gray-600 mt-1">PDF only · max 5 MB · replaces the current CV</p>
            <input type="file" accept="application/pdf" onChange={(e) => pick(e.target.files[0])} className="hidden" />
          </label>

          {file && (
            <div className="flex justify-end">
              <button
                onClick={upload}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-1.5 bg-[#0a0705] rounded-xl border border-amber-500/40 text-xs text-gray-200 hover:border-amber-400 disabled:opacity-50"
              >
                {uploading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                )}
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
