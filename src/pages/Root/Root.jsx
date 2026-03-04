import React, { useEffect } from "react";
import Header from "../../shared/components/Layout/Header/Header";
import Footer from "../../shared/components/Layout/Footer";
import { Outlet, useLocation, useNavigation } from "react-router-dom";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

import TopLoadingBar from "../../shared/components/ui/loading/TopLoadingBar";
import RouteOverlaySkeleton from "../../shared/components/ui/loading/RouteOverlaySkeleton";
import { Toaster } from "sonner";

const KEY_LAST_PATH = "ss_last_path";

function isNonTrackablePath(pathname = "") {
  // ✅ Do not store auth pages as last path
  if (
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password")
  ) {
    return true;
  }

  // ✅ Enterprise: do not store forbidden page as last path (avoid post-login loop/poor UX)
  if (pathname === "/403") return true;

  // ✅ Enterprise: do not store admin routes as last path (keep customer UX clean)
  if (pathname.startsWith("/admin")) return true;

  return false;
}

function Root() {
  const navigation = useNavigation();
  const location = useLocation();

  const isRouteBusy = navigation.state !== "idle";
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const showTopBar = isRouteBusy || isFetching > 0 || isMutating > 0;

  // ✅ Store last non-auth, non-forbidden, non-admin page for post-login fallback
  useEffect(() => {
    if (isNonTrackablePath(location.pathname)) return;

    const full = `${location.pathname}${location.search}${location.hash}`;
    try {
      sessionStorage.setItem(KEY_LAST_PATH, full);
    } catch {
      // ignore
    }
  }, [location.pathname, location.search, location.hash]);

  // Smooth UX: Scroll to top on route change (ignore hash navigation)
  useEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search, location.hash]);

  return (
    <>
      <Toaster position="top-right" closeButton richColors />

      <Header />

      {showTopBar && <TopLoadingBar />}

      <main className="relative min-h-[60vh]" aria-busy={isRouteBusy ? "true" : "false"}>
        <Outlet />
        {isRouteBusy && <RouteOverlaySkeleton />}
      </main>

      <Footer />
    </>
  );
}

export default Root;
