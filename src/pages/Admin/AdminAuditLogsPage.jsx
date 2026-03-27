import React, { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Loader2,
  RefreshCcw,
  Search,
  Calendar,
  Eye,
  X,
  ShieldCheck,
} from "lucide-react";
import api from "../../services/apiClient";

function formatDate(iso) {
  try {
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function getErrorMessage(err) {
  const msg =
    err?.response?.data?.message || err?.response?.data?.error || err?.message;
  return msg ? String(msg) : "Something went wrong.";
}

function safeJson(value) {
  try {
    if (value == null) return "null";
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function Skeleton({ rows = 10 }) {
  return (
    <div className="overflow-x-auto p-6" role="status" aria-live="polite" aria-busy="true">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-[0.14em] text-gray-500">
            <th className="px-4 py-4 font-semibold">Time</th>
            <th className="px-4 py-4 font-semibold">Actor</th>
            <th className="px-4 py-4 font-semibold">Action</th>
            <th className="px-4 py-4 font-semibold">Entity</th>
            <th className="px-4 py-4 text-right font-semibold">Details</th>
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} className="border-b border-gray-100 last:border-b-0">
              <td className="px-4 py-4">
                <div className="h-4 w-28 animate-pulse rounded-md bg-gray-100" />
              </td>
              <td className="px-4 py-4">
                <div className="h-4 w-40 animate-pulse rounded-md bg-gray-100" />
                <div className="mt-2 h-3 w-28 animate-pulse rounded-md bg-gray-100" />
              </td>
              <td className="px-4 py-4">
                <div className="h-4 w-44 animate-pulse rounded-md bg-gray-100" />
              </td>
              <td className="px-4 py-4">
                <div className="h-4 w-28 animate-pulse rounded-md bg-gray-100" />
              </td>
              <td className="px-4 py-4 text-right">
                <div className="ml-auto h-8 w-20 animate-pulse rounded-xl bg-gray-100" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 h-3 w-56 animate-pulse rounded-md bg-gray-100" />
    </div>
  );
}

function Drawer({ open, onClose, log }) {
  if (!open) return null;

  const actorName =
    log?.actor?.displayName || log?.actor?.email || log?.actor?.phone || "Admin";

  return (
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close log details overlay"
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-auto border-l border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Audit Log
            </div>

            <div className="mt-1 truncate text-lg font-semibold text-gray-900">
              {String(log?.action || "—")}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1">
                {String(log?.entity || "—")}
              </span>

              {log?.entityId ? (
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 font-mono">
                  {String(log.entityId)}
                </span>
              ) : null}

              <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1">
                {formatDate(log?.createdAt)}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="rounded-2xl p-2 transition hover:bg-gray-50"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Actor</div>
            <div className="mt-3 space-y-1 text-sm text-gray-700">
              <div className="font-medium text-gray-900">{actorName}</div>
              <div className="text-gray-600">
                {log?.actor?.email ? `Email: ${log.actor.email}` : "Email: —"}
              </div>
              <div className="text-gray-600">
                {log?.actor?.phone ? `Phone: ${log.actor.phone}` : "Phone: —"}
              </div>
              <div className="text-gray-600">
                {log?.actor?.role ? `Role: ${log.actor.role}` : "Role: —"}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Request meta</div>
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              <div className="text-gray-600">
                <span className="font-medium text-gray-900">IP:</span>{" "}
                {log?.meta?.ip || "—"}
              </div>
              <div className="text-gray-600">
                <span className="font-medium text-gray-900">Method:</span>{" "}
                {log?.meta?.method || "—"}
              </div>
              <div className="break-all text-gray-600">
                <span className="font-medium text-gray-900">Path:</span>{" "}
                {log?.meta?.path || "—"}
              </div>
              <div className="break-all text-gray-600">
                <span className="font-medium text-gray-900">User-Agent:</span>{" "}
                {log?.meta?.userAgent || "—"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-4">
                <div className="text-sm font-semibold text-gray-900">Before</div>
              </div>
              <pre className="overflow-auto bg-gray-50 p-4 text-xs text-gray-900">
{safeJson(log?.before)}
              </pre>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-4">
                <div className="text-sm font-semibold text-gray-900">After</div>
              </div>
              <pre className="overflow-auto bg-gray-50 p-4 text-xs text-gray-900">
{safeJson(log?.after)}
              </pre>
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-200 bg-gray-50 p-5 text-xs text-gray-600">
            <div className="flex items-center gap-2 font-semibold text-gray-800">
              <ShieldCheck size={14} />
              Audit note
            </div>
            <div className="mt-1">
              Audit logs are generated by the server. Export, retention policy and
              advanced permission controls can be added later without changing this UI structure.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [q, setQ] = useState("");
  const dq = useDeferredValue(q);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [drawerLog, setDrawerLog] = useState(null);

  const badRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  const queryKey = useMemo(
    () => ["admin-audit-logs", page, limit, String(dq || ""), dateFrom, dateTo],
    [page, limit, dq, dateFrom, dateTo]
  );

  const listQuery = useQuery({
    queryKey,
    enabled: !badRange,
    queryFn: async ({ signal }) => {
      const params = { page, limit };

      const term = String(dq || "").trim();
      if (term) params.q = term;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const { data } = await api.get("/audit-logs/admin", { params, signal });
      return data;
    },
    staleTime: 10_000,
    keepPreviousData: true,
    retry: 1,
  });

  const logs = listQuery.data?.logs || [];
  const total = listQuery.data?.total || 0;
  const pages = listQuery.data?.pages || 1;

  function goPage(nextPage) {
    const next = clamp(Number(nextPage || 1), 1, Math.max(1, pages));
    setPage(next);
  }

  return (
    <div className="space-y-6">
      <Drawer open={!!drawerLog} log={drawerLog} onClose={() => setDrawerLog(null)} />

      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
              <FileText size={14} />
              Audit Logs
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 md:text-3xl">
              Audit Logs
            </h1>

            <div className="mt-2 text-sm text-gray-600">
              Total logs: <span className="font-semibold text-gray-900">{total}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              onClick={() => listQuery.refetch()}
              disabled={listQuery.isFetching || badRange}
            >
              {listQuery.isFetching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCcw size={16} />
              )}
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="text-sm font-semibold text-gray-900">Search</div>
            <div className="relative mt-2">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:ring-offset-2"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by action, entity, actor, email, phone or entity ID"
              />
              {q ? (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 transition hover:bg-gray-50"
                  onClick={() => {
                    setQ("");
                    setPage(1);
                  }}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Server-side search and pagination.
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="text-sm font-semibold text-gray-900">Per page</div>
            <select
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value || 20));
                setPage(1);
              }}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <div className="text-sm font-semibold text-gray-900">Date from</div>
            <div className="relative mt-2">
              <Calendar
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="date"
                className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="text-sm font-semibold text-gray-900">Date to</div>
            <div className="relative mt-2">
              <Calendar
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="date"
                className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {badRange ? (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            Invalid date range: Date from must be earlier than Date to.
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        {listQuery.isPending ? (
          <Skeleton rows={10} />
        ) : listQuery.isError ? (
          <div className="p-6">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <div className="font-semibold">Failed to load audit logs</div>
              <div className="mt-1">{getErrorMessage(listQuery.error)}</div>
              <button
                type="button"
                className="mt-4 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900"
                onClick={() => listQuery.refetch()}
              >
                Try again
              </button>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 w-fit rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
              No logs
            </div>
            <div className="text-2xl font-semibold text-gray-900">No results found</div>
            <div className="mt-2 text-gray-600">
              Try changing the search term or date range.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs uppercase tracking-[0.14em] text-gray-500">
                  <th className="px-4 py-4 font-semibold">Time</th>
                  <th className="px-4 py-4 font-semibold">Actor</th>
                  <th className="px-4 py-4 font-semibold">Action</th>
                  <th className="px-4 py-4 font-semibold">Entity</th>
                  <th className="px-4 py-4 text-right font-semibold">Details</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => {
                  const actorName =
                    log?.actor?.displayName ||
                    log?.actor?.email ||
                    log?.actor?.phone ||
                    "Admin";

                  return (
                    <tr
                      key={log?._id}
                      className="border-b border-gray-100 transition hover:bg-gray-50/70 last:border-b-0"
                    >
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-700">
                          {formatDate(log?.createdAt)}
                        </div>
                        <div className="font-mono text-xs text-gray-500">
                          {String(log?._id || "")}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="max-w-[240px] truncate font-semibold text-gray-900">
                          {actorName}
                        </div>
                        <div className="max-w-[240px] truncate text-xs text-gray-500">
                          {log?.actor?.email || log?.actor?.phone || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="max-w-[320px] truncate font-semibold text-gray-900">
                          {String(log?.action || "—")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log?.meta?.method ? `${log.meta.method} • ` : ""}
                          {log?.meta?.path || ""}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                          {String(log?.entity || "—")}
                        </div>

                        {log?.entityId ? (
                          <div className="mt-2 max-w-[280px] break-all font-mono text-xs text-gray-500">
                            {String(log.entityId)}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                          onClick={() => setDrawerLog(log)}
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 p-4 text-xs text-gray-500">
              <div>
                Showing{" "}
                <span className="font-semibold text-gray-900">{logs.length}</span> log(s)
                on this page • Total:{" "}
                <span className="font-semibold text-gray-900">{total}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                  onClick={() => goPage(page - 1)}
                  disabled={page <= 1 || listQuery.isFetching || badRange}
                >
                  Prev
                </button>

                <div className="min-w-[90px] text-center text-sm font-semibold text-gray-700">
                  {page} / {pages}
                </div>

                <button
                  type="button"
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                  onClick={() => goPage(page + 1)}
                  disabled={page >= pages || listQuery.isFetching || badRange}
                >
                  Next
                </button>

                {listQuery.isFetching ? (
                  <span className="ml-2 inline-flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Updating...
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}