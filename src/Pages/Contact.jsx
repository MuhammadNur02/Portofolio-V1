import { useState, useEffect } from "react";
import { Share2, User, Mail, MessageSquare, Send } from "lucide-react";
import SocialLinks from "../components/SocialLinks";
import Komentar from "../components/Commentar";
import Swal from "sweetalert2";
import AOS from "aos";
import "aos/dist/aos.css";
import axios from "axios";
import { useLanguage } from "../context/LanguageContext";

const SEND_COOLDOWN_MS = 60_000;
const LAST_SENT_KEY = "contactLastSentAt";
const readLastSent = () => {
  try {
    return Number(localStorage.getItem(LAST_SENT_KEY)) || 0;
  } catch {
    return 0;
  }
};
const writeLastSent = () => {
  try {
    localStorage.setItem(LAST_SENT_KEY, String(Date.now()));
  } catch {
    /* storage unavailable — the guard just won't apply */
  }
};

const ContactPage = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    _honey: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    AOS.init({
      once: false,
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Spam guard 1: the invisible honeypot field was filled -> a bot. Look successful, send nothing.
    if (formData._honey) {
      setFormData({ name: "", email: "", message: "", _honey: "" });
      return;
    }
    // Spam guard 2: at most one message per minute from the same browser.
    if (Date.now() - readLastSent() < SEND_COOLDOWN_MS) {
      Swal.fire({
        title: t.contact.cooldownTitle,
        text: t.contact.cooldownText,
        icon: "info",
        confirmButtonColor: "#fbbf24",
      });
      return;
    }

    setIsSubmitting(true);

    Swal.fire({
      title: t.contact.sendingTitle,
      html: t.contact.sendingText,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Ganti dengan email Anda di FormSubmit
const formSubmitUrl = 'https://formsubmit.co/muhammadnurrahmanjuliansyah@gmail.com';
      
      // Siapkan data form untuk FormSubmit
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('message', formData.message);
      submitData.append('_subject', 'Pesan Baru dari Website Portfolio');
      submitData.append('_honey', ''); // FormSubmit's own honeypot: it discards submissions where this is filled
      submitData.append('_captcha', 'false'); // Nonaktifkan captcha
      submitData.append('_template', 'table'); // Format email sebagai tabel

      await axios.post(formSubmitUrl, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

     
      Swal.fire({
        title: t.contact.successTitle,
        text: t.contact.successText,
        icon: 'success',
        confirmButtonColor: '#fbbf24',
        timer: 2000,
        timerProgressBar: true
      });

      writeLastSent();
      setFormData({
        name: "",
        email: "",
        message: "",
        _honey: "",
      });

    } catch (error) {
      // FormSubmit returns a redirect (status 0 / network error) on success, so we check if it's a CORS/redirect-based success
      if (error.message === 'Network Error' || (error.request && error.request.status === 0)) {
        Swal.fire({
          title: t.contact.successTitle,
          text: t.contact.successText,
          icon: 'success',
          confirmButtonColor: '#fbbf24',
          timer: 2000,
          timerProgressBar: true
        });

        writeLastSent();
        setFormData({
          name: "",
          email: "",
          message: "",
          _honey: "",
        });
      } else {
        Swal.fire({
          title: t.contact.errorTitle,
          text: t.contact.errorText,
          icon: 'error',
          confirmButtonColor: '#fbbf24'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-[5%] sm:px-[5%] lg:px-[10%] " >
      <div className="text-center lg:mt-[5%] mt-10 mb-2 sm:px-0 px-[5%]">
        <h2
          data-aos="fade-down"
          data-aos-duration="1000"
          className="inline-block text-3xl md:text-5xl font-bold text-center mx-auto text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] to-[#dc2626]"
        >
          <span
            style={{
              color: "#fbbf24",
              backgroundImage:
                "linear-gradient(45deg, #fbbf24 10%, #dc2626 93%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t.contact.title}
          </span>
        </h2>
        <p
          data-aos="fade-up"
          data-aos-duration="1100"
          className="text-stone-400 max-w-2xl mx-auto text-sm md:text-base mt-2"
        >
          {t.contact.subtitle}
        </p>
      </div>

      <div
        className="h-auto py-10 flex items-center justify-center 2xl:pr-[3.1%] lg:pr-[3.8%]  md:px-0"
        id="Contact"
      >
        <div className="container px-[1%] grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-[45%_55%] 2xl:grid-cols-[35%_65%] gap-12" >
          <div
        
            className="bg-[#120c07]/55 backdrop-blur-xl rounded-3xl shadow-2xl p-5 py-10 sm:p-10 transform transition-all duration-500 hover:shadow-[#fbbf24]/10"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-4xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] to-[#dc2626]">
                  {t.contact.formTitle}
                </h2>
                <p className="text-gray-400">
                  {t.contact.formSubtitle}
                </p>
              </div>
              <Share2 className="w-10 h-10 text-[#fbbf24] opacity-50" />
            </div>

            <form 
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Honeypot: invisible to people, bots tend to fill it. Filled = treated as spam and never sent. */}
              <input
                type="text"
                name="_honey"
                value={formData._honey ?? ""}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
              />
              <div
                data-aos="fade-up"
                data-aos-delay="100"
                className="relative group"
              >
                <User className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-[#fbbf24] transition-colors" />
                <input
                  type="text"
                  name="name"
                  placeholder={t.contact.namePlaceholder}
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full p-4 pl-12 bg-white/10 rounded-xl border border-white/20 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/30 transition-all duration-300 hover:border-[#fbbf24]/30 disabled:opacity-50"
                  required
                />
              </div>
              <div
                data-aos="fade-up"
                data-aos-delay="200"
                className="relative group"
              >
                <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-[#fbbf24] transition-colors" />
                <input
                  type="email"
                  name="email"
                  placeholder={t.contact.emailPlaceholder}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full p-4 pl-12 bg-white/10 rounded-xl border border-white/20 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/30 transition-all duration-300 hover:border-[#fbbf24]/30 disabled:opacity-50"
                  required
                />
              </div>
              <div
                data-aos="fade-up"
                data-aos-delay="300"
                className="relative group"
              >
                <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-[#fbbf24] transition-colors" />
                <textarea
                  name="message"
                  placeholder={t.contact.messagePlaceholder}
                  value={formData.message}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full resize-none p-4 pl-12 bg-white/10 rounded-xl border border-white/20 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/30 transition-all duration-300 hover:border-[#fbbf24]/30 h-[9.9rem] disabled:opacity-50"
                  required
                />
              </div>
              <button
                data-aos="fade-up"
                data-aos-delay="400"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#fbbf24] to-[#dc2626] text-white py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#fbbf24]/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Send className="w-5 h-5" />
                {isSubmitting ? t.contact.sending : t.contact.send}
              </button>
            </form>

            <div className="mt-10 pt-6 border-t border-white/10 flex justify-center space-x-6">
              <SocialLinks />
            </div>
          </div>

          <div className="  bg-[#120c07]/55 backdrop-blur-xl rounded-3xl p-3 py-3 md:p-10 md:py-8 shadow-2xl transform transition-all duration-500 hover:shadow-[#fbbf24]/10">
            <Komentar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
