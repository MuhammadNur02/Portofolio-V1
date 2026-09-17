import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import {
  Plus,
  Trash2,
  Upload,
  History,
  X,
  Pencil,
  GraduationCap,
  Briefcase,
  Award,
} from "lucide-react";

const TYPE_OPTIONS = [
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "work", label: "Work", icon: Briefcase },
  { value: "organization", label: "Organization", icon: Award },
];

const TYPE_ICON = Object.fromEntries(TYPE_OPTIONS.map((t) => [t.value, t.icon]));

const Card = ({ children, className = "" }) => (
  <div className={`relative group ${className}`}>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-500" />
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/12 rounded-2xl h-full">
      {children}
    </div>
  </div>
);

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) => (
  <div className="space-y-1.5">
    <label className="text-xs text-indigo-300/70 uppercase tracking-wider font-medium">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full bg-[#0d0d22] border border-white/10 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-600 text-sm outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
    />
  </div>
);

const SkeletonCard = () => (
  <div className="relative">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10" />
    <div className="relative bg-white/5 border border-white/12 rounded-2xl p-4 flex flex-col gap-3">
      <div className="h-4 bg-white/5 animate-pulse rounded-lg w-1/3" />
      <div className="h-4 bg-white/5 animate-pulse rounded-lg w-2/3" />
      <div className="h-3 bg-white/5 animate-pulse rounded-lg w-1/2" />
      <div className="h-3 bg-white/5 animate-pulse rounded-lg w-full" />
    </div>
  </div>
);

const ExperienceCard = ({ item, onDelete, onEdit }) => {
  const Icon = TYPE_ICON[item.type] || Briefcase;
  return (
    <Card>
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-indigo-300" />
          </div>
          <span className="text-xs text-indigo-300/80 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2.5 py-1">
            {item.period}
          </span>
        </div>
        <h3 className="font-semibold text-white text-sm mb-0.5">
          {item.role}
        </h3>
        <p className="text-gray-500 text-xs mb-2">{item.place}</p>
        {item.description && (
          <p className="text-gray-400 text-xs mb-3 line-clamp-3 leading-relaxed">
            {item.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-white/8">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">
            Urutan: {item.order_index ?? 0}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/10 text-xs transition-colors"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={() => onDelete(item.id)}
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
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-20 pointer-events-none" />
      <div className="relative bg-[#0a0a1a] border border-white/12 rounded-2xl flex flex-col overflow-hidden">
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

const ExperienceForm = ({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save Entry",
  uploading,
}) => {
  const [form, setForm] = useState({
    type: initial?.type || "education",
    role: initial?.role || "",
    place: initial?.place || "",
    period: initial?.period || "",
    description: initial?.description || "",
    order_index: initial?.order_index ?? 0,
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...form, order_index: Number(form.order_index) || 0 });
      }}
      className="p-5 sm:p-6 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs text-indigo-300/70 uppercase tracking-wider font-medium">
            Type
          </label>
          <div className="flex gap-2">
            {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: value }))}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                  form.type === value
                    ? "border-indigo-500/50 bg-indigo-500/15 text-white"
                    : "border-white/10 bg-[#0d0d22] text-gray-500 hover:text-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        <InputField
          label="Role / Title"
          value={form.role}
          onChange={set("role")}
          placeholder="e.g. S1 Pendidikan Informatika"
          required
        />
        <InputField
          label="Place / Institution"
          value={form.place}
          onChange={set("place")}
          placeholder="e.g. Universitas Ivet Semarang"
          required
        />
        <InputField
          label="Period"
          value={form.period}
          onChange={set("period")}
          placeholder="e.g. 2022 — Sekarang"
          required
        />
        <InputField
          label="Sort Order (kecil tampil dulu)"
          type="number"
          value={form.order_index}
          onChange={set("order_index")}
          placeholder="0"
        />

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs text-indigo-300/70 uppercase tracking-wider font-medium">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={set("description")}
            placeholder="Ringkasan singkat pencapaian/tanggung jawab di entri ini..."
            rows={3}
            className="w-full bg-[#0d0d22] border border-white/10 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-600 text-sm outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none"
          />
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
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4f52c9] to-[#8644c5] rounded-xl opacity-60 blur group-hover/s:opacity-100 transition duration-300" />
          <div className="relative flex items-center gap-2 px-5 py-2 bg-[#030014] rounded-xl border border-white/10">
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4 text-indigo-400" />
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

export default function Experience() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("experience")
      .select("*")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async (form) => {
    setUploading(true);
    await supabase.from("experience").insert(form);
    setShowCreate(false);
    setUploading(false);
    fetchItems();
  };

  const handleEdit = async (form) => {
    setUploading(true);
    await supabase.from("experience").update(form).eq("id", editItem.id);
    setEditItem(null);
    setUploading(false);
    fetchItems();
  };

  const deleteItem = async (id) => {
    if (!confirm("Delete this entry?")) return;
    await supabase.from("experience").delete().eq("id", id);
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-xl blur opacity-50" />
            <div className="relative w-9 h-9 bg-[#030014] rounded-xl border border-white/15 flex items-center justify-center">
              <History className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Experience & Education
            </h1>
            <p className="text-gray-500 text-xs">
              {loading ? "Loading..." : `${items.length} entries total`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="relative group shrink-0"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4f52c9] to-[#8644c5] rounded-xl opacity-50 blur group-hover:opacity-80 transition duration-300" />
          <div className="relative flex items-center gap-2 px-4 py-2.5 bg-[#030014] rounded-xl border border-white/10">
            <Plus className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-gray-200">New Entry</span>
          </div>
        </button>
      </div>

      {showCreate && (
        <Modal title="Add Experience/Education" onClose={() => setShowCreate(false)}>
          <ExperienceForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            submitLabel="Save Entry"
            uploading={uploading}
          />
        </Modal>
      )}

      {editItem && (
        <Modal title="Edit Entry" onClose={() => setEditItem(null)}>
          <ExperienceForm
            initial={editItem}
            onSubmit={handleEdit}
            onCancel={() => setEditItem(null)}
            submitLabel="Update Entry"
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
            <History className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No entries yet. Add your education, work, or organization history!
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
            <ExperienceCard
              key={item.id}
              item={item}
              onDelete={deleteItem}
              onEdit={setEditItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
