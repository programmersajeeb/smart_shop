import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertTriangle } from "lucide-react";
import ContactHero from "./component/ContactHero";
import ContactInfoCards from "./component/ContactInfoCards";
import SupportCategories from "./component/SupportCategories";
import FAQSection from "./component/FAQSection";
import StoreLocationSection from "./component/StoreLocationSection";
import ContactFormSection from "./component/ContactFormSection";
import FinalContactCTA from "./component/FinalContactCTA";
import SocialMediaLinks from "./component/SocialMediaLinks";
import { raw } from "../../../services/apiClient";

function defaultContactConfig() {
  return {
    hero: {
      eyebrow: "Contact us",
      title: "Need help? We are here to make things easier.",
      description:
        "Whether you have a question about an order, need support, or want to reach the right team, you can contact Smart Shop in the way that works best for you.",
      image:
        "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80",
      primaryLabel: "Email support",
      primaryHref: "mailto:support@smartshop.com",
      secondaryLabel: "Call us",
      secondaryHref: "tel:+8801234567890",
    },

    infoCards: {
      title: "Quick ways to reach us",
      subtitle:
        "Use any of these contact options if you want a faster way to get in touch.",
      items: [
        {
          title: "Email us",
          text: "support@smartshop.com",
          icon: "mail",
        },
        {
          title: "Call support",
          text: "+880 1234-567890",
          icon: "phone",
        },
        {
          title: "Office location",
          text: "Dhaka, Bangladesh",
          icon: "mapPin",
        },
        {
          title: "Support hours",
          text: "Sat–Thu: 9:00 AM – 10:00 PM",
          icon: "clock",
        },
      ],
    },

    supportCategories: {
      title: "Choose the right team",
      subtitle:
        "Reaching the right team first usually means a faster and more helpful reply.",
      items: [
        {
          title: "Customer support",
          description:
            "For help with orders, refunds, payments, returns, or delivery updates.",
          label: "Contact support",
          href: "mailto:support@smartshop.com",
        },
        {
          title: "Business inquiries",
          description:
            "For partnerships, collaborations, bulk purchases, or other business requests.",
          label: "Contact business team",
          href: "mailto:business@smartshop.com",
        },
        {
          title: "Media and press",
          description:
            "For interviews, brand-related questions, or press communication.",
          label: "Contact press team",
          href: "mailto:press@smartshop.com",
        },
      ],
      resourceButtonLabel: "View help resources",
      resourceButtonHref: "/faq",
    },

    faq: {
      title: "Frequently asked questions",
      subtitle: "A few common questions customers usually ask before reaching out.",
      items: [
        {
          q: "How can I track my order?",
          a: "Once your order is shipped, we send a tracking update by email or SMS. You can also check your order status from your account.",
        },
        {
          q: "What is your return policy?",
          a: "Unused items in their original condition can usually be returned within 7 days. Refund timing may vary depending on the payment method.",
        },
        {
          q: "How do I contact customer support?",
          a: "You can email us at support@smartshop.com or call +880 1234-567890 during support hours.",
        },
        {
          q: "Do you offer international shipping?",
          a: "Yes, international shipping is available in selected cases. Delivery time depends on the destination and shipping option.",
        },
        {
          q: "Can I modify or cancel my order?",
          a: "If your order has not moved into processing yet, our team may still be able to help. Contact support as soon as possible.",
        },
      ],
    },

    location: {
      title: "Visit our office",
      subtitle:
        "If you need in-person assistance or want to reach the team directly, here is our office information.",
      officeName: "Smart Shop Office",
      address: "12 Gulshan Avenue, Dhaka 1212, Bangladesh",
      officeHours: "Saturday to Thursday, 10:00 AM to 6:00 PM",
      mapEmbedUrl:
        "https://www.google.com/maps?q=Gulshan%20Avenue%20Dhaka&z=14&output=embed",
    },

    finalCta: {
      eyebrow: "Need more help?",
      title: "We are ready to help you with the next step.",
      description:
        "Reach out if you still need support, have a question about your order, or want help from the team directly.",
      primaryLabel: "Live chat support",
      primaryHref: "",
      secondaryLabel: "Email us",
      secondaryHref: "mailto:support@smartshop.com",
    },

    social: {
      title: "Connect with us",
      subtitle: "Follow Smart Shop for updates, new arrivals, and brand news.",
      items: [
        { label: "Facebook", href: "https://facebook.com" },
        { label: "Instagram", href: "https://instagram.com" },
        { label: "YouTube", href: "https://youtube.com" },
        { label: "LinkedIn", href: "https://linkedin.com" },
        { label: "WhatsApp", href: "https://wa.me/+8801234567890" },
      ],
    },
  };
}

function normalizeContactConfig(input) {
  const base = defaultContactConfig();
  const data = input && typeof input === "object" ? input : {};

  return {
    hero: { ...base.hero, ...(data.hero || {}) },
    infoCards: {
      ...base.infoCards,
      ...(data.infoCards || {}),
      items: Array.isArray(data?.infoCards?.items)
        ? data.infoCards.items
        : base.infoCards.items,
    },
    supportCategories: {
      ...base.supportCategories,
      ...(data.supportCategories || {}),
      items: Array.isArray(data?.supportCategories?.items)
        ? data.supportCategories.items
        : base.supportCategories.items,
    },
    faq: {
      ...base.faq,
      ...(data.faq || {}),
      items: Array.isArray(data?.faq?.items) ? data.faq.items : base.faq.items,
    },
    location: { ...base.location, ...(data.location || {}) },
    finalCta: { ...base.finalCta, ...(data.finalCta || {}) },
    social: {
      ...base.social,
      ...(data.social || {}),
      items: Array.isArray(data?.social?.items) ? data.social.items : base.social.items,
    },
  };
}

function ContactPageLoading() {
  return (
    <section className="w-full bg-white py-20 md:py-28">
      <div className="site-shell">
        <div className="rounded-[28px] border border-black/5 bg-gray-50 p-8 shadow-sm">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 size={18} className="animate-spin" />
            Loading contact page...
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactPageError({ message }) {
  return (
    <section className="w-full bg-white py-20 md:py-28">
      <div className="site-shell">
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-white text-red-700">
              <AlertTriangle size={18} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-950">
                Contact page could not be loaded
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {message || "Please refresh the page and try again."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ContactUsPage() {
  const contactQuery = useQuery({
    queryKey: ["contact-page-config"],
    queryFn: async () => {
      const { data } = await raw.get("/page-config/contact");
      return data;
    },
    staleTime: 60_000,
  });

  if (contactQuery.isLoading) {
    return <ContactPageLoading />;
  }

  if (contactQuery.isError) {
    return (
      <ContactPageError
        message={
          contactQuery.error?.response?.data?.message ||
          contactQuery.error?.response?.data?.error ||
          contactQuery.error?.message
        }
      />
    );
  }

  const config = normalizeContactConfig(contactQuery.data?.data);

  return (
    <div>
      <ContactHero data={config.hero} />
      <ContactInfoCards data={config.infoCards} />
      <SupportCategories data={config.supportCategories} />
      <FAQSection data={config.faq} />
      <StoreLocationSection data={config.location} />
      <ContactFormSection />
      <FinalContactCTA data={config.finalCta} />
      <SocialMediaLinks data={config.social} />
    </div>
  );
}