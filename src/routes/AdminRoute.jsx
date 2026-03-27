import React, { useEffect, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../services/apiClient";
import { useAuth } from "../shared/hooks/useAuth";
import { clearAccessToken } from "../core/config/tokenStore";

function sanitizeInternalPath(path, fallback = "/") {
  const value = String(path || "").trim();

  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("://")) return fallback;
  if (value.startsWith("/\\")) return fallback;

  return value;
}

function buildReturnTo(location) {
  const pathname = location?.pathname || "/";
  const search = location?.search || "";
  const hash = location?.hash || "";

  return sanitizeInternalPath(`${pathname}${search}${hash}`, "/");
}

function buildSignInUrl(returnTo) {
  return `/signin?returnTo=${encodeURIComponent(
    sanitizeInternalPath(returnTo, "/")
  )}`;
}

function pickUser(payload) {
  if (!payload) return null;
  return payload?.user || payload?.data?.user || payload?.data || payload;
}

function normalizeRole(user) {
  return String(user?.role || "").trim().toLowerCase();
}

function normalizePermissions(user) {
  const list = Array.isArray(user?.permissions) ? user.permissions : [];
  const out = [];
  const seen = new Set();

  for (const raw of list) {
    const value = String(raw || "").trim().toLowerCase();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }

  return out;
}

function getRoleLevel(user) {
  const value = Number(user?.roleLevel || 0);
  return Number.isFinite(value) ? value : 0;
}

function isRbacReady(user) {
  if (!user) return false;

  const role = String(user?.role || "").trim();
  const roleLevel = Number(user?.roleLevel);
  const permissionsReady = Array.isArray(user?.permissions);

  return Boolean(role) && Number.isFinite(roleLevel) && permissionsReady;
}

function canAccessAdminArea(user) {
  if (!user) return false;

  const role = normalizeRole(user);
  const roleLevel = getRoleLevel(user);
  const permissions = normalizePermissions(user);

  if (role === "superadmin") return true;
  if (roleLevel >= 100) return true;
  if (permissions.includes("*")) return true;
  if (permissions.includes("admin:access")) return true;
  if (roleLevel > 0) return true;

  return false;
}

function RouteGateSkeleton() {
  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="container mx-auto px-6 py-10">
        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="skeleton h-5 w-44 rounded-lg" />
          <div className="mt-3 skeleton h-7 w-80 rounded-lg" />

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 p-5">
              <div className="skeleton h-4 w-32 rounded-lg" />
              <div className="mt-3 skeleton h-4 w-full rounded-lg" />
              <div className="mt-2 skeleton h-4 w-5/6 rounded-lg" />
            </div>

            <div className="rounded-2xl border border-gray-200 p-5">
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

export default function AdminRoute({ children }) {
  const { isAuthed, booting, user, setUser } = useAuth();
  const location = useLocation();

  const returnTo = useMemo(() => buildReturnTo(location), [location]);

  const authUser = pickUser(user);
  const needsHydrate = Boolean(isAuthed && (!authUser || !isRbacReady(authUser)));

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
    const currentUser = pickUser(user);

    if (nextUser && (!currentUser || !isRbacReady(currentUser))) {
      setUser(nextUser);
    }
  }, [meQuery.data, user, setUser]);

  useEffect(() => {
    if (!needsHydrate || !meQuery.isError) return;

    const status = meQuery.error?.response?.status;
    if (status === 401 || status === 403) {
      clearAccessToken({ removeMode: true });
      setUser(null);
    }
  }, [needsHydrate, meQuery.isError, meQuery.error, setUser]);

  const resolvedUser = useMemo(() => {
    return pickUser(user) || pickUser(meQuery.data) || null;
  }, [user, meQuery.data]);

  if (booting) {
    return <RouteGateSkeleton />;
  }

  if (!isAuthed) {
    return (
      <Navigate
        to={buildSignInUrl(returnTo)}
        replace
        state={{ from: returnTo }}
      />
    );
  }

  if (needsHydrate && meQuery.isPending) {
    return <RouteGateSkeleton />;
  }

  if (needsHydrate && meQuery.isError) {
    return (
      <Navigate
        to={buildSignInUrl(returnTo)}
        replace
        state={{ from: returnTo }}
      />
    );
  }

  if (!canAccessAdminArea(resolvedUser)) {
    return <Navigate to="/403" replace state={{ from: returnTo }} />;
  }

  return children;
}