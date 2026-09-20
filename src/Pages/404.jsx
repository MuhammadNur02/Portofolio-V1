import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const NotFoundPage = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>404 — {t.notFound.title}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg text-center bg-[#120c07]/55 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-12">
          <p className="text-7xl sm:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] to-[#dc2626]">
            404
          </p>
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-white">{t.notFound.title}</h1>
          <p className="mt-3 text-gray-400">{t.notFound.text}</p>

          <Link
            to="/"
            className="mt-8 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-[#0a0705]
                       bg-gradient-to-r from-[#fbbf24] to-[#dc2626] hover:opacity-90 transition-opacity duration-300"
          >
            <Home className="w-5 h-5" />
            {t.notFound.backHome}
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
