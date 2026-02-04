import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Home, Mail, ArrowRight, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../services/firebaseClient";

function isValidEmail(email) {
  const v = String(email || "").trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const emailOk = useMemo(() => isValidEmail(email), [email]);

  async function onSubmit(e) {
    e.preventDefault();
    setTouched(true);
    setError("");
    setSuccess("");

    if (!emailOk) return setError("Please enter a valid email address.");

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess("Password reset email sent. Please check your inbox (and spam folder).");
    } catch (err) {
      setError(err?.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <Home size={16} />
                <Link to="/">Home</Link>
              </li>
              <li className="font-semibold">Forgot password</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10">
        <div className="max-w-xl mx-auto rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
          <p className="text-gray-600 mt-2">
            Enter your email and we will send you a password reset link.
          </p>

          {success ? (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex gap-3">
              <CheckCircle2 className="mt-0.5" size={18} />
              <div>{success}</div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex gap-3">
              <AlertTriangle className="mt-0.5" size={18} />
              <div>{error}</div>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-800">Email address</label>
              <div
                className={[
                  "mt-2 flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm",
                  "focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2",
                  touched && !emailOk ? "border-red-300" : "border-gray-200",
                ].join(" ")}
              >
                <Mail size={18} className="text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="you@example.com"
                  className="w-full outline-none text-gray-900"
                  aria-label="Email address"
                  autoComplete="email"
                />
              </div>

              {touched && !emailOk ? (
                <div className="mt-2 text-xs text-red-600">Please enter a valid email.</div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={[
                "w-full rounded-2xl px-6 py-4 font-semibold text-white transition",
                "bg-black hover:bg-gray-900",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                loading ? "opacity-80 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Sending...
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-2">
                  Send reset link <ArrowRight size={18} />
                </span>
              )}
            </button>

            <div className="text-sm text-gray-600">
              Remembered your password?{" "}
              <Link to="/signin" className="underline hover:text-gray-900">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
