import React, { useEffect, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../services/apiClient";
import { useAuth } from "../shared/hooks/useAuth";
import { clearAccessToken } from "../core/config/tokenStore";

function sanitizeInternalPath(path, fallback = "/") {
  const p = String(path || "").trim();
  if (!p) return fallback;

  // Must be a relative path
  if (!p.startsWith("/")) return fallback;

  // Prevent protocol-relative URLs: //evil.com
  if (p.startsWith("//")) return fallback;

  // Prevent schemes inside (extra safety)
  if (p.includes("://")) return fallback;

  // Prevent weird backslash forms
  if (p.startsWith("/\\")) return fallback;

  return p;
}

function buildReturnTo(loc) {
  const pathname = loc?.pathname || "/";
  const search = loc?.search || "";
  const hash = loc?.hash || "";
  const full = `${pathname}${search}${hash}`;
  return sanitizeInternalPath(full, "/");
}

function buildSignInUrl(returnTo) {
  const rt = sanitizeInternalPath(returnTo, "/");
  return `/signin?returnTo=${encodeURIComponent(rt)}`;
}

function normalizeRole(u) {
  return String(u?.role || "").trim().toLowerCase();
}
function isAdminRole(role) {
  return role === "admin" || role === "superadmin";
}
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

export default function PrivateRoute({ children }) {
  const { isAuthed, booting, user, setUser } = useAuth();
  const loc = useLocation();

  const returnTo = useMemo(() => buildReturnTo(loc), [loc]);

  const needsHydrate = Boolean(isAuthed && !pickUser(user));

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

  useEffect(() => {
    const u = pickUser(meQuery.data);
    if (u && !pickUser(user)) setUser(u);
  }, [meQuery.data, setUser, user]);

  // Enterprise: if token is invalid (401/403) while hydrating, clear token + stale user
  useEffect(() => {
    if (!needsHydrate) return;
    if (!meQuery.isError) return;

    const status = meQuery.error?.response?.status;
    if (status === 401 || status === 403) {
      clearAccessToken();
      setUser(null);
    }
  }, [needsHydrate, meQuery.isError, meQuery.error, setUser]);

  const resolvedUser = useMemo(
    () => pickUser(user) || pickUser(meQuery.data) || null,
    [user, meQuery.data]
  );

  const role = normalizeRole(resolvedUser);

  if (booting) return <RouteGateSkeleton />;

  if (!isAuthed) {
    return (
      <Navigate
        to={buildSignInUrl(returnTo)}
        replace
        state={{ from: returnTo }}
      />
    );
  }

  if (needsHydrate) {
    if (meQuery.isPending) return <RouteGateSkeleton />;
    if (meQuery.isError) {
      return (
        <Navigate
          to={buildSignInUrl(returnTo)}
          replace
          state={{ from: returnTo }}
        />
      );
    }
  }

  // admin should not stay in /account area
  if (isAdminRole(role) && String(loc.pathname || "").startsWith("/account")) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
