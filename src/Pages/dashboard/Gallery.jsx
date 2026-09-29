import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { compressImage, safeFileName } from "../../lib/compressImage";
import { Images, Upload, Trash2, ImageIcon, Plus, AlertTriangle } from "lucide-react";

// Activity photos for the public "Gallery" section. Needs the `gallery` table and `gallery-images`
// storage bucket — run supabase/gallery.sql once in the Supabase SQL editor.

const Card = ({ children, className = "" }) => (
  <div className={`relative group ${className}`}>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f59e0b] to-[#dc2626] rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-500" />
    <div className="relative bg-[#120c07]/60 backdrop-blur-xl border border-white/12 rounded-2xl h-full">{children}</div>
  </div>
);

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) setError(error.code === "PGRST205" ? "missing-table" : error.message);
    else setError("");
    setPhotos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleFile = (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    setCaption("");
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    const f = await compressImage(file);
    const fileName = `gallery-${Date.now()}-${safeFileName(f.name)}`;
    const { error: uploadError } = await supabase.storage.from("gallery-images").upload(fileName, f);
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("gallery-images").getPublicUrl(fileName);
    const { error: insertError } = await supabase
      .from("gallery")
      .insert({ image_url: data.publicUrl, caption: caption.trim() || null, order_index: photos.length });
    if (insertError) setError(insertError.message);
    setUploading(false);
    clear();
    fetchPhotos();
  };

  const remove = async (id) => {
    if (!confirm("Delete this photo?")) return;
    await supabase.from("gallery").delete().eq("id", id);
    fetchPhotos();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f59e0b] to-[#dc2626] rounded-xl blur opacity-50" />
          <div className="relative w-9 h-9 bg-[#0a0705] rounded-xl border border-white/15 flex items-center justify-center">
            <Images className="w-4 h-4 text-amber-400" />
          </div>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Gallery</h1>
          <p className="text-gray-500 text-xs">{loading ? "Loading..." : `${photos.length} photos · shown in the "Galeri Kegiatan" section`}</p>
        </div>
      </div>

      {error === "missing-table" ? (
        <Card>
          <div className="p-5 flex items-start gap-3 text-sm text-amber-200">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <p>
              The <code className="text-amber-300">gallery</code> table doesn&apos;t exist yet. Open Supabase → SQL Editor, paste the
              contents of <code className="text-amber-300">supabase/gallery.sql</code> from the project, and run it once.
            </p>
          </div>
        </Card>
      ) : (
        error && <p className="text-sm text-red-400">{error}</p>
      )}

      <Card>
        <div className="p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-400" /> Upload Photo
          </h2>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files[0]);
            }}
            className={`flex flex-col items-center justify-center w-full min-h-[160px] rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
              dragOver ? "border-amber-400/60 bg-amber-500/10" : "border-white/12 bg-white/4 hover:border-amber-500/35 hover:bg-white/7"
            }`}
          >
            {preview ? (
              <img src={preview} alt="preview" className="max-h-48 object-contain rounded-lg p-2" />
            ) : (
              <div className="text-center space-y-2 p-6">
                <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                  <ImageIcon className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-sm text-gray-300">Drag & drop or click to upload</p>
                <p className="text-xs text-gray-600">Portrait photos (3:4) look best · JPG, PNG, WEBP</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} className="hidden" />
          </label>

          {file && (
            <div className="space-y-3">
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption (optional), e.g. Hackathon UNISVET 2025"
                maxLength={80}
                className="w-full bg-[#17110a] border border-white/10 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-600 text-sm outline-none focus:border-amber-500/60"
              />
              <div className="flex items-center justify-end gap-2">
                <button onClick={clear} className="px-3 py-1.5 rounded-xl border border-white/10 text-gray-500 hover:text-white text-xs transition-colors">
                  Clear
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
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {!loading && photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group rounded-2xl overflow-hidden border border-white/12 bg-[#120c07]/60">
              <img src={photo.image_url} alt={photo.caption || ""} className="w-full aspect-[3/4] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end gap-2 p-3">
                {photo.caption && <p className="text-xs text-gray-200 line-clamp-2">{photo.caption}</p>}
                <button
                  onClick={() => remove(photo.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs justify-center hover:bg-red-500/30"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
