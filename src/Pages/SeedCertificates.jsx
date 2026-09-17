import { useState } from "react";
import { supabase } from "../supabase";
import { Award, CheckCircle, XCircle, Loader2 } from "lucide-react";

const certificateData = [
  { Img: "/MMS Certificate.jpg" },
  { Img: "/Makrab Certificate.jpg" },
  { Img: "/Introduction Certificate.jpg" },
];

export default function SeedCertificates() {
  const [seeding, setSeeding] = useState(false);
  const [results, setResults] = useState([]);

  const handleSeed = async () => {
    setSeeding(true);
    setResults([]);
    const res = [];

    for (const cert of certificateData) {
      try {
        const { data, error } = await supabase
          .from("certificates")
          .insert([cert])
          .select();

        if (error) {
          res.push({ img: cert.Img, success: false, error: error.message });
        } else {
          res.push({ img: cert.Img, success: true, data });
        }
      } catch (err) {
        res.push({ img: cert.Img, success: false, error: err.message });
      }
    }

    setResults(res);
    setSeeding(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0705] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f59e0b] to-[#dc2626] rounded-2xl blur opacity-20" />
          <div className="relative bg-[#120c07]/55 backdrop-blur-xl border border-white/12 rounded-2xl p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Award className="w-7 h-7 text-amber-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-1">
                Seed Certificates
              </h1>
              <p className="text-sm text-gray-400">
                Insert 3 certificate records into Supabase
              </p>
            </div>

            {/* Certificate List */}
            <div className="space-y-2 mb-6">
              {certificateData.map((cert, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/8"
                >
                  <div className="w-8 h-8 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={cert.Img}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-300 truncate">
                    {cert.Img.replace("/", "")}
                  </span>
                </div>
              ))}
            </div>

            {/* Seed Button */}
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="relative group w-full"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#d97706] to-[#b91c1c] rounded-xl opacity-60 blur group-hover:opacity-100 transition duration-300" />
              <div className="relative flex items-center justify-center gap-2 w-full py-2.5 bg-[#0a0705] rounded-xl border border-white/10">
                {seeding ? (
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                ) : (
                  <Award className="w-4 h-4 text-amber-400" />
                )}
                <span className="text-sm text-gray-200">
                  {seeding ? "Seeding..." : "Seed 3 Certificates"}
                </span>
              </div>
            </button>

            {/* Results */}
            {results.length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Results
                </p>
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      r.success
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                        : "bg-red-500/10 border border-red-500/20 text-red-300"
                    }`}
                  >
                    {r.success ? (
                      <CheckCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span className="truncate">{r.img.replace("/", "")}</span>
                    {!r.success && (
                      <span className="text-xs opacity-70 ml-auto shrink-0">
                        {r.error}
                      </span>
                    )}
                    {r.success && (
                      <span className="text-xs opacity-70 ml-auto shrink-0">
                        ✓ Inserted
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

