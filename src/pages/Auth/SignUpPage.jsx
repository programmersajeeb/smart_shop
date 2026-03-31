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
  if (score <= 2) {
    return {
      score,
      label: "Weak",
      hint: "Use 8+ characters with letters and numbers.",
    };
  }
  if (score === 3) {
    return {
      score,
      label: "Good",
      hint: "Add uppercase or a symbol for stronger security.",
    };
  }
  return {
    score,
    label: "Strong",
    hint: "Great — your password looks strong.",
  };
}

function getErrorMessage(err) {
  const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
  if (serverMsg) return String(serverMsg);

  const code = err?.code || "";
  if (code === "auth/email-already-in-use") {
    return "This email is already in use. Try another email.";
  }
  if (code === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }
  if (code === "auth/weak-password") {
    return "Password is too weak. Use at least 8 characters.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Email and password sign up is not enabled.";
  }
  if (code === "auth/network-request-failed") {
    return "Network error. Please check your connection and try again.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Please wait a bit and try again.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "Popup was closed. Please try again.";
  }

  return err?.message ? String(err.message) : "Sign up failed. Please try again.";
}

function roleOf(u) {
  return String(u?.role || "").trim().toLowerCase();
}

function isAdminRole(role) {
  const r = String(role || "").trim().toLowerCase();
  return r === "admin" || r === "superadmin";
}

function sanitizeInternalPath(path, fallback = "/") {
  const p = String(path || "").trim();
  if (!p) return fallback;
  if (!p.startsWith("/")) return fallback;
  if (p.startsWith("//")) return fallback;
  if (p.includes("://")) return fallback;
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

function pickUserFromAny(payload) {
  if (!payload) return null;
  const u = payload?.user || payload?.data?.user || null;
  if (u) return u;

  if (typeof payload === "object") {
    const maybeUser = payload;
    if (maybeUser?.role || maybeUser?.email || maybeUser?.uid) {
      return maybeUser;
    }
  }

  return null;
}

function resolvePostAuthTarget({ user, returnTo, returnToSource }) {
  const r = roleOf(user);
  const admin = isAdminRole(r);

  const rt = sanitizeInternalPath(returnTo, "/");
  const authLike = rt === "/" || isAuthLikePath(rt);

  if (admin) {
    if (returnToSource === "default" || authLike) return "/admin";
    if (rt.startsWith("/admin")) return rt;
    if (rt.startsWith("/account") || rt.startsWith("/settings")) return "/admin";
    return rt || "/admin";
  }

  if (rt.startsWith("/admin")) return "/403";
  if (authLike) return "/account";
  return rt || "/account";
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
  rightSlot,
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
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
      {error ? <div className="mt-2 text-xs text-red-600">{error}</div> : null}
    </label>
  );
}

