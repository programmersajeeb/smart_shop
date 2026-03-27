import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../services/firebaseClient";

function isValidEmail(email) {
  const v = String(email || "").trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function getErrorMessage(err) {
  const code = err?.code || "";

  if (code === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }
  if (code === "auth/user-not-found") {
    return "No account found with this email.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Please wait a bit and try again.";
  }
  if (code === "auth/network-request-failed") {
    return "Network error. Please check your connection and try again.";
  }

  return err?.message ? String(err.message) : "Could not send reset email. Please try again.";
}

function AuthFeature({ icon: Icon, title, text }) {
  return (
    <div className="rounded-[24px] border border-gray-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-800">
          <Icon size={18} />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="mt-1 text-sm leading-6 text-gray-600">{text}</div>
        </div>
      </div>
    </div>
  );
}

function AuthInput({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  error,
  autoFocus = false,
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-gray-800">{label}</div>
      <div
        className={[
          "mt-2 flex items-center gap-3 rounded-[22px] border bg-white px-4 py-3 shadow-sm transition",
          "focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2",
          error ? "border-red-300" : "border-gray-200",
        ].join(" ")}
      >
        <Icon size={18} className="shrink-0 text-gray-500" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
        />
      </div>
      {error ? <div className="mt-2 text-xs text-red-600">{error}</div> : null}
    </label>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [touched, setTouched] = useState({
    email: false,
  });

  const emailOk = useMemo(() => isValidEmail(email), [email]);

  async function onSubmit(e) {
    e.preventDefault();

    setTouched({ email: true });
    setError("");
    setSuccess("");

    if (!emailOk) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, String(email || "").trim());

      setSuccess(
        "Password reset email has been sent. Please check your inbox and spam folder."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell min-h-[calc(100vh-64px)]">
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="breadcrumbs text-sm text-gray-600">
            <ul>
              <li>
                <Home size={16} />
                <Link to="/" className="hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li className="font-semibold text-gray-900">Forgot password</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="auth-panel auth-panel-dark rounded-[32px] border border-gray-200 p-8 shadow-sm md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-white/90">
              <Sparkles size={16} />
              Account recovery
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Reset your password
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-gray-300 md:text-base">
              Enter your account email and we will send you a secure password reset
              link so you can regain access quickly.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AuthFeature
                icon={ShieldCheck}
                title="Secure recovery"
                text="Password reset is handled through a protected email verification flow."
              />
              <AuthFeature
                icon={KeyRound}
                title="Fast access restore"
                text="Use the reset link to create a new password and sign back in."
              />
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold text-white">Before you continue</div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-300">
                <li>Use the same email you used during registration.</li>
                <li>Check spam or promotions folder if you do not see the email.</li>
                <li>After reset, sign in again with your new password.</li>
              </ul>
            </div>
          </div>

          <div className="auth-panel rounded-[32px] border border-gray-200 bg-white p-8 shadow-sm md:p-10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                  Forgot password
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  We will email you a reset link.
                </p>
              </div>

              <Link
                to="/signin"
                className="text-sm font-medium text-gray-700 underline decoration-gray-300 underline-offset-4 transition hover:text-gray-900"
              >
                Back to sign in
              </Link>
            </div>

            {success ? (
              <div className="mt-6 flex gap-3 rounded-[24px] border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
                <div>
                  <div className="font-semibold">Email sent</div>
                  <div className="mt-1">{success}</div>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 flex gap-3 rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <AlertTriangle className="mt-0.5 shrink-0" size={18} />
                <div>
                  <div className="font-semibold">Couldn’t send reset email</div>
                  <div className="mt-1">{error}</div>
                </div>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="mt-6">
              <div className="space-y-4">
                <AuthInput
                  label="Email address"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched({ email: true })}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  error={touched.email && !emailOk ? "Please enter a valid email address." : ""}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className={[
                    "inline-flex w-full items-center justify-center gap-2 rounded-[22px] px-6 py-4 text-sm font-semibold transition",
                    loading
                      ? "cursor-not-allowed bg-gray-200 text-gray-500"
                      : "bg-black text-white hover:bg-gray-900",
                  ].join(" ")}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Sending reset link...
                    </>
                  ) : (
                    <>
                      Send reset link
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div className="rounded-[22px] border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Remember your password?{" "}
                  <Link
                    to="/signin"
                    className="font-medium text-gray-900 underline decoration-gray-300 underline-offset-4"
                  >
                    Go back to sign in
                  </Link>
                </div>
              </div>
            </form>

            {loading ? (
              <div className="mt-4 text-xs text-gray-500">
                Please wait while we process your request.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}