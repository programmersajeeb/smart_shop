import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Users,
  Filter,
} from "lucide-react";
import api from "../../services/apiClient";

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-BD", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-BD", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function sourceLabel(value) {
  const source = String(value || "").trim().toLowerCase();

  if (source === "home_newsletter") return "Home Newsletter";
  if (source === "footer_newsletter") return "Footer Newsletter";
  if (source === "admin_manual") return "Admin Manual";
  return "Unknown";
}

function statusBadgeClass(status) {
  const value = String(status || "").trim().toLowerCase();

  if (value === "subscribed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value === "unsubscribed") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-gray-200 bg-gray-50 text-gray-700";
}

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            {label}
          </div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </div>
          <div className="mt-2 text-sm text-gray-500">{hint}</div>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-700">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[28px] border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700">
        <Mail size={20} />
      </div>

      <h2 className="mt-4 text-xl font-semibold text-gray-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-gray-600">
        {description}
      </p>
    </div>
  );
}

export default function AdminNewsletterPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [actionState, setActionState] = useState({
    type: "",
    message: "",
  });

  const summaryQuery = useQuery({
    queryKey: ["admin-newsletter-summary"],
    queryFn: async () => {
      const { data } = await api.get("/newsletter/admin/summary");
      return data;
    },
    staleTime: 30_000,
  });

  const listQuery = useQuery({
    queryKey: [
      "admin-newsletter-list",
      {
        page,
        limit,
        q: searchValue,
        status: statusFilter,
        source: sourceFilter,
      },
    ],
    queryFn: async () => {
      const { data } = await api.get("/newsletter/admin/list", {
        params: {
          page,
          limit,
          q: searchValue || undefined,
          status: statusFilter || undefined,
          source: sourceFilter || undefined,
        },
      });

      return data;
    },
    placeholderData: (previousData) => previousData,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch(`/newsletter/admin/${id}/status`, {
        status,
        source: "admin_manual",
      });
      return data;
    },
    onSuccess: (data) => {
      setActionState({
        type: "success",
        message:
          data?.message || "Subscriber status updated successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ["admin-newsletter-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-newsletter-list"] });
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to update subscriber status.";

      setActionState({
        type: "error",
        message: String(message),
      });
    },
  });

  const summary = summaryQuery.data?.data || {};
  const sourceStats = Array.isArray(summary?.bySource) ? summary.bySource : [];
  const rows = Array.isArray(listQuery.data?.data) ? listQuery.data.data : [];
  const pagination = listQuery.data?.pagination || {
    page: 1,
    limit,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const totalPages = clamp(Number(pagination?.totalPages || 1), 1, 100000);
  const currentPage = clamp(Number(pagination?.page || 1), 1, totalPages);

  const sourceStatsMap = useMemo(() => {
    const map = new Map();

    for (const item of sourceStats) {
      const key = String(item?.source || "unknown").trim().toLowerCase();
      const count = Number(item?.count || 0);
      map.set(key, count);
    }

    return map;
  }, [sourceStats]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    setSearchValue(normalizeText(searchText, ""));
    setActionState({ type: "", message: "" });
  }

  function handleResetFilters() {
    setSearchText("");
    setSearchValue("");
    setStatusFilter("");
    setSourceFilter("");
    setPage(1);
    setActionState({ type: "", message: "" });
  }

  function handleStatusChange(id, status) {
    setActionState({ type: "", message: "" });
    updateStatusMutation.mutate({ id, status });
  }

  const isInitialLoading =
    summaryQuery.isLoading || (listQuery.isLoading && !listQuery.data);

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-600">
              <Mail size={14} />
              Newsletter management
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
              Manage newsletter subscribers
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
              Review subscriber activity, monitor acquisition sources, and keep
              newsletter records clean with responsive status management.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActionState({ type: "", message: "" });
              summaryQuery.refetch();
              listQuery.refetch();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh data
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total subscribers"
          value={Number(summary?.total || 0)}
          hint="All newsletter records"
        />
        <StatCard
          icon={CheckCircle2}
          label="Subscribed"
          value={Number(summary?.subscribed || 0)}
          hint="Currently active recipients"
        />
        <StatCard
          icon={XCircle}
          label="Unsubscribed"
          value={Number(summary?.unsubscribed || 0)}
          hint="Inactive newsletter recipients"
        />
        <StatCard
          icon={Filter}
          label="Top source"
          value={sourceLabel(
            sourceStats
              .slice()
              .sort((a, b) => Number(b?.count || 0) - Number(a?.count || 0))[0]
              ?.source || "unknown"
          )}
          hint="Best recent acquisition channel"
        />
      </section>

      <section className="rounded-[30px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              Home newsletter
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {Number(sourceStatsMap.get("home_newsletter") || 0)}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              Footer newsletter
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {Number(sourceStatsMap.get("footer_newsletter") || 0)}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              Admin manual
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {Number(sourceStatsMap.get("admin_manual") || 0)}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              Unknown source
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {Number(sourceStatsMap.get("unknown") || 0)}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <form
            onSubmit={handleSearchSubmit}
            className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_220px_220px]"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-800">
                Search subscribers
              </span>
              <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-4">
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search by email, source or notes"
                  className="w-full border-0 bg-transparent px-3 py-3.5 text-sm text-gray-900 outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-800">
                Status
              </span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none"
              >
                <option value="">All statuses</option>
                <option value="subscribed">Subscribed</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-800">
                Source
              </span>
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none"
              >
                <option value="">All sources</option>
                <option value="home_newsletter">Home Newsletter</option>
                <option value="footer_newsletter">Footer Newsletter</option>
                <option value="admin_manual">Admin Manual</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>

            <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                Apply filters
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {actionState.message ? (
          <div
            className={[
              "mt-4 rounded-2xl px-4 py-3 text-sm",
              actionState.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-red-200 bg-red-50 text-red-700",
            ].join(" ")}
          >
            {actionState.message}
          </div>
        ) : null}
      </section>

      <section className="rounded-[30px] border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Subscriber records
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Total matched records: {Number(pagination?.total || 0)}
              </p>
            </div>

            {listQuery.isFetching ? (
              <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                Refreshing list...
              </div>
            ) : null}
          </div>
        </div>

        {isInitialLoading ? (
          <div className="space-y-4 p-5 md:p-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-2xl border border-gray-200 bg-gray-50"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-5 md:p-6">
            <EmptyState
              title="No newsletter subscribers found"
              description="There are no matching subscriber records for the current filters. Try changing your search or resetting the filter set."
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-left text-xs uppercase tracking-[0.16em] text-gray-500">
                    <th className="px-6 py-4 font-semibold">Subscriber</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Last Source</th>
                    <th className="px-6 py-4 font-semibold">Created</th>
                    <th className="px-6 py-4 font-semibold">Updated</th>
                    <th className="px-6 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((item) => {
                    const isUpdating =
                      updateStatusMutation.isPending &&
                      updateStatusMutation.variables?.id === item?._id;

                    return (
                      <tr
                        key={item?._id}
                        className="border-b border-gray-100 align-top last:border-b-0"
                      >
                        <td className="px-6 py-5">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-gray-900">
                              {item?.email || "—"}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Sources:{" "}
                              {Array.isArray(item?.sources) && item.sources.length
                                ? item.sources.map((source) => sourceLabel(source)).join(", ")
                                : "—"}
                            </div>
                            {item?.notes ? (
                              <div className="mt-2 text-xs text-gray-500">
                                Note: {item.notes}
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={[
                              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                              statusBadgeClass(item?.status),
                            ].join(" ")}
                          >
                            {normalizeText(item?.status, "unknown")}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="text-sm font-medium text-gray-900">
                            {sourceLabel(item?.lastSource)}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Last subscribed: {formatDate(item?.lastSubscribedAt)}
                          </div>
                        </td>

                        <td className="px-6 py-5 text-sm text-gray-600">
                          {formatDateTime(item?.createdAt)}
                        </td>

                        <td className="px-6 py-5 text-sm text-gray-600">
                          {formatDateTime(item?.updatedAt)}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={isUpdating || item?.status === "subscribed"}
                              onClick={() =>
                                handleStatusChange(item?._id, "subscribed")
                              }
                              className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isUpdating && updateStatusMutation.variables?.status === "subscribed" ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                "Mark subscribed"
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={isUpdating || item?.status === "unsubscribed"}
                              onClick={() =>
                                handleStatusChange(item?._id, "unsubscribed")
                              }
                              className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isUpdating && updateStatusMutation.variables?.status === "unsubscribed" ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                "Mark unsubscribed"
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 p-5 lg:hidden">
              {rows.map((item) => {
                const isUpdating =
                  updateStatusMutation.isPending &&
                  updateStatusMutation.variables?.id === item?._id;

                return (
                  <div
                    key={item?._id}
                    className="rounded-[26px] border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-gray-900">
                          {item?.email || "—"}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {sourceLabel(item?.lastSource)}
                        </div>
                      </div>

                      <span
                        className={[
                          "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold",
                          statusBadgeClass(item?.status),
                        ].join(" ")}
                      >
                        {normalizeText(item?.status, "unknown")}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-gray-50 px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                          Created
                        </div>
                        <div className="mt-1 text-sm text-gray-900">
                          {formatDateTime(item?.createdAt)}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-gray-50 px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                          Updated
                        </div>
                        <div className="mt-1 text-sm text-gray-900">
                          {formatDateTime(item?.updatedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl bg-gray-50 px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                        Sources
                      </div>
                      <div className="mt-1 text-sm text-gray-900">
                        {Array.isArray(item?.sources) && item.sources.length
                          ? item.sources.map((source) => sourceLabel(source)).join(", ")
                          : "—"}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isUpdating || item?.status === "subscribed"}
                        onClick={() => handleStatusChange(item?._id, "subscribed")}
                        className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUpdating && updateStatusMutation.variables?.status === "subscribed" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          "Mark subscribed"
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating || item?.status === "unsubscribed"}
                        onClick={() =>
                          handleStatusChange(item?._id, "unsubscribed")
                        }
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUpdating && updateStatusMutation.variables?.status === "unsubscribed" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          "Mark unsubscribed"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!pagination?.hasPrevPage}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={!pagination?.hasNextPage}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}