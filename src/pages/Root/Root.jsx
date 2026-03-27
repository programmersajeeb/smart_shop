import React, { useEffect, useMemo } from "react";
import Header from "../../shared/components/Layout/Header/Header";
import Footer from "../../shared/components/Layout/Footer";
import { Link, Outlet, useLocation, useNavigation } from "react-router-dom";
import { useIsFetching, useIsMutating, useQuery } from "@tanstack/react-query";
import { AlertTriangle, ShieldAlert } from "lucide-react";

import TopLoadingBar from "../../shared/components/ui/loading/TopLoadingBar";
import RouteOverlaySkeleton from "../../shared/components/ui/loading/RouteOverlaySkeleton";
import { Toaster } from "sonner";
import api from "../../services/apiClient";

const KEY_LAST_PATH = "ss_last_path";

function isNonTrackablePath(pathname = "") {
  if (
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password")
  ) {
    return true;
  }

  if (pathname === "/403") return true;
  if (pathname.startsWith("/admin")) return true;

  return false;
}

function isMaintenanceBypassPath(pathname = "") {
  return (
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/403" ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/admin")
  );
}

function normalizePublicSettings(input) {
  const data = input && typeof input === "object" ? input : {};

  const site = data.site && typeof data.site === "object" ? data.site : {};
  const commerce =
    data.commerce && typeof data.commerce === "object" ? data.commerce : {};

  const maintenanceMode = Boolean(site.maintenanceMode);
  const maintenanceMessage = String(
    site.maintenanceMessage ||
      "We are performing scheduled maintenance. Please try again soon."
  )
    .trim()
    .slice(0, 220);

  return {
    site: {
      maintenanceMode,
      maintenanceMessage:
        maintenanceMessage ||
        "We are performing scheduled maintenance. Please try again soon.",
    },
    commerce: {
      allowGuestCheckout: Boolean(commerce.allowGuestCheckout),
      allowBackorders: Boolean(commerce.allowBackorders),
    },
  };
}

function MaintenanceScreen({ message }) {
  return (
    <div className="container mx-auto px-6 py-10">
      <div className="rounded-[28px] border border-amber-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50">
            <ShieldAlert size={20} className="text-amber-700" />
          </div>

          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Maintenance mode
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
              Storefront temporarily unavailable
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">
              {message}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/signin"
                className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                Sign in
              </Link>

              <Link
                to="/terms"
                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Terms
              </Link>

              <Link
                to="/privacy"
                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Root() {
  const navigation = useNavigation();
  const location = useLocation();

  const isRouteBusy = navigation.state !== "idle";
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const settingsQuery = useQuery({
    queryKey: ["public-admin-settings"],
    queryFn: async () => {
      const response = await api.get("/page-config/admin-settings/public");
      return response.data;
    },
    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const publicSettings = useMemo(() => {
    return normalizePublicSettings(settingsQuery.data?.data || {});
  }, [settingsQuery.data]);

  const maintenanceMode = Boolean(publicSettings?.site?.maintenanceMode);
  const maintenanceMessage =
    publicSettings?.site?.maintenanceMessage ||
    "We are performing scheduled maintenance. Please try again soon.";

  const allowMaintenanceBypass = isMaintenanceBypassPath(location.pathname);
  const shouldBlockForMaintenance = maintenanceMode && !allowMaintenanceBypass;

  const showTopBar =
    isRouteBusy || isFetching > 0 || isMutating > 0 || settingsQuery.isLoading;

  useEffect(() => {
    if (isNonTrackablePath(location.pathname)) return;

    const full = `${location.pathname}${location.search}${location.hash}`;
    try {
      sessionStorage.setItem(KEY_LAST_PATH, full);
    } catch {
      // ignore
    }
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search, location.hash]);

  return (
    <>
      <Toaster position="top-right" closeButton richColors />

      <Header />

      {showTopBar && <TopLoadingBar />}

      {maintenanceMode && !allowMaintenanceBypass ? (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="container mx-auto flex items-start gap-2 px-6 py-3 text-sm text-amber-900">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              Maintenance mode is active. Public storefront access is temporarily limited.
            </span>
          </div>
        </div>
      ) : null}

      <main className="relative min-h-[60vh]" aria-busy={isRouteBusy ? "true" : "false"}>
        {shouldBlockForMaintenance ? (
          <MaintenanceScreen message={maintenanceMessage} />
        ) : (
          <Outlet />
        )}

        {isRouteBusy && <RouteOverlaySkeleton />}
      </main>

      <Footer />
    </>
  );
}

export default Root;