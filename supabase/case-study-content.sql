-- Draft case-study text for the 4 existing projects, written from what's already documented
-- (Description/Features/TechStack) for each one. Review before treating as final, especially
-- "Role" and "Results" — those are the parts only the project's author can really vouch for.
-- Matched by id, so re-running this after editing Title elsewhere is still safe.
-- Run once in Supabase → SQL Editor, after case-study-fields.sql.

update public.projects set
  "Role" = $$Menangani pengembangan penuh dashboard ini, dari skema database, alur autentikasi admin, sampai UI form CRUD-nya — berpasangan dengan situs publik prodi yang datanya saling terhubung.$$,
  "Challenge" = $$Staf prodi yang memakai dashboard ini bukan orang teknis — mereka perlu bisa ganti berita, tambah profil dosen, atau update galeri kampus sendiri tanpa harus minta bantuan developer tiap kali ada perubahan kecil. Di sisi lain, panel admin ini harus benar-benar terpisah dari situs publik supaya calon mahasiswa yang mampir tidak pernah nyasar ke halaman pengelolaan konten.$$,
  "Approach" = $$Supabase dipakai untuk auth, database, dan storage sekaligus, jadi tidak perlu membangun backend terpisah dari nol. Login dibatasi khusus akun admin/pengelola (bukan sign-up publik), dan dashboard-nya sengaja dipisah route-nya dari halaman publik. Form CRUD untuk berita, dosen, dan galeri dibikin sesederhana mungkin — upload gambar, isi teks, submit — supaya staf non-teknis tidak kebingungan.$$,
  "Results" = $$Staf prodi sekarang bisa update berita, profil dosen, dan galeri fasilitas sendiri kapan pun ada perubahan, tanpa harus menunggu developer turun tangan.$$
where id = 2; -- Admin Dashboard Prodi Informatika UNISVET

update public.projects set
  "Role" = $$Membangun situs publiknya, sepasang dengan admin dashboard di atas, dengan data yang saling terhubung lewat database yang sama.$$,
  "Challenge" = $$Situs kampus punya banyak jenis konten sekaligus — profil prodi, kurikulum OBE, profil dosen, fasilitas lab, berita — yang semuanya harus gampang ditemukan calon mahasiswa. Di sisi lain, kampus sudah punya beberapa sistem terpisah yang berjalan duluan (SIAKAD, e-learning, e-library) yang tidak perlu dan tidak mungkin dibangun ulang — situs ini harus jadi pintu masuk yang jelas ke semua itu, bukan malah menambah kebingungan dengan duplikasi.$$,
  "Approach" = $$Konten yang sering berubah (berita, profil dosen, galeri) ditarik dari database yang sama dengan admin dashboard, jadi begitu staf update di sana, langsung tampil di situs publik. Untuk sistem eksternal seperti SIAKAD, e-learning, dan e-library, situs ini tidak mencoba menduplikasi atau meng-embed — cukup tautan yang jelas dan mudah ditemukan, karena sistem-sistem itu memang bukan bagian yang perlu dibangun ulang.$$,
  "Results" = $$Calon mahasiswa bisa melihat kurikulum, fasilitas, dan profil dosen dari satu situs, sekaligus mendaftar PMB secara online — tidak perlu lagi mengandalkan brosur atau halaman-halaman terpisah yang informasinya sering tidak konsisten.$$
where id = 1; -- Web Kampus Prodi Informatika UNISVET

update public.projects set
  "Role" = $$Proyek eksplorasi pribadi untuk mencoba menggabungkan AI generation dengan rendering 3D di browser.$$,
  "Challenge" = $$Presentasi 3D gampang berakhir jadi "terlihat keren tapi tidak kepakai" — efek 3D yang berlebihan malah mengalihkan perhatian dari isi materinya. Tantangannya adalah membuat tampilan dan transisi 3D yang tetap enak dipakai untuk presentasi sungguhan, bukan sekadar demo teknis, sambil tetap membiarkan AI yang menyusun strukturnya dari prompt.$$,
  "Approach" = $$Alat ini mengambil prompt/topik dari pengguna, lalu menghasilkan struktur slide-nya, yang kemudian dirender sebagai deck 3D yang bisa dijelajah — bukan sekadar slide flat yang diberi efek 3D di atasnya.$$,
  "Results" = $$Masih tahap prototipe/eksplorasi pribadi, belum dipakai untuk presentasi produksi — tapi jadi tempat latihan menggabungkan AI generation dengan WebGL secara langsung.$$
where id = 3; -- Presentasi AI 3D WebGL

update public.projects set
  "Role" = $$Proyek pribadi untuk latihan merangkai stack modern secara end-to-end — CMS, autentikasi, pembayaran, penyimpanan file, sampai monitoring — bukan sekadar membuat toko online biasa.$$,
  "Challenge" = $$Jualan aset digital (boilerplate, UI kit, template) berbeda dari e-commerce barang fisik — perlu pengiriman file yang aman setelah pembayaran, lisensi yang jelas, dan storefront yang terasa curated/premium, bukan marketplace ramai. Tantangan utamanya menyusun satu alur checkout-ke-delivery yang mulus antara pembayaran, penyimpanan file, dan akses unduhan.$$,
  "Approach" = $$Sanity dipakai untuk mengatur konten produk supaya mudah di-update tanpa redeploy, Clerk untuk autentikasi, Lemon Squeezy untuk pembayaran dan lisensi produk digital, Cloudflare R2 untuk menyimpan file asetnya, dan PostHog bersama Sentry untuk memantau pemakaian dan error setelah live.$$,
  "Results" = $$Masih tahap pengembangan/dev preview, belum menangani transaksi produksi sungguhan — tapi alur checkout-ke-delivery-nya sudah berjalan end-to-end di environment dev.$$
where id = 4; -- Platform e-commerce Lumira
