import { useMemo, useState } from "react";
import {
  Mail,
  User,
  MessageSquare,
  Phone,
  Tag,
  FileText,
  Send,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { raw } from "../../../../services/apiClient";

const INQUIRY_OPTIONS = [
  { value: "general", label: "General question" },
  { value: "order_support", label: "Order support" },
  { value: "delivery", label: "Delivery update" },
  { value: "return_refund", label: "Return or refund" },
  { value: "payment", label: "Payment issue" },
  { value: "business", label: "Business inquiry" },
  { value: "press", label: "Media and press" },
];

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  inquiryType: "general",
  subject: "",
  orderReference: "",
  message: "",
};

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function validateEmail(value) {
  const email = normalizeText(value);
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(value) {
  const phone = String(value || "").replace(/[^\d+]/g, "").trim();
  if (!phone) return true;
  return phone.length >= 7 && phone.length <= 16;
}

function getFieldError(name, value, form) {
  const clean = normalizeText(value);

  if (name === "name") {
    if (!clean) return "Please enter your name.";
    if (clean.length < 2) return "Name should be at least 2 characters.";
    return "";
  }

  if (name === "email") {
    if (!clean) return "Please enter your email address.";
    if (!validateEmail(clean)) return "Please enter a valid email address.";
    return "";
  }

  if (name === "phone") {
    if (!validatePhone(value)) return "Please enter a valid phone number.";
    return "";
  }

  if (name === "subject") {
    if (!clean) return "Please add a subject.";
    if (clean.length < 4) return "Subject should be a bit more specific.";
    return "";
  }

  if (name === "message") {
    if (!clean) return "Please write your message.";
    if (clean.length < 20) {
      return "Please share a few more details so we can help properly.";
    }
    return "";
  }

  if (name === "orderReference") {
    if (
      form.inquiryType === "order_support" ||
      form.inquiryType === "delivery" ||
      form.inquiryType === "return_refund" ||
      form.inquiryType === "payment"
    ) {
      if (!clean) return "Order reference helps us review your request faster.";
    }
    return "";
  }

  return "";
}

function buildErrors(form) {
  return {
    name: getFieldError("name", form.name, form),
    email: getFieldError("email", form.email, form),
    phone: getFieldError("phone", form.phone, form),
    subject: getFieldError("subject", form.subject, form),
    orderReference: getFieldError("orderReference", form.orderReference, form),
    message: getFieldError("message", form.message, form),
  };
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

function FieldError({ message }) {
  if (!message) return null;

  return (
    <div className="mt-2 flex items-start gap-2 text-xs text-red-600">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function ContactFormSection() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState({});
  const [submitState, setSubmitState] = useState({
    loading: false,
    success: false,
    error: "",
  });

  const errors = useMemo(() => buildErrors(form), [form]);

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSubmitState((prev) => ({
      ...prev,
      success: false,
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
      name: true,
      email: true,
      phone: true,
      subject: true,
      orderReference: true,
      message: true,
    };

    setTouched(nextTouched);
    setSubmitState({
      loading: false,
      success: false,
      error: "",
    });

    const nextErrors = buildErrors(form);
    const invalid = Object.values(nextErrors).some(Boolean);

    if (invalid) return;

    try {
      setSubmitState({
        loading: true,
        success: false,
        error: "",
      });

      const payload = {
        name: normalizeText(form.name),
        email: normalizeText(form.email),
        phone: normalizeText(form.phone),
        inquiryType: form.inquiryType,
        subject: normalizeText(form.subject),
        orderReference: normalizeText(form.orderReference),
        message: normalizeText(form.message),
      };

      await raw.post("/support", payload);

      setSubmitState({
        loading: false,
        success: true,
        error: "",
      });

      setForm(INITIAL_FORM);
      setTouched({});
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "We could not send your message right now. Please try again.";

      setSubmitState({
        loading: false,
        success: false,
        error: String(message),
      });
    }
  }

  const showOrderReference =
    form.inquiryType === "order_support" ||
    form.inquiryType === "delivery" ||
    form.inquiryType === "return_refund" ||
    form.inquiryType === "payment";

  const canSubmit = submitState.loading
    ? false
    : !Object.values(buildErrors(form)).some(Boolean);

  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="site-shell">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-950 md:text-4xl">
            Send us a message
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-600 md:text-[15px]">
            Share the details below and our team will review your message carefully.
            The more context you provide, the faster we can help.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-4xl rounded-[30px] border border-black/5 bg-gray-50 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-8 md:p-10">
          {submitState.success ? (
            <div className="mb-6 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-700">
                  <CheckCircle2 size={20} />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-950">
                    Your message has been received
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Thanks for reaching out. Our team will review your request and get
                    back to you as soon as possible.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {submitState.error ? (
            <div className="mb-6 rounded-[24px] border border-red-200 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-white text-red-700">
                  <AlertTriangle size={20} />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-950">
                    Message could not be sent
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {submitState.error}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-gray-800">Your name</label>
                <InputShell icon={User} invalid={touched.name && !!errors.name}>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    onBlur={() => markTouched("name")}
                    placeholder="Enter your full name"
                    className="w-full border-0 bg-transparent text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400"
                  />
                </InputShell>
                <FieldError message={touched.name ? errors.name : ""} />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Email address
                </label>
                <InputShell icon={Mail} invalid={touched.email && !!errors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    onBlur={() => markTouched("email")}
                    placeholder="Enter your email address"
                    className="w-full border-0 bg-transparent text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400"
                  />
                </InputShell>
                <FieldError message={touched.email ? errors.email : ""} />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800">Phone number</label>
                <InputShell icon={Phone} invalid={touched.phone && !!errors.phone}>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    onBlur={() => markTouched("phone")}
                    placeholder="Optional phone number"
                    className="w-full border-0 bg-transparent text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400"
                  />
                </InputShell>
                <FieldError message={touched.phone ? errors.phone : ""} />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800">Inquiry type</label>
                <InputShell icon={Tag}>
                  <select
                    value={form.inquiryType}
                    onChange={(e) => updateField("inquiryType", e.target.value)}
                    className="w-full border-0 bg-transparent text-sm text-gray-800 outline-none ring-0"
                  >
                    {INQUIRY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </InputShell>
              </div>

              <div className={showOrderReference ? "" : "md:col-span-2"}>
                <label className="text-sm font-semibold text-gray-800">Subject</label>
                <InputShell icon={FileText} invalid={touched.subject && !!errors.subject}>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => updateField("subject", e.target.value)}
                    onBlur={() => markTouched("subject")}
                    placeholder="What do you need help with?"
                    className="w-full border-0 bg-transparent text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400"
                  />
                </InputShell>
                <FieldError message={touched.subject ? errors.subject : ""} />
              </div>

              {showOrderReference ? (
                <div>
                  <label className="text-sm font-semibold text-gray-800">
                    Order reference
                  </label>
                  <InputShell
                    icon={ClipboardList}
                    invalid={touched.orderReference && !!errors.orderReference}
                  >
                    <input
                      type="text"
                      value={form.orderReference}
                      onChange={(e) => updateField("orderReference", e.target.value)}
                      onBlur={() => markTouched("orderReference")}
                      placeholder="Order ID, phone, or reference number"
                      className="w-full border-0 bg-transparent text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400"
                    />
                  </InputShell>
                  <FieldError
                    message={touched.orderReference ? errors.orderReference : ""}
                  />
                </div>
              ) : null}

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-800">Message</label>
                <div
                  className={[
                    "mt-2 flex items-start gap-3 rounded-[20px] border bg-white px-4 py-4 shadow-sm transition-colors transition-shadow",
                    touched.message && errors.message
                      ? "border-red-300 focus-within:border-red-400 focus-within:shadow-[0_0_0_4px_rgba(239,68,68,0.08)]"
                      : "border-black/10 focus-within:border-black/25 focus-within:shadow-[0_0_0_4px_rgba(17,24,39,0.06)]",
                  ].join(" ")}
                >
                  <MessageSquare
                    size={18}
                    className={[
                      "mt-1 shrink-0",
                      touched.message && errors.message ? "text-red-500" : "text-gray-500",
                    ].join(" ")}
                  />
                  <textarea
                    value={form.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    onBlur={() => markTouched("message")}
                    placeholder="Tell us what happened, what you need, and any details that would help our team understand your request."
                    rows={6}
                    className="w-full resize-none border-0 bg-transparent text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400"
                  />
                </div>
                <FieldError message={touched.message ? errors.message : ""} />
              </div>
            </div>

            <div className="rounded-[24px] border border-black/5 bg-white px-5 py-4">
              <p className="text-sm leading-6 text-gray-600">
                We use the information you provide only to review your request and reply
                properly. For order-related questions, adding your order reference helps
                us respond faster.
              </p>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              {submitState.loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending your message...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default ContactFormSection;