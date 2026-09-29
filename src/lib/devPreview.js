// Sample content for sections whose table is still empty — shown ONLY while running `npm run dev`,
// with a visible "preview" badge, so the layout can be judged before real data exists.
// Production builds never include it: visitors see the section only once real entries are added
// in the dashboard (fake testimonials or experience would hurt far more than an absent section).

const SAMPLES = {
  experience: [
    {
      id: "sample-1",
      type: "work",
      period: "2025 — Sekarang",
      role: "Fullstack Developer (contoh)",
      place: "Nama Perusahaan",
      description: "Contoh entri. Tambahkan pengalaman asli lewat Dashboard → Experience, dan entri ini akan hilang.",
    },
    {
      id: "sample-2",
      type: "organization",
      period: "2023 — 2024",
      role: "Divisi Teknologi (contoh)",
      place: "Nama Organisasi",
      description: "Tulis dampak nyata: apa yang kamu bangun, untuk siapa, dan hasilnya.",
    },
    {
      id: "sample-3",
      type: "education",
      period: "2021 — Sekarang",
      role: "Pendidikan Informatika (contoh)",
      place: "Nama Kampus",
      description: "Pendidikan juga tampil di timeline ini.",
    },
  ],
  testimonials: [
    {
      id: "sample-1",
      name: "Nama Klien",
      role: "Product Manager — contoh",
      quote: "Contoh testimoni. Minta rekan kerja, dosen, atau klien menulis 2–3 kalimat jujur, lalu tambahkan lewat Dashboard → Testimonials.",
    },
    {
      id: "sample-2",
      name: "Rekan Tim",
      role: "Lead Engineer — contoh",
      quote: "Testimoni yang menyebut hasil konkret — misalnya waktu rilis lebih cepat atau bug berkurang — paling meyakinkan bagi rekruter.",
    },
    {
      id: "sample-3",
      name: "Dosen Pembimbing",
      role: "Dosen — contoh",
      quote: "Tiga sampai lima testimoni sudah cukup. Foto profil membuat kartu terlihat jauh lebih hidup.",
    },
  ],
  gallery: [
    { id: "sample-1", image_url: "/Kane.webp", caption: "Contoh foto kegiatan" },
    { id: "sample-2", image_url: "/WelcomeScreenNew.webp", caption: "Upload lewat Dashboard → Gallery" },
    { id: "sample-3", image_url: "/Portrait.webp", caption: "Workshop, lomba, seminar…" },
    { id: "sample-4", image_url: "/Samurai-mobile.webp", caption: "Contoh foto kegiatan" },
    { id: "sample-5", image_url: "/og-image.jpg", caption: "Contoh foto kegiatan" },
  ],
};

/** Real rows when there are any; otherwise sample rows in dev only. */
export function withDevPreview(name, rows) {
  if (rows.length > 0 || !import.meta.env.DEV) return { items: rows, isPreview: false };
  return { items: SAMPLES[name] || [], isPreview: true };
}
