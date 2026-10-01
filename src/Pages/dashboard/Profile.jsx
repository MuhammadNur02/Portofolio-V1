import { useEffect, useRef, useState } from "react";
import { supabase } from "../../supabase";
import { cropToSquare } from "../../lib/avatarCrop";
import { fetchAvatarUrl, rememberAvatar } from "../../lib/useAvatar";
import { CircleUserRound, Upload, Trash2, AlertTriangle } from "lucide-react";

// The profile photo shown in place of the logo (navbar, footer, project pages). Needs the `avatar`
// storage bucket — run supabase/avatar.sql once in the Supabase SQL editor.
const MAX_BYTES = 15 * 1024 * 1024; // before it is cropped and shrunk, so a phone photo is fine

const Card = ({ children }) => (
  <div className="relative group">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f59e0b] to-[#dc2626] rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-500" />
    <div className="relative bg-[#120c07]/60 backdrop-blur-xl border border-white/12 rounded-2xl">{children}</div>
  </div>
);

export default function Profile() {
  const [current, setCurrent] = useState(null); // URL of the photo on the site, or null
  const [loading, setLoading] = useState(true);
  const [blob, setBlob] = useState(null); // the cropped photo waiting to be uploaded
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const previewRef = useRef(null);

  const refresh = async () => {
    const url = await fetchAvatarUrl(supabase);
    if (url === undefined) setError("missing-bucket");
    rememberAvatar(url);
    setCurrent(url ?? null);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    return () => previewRef.current && URL.revokeObjectURL(previewRef.current);
  }, []);

  const clear = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setBlob(null);
    setPreview(null);
  };

  const pick = async (file) => {
    setDone("");
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError("Choose a JPG, PNG or WEBP photo.");
    if (file.size > MAX_BYTES) return setError("That photo is larger than 15 MB.");
    setError("");
    try {
      const cropped = await cropToSquare(file);
      clear();
      previewRef.current = URL.createObjectURL(cropped);
      setBlob(cropped);
      setPreview(previewRef.current);
    } catch (e) {
      setError(e.message);
    }
  };

  const upload = async () => {
    setUploading(true);
    setError("");
    const { error: uploadError } = await supabase.storage
      .from("avatar")
      .upload("avatar.webp", blob, { upsert: true, contentType: blob.type, cacheControl: "3600" });
    setUploading(false);
    if (uploadError) return setError(uploadError.message);
    clear();
    setDone("Saved. The new photo is now your logo on the site.");
    refresh();
  };

  const remove = async () => {
    if (!confirm("Remove the photo? The site goes back to the 侍 seal.")) return;
    const { error: removeError } = await supabase.storage.from("avatar").remove(["avatar.webp"]);
    if (removeError) return setError(removeError.message);
    setDone("");
    refresh();
  };

  const shown = preview || current;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f59e0b] to-[#dc2626] rounded-xl blur opacity-50" />
          <div className="relative w-9 h-9 bg-[#0a0705] rounded-xl border border-white/15 flex items-center justify-center">
            <CircleUserRound className="w-4 h-4 text-amber-400" />
          </div>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Profile Photo</h1>
          <p className="text-gray-500 text-xs">Replaces the logo in the navbar, footer and project pages</p>
        </div>
      </div>

      {error === "missing-bucket" ? (
        <Card>
          <div className="p-5 flex items-start gap-3 text-sm text-amber-200">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <p>
              The <code className="text-amber-300">avatar</code> bucket doesn&apos;t exist yet. Open Supabase → SQL Editor, paste{" "}
              <code className="text-amber-300">supabase/avatar.sql</code> and run it once.
            </p>
          </div>
        </Card>
      ) : (
        error && <p className="text-sm text-red-400">{error}</p>
      )}
      {done && <p className="text-sm text-emerald-400">{done}</p>}

      <Card>
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="shrink-0 text-center space-y-2">
            {loading ? (
              <div className="w-28 h-28 rounded-full bg-white/5 animate-pulse" />
            ) : shown ? (
              <img src={shown} alt="Profile photo" className="w-28 h-28 rounded-full object-cover ring-2 ring-amber-500/40" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-[#17110a] border border-dashed border-white/15 flex items-center justify-center">
                <CircleUserRound className="w-9 h-9 text-gray-600" />
              </div>
            )}
            <p className="text-xs text-gray-500">{preview ? "Preview (not saved yet)" : current ? "On the site now" : "No photo yet"}</p>
          </div>

          <div className="flex-1 w-full space-y-3">
            <label className="flex flex-col items-center justify-center w-full min-h-[104px] rounded-xl border-2 border-dashed border-white/12 bg-white/4 hover:border-amber-500/35 cursor-pointer text-center p-4">
              <p className="text-sm text-gray-300">Click to choose a photo</p>
              <p className="text-xs text-gray-600 mt-1">JPG, PNG or WEBP · cropped to a square and shrunk automatically</p>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => pick(e.target.files[0])} className="hidden" />
            </label>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {current && !blob && (
                <button
                  onClick={remove}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs"
                >
                  <Trash2 className="w-3 h-3" /> Remove photo
                </button>
              )}
              {blob && (
                <>
                  <button onClick={clear} className="px-3 py-1.5 rounded-xl border border-white/10 text-gray-500 hover:text-white text-xs transition-colors">
                    Cancel
                  </button>
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
                    {uploading ? "Saving..." : "Save photo"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
