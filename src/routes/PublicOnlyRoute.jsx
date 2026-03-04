import React, { useEffect, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../services/apiClient";
import { useAuth } from "../shared/hooks/useAuth";
import { clearAccessToken } from "../core/config/tokenStore";

function normalizeRole(u) {
  return String(u?.role || "").trim().toLowerCase();
}
function isAdminRole(role) {
  return role === "admin" || role === "superadmin";
}

/**
 * ✅ Normalize /auth/me response to real user object
 * Supports: { user }, { data: { user } }, { data }, or direct user object
 */
function pickUser(payload) {
  if (!payload) return null;
  return payload?.user || payload?.data?.user || payload?.data || payload;
}

function RouteGateSkeleton() {
  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="container mx-auto px-6 py-10">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="skeleton h-5 w-40 rounded-lg" />
          <div className="mt-3 skeleton h-7 w-72 rounded-lg" />
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border p-5">
              <div className="skeleton h-4 w-32 rounded-lg" />
              <div className="mt-3 skeleton h-4 w-full rounded-lg" />
              <div className="mt-2 skeleton h-4 w-5/6 rounded-lg" />
            </div>
            <div className="rounded-2xl border p-5">
              <div className="skeleton h-4 w-28 rounded-lg" />
              <div className="mt-3 skeleton h-4 w-full rounded-lg" />
              <div className="mt-2 skeleton h-4 w-2/3 rounded-lg" />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="skeleton h-10 w-28 rounded-xl" />
            <div className="skeleton h-10 w-36 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Enterprise-safe internal path sanitizer (prevents open-redirect)
 */
function sanitizeInternalPath(path, fallback = "") {
  const p = String(path || "").trim();
  if (!p) return fallback;

  // Must be a relative path
  if (!p.startsWith("/")) return fallback;

  // Prevent protocol-relative URLs: //evil.com
  if (p.startsWith("//")) return fallback;

  // Prevent schemes inside
  if (p.includes("://")) return fallback;

  // Prevent weird backslash forms
  if (p.startsWith("/\\")) return fallback;

  return p;
}

function isAuthPagePath(path) {
  const p = String(path || "");
  return p === "/signin" || p === "/signup";
}

/**
 * Priority: query returnTo > location.state.from
 */
function getReturnTo(loc) {
  // 1) Query param
  const qs = String(loc?.search || "");
  let qReturnTo = "";
  try {
    const sp = new URLSearchParams(qs);
    qReturnTo = sp.get("returnTo") || "";
  } catch {
    qReturnTo = "";
  }

  // 2) State from
  const sFrom = String(loc?.state?.from || "");

  const candidate = qReturnTo || sFrom;
  const safe = sanitizeInternalPath(candidate, "");

  // avoid redirecting back to auth pages
  if (safe && isAuthPagePath(safe)) return "";

  return safe;
}

/**
 * PublicOnlyRoute
 * - Not authed -> allow public pages (signin/signup)
 * - Authed -> redirect:
 *    - Admin -> /admin (or safe admin returnTo)
 *    - User  -> safe returnTo (non-admin) else /account
 * - If token exists but user isn't hydrated -> hydrate via /auth/me
 * - If hydrate fails due to invalid token -> clear token so app doesn't get stuck
 */
export default function PublicOnlyRoute({ children }) {
  const { isAuthed, booting, user, setUser } = useAuth();
  const loc = useLocation();

  const hasUser = !!pickUser(user);
  const needsHydrate = Boolean(isAuthed && !hasUser);

  const meQuery = useQuery({
    queryKey: ["auth-me"],
    enabled: needsHydrate && !booting,
    queryFn: async ({ signal }) => {
      const { data } = await api.get("/auth/me", { signal });
      return data;
    },
    staleTime: 60_000,
    retry: 0,
  });

  // Hydrate user into context
  useEffect(() => {
    const u = pickUser(meQuery.data);
    if (u && !pickUser(user)) setUser(u);
  }, [meQuery.data, setUser, user]);

  // ✅ If /me fails (token invalid) => clear token so isAuthed becomes false next render
  useEffect(() => {
    if (!needsHydrate) return;
    if (!meQuery.isError) return;

    const status = meQuery.error?.response?.status;
    if (status === 401 || status === 403) {
      clearAccessToken(); // keep your existing behavior
      setUser(null);
    }
  }, [needsHydrate, meQuery.isError, meQuery.error, setUser]);

  const resolvedUser = useMemo(
    () => pickUser(user) || pickUser(meQuery.data) || null,
    [user, meQuery.data]
  );

  const role = normalizeRole(resolvedUser);

  if (booting) return <RouteGateSkeleton />;

  // Not logged in -> allow public page
  if (!isAuthed) return children;

  // Logged in but user not hydrated yet
  if (needsHydrate) {
    if (meQuery.isPending) return <RouteGateSkeleton />;
    if (meQuery.isError) return children; // after clearAccessToken, next render will be !isAuthed
  }

  const returnTo = getReturnTo(loc);

  // Admin policy: always land in /admin scope
  if (isAdminRole(role)) {
    if (returnTo && returnTo.startsWith("/admin")) {
      return <Navigate to={returnTo} replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  // User policy: never land in /admin (enterprise)
  if (returnTo && returnTo.startsWith("/admin")) {
    return <Navigate to="/403" replace state={{ from: returnTo }} />;
  }

  if (returnTo) return <Navigate to={returnTo} replace />;
  return <Navigate to="/account" replace />;
}
