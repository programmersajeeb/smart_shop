import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  PackageSearch,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Truck,
  ReceiptText,
  Phone,
  Hash,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { raw } from "../../services/apiClient";

const INITIAL_FORM = {
  orderId: "",
  phone: "",
};

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "").trim();
}

function isValidObjectId(value) {
  return /^[0-9a-fA-F]{24}$/.test(String(value || "").trim());
}

function validateForm(form) {
  const errors = {
    orderId: "",
    phone: "",
  };

  const orderId = normalizeText(form.orderId);
  const phone = normalizePhone(form.phone);

  if (!orderId) {
    errors.orderId = "Please enter your order ID.";
  } else if (!isValidObjectId(orderId)) {
    errors.orderId = "Please enter a valid order ID.";
  }

  if (!phone) {
    errors.phone = "Please enter the phone number used during checkout.";
  } else if (phone.length < 7 || phone.length > 16) {
    errors.phone = "Please enter a valid phone number.";
  }

  return errors;
}

function formatMoney(value) {
  const amount = Number(value || 0);
  if (Number.isNaN(amount)) return "৳0";
  return `৳${amount.toFixed(0)}`;
}

function getStatusMeta(statusRaw) {
  const status = String(statusRaw || "pending").toLowerCase();

  if (status === "delivered") {
    return {
      label: "Delivered",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
      summary: "Your order has been delivered successfully.",
    };
  }

  if (status === "shipped") {
    return {
      label: "Shipped",
      badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
      icon: Truck,
      summary: "Your order is on the way.",
    };
  }

  if (status === "processing") {
    return {
      label: "Processing",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
      icon: Loader2,
      summary: "Your order is being prepared.",
    };
  }

  if (status === "paid") {
    return {
      label: "Paid",
      badgeClass: "border-green-200 bg-green-50 text-green-700",
      icon: CheckCircle2,
      summary: "Payment has been recorded and the order is moving forward.",
    };
  }

  if (status === "cancelled") {
    return {
      label: "Cancelled",
      badgeClass: "border-red-200 bg-red-50 text-red-700",
      icon: AlertTriangle,
      summary: "This order is marked as cancelled.",
    };
  }

  return {
    label: "Pending",
    badgeClass: "border-gray-200 bg-gray-50 text-gray-700",
    icon: ReceiptText,
    summary: "Your order has been received and is waiting for the next step.",
  };
}

