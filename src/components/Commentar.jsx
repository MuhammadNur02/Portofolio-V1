import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  AlertCircle,
  ImagePlus,
  Loader2,
  MessageCircle,
  Pin,
  Send,
  UserCircle2,
  X,
} from "lucide-react";
import { supabase } from "../supabase";
import { useLanguage } from "../context/LanguageContext";
import Reveal from "./ui/Reveal";

// Client-side spam guards (a determined bot can bypass these — real protection is Row Level Security +
// a captcha on the server — but they stop casual spam and accidental double posts).
const COMMENT_COOLDOWN_MS = 60_000;
const LAST_POSTED_KEY = "commentLastPostedAt";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const readLastPosted = () => {
  try {
    return Number(localStorage.getItem(LAST_POSTED_KEY)) || 0;
  } catch {
    return 0;
  }
};
const writeLastPosted = () => {
  try {
    localStorage.setItem(LAST_POSTED_KEY, String(Date.now()));
  } catch {
    /* storage unavailable — the cooldown just won't apply */
  }
};
const countLinks = (text) => (text.match(/https?:\/\/|www\./gi) || []).length;

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-washi placeholder:text-washi-subtle/70 transition-[border-color,box-shadow] duration-300 hover:border-white/20 focus:border-shu-500 focus:outline-none focus:ring-4 focus:ring-shu-500/15";

