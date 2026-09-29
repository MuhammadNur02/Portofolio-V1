import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowUpRight, Check, CheckCircle2, Clock, Copy, Loader2, Mail, Send } from "lucide-react";
import { FaGithub, FaInstagram, FaLinkedinIn, FaTiktok, FaWhatsapp, FaYoutube } from "react-icons/fa6";
import { useLanguage } from "../context/LanguageContext";
import { SITE, SOCIALS } from "../config/site";
import { cn } from "../lib/utils";
import SectionHeading from "../components/ui/SectionHeading";
import Reveal, { RevealGroup, RevealItem } from "../components/ui/Reveal";
import Komentar from "../components/Commentar";

const SOCIAL_ICONS = {
  github: FaGithub,
  linkedin: FaLinkedinIn,
  instagram: FaInstagram,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  whatsapp: FaWhatsapp,
};

const FORM_ENDPOINT = `https://formsubmit.co/ajax/${SITE.email}`;
const SEND_COOLDOWN_MS = 60_000;
const LAST_SENT_KEY = "contactLastSentAt";
const EMPTY = { name: "", email: "", message: "", _honey: "" };

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

function Field({ label, id, as = "input", className, ...props }) {
  const Tag = as;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-washi-subtle">
        {label}
      </label>
      <Tag
        id={id}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-washi placeholder:text-washi-subtle/70",
          "transition-[border-color,box-shadow,background-color] duration-300 hover:border-white/20",
          "focus:border-shu-500 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-shu-500/15 disabled:opacity-50",
          as === "textarea" ? "min-h-[160px] resize-y py-3.5" : "h-12"
        )}
        {...props}
      />
    </div>
  );
}

function EmailCard({ t }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SITE.email);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${SITE.email}`;
    }
  };

  return (
    <div className="surface p-6">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-washi-subtle">
        <Mail aria-hidden="true" className="h-4 w-4 text-shu-400" />
        {t.contact.emailLabel}
      </p>
      <a
        href={`mailto:${SITE.email}`}
        className="mt-3 block font-display text-base font-semibold text-washi transition-colors [overflow-wrap:anywhere] hover:text-shu-300 sm:text-lg"
      >
        {SITE.email}
      </a>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="btn-ghost h-10 px-4 text-xs" aria-live="polite">
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          {copied ? t.contact.copied : t.contact.copy}
        </button>
        <a href={`mailto:${SITE.email}`} className="btn-ghost h-10 px-4 text-xs">
          <ArrowUpRight className="h-4 w-4" />
          Email
        </a>
      </div>
    </div>
  );
}

const STATUS_STYLE = {
  success: { icon: CheckCircle2, className: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" },
  error: { icon: AlertCircle, className: "border-shu-500/30 bg-shu-500/10 text-shu-200" },
  cooldown: { icon: Clock, className: "border-kin-400/30 bg-kin-400/10 text-kin-300" },
};

const ContactPage = () => {
  const { t } = useLanguage();
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("idle"); // idle | sending | success | error | cooldown

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    // Spam guard 1: the invisible honeypot was filled -> a bot. Look successful, send nothing.
    if (form._honey) {
      setForm(EMPTY);
      setStatus("success");
      return;
    }
    // Spam guard 2: at most one message per minute from the same browser.
    if (Date.now() - readLastSent() < SEND_COOLDOWN_MS) {
      setStatus("cooldown");
      return;
    }

    setStatus("sending");
    const data = new FormData();
    data.append("name", form.name);
    data.append("email", form.email);
    data.append("message", form.message);
    data.append("_subject", `Pesan baru dari portofolio — ${form.name}`);
    data.append("_honey", "");
    data.append("_captcha", "false");
    data.append("_template", "table");

    try {
      // FormSubmit's AJAX endpoint answers with JSON instead of redirecting to a thank-you page.
      const response = await fetch(FORM_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === "false" || result.success === false) throw new Error(result.message || "Send failed");
      writeLastSent();
      setForm(EMPTY);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const sending = status === "sending";
  const statusStyle = STATUS_STYLE[status];
  const statusText = {
    success: [t.contact.successTitle, t.contact.successText],
    error: [t.contact.errorTitle, t.contact.errorText],
    cooldown: [t.contact.cooldownTitle, t.contact.cooldownText],
  }[status];

  return (
    <section id="Contact" className="section-y relative">
      <div className="container-site grid gap-16 lg:grid-cols-12 lg:gap-20">
        <div className="space-y-10 lg:col-span-5">
          <SectionHeading index="06" eyebrow={t.contact.eyebrow} title={t.contact.title} lead={t.contact.lead} kanji="縁" />

          <Reveal delay={0.1}>
            <EmailCard t={t} />
          </Reveal>

          <div>
            <Reveal>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-washi-subtle">{t.contact.socialsTitle}</p>
            </Reveal>
            <RevealGroup as="ul" className="grid grid-cols-1 gap-2 sm:grid-cols-2" stagger={0.05}>
              {SOCIALS.map((s) => {
                const Icon = SOCIAL_ICONS[s.id];
                return (
                  <RevealItem as="li" key={s.id}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-washi transition-colors duration-300 group-hover:bg-shu-500 group-hover:text-white">
                        {Icon && <Icon aria-hidden="true" className="h-[18px] w-[18px]" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-washi">{s.label}</span>
                        <span className="block truncate text-xs text-washi-subtle">{s.handle}</span>
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-washi-subtle transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-washi"
                      />
                    </a>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          </div>
        </div>

        <Reveal delay={0.1} className="lg:col-span-7">
          <form onSubmit={onSubmit} className="surface relative space-y-6 p-6 sm:p-10">
            <h3 className="font-display text-2xl font-bold text-washi font-semiwide">{t.contact.formTitle}</h3>

            {/* Honeypot: invisible to people, bots tend to fill it. Filled = treated as spam and never sent. */}
            <input
              type="text"
              name="_honey"
              value={form._honey}
              onChange={onChange}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-px w-px opacity-0"
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                id="contact-name"
                name="name"
                label={t.contact.nameLabel}
                placeholder={t.contact.namePlaceholder}
                value={form.name}
                onChange={onChange}
                disabled={sending}
                autoComplete="name"
                required
              />
              <Field
                id="contact-email"
                name="email"
                type="email"
                label={t.contact.emailFieldLabel}
                placeholder={t.contact.emailPlaceholder}
                value={form.email}
                onChange={onChange}
                disabled={sending}
                autoComplete="email"
                required
              />
            </div>
            <Field
              id="contact-message"
              name="message"
              as="textarea"
              label={t.contact.messageLabel}
              placeholder={t.contact.messagePlaceholder}
              value={form.message}
              onChange={onChange}
              disabled={sending}
              required
            />

            <button type="submit" disabled={sending} className="btn-primary group w-full sm:w-auto">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
              {sending ? t.contact.sending : t.contact.send}
            </button>

            <div aria-live="polite">
              <AnimatePresence>
                {statusStyle && statusText && (
                  <motion.div
                    key={status}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn("flex items-start gap-3 rounded-xl border p-4 text-sm", statusStyle.className)}
                  >
                    <statusStyle.icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
                    <p>
                      <span className="font-semibold">{statusText[0]}</span> {statusText[1]}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </Reveal>
      </div>

      <div className="container-site mt-24 sm:mt-32">
        <Komentar />
      </div>
    </section>
  );
};

export default ContactPage;
