import { Facebook, Instagram, Youtube, Linkedin, MessageCircle } from "lucide-react";

function SocialMediaLinks() {
  return (
    <section className="w-full py-14 bg-white border-t">
      <div className="container mx-auto px-6 text-center">

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
          Connect With Us
        </h2>

        {/* Subtitle */}
        <p className="text-gray-600 max-w-md mx-auto mb-8 text-sm md:text-base">
          Follow us on social media for updates, announcements, and exclusive offers.
        </p>

        {/* Social Icons */}
        <div className="flex justify-center gap-6 md:gap-8">

          {/* Facebook */}
          <a
            href="https://facebook.com"
            target="_blank"
            className="
              p-3 rounded-full border shadow-sm bg-white
              hover:bg-black hover:text-white 
              transition
            "
          >
            <Facebook size={22} />
          </a>

          {/* Instagram */}
          <a
            href="https://instagram.com"
            target="_blank"
            className="
              p-3 rounded-full border shadow-sm bg-white
              hover:bg-black hover:text-white 
              transition
            "
          >
            <Instagram size={22} />
          </a>

          {/* YouTube */}
          <a
            href="https://youtube.com"
            target="_blank"
            className="
              p-3 rounded-full border shadow-sm bg-white
              hover:bg-black hover:text-white 
              transition
            "
          >
            <Youtube size={22} />
          </a>

          {/* LinkedIn */}
          <a
            href="https://linkedin.com"
            target="_blank"
            className="
              p-3 rounded-full border shadow-sm bg-white
              hover:bg-black hover:text-white 
              transition
            "
          >
            <Linkedin size={22} />
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/+8801234567890"
            target="_blank"
            className="
              p-3 rounded-full border shadow-sm bg-white
              hover:bg-black hover:text-white 
              transition
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
