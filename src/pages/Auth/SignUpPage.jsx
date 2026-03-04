import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../../shared/hooks/useAuth";
import { auth } from "../../services/firebaseClient";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { exchangeFirebaseToken } from "../../services/authApi";
import { setAccessToken } from "../../core/config/tokenStore";

const KEY_LAST_PATH = "ss_last_path";

/**
 * SignUpPage (Production / Enterprise)
 * - Separate loading states (Google vs Email)
 * - Defensive error mapping (Firebase + backend)
 * - Prevent double submit / concurrent actions
 * - Clean validation & accessibility-friendly UI
 * - ✅ Role-based post-signup redirect (Admin → /admin, User → /account)
 */

function isValidEmail(email) {
  const v = String(email || "").trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function passwordStrength(pass) {
  const p = String(pass || "");
  let score = 0;

  if (p.length >= 8) score += 1;
  if (/[A-Z]/.test(p)) score += 1;
  if (/[a-z]/.test(p)) score += 1;
  if (/\d/.test(p)) score += 1;
  if (/[^A-Za-z0-9]/.test(p)) score += 1;

  if (p.length === 0) return { score: 0, label: "—", hint: "Enter a password" };
  if (score <= 2) return { score, label: "Weak", hint: "Use 8+ chars and mix letters & numbers" };
  if (score === 3) return { score, label: "Good", hint: "Add uppercase/symbols for stronger security" };
  return { score, label: "Strong", hint: "Great — your password looks strong" };
}

function getErrorMessage(err) {
  const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
  if (serverMsg) return String(serverMsg);

  const code = err?.code || "";
  if (code === "auth/email-already-in-use") return "This email is already in use. Try another email.";
  if (code === "auth/invalid-email") return "Please enter a valid email address.";
  if (code === "auth/weak-password") return "Password is too weak. Use at least 8 characters.";
  if (code === "auth/operation-not-allowed")
    return "Email/Password sign up is not enabled in Firebase.";
  if (code === "auth/network-request-failed")
    return "Network error. Please check your connection and try again.";
  if (code === "auth/too-many-requests")
    return "Too many attempts. Please wait a bit and try again.";
  if (code === "auth/popup-closed-by-user")
    return "Popup was closed. Please try again.";

  return err?.message ? String(err.message) : "Sign up failed. Please try again.";
}

function roleOf(u) {
  return String(u?.role || "").toLowerCase();
}

function isAdminRole(role) {
  const r = String(role || "").toLowerCase();
  return r === "admin" || r === "superadmin";
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
    return sanitizeInternalPath(v, "");
  } catch {
    return "";
  }
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

/**
 * ✅ Normalize auth payload to real user object (defensive)
 * - { user }
 * - { data: { user } }
 * - direct user object (fallback)
 */
function pickUserFromAny(payload) {
  if (!payload) return null;
  const u = payload?.user || payload?.data?.user || null;
  if (u) return u;

  // If payload itself looks like a user object
  if (typeof payload === "object") {
    const maybeUser = payload;
    if (maybeUser?.role || maybeUser?.email || maybeUser?.uid) return maybeUser;
  }
  return null;
}

/**
 * Enterprise post-auth redirect rules (signup):
 * - Admin default landing: /admin
 * - User default landing: /account
 * - If returnTo is an auth page or "/" -> role landing
 * - If returnTo is /admin but user isn't admin -> /403
 * - If returnTo is /account or /settings but admin -> /admin
 */
function resolvePostAuthTarget({ user, returnTo, returnToSource }) {
  const r = roleOf(user);
  const admin = isAdminRole(r);

  const rt = sanitizeInternalPath(returnTo, "/");
  const authLike = rt === "/" || isAuthLikePath(rt);

  if (admin) {
    // If they came directly to signup without any intent -> admin dashboard
    if (returnToSource === "default" || authLike) return "/admin";

    if (rt.startsWith("/admin")) return rt;
    if (rt.startsWith("/account") || rt.startsWith("/settings")) return "/admin";

    // Allow returning to store pages too
    return rt || "/admin";
  }

  // Normal user
  if (rt.startsWith("/admin")) return "/403";
  if (authLike) return "/account";
  return rt || "/account";
}

export default function SignUpPage() {
  const nav = useNavigate();
  const loc = useLocation();

  const { loginWithGoogle, setUser } = useAuth();

  // ✅ Enterprise: returnTo priority: query.returnTo -> loc.state.from -> sessionStorage last path -> default "/"
  const returnToInfo = useMemo(() => {
    const fromQuery = readReturnToFromQuery(loc.search);
    if (fromQuery) return { value: fromQuery, source: "query" };

    const fromStateRaw = loc.state?.from;
    const fromState =
      typeof fromStateRaw === "string" ? sanitizeInternalPath(fromStateRaw, "") : "";
    if (fromState) return { value: fromState, source: "state" };

    const last = readLastPath();
    if (last) return { value: last, source: "last" };

    return { value: "/", source: "default" };
  }, [loc.search, loc.state]);

  const returnTo = returnToInfo.value;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Keep default false for compliance-friendly UX; user must explicitly opt-in.
  const [agree, setAgree] = useState(false);

  // Remember me
  const [remember, setRemember] = useState(true);

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Separate loaders (enterprise UX)
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const isBusy = googleLoading || emailLoading;

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirm: false,
  });

  const nameOk = String(fullName || "").trim().length >= 2;
  const emailOk = isValidEmail(email);

  const passMinOk = String(password || "").length >= 8;
  const matchOk = String(confirm || "").length > 0 && password === confirm;

  const strength = useMemo(() => passwordStrength(password), [password]);

  const canSubmit = !isBusy && nameOk && emailOk && passMinOk && matchOk && !!agree;

  async function onGoogleSignup() {
    setError("");
    setSuccess("");

    try {
      setGoogleLoading(true);

      // IMPORTANT: loginWithGoogle might return {user} or direct user; normalize
      const payload = await loginWithGoogle(remember);
      const authedUser = pickUserFromAny(payload) || null;

      if (authedUser) setUser(authedUser);

      const target = resolvePostAuthTarget({
        user: authedUser,
        returnTo,
        returnToSource: returnToInfo.source,
      });

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

  async function realSignupAndExchange() {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    const name = String(fullName || "").trim();
    if (name) {
      try {
        await updateProfile(cred.user, { displayName: name });
      } catch {
        // Non-critical; ignore
      }
    }

    // Force refresh token to ensure latest profile is reflected
    const idToken = await cred.user.getIdToken(true);

    const data = await exchangeFirebaseToken(idToken);

    if (data?.accessToken) setAccessToken(data.accessToken, { remember });

    // Defensive user normalize
    const u = pickUserFromAny(data);
    if (u) setUser(u);

    return { ...data, user: u || data?.user };
  }

  async function onSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setTouched({ fullName: true, email: true, password: true, confirm: true });

    if (!nameOk) return setError("Please enter your full name.");
    if (!emailOk) return setError("Please enter a valid email address.");
    if (!passMinOk) return setError("Password must be at least 8 characters.");
    if (!matchOk) return setError("Passwords do not match.");
    if (!agree) return setError("You must agree to the Terms & Privacy Policy.");

    try {
      setEmailLoading(true);

      const data = await realSignupAndExchange();

      setSuccess("Account created successfully. Redirecting...");

      const u = pickUserFromAny(data) || data?.user || null;

      const target = resolvePostAuthTarget({
        user: u,
        returnTo,
        returnToSource: returnToInfo.source,
      });

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
      {/* Top bar */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <Home size={16} />
                <Link to="/">Home</Link>
              </li>
              <li className="font-semibold">Sign up</li>
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
              Create your account
            </div>

            <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              Join us today ✨
            </h1>
            <p className="mt-2 text-gray-600 max-w-xl">
              Get a premium, secure and user-friendly shopping experience.
              Built with international standard UI/UX and production-level best practices.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border p-4 flex items-start gap-3 bg-white">
                <ShieldCheck className="text-gray-800 mt-0.5" />
                <div>
                  <div className="font-semibold">Secure Account</div>
                  <div className="text-sm text-gray-600">Your data is protected</div>
                </div>
              </div>
              <div className="rounded-2xl border p-4 flex items-start gap-3 bg-white">
                <CheckCircle2 className="text-gray-800 mt-0.5" />
                <div>
                  <div className="font-semibold">Fast Checkout</div>
                  <div className="text-sm text-gray-600">Save address & preferences</div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border bg-gradient-to-br from-white to-gray-50 p-6">
              <div className="text-sm font-semibold text-gray-900">Password guide</div>
              <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                <li>Use at least 8 characters</li>
                <li>Mix uppercase, lowercase, and numbers</li>
                <li>Add a symbol for extra security</li>
              </ul>
            </div>
          </div>

          {/* Right: Form */}
          <div className="rounded-2xl border bg-white p-8 md:p-10 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Sign up</h2>
              <Link to="/signin" className="text-sm underline text-gray-700 hover:text-gray-900">
                Already have an account?
              </Link>
            </div>

            {success ? (
              <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex gap-3">
                <CheckCircle2 className="mt-0.5" size={18} />
                <div>
                  <div className="font-semibold">Success</div>
                  <div className="mt-1">{success}</div>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex gap-3">
                <AlertTriangle className="mt-0.5" size={18} />
                <div>
                  <div className="font-semibold">Couldn’t create account</div>
                  <div className="mt-1">{error}</div>
                </div>
              </div>
            ) : null}

            {/* Google Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={onGoogleSignup}
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
                {/* Full name */}
                <div>
                  <label className="text-sm font-medium text-gray-800">Full name</label>
                  <div
                    className={[
                      "mt-2 flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm",
                      "focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2",
                      touched.fullName && !nameOk ? "border-red-300" : "border-gray-200",
                    ].join(" ")}
                  >
                    <User size={18} className="text-gray-500" />
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={() => setTouched((s) => ({ ...s, fullName: true }))}
                      placeholder="Your full name"
                      className="w-full outline-none text-gray-900"
                      aria-label="Full name"
                      autoComplete="name"
                      autoFocus
                    />
                  </div>
                  {touched.fullName && !nameOk ? (
                    <div className="mt-2 text-xs text-red-600">Name must be at least 2 characters.</div>
                  ) : null}
                </div>

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
                      touched.password && !passMinOk ? "border-red-300" : "border-gray-200",
                    ].join(" ")}
                  >
                    <Lock size={18} className="text-gray-500" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setTouched((s) => ({ ...s, password: true }))}
                      placeholder="Create a strong password"
                      className="w-full outline-none text-gray-900"
                      aria-label="Password"
                      autoComplete="new-password"
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

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="text-xs text-gray-600">
                      Strength: <span className="font-semibold text-gray-900">{strength.label}</span>
                    </div>
                    <div className="text-xs text-gray-500">{strength.hint}</div>
                  </div>

                  <div className="mt-2 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-black transition-all"
                      style={{
                        width:
                          strength.score <= 0
                            ? "0%"
                            : strength.score === 1
                            ? "20%"
                            : strength.score === 2
                            ? "40%"
                            : strength.score === 3
                            ? "60%"
                            : strength.score === 4
                            ? "80%"
                            : "100%",
                      }}
                    />
                  </div>

                  {touched.password && !passMinOk ? (
                    <div className="mt-2 text-xs text-red-600">Password must be at least 8 characters.</div>
                  ) : null}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="text-sm font-medium text-gray-800">Confirm password</label>
                  <div
                    className={[
                      "mt-2 flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm",
                      "focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2",
                      touched.confirm && !matchOk ? "border-red-300" : "border-gray-200",
                    ].join(" ")}
                  >
                    <Lock size={18} className="text-gray-500" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onBlur={() => setTouched((s) => ({ ...s, confirm: true }))}
                      placeholder="Re-enter your password"
                      className="w-full outline-none text-gray-900"
                      aria-label="Confirm password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="p-2 rounded-xl hover:bg-gray-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                      aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {touched.confirm && !matchOk ? (
                    <div className="mt-2 text-xs text-red-600">Passwords do not match.</div>
                  ) : null}
                </div>

                {/* Remember */}
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
                </div>

                {/* Agree */}
                <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm mt-1"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                  />
                  <span>
                    I agree to the{" "}
                    <Link className="underline hover:text-gray-900" to="/terms">
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link className="underline hover:text-gray-900" to="/privacy">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={[
                    "w-full rounded-2xl px-6 py-4 font-semibold text-white transition",
                    canSubmit ? "bg-black hover:bg-gray-900" : "bg-gray-700 cursor-not-allowed",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                  ].join(" ")}
                >
                  {emailLoading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      Creating account...
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      Create account <ArrowRight size={18} />
                    </span>
                  )}
                </button>

                <p className="text-xs text-gray-500 mt-3">
                  Already have an account?{" "}
                  <Link className="underline hover:text-gray-900" to="/signin">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>

            {/* Small helper note */}
            {isBusy ? (
              <div className="mt-4 text-xs text-gray-500">
                Please wait—your request is being processed.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
