import { Mail, Phone, MapPin, Clock } from "lucide-react";

function ContactInfoCards() {
  const items = [
    {
      icon: Mail,
      title: "Email us",
      text: "support@smartshop.com",
    },
    {
      icon: Phone,
      title: "Call support",
      text: "+880 1234-567890",
    },
    {
      icon: MapPin,
      title: "Office location",
      text: "Dhaka, Bangladesh",
    },
    {
      icon: Clock,
      title: "Support hours",
      text: "Sat–Thu: 9:00 AM – 10:00 PM",
    },
  ];

  return (
    <section className="w-full bg-white py-14 md:py-20">
      <div className="site-shell">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-950 md:text-4xl">
            Quick ways to reach us
          </h2>
          <p className="mt-4 text-sm leading-7 text-gray-600 md:text-[15px]">
            Use any of these contact options if you want a faster way to get in touch.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-[26px] border border-black/5 bg-gray-50 p-6 text-center shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 bg-white text-gray-900">
                  <Icon size={20} />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-gray-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ContactInfoCards;