export default function SignUpPage() {
  const nav = useNavigate();
  const loc = useLocation();

  const { loginWithGoogle, setUser } = useAuth();

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

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [agree, setAgree] = useState(false);
  const [remember, setRemember] = useState(true);

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

      const payload = await loginWithGoogle(remember);
      const authedUser = pickUserFromAny(payload) || null;

      if (authedUser) {
        setUser(authedUser);
      }

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
    const cleanEmail = String(email || "").trim();
    const cleanPassword = String(password || "");
    const cleanName = String(fullName || "").trim();

    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);

    if (cleanName) {
      try {
        await updateProfile(cred.user, { displayName: cleanName });
      } catch {
        // ignore non-critical profile update failure
      }
    }

    const idToken = await cred.user.getIdToken(true);
    const data = await exchangeFirebaseToken(idToken);

    if (data?.accessToken) {
      setAccessToken(data.accessToken, { remember });
    }

    const u = pickUserFromAny(data);
    if (u) {
      setUser(u);
    }

    return { ...data, user: u || data?.user || null };
  }

  async function onSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirm: true,
    });

    if (!nameOk) {
      setError("Please enter your full name.");
      return;
    }
    if (!emailOk) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!passMinOk) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!matchOk) {
      setError("Passwords do not match.");
      return;
    }
    if (!agree) {
      setError("You must agree to the Terms and Privacy Policy.");
      return;
    }

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
    <div className="auth-shell min-h-[calc(100vh-64px)]">
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="site-shell py-4">
          <div className="breadcrumbs text-sm text-gray-600">
            <ul>
              <li>
                <Home size={16} />
                <Link to="/" className="hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li className="font-semibold text-gray-900">Sign up</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="site-shell py-10 md:py-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="auth-panel auth-panel-dark rounded-[32px] border border-gray-200 p-8 shadow-sm md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-white/90">
              <Sparkles size={16} />
              Create your account
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Join with confidence
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-gray-300 md:text-base">
              Create your account to save preferences, manage orders and enjoy a cleaner,
              faster and more secure shopping flow.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AuthFeature
                icon={ShieldCheck}
                title="Protected account"
                text="Strong authentication flow designed for real-world production use."
              />
              <AuthFeature
                icon={CheckCircle2}
                title="Better shopping flow"
                text="Save your details and track your activity from one account."
              />
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold text-white">Password tips</div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-300">
                <li>Use at least 8 characters.</li>
                <li>Mix uppercase, lowercase and numbers.</li>
                <li>Add a symbol for stronger account security.</li>
              </ul>
            </div>
          </div>

          <div className="auth-panel rounded-[32px] border border-gray-200 bg-white p-8 shadow-sm md:p-10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Sign up</h2>
                <p className="mt-1 text-sm text-gray-500">Create your account in a few steps.</p>
              </div>

              <Link
                to="/signin"
                className="text-sm font-medium text-gray-700 underline decoration-gray-300 underline-offset-4 transition hover:text-gray-900"
              >
                Already have an account?
              </Link>
            </div>

            {success ? (
              <div className="mt-6 flex gap-3 rounded-[24px] border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
                <div>
                  <div className="font-semibold">Success</div>
                  <div className="mt-1">{success}</div>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 flex gap-3 rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <AlertTriangle className="mt-0.5 shrink-0" size={18} />
                <div>
                  <div className="font-semibold">Couldn’t create account</div>
                  <div className="mt-1">{error}</div>
                </div>
              </div>
            ) : null}

            <div className="mt-6">
              <button
                type="button"
                onClick={onGoogleSignup}
                disabled={isBusy}
                className="auth-social-btn inline-flex w-full items-center justify-center gap-3 rounded-[22px] border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {googleLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Please wait...
                  </span>
                ) : (
                  <>
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
                  </>
                )}
              </button>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
                  Or create account with email
                </span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
            </div>

            <form onSubmit={onSubmit} className={isBusy ? "pointer-events-none opacity-90" : ""}>
              <div className="space-y-4">
                <AuthInput
                  label="Full name"
                  icon={User}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => setTouched((s) => ({ ...s, fullName: true }))}
                  placeholder="Your full name"
                  autoComplete="name"
                  autoFocus
                  error={touched.fullName && !nameOk ? "Name must be at least 2 characters." : ""}
                />

                <AuthInput
                  label="Email address"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((s) => ({ ...s, email: true }))}
                  placeholder="you@example.com"
                  autoComplete="email"
                  error={touched.email && !emailOk ? "Please enter a valid email." : ""}
                />

                <div>
                  <AuthInput
                    label="Password"
                    icon={Lock}
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((s) => ({ ...s, password: true }))}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    error={
                      touched.password && !passMinOk
                        ? "Password must be at least 8 characters."
                        : ""
                    }
                    rightSlot={
                      <button
                        type="button"
                        className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                        onClick={() => setShowPass((v) => !v)}
                        aria-label={showPass ? "Hide password" : "Show password"}
                      >
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    }
                  />

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-xs text-gray-600">
                      Strength: <span className="font-semibold text-gray-900">{strength.label}</span>
                    </div>
                    <div className="text-xs text-gray-500">{strength.hint}</div>
                  </div>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-black transition-all duration-300"
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
                </div>

                <AuthInput
                  label="Confirm password"
                  icon={Lock}
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onBlur={() => setTouched((s) => ({ ...s, confirm: true }))}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  error={touched.confirm && !matchOk ? "Passwords do not match." : ""}
                  rightSlot={
                    <button
                      type="button"
                      className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />

                <div className="flex items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 select-none">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Remember me
                  </label>
                </div>

                <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm mt-1"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                  />
                  <span className="leading-6">
                    I agree to the{" "}
                    <Link className="font-medium underline decoration-gray-300 underline-offset-4" to="/terms">
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link
                      className="font-medium underline decoration-gray-300 underline-offset-4"
                      to="/privacy"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={[
                    "inline-flex w-full items-center justify-center gap-2 rounded-[22px] px-6 py-4 text-sm font-semibold transition",
                    canSubmit
                      ? "bg-black text-white hover:bg-gray-900"
                      : "cursor-not-allowed bg-gray-200 text-gray-500",
                  ].join(" ")}
                >
                  {emailLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    className="font-medium text-gray-900 underline decoration-gray-300 underline-offset-4"
                    to="/signin"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>

            {isBusy ? (
              <div className="mt-4 text-xs text-gray-500">
                Please wait — your request is being processed.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}