import React from "react";
import Header from "../../shared/components/Layout/Header/Header";
import Footer from "../../shared/components/Layout/Footer";
import { Outlet, useNavigation } from "react-router-dom";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

import TopLoadingBar from "../../shared/components/ui/loading/TopLoadingBar";
import RouteOverlaySkeleton from "../../shared/components/ui/loading/RouteOverlaySkeleton";

function Root() {
  const navigation = useNavigation();

  // React Router Data navigation states: "idle" | "loading" | "submitting"
  const isRouteBusy = navigation.state !== "idle";

  // React Query global network activity
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const showTopBar = isRouteBusy || isFetching > 0 || isMutating > 0;

  return (
    <>
      <Header />

      {/* Global top loading bar (route + query) */}
      {showTopBar && <TopLoadingBar />}

      <main className="relative min-h-[60vh]" aria-busy={isRouteBusy ? "true" : "false"}>
        <Outlet />

        {/* Route transition skeleton overlay */}
        {isRouteBusy && <RouteOverlaySkeleton />}
      </main>

      <Footer />
    </>
  );
}

export default Root;
