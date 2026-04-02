import {
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  MessageCircle,
} from "lucide-react";

const ICON_MAP = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  whatsapp: MessageCircle,
};

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function normalizeHref(value, fallback = "#") {
  const href = String(value || "").trim();
  return href || fallback;
}

function resolveIcon(label) {
  const key = String(label || "").trim().toLowerCase();
  return ICON_MAP[key] || MessageCircle;
}

function SocialMediaLinks({ data }) {
  const title = normalizeText(data?.title, "Connect with us");
  const subtitle = normalizeText(
    data?.subtitle,
    "Follow Smart Shop for updates, new arrivals, and brand news."
  );

  const items =
    Array.isArray(data?.items) && data.items.length
      ? data.items
      : [
          { href: "https://facebook.com", label: "Facebook" },
          { href: "https://instagram.com", label: "Instagram" },
          { href: "https://youtube.com", label: "YouTube" },
          { href: "https://linkedin.com", label: "LinkedIn" },
          { href: "https://wa.me/+8801234567890", label: "WhatsApp" },
        ];

  return (
    <section className="w-full border-t border-black/5 bg-white py-14 md:py-16">
      <div className="site-shell text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-950">
          {title}
        </h2>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-gray-600 md:text-[15px]">
          {subtitle}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4 sm:gap-5">
          {items.map((item, index) => {
            const label = normalizeText(item?.label, `Social ${index + 1}`);
            const href = normalizeHref(item?.href);
            const Icon = resolveIcon(label);

            return (
              <a
                key={`${label}-${index}`}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-gray-800 shadow-sm transition hover:bg-black hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <Icon size={20} />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default SocialMediaLinks;