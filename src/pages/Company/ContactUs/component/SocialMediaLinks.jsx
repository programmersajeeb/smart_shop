import { Facebook, Instagram, Youtube, Linkedin, MessageCircle } from "lucide-react";

function SocialMediaLinks() {
  return (
    <section className="w-full border-t bg-white py-14">
      <div className="site-shell text-center">
        <h2 className="mb-6 text-xl font-bold text-gray-900 md:text-2xl">
          Connect With Us
        </h2>

        <p className="mx-auto mb-8 max-w-md text-sm text-gray-600 md:text-base">
          Follow us on social media for updates, announcements, and exclusive offers.
        </p>

        <div className="flex justify-center gap-6 md:gap-8">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer"
            className="
              rounded-full border bg-white p-3 shadow-sm
              transition hover:bg-black hover:text-white
            "
          >
            <Facebook size={22} />
          </a>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="
              rounded-full border bg-white p-3 shadow-sm
              transition hover:bg-black hover:text-white
            "
          >
            <Instagram size={22} />
          </a>

          <a
            href="https://youtube.com"
            target="_blank"
            rel="noreferrer"
            className="
              rounded-full border bg-white p-3 shadow-sm
              transition hover:bg-black hover:text-white
            "
          >
            <Youtube size={22} />
          </a>

          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noreferrer"
            className="
              rounded-full border bg-white p-3 shadow-sm
              transition hover:bg-black hover:text-white
            "
          >
            <Linkedin size={22} />
          </a>

          <a
            href="https://wa.me/+8801234567890"
            target="_blank"
            rel="noreferrer"
            className="
              rounded-full border bg-white p-3 shadow-sm
              transition hover:bg-black hover:text-white
            "
          >
            <MessageCircle size={22} />
          </a>
        </div>
      </div>
    </section>
  );
}

export default SocialMediaLinks;