import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const NotFoundPage = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{`404 — ${t.notFound.title}`}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="relative z-10 flex min-h-screen items-center justify-center overflow-hidden bg-ink/85 px-6 py-16">
        <img
          src="/Torii-Gate-sm.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 w-[min(90vw,760px)] -translate-x-1/2 opacity-[0.12] brightness-0 invert"
        />
        <div className="relative max-w-lg text-center">
          <p className="font-kanji text-2xl text-shu-400">迷子</p>
          <p className="mt-2 font-display text-[7rem] font-extrabold leading-none text-washi font-wide sm:text-[9rem]">404</p>
          <h1 className="mt-4 font-display text-2xl font-bold text-washi sm:text-3xl">{t.notFound.title}</h1>
          <p className="mt-3 text-washi-muted">{t.notFound.text}</p>
          <Link to="/" className="btn-primary mt-10">
            <ArrowLeft className="h-4 w-4" />
            {t.notFound.backHome}
          </Link>
        </div>
      </main>
    </>
  );
};

export default NotFoundPage;
