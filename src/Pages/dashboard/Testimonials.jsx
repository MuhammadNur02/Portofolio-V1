import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { compressImage, safeFileName } from "../../lib/compressImage";
import { PHOTO_BUCKET, testimonialDesignation, testimonialPhoto } from "../../lib/testimonials";
import { translations } from "../../translations";
import { toSlug } from "../../utils/slug";
import Stars from "../../components/ui/Stars";
import {
  Plus,
  Trash2,
  Upload,
  MessageSquareQuote,
  X,
  Pencil,
  ImageIcon,
  FolderOpen,
  ExternalLink,
} from "lucide-react";

const RELATION_LABELS = translations.en.testimonialForm.relations;

const Card = ({ children, className = "" }) => (
  <div className={`relative group ${className}`}>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f59e0b] to-[#dc2626] rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-500" />
    <div className="relative bg-[#120c07]/60 backdrop-blur-xl border border-white/12 rounded-2xl h-full">
      {children}
    </div>
  </div>
);

const InputField = ({ label, value, onChange, placeholder, required = false }) => (
  <div className="space-y-1.5">
    <label className="text-xs text-amber-300/70 uppercase tracking-wider font-medium">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full bg-[#17110a] border border-white/10 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-600 text-sm outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
    />
  </div>
);

const SkeletonCard = () => (
  <div className="relative">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f59e0b] to-[#dc2626] rounded-2xl blur opacity-10" />
    <div className="relative bg-[#120c07]/60 border border-white/12 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse shrink-0" />
        <div className="h-4 bg-white/5 animate-pulse rounded-lg w-1/2" />
      </div>
      <div className="h-3 bg-white/5 animate-pulse rounded-lg w-full" />
      <div className="h-3 bg-white/5 animate-pulse rounded-lg w-4/5" />
    </div>
  </div>
);

const Avatar = ({ item, size = "w-10 h-10" }) => {
  const photo = testimonialPhoto(item);
  if (photo) {
    return (
      <img
        src={photo}
        alt={item.name}
        className={`${size} rounded-full object-cover border border-white/10 shrink-0`}
      />
    );
  }
  const initial = (item.name || "?").trim().charAt(0).toUpperCase();
  return (
    <div
      className={`${size} rounded-full bg-gradient-to-br from-amber-500/30 to-red-500/30 border border-white/10 flex items-center justify-center text-amber-200 font-semibold shrink-0`}
    >
      {initial}
    </div>
  );
};

const TestimonialCard = ({ item, project, onDelete, onEdit }) => {
  const fromForm = item.source === "form";
  return (
  <Card>
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-3">
        <Avatar item={item} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm truncate">
            {item.name}
          </h3>
          <p className="text-gray-500 text-xs truncate">{testimonialDesignation(item, RELATION_LABELS)}</p>
        </div>
        {fromForm && (
          <span title="Sent by the person themselves through the public form" className="shrink-0 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
            Form
          </span>
        )}
      </div>
      {(item.rating || project) && (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {item.rating && <Stars value={item.rating} label={`${item.rating} out of 5 stars`} starClassName="h-3.5 w-3.5" />}
          {project && (
            <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-gray-400">
              <FolderOpen className="h-3 w-3 shrink-0 text-amber-400" />
              <span className="truncate">{project.Title}</span>
            </span>
          )}
        </div>
      )}
      <p className="text-gray-400 text-xs mb-3 line-clamp-4 leading-relaxed flex-1">
        "{item.quote}"
      </p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-white/8">
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">
          {fromForm && item.created_at ? new Date(item.created_at).toLocaleDateString() : `Urutan: ${item.order_index ?? 0}`}
        </span>
        <div className="flex gap-2">
          {fromForm ? (
            project && (
              <a
                href={`/project/${toSlug(project.Title)}#testimoni`}
                target="_blank"
                rel="noopener noreferrer"
                title="See it on the project page"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-xs transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> View
              </a>
            )
          ) : (
          <button
            onClick={() => onEdit(item)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/25 text-amber-400 hover:bg-amber-500/10 text-xs transition-colors"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
          )}
          <button
            onClick={() => onDelete(item)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>
    </div>
  </Card>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
    <div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    />
    <div
      className="relative z-10 w-full max-w-2xl flex flex-col"
      style={{ maxHeight: "calc(100vh - 24px)" }}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f59e0b] to-[#dc2626] rounded-2xl blur opacity-20 pointer-events-none" />
      <div className="relative bg-[#130d08] border border-white/12 rounded-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  </div>
);

const TestimonialForm = ({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save Testimonial",
  uploading,
}) => {
  const [form, setForm] = useState({
    name: initial?.name || "",
    role: initial?.role || "",
    quote: initial?.quote || "",
    order_index: initial?.order_index ?? 0,
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initial?.avatar || null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...form, order_index: Number(form.order_index) || 0 }, file);
      }}
      className="p-5 sm:p-6 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Name"
          value={form.name}
          onChange={set("name")}
          placeholder="e.g. Budi Santoso"
          required
        />
        <InputField
          label="Role / Relation"
          value={form.role}
          onChange={set("role")}
          placeholder="e.g. Dosen Pembimbing"
          required
        />

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs text-amber-300/70 uppercase tracking-wider font-medium">
            Quote
          </label>
          <textarea
            value={form.quote}
            onChange={set("quote")}
            placeholder="Kutipan testimoni..."
            rows={3}
            required
            className="w-full bg-[#17110a] border border-white/10 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-600 text-sm outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none"
          />
        </div>

        <InputField
          label="Sort Order (kecil tampil dulu)"
          value={form.order_index}
          onChange={set("order_index")}
          placeholder="0"
        />

        <div className="space-y-1.5">
          <label className="text-xs text-amber-300/70 uppercase tracking-wider font-medium">
            Avatar (opsional)
          </label>
          <label className="flex items-center gap-3 w-full bg-[#17110a] border border-dashed border-white/15 rounded-xl px-3 py-2.5 cursor-pointer hover:border-amber-500/40 hover:bg-white/4 transition-all">
            {preview ? (
              <img
                src={preview}
                className="h-9 w-9 object-cover rounded-full border border-white/10"
                alt="preview"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <ImageIcon className="w-4 h-4 text-gray-600" />
              </div>
            )}
            <p className="text-xs text-gray-400">
              {preview ? "Ganti foto" : "Upload foto (opsional)"}
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm transition-colors"
        >
          Cancel
        </button>
        <button type="submit" disabled={uploading} className="relative group/s">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#d97706] to-[#b91c1c] rounded-xl opacity-60 blur group-hover/s:opacity-100 transition duration-300" />
          <div className="relative flex items-center gap-2 px-5 py-2 bg-[#0a0705] rounded-xl border border-white/10">
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-sm text-gray-200">
              {uploading ? "Saving..." : submitLabel}
            </span>
          </div>
        </button>
      </div>
    </form>
  );
};

export default function Testimonials() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    const [{ data }, { data: projectRows }] = await Promise.all([
      supabase
        .from("testimonials")
        .select("*")
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase.from("projects").select("id, Title"),
    ]);
    setItems(data || []);
    setProjects(new Map((projectRows || []).map((p) => [p.id, p])));
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const uploadAvatar = async (original) => {
    const f = await compressImage(original, { maxSize: 512 });
    const fileName = `${Date.now()}-${safeFileName(f.name)}`;
    const { error } = await supabase.storage.from("testimonial-images").upload(fileName, f);
    if (error) {
      alert(`Avatar upload failed: ${error.message}`);
      return null;
    }
    const { data } = supabase.storage
      .from("testimonial-images")
      .getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleCreate = async (form, file) => {
    setUploading(true);
    let avatarUrl = null;
    if (file) {
      avatarUrl = await uploadAvatar(file);
      if (!avatarUrl) return setUploading(false);
    }
    await supabase.from("testimonials").insert({ ...form, avatar: avatarUrl });
    setShowCreate(false);
    setUploading(false);
    fetchItems();
  };

  const handleEdit = async (form, file) => {
    setUploading(true);
    let avatarUrl = editItem.avatar || null;
    if (file) {
      avatarUrl = await uploadAvatar(file);
      if (!avatarUrl) return setUploading(false);
    }
    await supabase
      .from("testimonials")
      .update({ ...form, avatar: avatarUrl })
      .eq("id", editItem.id);
    setEditItem(null);
    setUploading(false);
    fetchItems();
  };

  const deleteItem = async (item) => {
    if (!confirm("Delete this testimonial?")) return;
    await supabase.from("testimonials").delete().eq("id", item.id);
    // A photo sent through the form belongs to that testimonial only.
    if (item.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([item.photo_path]);
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f59e0b] to-[#dc2626] rounded-xl blur opacity-50" />
            <div className="relative w-9 h-9 bg-[#0a0705] rounded-xl border border-white/15 flex items-center justify-center">
              <MessageSquareQuote className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Testimonials
            </h1>
            <p className="text-gray-500 text-xs">
              {loading ? "Loading..." : `${items.length} testimonials total`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="relative group shrink-0"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#d97706] to-[#b91c1c] rounded-xl opacity-50 blur group-hover:opacity-80 transition duration-300" />
          <div className="relative flex items-center gap-2 px-4 py-2.5 bg-[#0a0705] rounded-xl border border-white/10">
            <Plus className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-gray-200">New Testimonial</span>
          </div>
        </button>
      </div>

      {showCreate && (
        <Modal title="Add Testimonial" onClose={() => setShowCreate(false)}>
          <TestimonialForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            submitLabel="Save Testimonial"
            uploading={uploading}
          />
        </Modal>
      )}

      {editItem && (
        <Modal title="Edit Testimonial" onClose={() => setEditItem(null)}>
          <TestimonialForm
            initial={editItem}
            onSubmit={handleEdit}
            onCancel={() => setEditItem(null)}
            submitLabel="Update Testimonial"
            uploading={uploading}
          />
        </Modal>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <div className="p-16 text-center">
            <MessageSquareQuote className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No testimonials yet. Add your first one!
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
            <TestimonialCard
              key={item.id}
              item={item}
              project={projects.get(item.project_id)}
              onDelete={deleteItem}
              onEdit={setEditItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
