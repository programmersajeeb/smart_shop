import { MapPin, Clock } from "lucide-react";

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function normalizeUrl(value, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function StoreLocationSection({ data }) {
  const title = normalizeText(data?.title, "Visit our office");
  const subtitle = normalizeText(
    data?.subtitle,
    "If you need in-person assistance or want to reach the team directly, here is our office information."
  );
  const officeName = normalizeText(data?.officeName, "Smart Shop Office");
  const address = normalizeText(
    data?.address,
    "12 Gulshan Avenue, Dhaka 1212, Bangladesh"
  );
  const officeHours = normalizeText(
    data?.officeHours,
    "Saturday to Thursday, 10:00 AM to 6:00 PM"
  );
  const mapEmbedUrl = normalizeUrl(
    data?.mapEmbedUrl,
    "https://www.google.com/maps?q=Gulshan%20Avenue%20Dhaka&z=14&output=embed"
  );

  return (
    <section className="w-full border-y border-black/5 bg-gray-50 py-16 md:py-24">
      <div className="site-shell">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-950 md:text-4xl">
            {title}
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-600 md:text-[15px]">
            {subtitle}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
          <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 bg-gray-50 text-gray-900">
              <MapPin size={20} />
            </div>

            <h3 className="mt-5 text-xl font-semibold text-gray-950">
              {officeName}
            </h3>

            <p className="mt-3 text-sm leading-7 text-gray-600">{address}</p>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-black/5 bg-gray-50 p-4">
              <Clock size={18} className="mt-0.5 shrink-0 text-gray-700" />
              <div>
                <div className="text-sm font-semibold text-gray-950">Office hours</div>
                <div className="mt-1 text-sm leading-6 text-gray-600">
                  {officeHours}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <iframe
              title="Smart Shop office location"
              src={mapEmbedUrl}
              width="100%"
              height="100%"
              className="min-h-[320px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default StoreLocationSection;