function FieldError({ message }) {
  if (!message) return null;

  return (
    <div className="mt-2 flex items-start gap-2 text-xs text-red-600">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function InputShell({ icon: Icon, children, invalid = false }) {
  return (
    <div
      className={[
        "mt-2 flex min-h-[56px] items-center gap-3 rounded-[20px] border bg-white px-4 shadow-sm transition-colors transition-shadow",
        invalid
          ? "border-red-300 focus-within:border-red-400 focus-within:shadow-[0_0_0_4px_rgba(239,68,68,0.08)]"
          : "border-black/10 focus-within:border-black/25 focus-within:shadow-[0_0_0_4px_rgba(17,24,39,0.06)]",
      ].join(" ")}
    >
      <Icon
        size={18}
        className={["shrink-0", invalid ? "text-red-500" : "text-gray-500"].join(" ")}
      />
      {children}
    </div>
  );
}

export default function TrackOrderPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState({});
  const [submitState, setSubmitState] = useState({
    loading: false,
    error: "",
  });
  const [order, setOrder] = useState(null);

  const errors = useMemo(() => validateForm(form), [form]);
  const statusMeta = getStatusMeta(order?.status);
  const StatusIcon = statusMeta.icon;

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSubmitState((prev) => ({
      ...prev,
      error: "",
    }));
  }

  function markTouched(name) {
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const nextTouched = {
      orderId: true,
      phone: true,
    };

    setTouched(nextTouched);
    setSubmitState({
      loading: false,
      error: "",
    });

    const nextErrors = validateForm(form);
    const invalid = Object.values(nextErrors).some(Boolean);
    if (invalid) return;

    try {
      setSubmitState({
        loading: true,
        error: "",
      });

      setOrder(null);

      const orderId = normalizeText(form.orderId);
      const phone = normalizePhone(form.phone);

      const response = await raw.get(`/orders/public/${orderId}`, {
        params: { phone },
      });

      setOrder(response?.data || null);
      setSubmitState({
        loading: false,
        error: "",
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "We could not find an order with those details.";

      setSubmitState({
        loading: false,
        error: String(message),
      });
      setOrder(null);
    }
  }

  return (
    <div className="bg-white">
      <section className="w-full border-b border-black/5 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(249,250,251,0.96)_36%,rgba(243,244,246,0.92)_100%)] py-16 md:py-24">
        <div className="site-shell">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-600">
              Order support
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-950 md:text-5xl">
              Track your order
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-600 md:text-[15px]">
              Enter your order ID and the phone number used during checkout to view the
              current order status, item summary, and shipping details.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-14 md:py-20">
        <div className="site-shell">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[30px] border border-black/5 bg-gray-50 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 bg-white text-gray-900">
                <PackageSearch size={20} />
              </div>

              <h2 className="mt-5 text-2xl font-bold tracking-tight text-gray-950">
                Find your order
              </h2>

              <p className="mt-3 text-sm leading-7 text-gray-600">
                For guest order lookup, use the exact phone number entered during checkout.
                This helps keep your order information secure.
              </p>

              {submitState.error ? (
                <div className="mt-6 rounded-[24px] border border-red-200 bg-red-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-white text-red-700">
                      <AlertTriangle size={20} />
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-gray-950">
                        We could not complete the lookup
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        {submitState.error}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
                <div>
                  <label className="text-sm font-semibold text-gray-800">Order ID</label>
                  <InputShell icon={Hash} invalid={touched.orderId && !!errors.orderId}>
                    <input
                      type="text"
                      value={form.orderId}
                      onChange={(e) => updateField("orderId", e.target.value)}
                      onBlur={() => markTouched("orderId")}
                      placeholder="Enter your order ID"
                      className="w-full border-0 bg-transparent text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400"
                    />
                  </InputShell>
                  <FieldError message={touched.orderId ? errors.orderId : ""} />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-800">
                    Checkout phone number
                  </label>
                  <InputShell icon={Phone} invalid={touched.phone && !!errors.phone}>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      onBlur={() => markTouched("phone")}
                      placeholder="Enter the phone number used during checkout"
                      className="w-full border-0 bg-transparent text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400"
                    />
                  </InputShell>
                  <FieldError message={touched.phone ? errors.phone : ""} />
                </div>

                <div className="rounded-[24px] border border-black/5 bg-white px-5 py-4">
                  <p className="text-sm leading-6 text-gray-600">
                    If you entered the wrong phone number during checkout or cannot locate
                    your order ID, contact support for help with verification.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitState.loading}
                  className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {submitState.loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Checking order...
                    </>
                  ) : (
                    <>
                      <PackageSearch size={18} />
                      Track order
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex flex-col gap-3 rounded-[24px] border border-black/5 bg-white p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <ShieldCheck size={16} />
                  Helpful shortcuts
                </div>

                <Link
                  to="/faq"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 transition hover:text-black"
                >
                  Read common support questions
                  <ArrowRight size={16} />
                </Link>

                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 transition hover:text-black"
                >
                  Contact support directly
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-black/5 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-8">
              {!order ? (
                <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-[24px] border border-dashed border-black/10 bg-gray-50 px-6 py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-black/5 bg-white text-gray-900">
                    <ShoppingBag size={22} />
                  </div>

                  <h2 className="mt-5 text-2xl font-bold tracking-tight text-gray-950">
                    Order details will appear here
                  </h2>

                  <p className="mt-3 max-w-md text-sm leading-7 text-gray-600">
                    After a successful lookup, you will see your current order status, item
                    summary, pricing overview, and delivery information in this section.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Order found
                      </div>

                      <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">
                        Here is the latest status for your order
                      </h2>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700">
                          <Hash size={14} />
                          {order?._id}
                        </span>

                        <span
                          className={[
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                            statusMeta.badgeClass,
                          ].join(" ")}
                        >
                          <StatusIcon
                            size={14}
                            className={statusMeta.label === "Processing" ? "animate-spin" : ""}
                          />
                          {statusMeta.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[24px] border border-black/5 bg-gray-50 p-5">
                    <p className="text-sm leading-7 text-gray-700">{statusMeta.summary}</p>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
                    <div className="space-y-4 xl:col-span-7">
                      <div className="rounded-[24px] border border-black/5 bg-white p-5">
                        <div className="text-sm font-semibold text-gray-900">Ordered items</div>

                        <div className="mt-4 space-y-3">
                          {(order.items || []).map((item, index) => (
                            <div
                              key={`${item.title}-${index}`}
                              className="flex items-center gap-3 rounded-2xl border border-black/5 bg-gray-50 p-3"
                            >
                              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-black/5 bg-white">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : null}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-gray-900">
                                  {item.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Qty: {item.qty} • {formatMoney(item.price)}
                                </div>
                              </div>

                              <div className="text-sm font-bold text-gray-900">
                                {formatMoney((item.price || 0) * (item.qty || 0))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-black/5 bg-white p-5">
                        <div className="text-sm font-semibold text-gray-900">Delivery details</div>

                        <div className="mt-4 space-y-2 text-sm text-gray-700">
                          <div>
                            <span className="text-gray-500">Name:</span>{" "}
                            {order?.shippingAddress?.name || "-"}
                          </div>
                          <div>
                            <span className="text-gray-500">Phone:</span>{" "}
                            {order?.shippingAddress?.phone || "-"}
                          </div>
                          <div>
                            <span className="text-gray-500">Address:</span>{" "}
                            {order?.shippingAddress?.addressLine || "-"}
                          </div>
                          <div>
                            <span className="text-gray-500">City:</span>{" "}
                            {order?.shippingAddress?.city || "-"}
                          </div>
                          <div>
                            <span className="text-gray-500">Country:</span>{" "}
                            {order?.shippingAddress?.country || "-"}
                          </div>
                          <div>
                            <span className="text-gray-500">Postal code:</span>{" "}
                            {order?.shippingAddress?.postalCode || "-"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 xl:col-span-5">
                      <div className="rounded-[24px] border border-black/5 bg-gray-50 p-5">
                        <div className="text-sm font-semibold text-gray-900">Order summary</div>

                        <div className="mt-4 space-y-3 text-sm text-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-semibold">{formatMoney(order.subtotal)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Shipping</span>
                            <span className="font-semibold">
                              {formatMoney(order.shipping || 0)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Discount</span>
                            <span className="font-semibold">
                              {formatMoney(order.discount || 0)}
                            </span>
                          </div>

                          <div className="h-px bg-black/5" />

                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">Total</span>
                            <span className="font-bold text-gray-950">
                              {formatMoney(order.total)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-black/5 bg-white p-5">
                        <div className="text-sm font-semibold text-gray-900">Need more help?</div>
                        <p className="mt-2 text-sm leading-7 text-gray-600">
                          If the status looks incorrect or you need help with a delivery,
                          refund, or payment issue, contact support with your order reference.
                        </p>

                        <div className="mt-5 flex flex-col gap-3">
                          <Link
                            to="/contact"
                            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
                          >
                            <AlertTriangle size={18} />
                            Contact support
                          </Link>

                          <Link
                            to="/returns"
                            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                          >
                            <ArrowRight size={18} />
                            Review return policy
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}