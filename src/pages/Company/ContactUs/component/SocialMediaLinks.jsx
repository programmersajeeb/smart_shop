import {
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  MessageCircle,
} from "lucide-react";

function SocialMediaLinks() {
  const items = [
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
    { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: MessageCircle, href: "https://wa.me/+8801234567890", label: "WhatsApp" },
  ];

  return (
    <section className="w-full border-t border-black/5 bg-white py-14 md:py-16">
      <div className="site-shell text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-950">
          Connect with us
        </h2>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-gray-600 md:text-[15px]">
          Follow Smart Shop for updates, new arrivals, and brand news.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4 sm:gap-5">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
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