import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../shared/hooks/useAuth";

function buildReturnTo(loc) {
  const pathname = loc?.pathname || "/";
  const search = loc?.search || "";
  const hash = loc?.hash || "";
  const full = `${pathname}${search}${hash}`;
  return full.startsWith("/") ? full : "/";
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
  const { isAuthed, booting } = useAuth();
  const loc = useLocation();

  if (booting) return <RouteGateSkeleton />;

  if (!isAuthed) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{ from: buildReturnTo(loc) }}
      />
    );
  }

  return children;
}