const Comment = memo(({ comment, formatDate, isPinned = false }) => {
  const { t } = useLanguage();
  return (
    <li
      className={
        isPinned
          ? "rounded-2xl border border-shu-500/30 bg-shu-500/[0.06] p-4"
          : "rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
      }
    >
      {isPinned && (
        <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-shu-300">
          <Pin aria-hidden="true" className="h-3.5 w-3.5" />
          {t.comments.pinned}
        </p>
      )}
      <div className="flex items-start gap-3">
        {comment.profile_image ? (
          <img
            src={comment.profile_image}
            alt=""
            loading="lazy"
            className="h-10 w-10 shrink-0 rounded-full border border-white/10 object-cover"
          />
        ) : (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[0.05] text-washi-muted">
            <UserCircle2 aria-hidden="true" className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-4">
            <p className="flex min-w-0 items-center gap-2">
              <span
                className={`truncate font-medium ${isPinned ? "text-shu-200" : "text-washi"}`}
              >
                {comment.user_name}
              </span>
              {isPinned && (
                <span className="rounded-full bg-shu-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-shu-200">
                  {t.comments.admin}
                </span>
              )}
            </p>
            <time
              dateTime={comment.created_at}
              className="shrink-0 text-xs text-washi-subtle"
            >
              {formatDate(comment.created_at)}
            </time>
          </div>
          <p className="mt-1 break-words text-sm leading-relaxed text-washi-muted">
            {comment.content}
          </p>
        </div>
      </div>
    </li>
  );
});
Comment.displayName = "Comment";

const CommentForm = memo(({ onSubmit, isSubmitting, onError }) => {
  const { t } = useLanguage();
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [honey, setHoney] = useState(""); // honeypot: invisible to people, bots tend to fill it
  const fileInputRef = useRef(null);

  const clearImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > MAX_IMAGE_BYTES || !file.type.startsWith("image/")) {
        onError(
          file.size > MAX_IMAGE_BYTES
            ? t.comments.fileTooLarge
            : t.comments.fileInvalid,
        );
        e.target.value = "";
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    },
    [onError, t],
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !userName.trim()) return;
    // Honeypot filled -> a bot: look successful, post nothing.
    if (!honey) onSubmit({ newComment, userName, imageFile });
    setNewComment("");
    setUserName("");
    clearImage();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input
        type="text"
        name="website"
        value={honey}
        onChange={(e) => setHoney(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />
      <div>
        <label
          htmlFor="comment-name"
          className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-washi-subtle"
        >
          {t.comments.name} <span className="text-shu-400">*</span>
        </label>
        <input
          id="comment-name"
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          maxLength={15}
          placeholder={t.comments.namePlaceholder}
          className={`${inputClass} h-12`}
          required
        />
      </div>

      <div>
        <label
          htmlFor="comment-message"
          className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-washi-subtle"
        >
          {t.comments.message} <span className="text-shu-400">*</span>
        </label>
        <textarea
          id="comment-message"
          value={newComment}
          maxLength={200}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t.comments.messagePlaceholder}
          className={`${inputClass} min-h-[110px] resize-none py-3.5`}
          required
        />
        <p className="mt-1 text-right text-[11px] tabular-nums text-washi-subtle">
          {newComment.length}/200
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-washi-subtle">
          {t.comments.profilePhoto}{" "}
          <span className="normal-case tracking-normal">
            {t.comments.optional}
          </span>
        </p>
        {imagePreview ? (
          <div className="flex items-center gap-4">
            <img
              src={imagePreview}
              alt=""
              className="h-14 w-14 rounded-full border border-white/15 object-cover"
            />
            <button
              type="button"
              onClick={clearImage}
              className="btn-ghost h-10 px-4 text-xs"
            >
              <X className="h-4 w-4" />
              {t.comments.removePhoto}
            </button>
          </div>
        ) : (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
              id="comment-photo"
            />
            <label
              htmlFor="comment-photo"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-3 text-sm text-washi-muted transition-colors hover:border-shu-500/60 hover:text-washi"
            >
              <ImagePlus aria-hidden="true" className="h-4 w-4" />
              {t.comments.choosePhoto}
              <span className="text-xs text-washi-subtle">
                · {t.comments.maxFileSize}
              </span>
            </label>
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {isSubmitting ? t.comments.posting : t.comments.post}
      </button>
    </form>
  );
});
CommentForm.displayName = "CommentForm";

const Komentar = () => {
  const { t, lang } = useLanguage();
  const [comments, setComments] = useState([]);
  const [pinnedComment, setPinnedComment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Comments (and the realtime websocket) load only when the guestbook comes near the viewport:
  // most visitors never scroll this far, and an open socket also keeps the page out of the back/forward cache.
  const rootRef = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || active) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setActive(true),
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [active]);

  useEffect(() => {
    if (!active) return;
    supabase
      .from("portfolio_comments")
      .select("*")
      .eq("is_pinned", true)
      // maybeSingle: having no pinned comment is normal, not a 406 error in the console
      .maybeSingle()
      .then(({ data }) => data && setPinnedComment(data));
  }, [active]);

  // Regular comments (excluding pinned) plus a real-time subscription that refreshes them.
  useEffect(() => {
    if (!active) return;
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("portfolio_comments")
        .select("*")
        .eq("is_pinned", false)
        .order("created_at", { ascending: false });
      if (!error) setComments(data || []);
    };
    fetchComments();

    const subscription = supabase
      .channel("portfolio_comments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "portfolio_comments",
          filter: "is_pinned=eq.false",
        },
        fetchComments,
      )
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, [active]);

  const uploadImage = useCallback(async (imageFile) => {
    if (!imageFile) return null;
    const fileExt = imageFile.name.split(".").pop();
    const filePath = `profile-images/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-images")
      .upload(filePath, imageFile);
    if (uploadError) throw uploadError;
    return supabase.storage.from("profile-images").getPublicUrl(filePath).data
      .publicUrl;
  }, []);

  const handleCommentSubmit = useCallback(
    async ({ newComment, userName, imageFile }) => {
      setError("");
      if (Date.now() - readLastPosted() < COMMENT_COOLDOWN_MS) {
        setError(t.comments.cooldown);
        return;
      }
      if (countLinks(newComment) > 1) {
        setError(t.comments.tooManyLinks);
        return;
      }
      setIsSubmitting(true);
      try {
        const profileImageUrl = await uploadImage(imageFile);
        const { error } = await supabase.from("portfolio_comments").insert([
          {
            content: newComment,
            user_name: userName,
            profile_image: profileImageUrl,
            is_pinned: false,
            created_at: new Date().toISOString(),
          },
        ]);
        if (error) throw error;
        writeLastPosted();
      } catch (err) {
        console.error("Failed to post comment:", err);
        setError(t.comments.failed);
      } finally {
        setIsSubmitting(false);
      }
    },
    [uploadImage, t],
  );

  const formatDate = useCallback(
    (timestamp) => {
      if (!timestamp) return "";
      const date = new Date(timestamp);
      const diffSeconds = Math.round((date - Date.now()) / 1000);
      const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
      const units = [
        ["day", 86400],
        ["hour", 3600],
        ["minute", 60],
      ];
      if (Math.abs(diffSeconds) >= 7 * 86400) {
        return new Intl.DateTimeFormat(lang, {
          year: "numeric",
          month: "short",
          day: "numeric",
        }).format(date);
      }
      for (const [unit, seconds] of units) {
        if (Math.abs(diffSeconds) >= seconds)
          return rtf.format(Math.round(diffSeconds / seconds), unit);
      }
      return rtf.format(0, "minute");
    },
    [lang],
  );

  const totalComments = comments.length + (pinnedComment ? 1 : 0);

  return (
    <div ref={rootRef}>
      <Reveal className="surface grid gap-10 p-6 sm:p-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-shu-500/15 text-shu-400">
              <MessageCircle aria-hidden="true" className="h-5 w-5" />
            </span>
            <h3 className="font-display text-2xl font-bold text-washi font-semiwide">
              {t.comments.heading}{" "}
              <span className="text-base font-medium tabular-nums text-washi-subtle">
                ({totalComments})
              </span>
            </h3>
          </div>
          <p className="mb-8 mt-3 text-sm leading-relaxed text-washi-muted">
            {t.comments.lead}
          </p>

          {error && (
            <p
              role="alert"
              className="mb-5 flex items-center gap-2 rounded-xl border border-shu-500/30 bg-shu-500/10 p-3 text-sm text-shu-200"
            >
              <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
          <CommentForm
            onSubmit={handleCommentSubmit}
            isSubmitting={isSubmitting}
            onError={setError}
          />
        </div>

        <div className="lg:col-span-7">
          <ul
            data-lenis-prevent
            className="max-h-[560px] space-y-3 overflow-y-auto overscroll-contain pr-2"
          >
            {pinnedComment && (
              <Comment
                comment={pinnedComment}
                formatDate={formatDate}
                isPinned
              />
            )}
            {comments.length === 0 && !pinnedComment ? (
              <li className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center text-washi-subtle">
                <UserCircle2
                  aria-hidden="true"
                  className="mb-3 h-10 w-10 opacity-50"
                />
                {t.comments.empty}
              </li>
            ) : (
              comments.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  formatDate={formatDate}
                />
              ))
            )}
          </ul>
        </div>
      </Reveal>
    </div>
  );
};

export default Komentar;
