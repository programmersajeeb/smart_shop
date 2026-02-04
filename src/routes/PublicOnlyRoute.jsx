import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../shared/hooks/useAuth";

function safePath(p, fallback = "/") {
  const s = typeof p === "string" ? p : "";
  return s.startsWith("/") ? s : fallback;
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

export default function PublicOnlyRoute({ children, redirectTo = "/" }) {
  const { isAuthed, booting } = useAuth();
  const loc = useLocation();

  if (booting) return <RouteGateSkeleton />;

  if (isAuthed) {
    // If user came here from a protected route, go back there. Otherwise use redirectTo.
    const from = safePath(loc.state?.from, "");
    const to = from || safePath(redirectTo, "/");
    return <Navigate to={to} replace />;
  }

  return children;
}
