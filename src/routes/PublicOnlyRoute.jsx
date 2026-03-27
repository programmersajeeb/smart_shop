import React, { useEffect, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../services/apiClient";
import { useAuth } from "../shared/hooks/useAuth";
import { clearAccessToken } from "../core/config/tokenStore";

function normalizeRole(u) {
  return String(u?.role || "").trim().toLowerCase();
}

function normalizePermissions(u) {
  const list = Array.isArray(u?.permissions) ? u.permissions : [];
  const out = [];
  const seen = new Set();

  for (const raw of list) {
    const p = String(raw || "").trim();
    if (!p) continue;

    const normalized = p.toLowerCase();
    if (seen.has(normalized)) continue;

    seen.add(normalized);
    out.push(normalized);
  }

  return out;
}

function getRoleLevel(u) {
  const n = Number(u?.roleLevel || 0);
  return Number.isFinite(n) ? n : 0;
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

function sanitizeInternalPath(path, fallback = "") {
  const p = String(path || "").trim();
  if (!p) return fallback;
  if (!p.startsWith("/")) return fallback;
  if (p.startsWith("//")) return fallback;
  if (p.includes("://")) return fallback;
  if (p.startsWith("/\\")) return fallback;
  return p;
}

function isAuthPagePath(path) {
  const p = String(path || "");
  return p === "/signin" || p === "/signup";
}

function getReturnTo(loc) {
  const qs = String(loc?.search || "");
  let qReturnTo = "";

  try {
    const sp = new URLSearchParams(qs);
    qReturnTo = sp.get("returnTo") || "";
  } catch {
    qReturnTo = "";
  }

  const sFrom = String(loc?.state?.from || "");
  const candidate = qReturnTo || sFrom;
  const safe = sanitizeInternalPath(candidate, "");

  if (safe && isAuthPagePath(safe)) return "";
  return safe;
}

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

  useEffect(() => {
    const nextUser = pickUser(meQuery.data);
    if (nextUser && !pickUser(user)) {
      setUser(nextUser);
    }
  }, [meQuery.data, setUser, user]);

  useEffect(() => {
    if (!needsHydrate || !meQuery.isError) return;

    const status = meQuery.error?.response?.status;
    if (status === 401 || status === 403) {
      clearAccessToken({ removeMode: true });
      setUser(null);
    }
  }, [needsHydrate, meQuery.isError, meQuery.error, setUser]);

  const resolvedUser = useMemo(
    () => pickUser(user) || pickUser(meQuery.data) || null,
    [user, meQuery.data]
  );

  const role = normalizeRole(resolvedUser);
  const roleLevel = getRoleLevel(resolvedUser);
  const permissions = normalizePermissions(resolvedUser);

  const isSuper =
    role === "superadmin" ||
    roleLevel >= 100 ||
    permissions.includes("*");

  const canAccessAdminShell =
    isSuper ||
    permissions.includes("admin:access") ||
    roleLevel > 0;

  if (booting) {
    return <RouteGateSkeleton />;
  }

  if (!isAuthed) {
    return children;
  }

  if (needsHydrate) {
    if (meQuery.isPending) {
      return <RouteGateSkeleton />;
    }

    if (meQuery.isError) {
      return children;
    }
  }

  const returnTo = getReturnTo(loc);

  if (canAccessAdminShell) {
    if (returnTo && returnTo.startsWith("/admin")) {
      return <Navigate to={returnTo} replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  if (returnTo && returnTo.startsWith("/admin")) {
    return <Navigate to="/403" replace state={{ from: returnTo }} />;
  }

  if (returnTo) {
    return <Navigate to={returnTo} replace />;
  }

  return <Navigate to="/account" replace />;
}