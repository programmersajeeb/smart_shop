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

const KEY_LAST_PATH = "ss_last_path";

function isValidEmail(email) {
  const v = String(email || "").trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function getErrorMessage(err) {
  const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
  if (serverMsg) return String(serverMsg);

  const code = err?.code || "";
  if (code === "auth/invalid-email") return "Please enter a valid email address.";
  if (code === "auth/user-not-found") return "No account found with this email.";
  if (code === "auth/wrong-password") return "Incorrect password. Please try again.";
  if (code === "auth/invalid-credential") return "Invalid email or password.";
  if (code === "auth/too-many-requests") return "Too many attempts. Please wait a bit and try again.";
  if (code === "auth/network-request-failed") return "Network error. Please check your connection and try again.";

  return err?.message ? String(err.message) : "Login failed. Please try again.";
}

/**
 * ✅ FIX: auth payload থেকে শুধু "user" বের করবো
 * - { user }
 * - { data: { user } }
 * - অন্য কিছু হলে null
 */
function pickUserFromAuthPayload(payload) {
  if (!payload) return null;
  return payload?.user || payload?.data?.user || null;
}

function roleOf(u) {
  return String(u?.role || "").toLowerCase();
}

function sanitizeInternalPath(path, fallback = "/") {
  const p = String(path || "").trim();
  if (!p) return fallback;

  // Must be an internal relative path
  if (!p.startsWith("/")) return fallback;

  // Prevent protocol-relative: //evil.com
  if (p.startsWith("//")) return fallback;

  // Prevent schemes inside
  if (p.includes("://")) return fallback;

  // Prevent weird backslash forms
  if (p.startsWith("/\\")) return fallback;

  return p;
}

function readLastPath() {
  try {
    const v = sessionStorage.getItem(KEY_LAST_PATH);
    if (typeof v === "string") {
      const s = sanitizeInternalPath(v, "");
      if (s) return s;
    }
  } catch {
    // ignore
  }
  return "";
}

function isAuthLikePath(p = "") {
  const s = String(p || "");
  return (
    s === "/signin" ||
    s.startsWith("/signin?") ||
    s === "/signup" ||
    s.startsWith("/signup?") ||
    s === "/forgot-password" ||
    s.startsWith("/forgot-password?")
  );
}

function readReturnToFromQuery(search) {
  const qs = String(search || "");
  if (!qs) return "";
  try {
    const sp = new URLSearchParams(qs);
    const v = sp.get("returnTo") || "";
    const s = sanitizeInternalPath(v, "");
    return s;
  } catch {
    return "";
  }
}

/**
 * Enterprise rule (fixed):
 * - Priority handled outside: query returnTo > state.from > lastPath > default
 * - "/" is valid page (DO NOT treat as auth-like)
 * - Admin default landing: /admin when no explicit returnTo (source: default)
 * - If returnTo is /admin but user isn't admin => /403 (enterprise standard)
 */
function resolvePostLoginTarget({ user, returnTo, returnToSource }) {
  const r = roleOf(user);
  const isAdmin = r === "admin" || r === "superadmin";

  const rt = sanitizeInternalPath(returnTo, "/");

  // If returnTo is actually an auth page, ignore it
  if (isAuthLikePath(rt)) {
    if (isAdmin) return "/admin";
    return "/";
  }

  if (isAdmin) {
    // If no explicit returnTo (user opened sign-in directly)
    if (returnToSource === "default") return "/admin";

    // Admin should not be forced into /account area
    if (rt.startsWith("/account") || rt.startsWith("/settings")) return "/admin";

    // If they were trying to open admin, go there
    if (rt.startsWith("/admin")) return rt;

    // Otherwise allow returning to store pages like /shop, /collections, /
    return rt || "/admin";
  }

  // Normal user
  if (rt.startsWith("/admin")) return "/403";
  return rt || "/";
}

export default function SignInPage() {
  const nav = useNavigate();
  const loc = useLocation();

  const { loginWithGoogle, setUser } = useAuth();

  // ✅ Enterprise: returnTo priority: query.returnTo -> loc.state.from -> sessionStorage last path -> default "/"
  const returnToInfo = useMemo(() => {
    const fromQuery = readReturnToFromQuery(loc.search);
    if (fromQuery && !isAuthLikePath(fromQuery)) {
      return { value: fromQuery, source: "query" };
    }

    const fromStateRaw = loc.state?.from;
    const fromState =
      typeof fromStateRaw === "string" ? sanitizeInternalPath(fromStateRaw, "") : "";
    if (fromState && !isAuthLikePath(fromState)) {
      return { value: fromState, source: "state" };
    }

    const last = readLastPath();
    if (last && !isAuthLikePath(last)) {
      return { value: last, source: "last" };
    }

    return { value: "/", source: "default" };
  }, [loc.search, loc.state]);

  const returnTo = returnToInfo.value;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [showPass, setShowPass] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const isBusy = googleLoading || emailLoading;

  const [error, setError] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailOk = isValidEmail(email);
  const passOk = String(password || "").length >= 6;

  async function onGoogleLogin() {
    setError("");
    setTouched((s) => ({ ...s }));

    try {
      setGoogleLoading(true);

      // ✅ FIX: loginWithGoogle যাই return করুক, user ঠিকমতো বের করি
      const payload = await loginWithGoogle(remember);
      const authedUser = pickUserFromAuthPayload(payload) || payload || null;

      // কন্টেক্সটে user না থাকলে set করে দিই (safe)
      if (authedUser) setUser(authedUser);

      const target = resolvePostLoginTarget({
        user: authedUser,
        returnTo,
        returnToSource: returnToInfo.source,
      });

      // Enterprise: if user tried /admin -> 403 with context
      if (target === "/403" && returnTo.startsWith("/admin")) {
        nav("/403", { replace: true, state: { from: returnTo } });
        return;
      }

      nav(target, { replace: true });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setGoogleLoading(false);
    }
  }

  async function emailPasswordLogin() {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken(true);

    const data = await exchangeFirebaseToken(idToken);

    if (data?.accessToken) {
      setAccessToken(data.accessToken, { remember });
    }

    // ✅ FIX: user normalize
    const u = pickUserFromAuthPayload(data);
    if (u) setUser(u);

    return { ...data, user: u || data?.user };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setTouched({ email: true, password: true });

    if (!emailOk) return setError("Please enter a valid email address.");
    if (!passOk) return setError("Password must be at least 6 characters.");

    try {
      setEmailLoading(true);

      const data = await emailPasswordLogin();
      const u = pickUserFromAuthPayload(data) || data?.user || null;

      const target = resolvePostLoginTarget({
        user: u,
        returnTo,
        returnToSource: returnToInfo.source,
      });

      // Enterprise: if user tried /admin -> 403 with context
      if (target === "/403" && returnTo.startsWith("/admin")) {
        nav("/403", { replace: true, state: { from: returnTo } });
        return;
      }

      nav(target, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEmailLoading(false);
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
              <li className="font-semibold">Sign in</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
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

          <div className="rounded-2xl border bg-white p-8 md:p-10 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Sign in</h2>
              <Link to="/signup" className="text-sm underline text-gray-700 hover:text-gray-900">
                Create account
              </Link>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex gap-3">
                <AlertTriangle className="mt-0.5" size={18} />
                <div>
                  <div className="font-semibold">Couldn’t sign you in</div>
                  <div className="mt-1">{error}</div>
                </div>
              </div>
            ) : null}

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
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">Email</span>
                  </div>

                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      className={[
                        "input input-bordered w-full pl-11 rounded-2xl",
                        touched.email && !emailOk ? "input-error" : "",
                      ].join(" ")}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((s) => ({ ...s, email: true }))}
                      autoComplete="email"
                    />
                  </div>
                </label>

                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">Password</span>
                    <Link to="/forgot-password" className="label-text-alt link link-hover">
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      className={[
                        "input input-bordered w-full pl-11 pr-11 rounded-2xl",
                        touched.password && !passOk ? "input-error" : "",
                      ].join(" ")}
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setTouched((s) => ({ ...s, password: true }))}
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-gray-100"
                      onClick={() => setShowPass((v) => !v)}
                      aria-label={showPass ? "Hide password" : "Show password"}
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Remember me
                  </label>
                </div>

                <button type="submit" disabled={isBusy} className="btn btn-neutral w-full rounded-2xl">
                  {emailLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      Signing in...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Sign in <ArrowRight size={18} />
                    </span>
                  )}
                </button>
              </div>
            </form>

            <p className="mt-5 text-sm text-gray-600">
              New here?{" "}
              <Link to="/signup" className="underline font-medium">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
