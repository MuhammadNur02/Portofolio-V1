-- Points each project's "Github" field at its real public repo, so the project detail page
-- shows a working "Source Code" link instead of the private-repo lock icon.
-- Web Kampus and Admin Dashboard share one repo (one Next.js app, admin lives at /admin/dashboard).
-- Run once in Supabase → SQL Editor.

update public.projects set "Github" = 'https://github.com/MuhammadNur02/informatika-unisvet' where id = 1; -- Web Kampus Prodi Informatika UNISVET
update public.projects set "Github" = 'https://github.com/MuhammadNur02/informatika-unisvet' where id = 2; -- Admin Dashboard Prodi Informatika UNISVET
update public.projects set "Github" = 'https://github.com/MuhammadNur02/My-Presentation'      where id = 3; -- Presentasi AI 3D WebGL
update public.projects set "Github" = 'https://github.com/MuhammadNur02/Lumira-Dev'           where id = 4; -- Platform e-commerce Lumira
