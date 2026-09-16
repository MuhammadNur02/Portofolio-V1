import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Home, Gamepad2 } from "lucide-react";

const NotFoundPage = () => {
  return (
    <>
      <Helmet>
        <title>404 — Halaman Tidak Ditemukan | Muhammad Nurrahman Juliansyah</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-[5%] text-center">
        <div className="hud-frame hud-frame-active max-w-lg w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 sm:p-14 shadow-2xl">
          <span className="eyebrow-tag justify-center mb-6 flex">SYSTEM ERROR // 404</span>

          <div className="relative inline-block mb-4">
            <span className="absolute -inset-4 bg-gradient-to-r from-[#00d2ff] to-[#3b82f6] blur-3xl opacity-30"></span>
            <h1 className="font-display relative text-7xl sm:text-8xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
              404
            </h1>
          </div>

          <p className="font-display text-lg sm:text-xl font-semibold text-gray-200 mb-2">
            Level Not Found
          </p>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8">
            Halaman yang kamu cari sepertinya keluar dari peta permainan.
            Yuk kembali ke checkpoint terakhir.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/" className="w-full sm:w-auto">
              <button className="group relative w-full sm:w-[180px]">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#06b6d4] to-[#2563eb] rounded-xl opacity-50 blur-md group-hover:opacity-90 transition-all duration-700"></div>
                <div className="relative h-11 bg-[#030014] backdrop-blur-xl rounded-lg border border-white/10 leading-none overflow-hidden">
                  <span className="absolute inset-0 flex items-center justify-center gap-2 text-sm">
                    <span className="bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent font-medium">
                      Kembali ke Home
                    </span>
                    <Home className="w-4 h-4 text-gray-200 group-hover:-translate-x-0.5 transform transition-all duration-300" />
                  </span>
                </div>
              </button>
            </Link>
            <a href="/#Portofolio" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-[#06b6d4]/50 text-[#06b6d4] font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 hover:bg-[#06b6d4]/10">
                <Gamepad2 className="w-4 h-4" /> Lihat Portofolio
              </button>
            </a>
          </div>

          <span className="hud-corner-bl"></span>
          <span className="hud-corner-br"></span>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
