import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/hooks/useAuth";

import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Home,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebaseClient";

import { exchangeFirebaseToken } from "../../services/authApi";
import { setAccessToken } from "../../core/config/tokenStore";

function isValidEmail(email) {
  const v = String(email || "").trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function getErrorMessage(err) {
  const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
  if (serverMsg) return String(serverMsg);

  // Firebase common error mapping (keep UX friendly)
  const code = err?.code || "";
  if (code === "auth/invalid-email") return "Please enter a valid email address.";
  if (code === "auth/user-not-found") return "No account found with this email.";
  if (code === "auth/wrong-password") return "Incorrect password. Please try again.";
  if (code === "auth/invalid-credential") return "Invalid email or password.";
  if (code === "auth/too-many-requests")
    return "Too many attempts. Please wait a bit and try again.";
  if (code === "auth/network-request-failed")
    return "Network error. Please check your connection and try again.";

  return err?.message ? String(err.message) : "Login failed. Please try again.";
}

export default function SignInPage() {
  const nav = useNavigate();
  const loc = useLocation();

  const { loginWithGoogle, setUser } = useAuth();

  const returnTo = useMemo(() => {
    const fromState = loc.state?.from;
    if (typeof fromState === "string" && fromState.startsWith("/")) return fromState;
    return "/";
  }, [loc.state]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [showPass, setShowPass] = useState(false);

  // Separate loading states (enterprise UX)
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const isBusy = googleLoading || emailLoading;

  const [error, setError] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailOk = isValidEmail(email);
  const passOk = String(password || "").length >= 6;

  async function onGoogleLogin() {
    setError("");
    setTouched((s) => ({ ...s })); // keep form state

    try {
      setGoogleLoading(true);

      // AuthProvider should handle user/session internally.
      // remember=true -> persistent storage; remember=false -> session-only (depends on your auth setup)
      await loginWithGoogle(remember);

      nav(returnTo, { replace: true });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setGoogleLoading(false);
    }
  }

  async function emailPasswordLogin() {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // Use a fresh token (safe for backend session exchange)
    const idToken = await cred.user.getIdToken(true);

    // Exchange Firebase ID token for backend access token + refresh cookie
    const data = await exchangeFirebaseToken(idToken);

    if (data?.accessToken) {
      // tokenStore currently uses localStorage by default.
      // remember=true -> keep token after browser restart; remember=false -> session-only (tokenStore must support it)
      setAccessToken(data.accessToken, { remember });
    }

    if (data?.user) setUser(data.user);

    return data;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setTouched({ email: true, password: true });

    if (!emailOk) return setError("Please enter a valid email address.");
    if (!passOk) return setError("Password must be at least 6 characters.");

    try {
      setEmailLoading(true);
      await emailPasswordLogin();
      nav(returnTo, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Top bar / breadcrumb */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <Home size={16} />
                <Link to="/">Home</Link>
              </li>
              <li className="font-semibold">Sign in</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left: Brand / Trust */}
          <div className="rounded-2xl border bg-white p-8 md:p-10 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 border px-3 py-1 text-sm">
              <Sparkles size={16} />
              Secure & Smooth Experience
            </div>

            <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              Welcome back 👋
            </h1>
            <p className="mt-2 text-gray-600 max-w-xl">
              Sign in to continue shopping with a fast, secure, and user-friendly checkout
              experience. International standard UI/UX — clean, responsive, and accessible.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border p-4 flex items-start gap-3 bg-white">
                <ShieldCheck className="text-gray-800 mt-0.5" />
                <div>
                  <div className="font-semibold">Secure Login</div>
                  <div className="text-sm text-gray-600">Protected sessions & best practices</div>
                </div>
              </div>
              <div className="rounded-2xl border p-4 flex items-start gap-3 bg-white">
                <Lock className="text-gray-800 mt-0.5" />
                <div>
                  <div className="font-semibold">Privacy First</div>
                  <div className="text-sm text-gray-600">We respect your data & security</div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border bg-gradient-to-br from-white to-gray-50 p-6">
              <div className="text-sm font-semibold text-gray-900">Pro tips</div>
              <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                <li>Use a strong password (8+ chars recommended).</li>
                <li>Enable “Remember me” only on personal devices.</li>
                <li>If you forgot your password, reset it securely.</li>
              </ul>
            </div>
          </div>

          {/* Right: Form */}
          <div className="rounded-2xl border bg-white p-8 md:p-10 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Sign in</h2>
              <Link to="/signup" className="text-sm underline text-gray-700 hover:text-gray-900">
                Create account
              </Link>
            </div>

            {/* Error box */}
            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex gap-3">
                <AlertTriangle className="mt-0.5" size={18} />
                <div>
                  <div className="font-semibold">Couldn’t sign you in</div>
                  <div className="mt-1">{error}</div>
                </div>
              </div>
            ) : null}

            {/* Google Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={onGoogleLogin}
                disabled={isBusy}
                className="btn btn-outline w-full rounded-2xl bg-white hover:bg-gray-50 border-gray-200"
              >
                {googleLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Please wait...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-3">
                    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                      <path
                        fill="#FFC107"
                        d="M43.611 20.083H42V20H24v8h11.303C33.651 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
                      />
                      <path
                        fill="#FF3D00"
                        d="M6.306 14.691l6.571 4.819C14.655 16.108 19.003 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                      />
                      <path
                        fill="#4CAF50"
                        d="M24 44c5.122 0 9.807-1.963 13.335-5.154l-6.164-5.214C29.136 35.091 26.715 36 24 36c-5.202 0-9.617-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                      />
                      <path
                        fill="#1976D2"
                        d="M43.611 20.083H42V20H24v8h11.303a12.02 12.02 0 0 1-4.132 5.632l.003-.002 6.164 5.214C36.905 39.308 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"
                      />
                    </svg>
                    Continue with Google
                  </span>
                )}
              </button>

              <div className="divider my-5 text-xs text-gray-500">OR</div>
            </div>

            <form onSubmit={onSubmit} className={isBusy ? "opacity-90 pointer-events-none" : ""}>
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-gray-800">Email address</label>
                  <div
                    className={[
                      "mt-2 flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm",
                      "focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2",
                      touched.email && !emailOk ? "border-red-300" : "border-gray-200",
                    ].join(" ")}
                  >
                    <Mail size={18} className="text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((s) => ({ ...s, email: true }))}
                      placeholder="you@example.com"
                      className="w-full outline-none text-gray-900"
                      aria-label="Email address"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>

                  {touched.email && !emailOk ? (
                    <div className="mt-2 text-xs text-red-600">Please enter a valid email.</div>
                  ) : null}
                </div>

                {/* Password */}
                <div>
                  <label className="text-sm font-medium text-gray-800">Password</label>
                  <div
                    className={[
                      "mt-2 flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm",
                      "focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2",
                      touched.password && !passOk ? "border-red-300" : "border-gray-200",
                    ].join(" ")}
                  >
                    <Lock size={18} className="text-gray-500" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setTouched((s) => ({ ...s, password: true }))}
                      placeholder="Enter your password"
                      className="w-full outline-none text-gray-900"
                      aria-label="Password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="p-2 rounded-xl hover:bg-gray-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                      aria-label={showPass ? "Hide password" : "Show password"}
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {touched.password && !passOk ? (
                    <div className="mt-2 text-xs text-red-600">
                      Password must be at least 6 characters.
                    </div>
                  ) : null}
                </div>

                {/* Remember / Forgot */}
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Remember me
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm underline text-gray-700 hover:text-gray-900"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isBusy}
                  className={[
                    "w-full rounded-2xl px-6 py-4 font-semibold text-white transition",
                    "bg-black hover:bg-gray-900",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                    isBusy ? "opacity-80 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {emailLoading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      Signing in...
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      Sign in <ArrowRight size={18} />
                    </span>
                  )}
                </button>

                <p className="text-xs text-gray-500 mt-3">
                  By continuing, you agree to our{" "}
                  <Link className="underline hover:text-gray-800" to="/terms">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link className="underline hover:text-gray-800" to="/privacy">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
