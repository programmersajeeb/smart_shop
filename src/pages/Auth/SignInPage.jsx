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
  CheckCircle2,
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
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Please wait a bit and try again.";
  }
  if (code === "auth/network-request-failed") {
    return "Network error. Please check your connection and try again.";
  }

  return err?.message ? String(err.message) : "Login failed. Please try again.";
}

function pickUserFromAuthPayload(payload) {
  if (!payload) return null;
  return payload?.user || payload?.data?.user || null;
}

function roleOf(u) {
  return String(u?.role || "").trim().toLowerCase();
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
    return sanitizeInternalPath(v, "");
  } catch {
    return "";
  }
}

function resolvePostLoginTarget({ user, returnTo, returnToSource }) {
  const r = roleOf(user);
  const isAdmin = r === "admin" || r === "superadmin";

  const rt = sanitizeInternalPath(returnTo, "/");

  if (isAuthLikePath(rt)) {
    if (isAdmin) return "/admin";
    return "/";
  }

  if (isAdmin) {
    if (returnToSource === "default") return "/admin";
    if (rt.startsWith("/account") || rt.startsWith("/settings")) return "/admin";
    if (rt.startsWith("/admin")) return rt;
    return rt || "/admin";
  }

  if (rt.startsWith("/admin")) return "/403";
  return rt || "/";
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
          className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
        />
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
      {error ? <div className="mt-2 text-xs text-red-600">{error}</div> : null}
    </label>
  );
}

export default function SignInPage() {
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [showPass, setShowPass] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const isBusy = googleLoading || emailLoading;

  const [error, setError] = useState("");
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const emailOk = isValidEmail(email);
  const passOk = String(password || "").length >= 6;

  async function onGoogleLogin() {
    setError("");

    try {
      setGoogleLoading(true);

      const payload = await loginWithGoogle(remember);
      const authedUser = pickUserFromAuthPayload(payload) || payload || null;

      if (authedUser) {
        setUser(authedUser);
      }

      const target = resolvePostLoginTarget({
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

  async function emailPasswordLogin() {
    const cred = await signInWithEmailAndPassword(
      auth,
      String(email || "").trim(),
      password
    );

    const idToken = await cred.user.getIdToken(true);
    const data = await exchangeFirebaseToken(idToken);

    if (data?.accessToken) {
      setAccessToken(data.accessToken, { remember });
    }

    const u = pickUserFromAuthPayload(data);
    if (u) {
      setUser(u);
    }

    return { ...data, user: u || data?.user || null };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setTouched({ email: true, password: true });

    if (!emailOk) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!passOk) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setEmailLoading(true);

      const data = await emailPasswordLogin();
      const u = pickUserFromAuthPayload(data) || data?.user || null;

      const target = resolvePostLoginTarget({
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
              <li className="font-semibold text-gray-900">Sign in</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="site-shell py-10 md:py-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="auth-panel auth-panel-dark rounded-[32px] border border-gray-200 p-8 shadow-sm md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-white/90">
              <Sparkles size={16} />
              Secure account access
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Welcome back
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-gray-300 md:text-base">
              Sign in to continue with your account, track orders, manage saved details and
              access a smooth checkout experience across devices.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AuthFeature
                icon={ShieldCheck}
                title="Protected access"
                text="Secure session handling with production-ready authentication flow."
              />
              <AuthFeature
                icon={CheckCircle2}
                title="Faster checkout"
                text="Use saved account information for a quicker purchase experience."
              />
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold text-white">Good sign-in habits</div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-300">
                <li>Use your personal device when enabling “Remember me”.</li>
                <li>Keep your password private and update it regularly.</li>
                <li>Use password reset if you are unsure about your credentials.</li>
              </ul>
            </div>
          </div>

          <div className="auth-panel rounded-[32px] border border-gray-200 bg-white p-8 shadow-sm md:p-10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Sign in</h2>
                <p className="mt-1 text-sm text-gray-500">Access your account securely.</p>
              </div>

              <Link
                to="/signup"
                className="text-sm font-medium text-gray-700 underline decoration-gray-300 underline-offset-4 transition hover:text-gray-900"
              >
                Create account
              </Link>
            </div>

            {error ? (
              <div className="mt-6 flex gap-3 rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <AlertTriangle className="mt-0.5 shrink-0" size={18} />
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
                  Or continue with email
                </span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
            </div>

            <form onSubmit={onSubmit} className={isBusy ? "pointer-events-none opacity-90" : ""}>
              <div className="space-y-4">
                <AuthInput
                  label="Email"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((s) => ({ ...s, email: true }))}
                  placeholder="you@example.com"
                  autoComplete="email"
                  error={touched.email && !emailOk ? "Please enter a valid email address." : ""}
                />

                <AuthInput
                  label="Password"
                  icon={Lock}
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((s) => ({ ...s, password: true }))}
                  placeholder="Your password"
                  autoComplete="current-password"
                  error={
                    touched.password && !passOk ? "Password must be at least 6 characters." : ""
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

                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-gray-700 underline decoration-gray-300 underline-offset-4 hover:text-gray-900"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-black px-6 py-4 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {emailLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="mt-6 text-sm text-gray-600">
              New here?{" "}
              <Link
                to="/signup"
                className="font-medium text-gray-900 underline decoration-gray-300 underline-offset-4"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}