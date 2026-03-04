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
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
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

function safeJson(v) {
  try {
    if (v == null) return "null";
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function Skeleton({ rows = 10 }) {
  return (
    <div className="p-6 overflow-x-auto" role="status" aria-live="polite" aria-busy="true">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Time</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Entity</th>
            <th className="text-right">Details</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td><div className="skeleton h-4 w-28 rounded-md" /></td>
              <td>
                <div className="skeleton h-4 w-40 rounded-md" />
                <div className="mt-2 skeleton h-3 w-28 rounded-md" />
              </td>
              <td><div className="skeleton h-4 w-44 rounded-md" /></td>
              <td><div className="skeleton h-4 w-28 rounded-md" /></td>
              <td className="text-right"><div className="skeleton h-8 w-20 rounded-xl ml-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4">
        <div className="skeleton h-3 w-56 rounded-md" />
      </div>
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
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white border-l shadow-2xl overflow-auto">
        <div className="p-5 border-b flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Audit Log
            </div>
            <div className="mt-1 text-lg font-semibold text-gray-900 truncate">
              {String(log?.action || "—")}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <span className="inline-flex items-center rounded-full border px-3 py-1 bg-gray-50">
                {String(log?.entity || "—")}
              </span>
              {log?.entityId ? (
                <span className="inline-flex items-center rounded-full border px-3 py-1 bg-white font-mono">
                  {String(log.entityId)}
                </span>
              ) : null}
              <span className="inline-flex items-center rounded-full border px-3 py-1 bg-white">
                {formatDate(log?.createdAt)}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="p-2 rounded-2xl hover:bg-gray-50 transition"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Actor */}
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Actor</div>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
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

          {/* Meta */}
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Request meta</div>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <div className="text-gray-600">
                <span className="font-medium text-gray-900">IP:</span>{" "}
                {log?.meta?.ip || "—"}
              </div>
              <div className="text-gray-600">
                <span className="font-medium text-gray-900">Method:</span>{" "}
                {log?.meta?.method || "—"}
              </div>
              <div className="text-gray-600 break-all">
                <span className="font-medium text-gray-900">Path:</span>{" "}
                {log?.meta?.path || "—"}
              </div>
              <div className="text-gray-600 break-all">
                <span className="font-medium text-gray-900">User-Agent:</span>{" "}
                {log?.meta?.userAgent || "—"}
              </div>
            </div>
          </div>

          {/* Before / After */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <div className="text-sm font-semibold text-gray-900">Before</div>
              </div>
              <pre className="p-4 text-xs overflow-auto bg-gray-50 text-gray-900">
{safeJson(log?.before)}
              </pre>
            </div>

            <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <div className="text-sm font-semibold text-gray-900">After</div>
              </div>
              <pre className="p-4 text-xs overflow-auto bg-gray-50 text-gray-900">
{safeJson(log?.after)}
              </pre>
            </div>
          </div>

          <div className="rounded-3xl border bg-gray-50 p-5 text-xs text-gray-600">
            <div className="font-semibold text-gray-800 flex items-center gap-2">
              <ShieldCheck size={14} /> Enterprise note
            </div>
            <div className="mt-1">
              Audit logs are server-generated. Next: add export (CSV), retention policy,
              and “hard delete” permission control.
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

  const [dateFrom, setDateFrom] = useState(""); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState(""); // YYYY-MM-DD

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
      return data; // { logs, total, page, pages, ... }
    },
    staleTime: 10_000,
    keepPreviousData: true,
    retry: 1,
  });

  const logs = listQuery.data?.logs || [];
  const total = listQuery.data?.total || 0;
  const pages = listQuery.data?.pages || 1;

  function goPage(p) {
    const next = clamp(Number(p || 1), 1, Math.max(1, pages));
    setPage(next);
  }

  return (
    <div className="space-y-6">
      <Drawer open={!!drawerLog} log={drawerLog} onClose={() => setDrawerLog(null)} />

      {/* Header */}
      <div className="rounded-3xl border bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <FileText size={16} />
            <span>Admin • Audit Logs</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
            Audit Logs
          </h1>
          <div className="text-sm text-gray-600 mt-2">
            Total logs: <span className="font-semibold text-gray-900">{total}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn btn-outline rounded-2xl bg-white hover:bg-gray-50 border-gray-200"
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

      {/* Filters */}
      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6">
            <div className="text-sm font-semibold text-gray-900">Search</div>
            <div className="mt-2 relative">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                className="input input-bordered w-full rounded-2xl bg-white border-gray-200 pl-11 pr-11"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search: action / entity / actor email/phone/name / entityId"
              />
              {q ? (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-gray-50"
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
              Server-side search + pagination (enterprise ready).
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="text-sm font-semibold text-gray-900">Per page</div>
            <select
              className="select select-bordered w-full rounded-2xl bg-white border-gray-200 mt-2"
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
            <div className="mt-2 relative">
              <Calendar
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="date"
                className="input input-bordered w-full rounded-2xl bg-white border-gray-200 pl-11"
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
            <div className="mt-2 relative">
              <Calendar
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="date"
                className="input input-bordered w-full rounded-2xl bg-white border-gray-200 pl-11"
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

      {/* Table */}
      <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
        {listQuery.isPending ? (
          <Skeleton rows={10} />
        ) : listQuery.isError ? (
          <div className="p-6">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <div className="font-semibold">Failed to load audit logs</div>
              <div className="mt-1">{getErrorMessage(listQuery.error)}</div>
              <button
                type="button"
                className="btn btn-sm mt-4 rounded-xl bg-black text-white hover:bg-gray-900 border-0"
                onClick={() => listQuery.refetch()}
              >
                Try again
              </button>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 w-fit rounded-full border px-3 py-1 text-sm bg-gray-50">
              No logs
            </div>
            <div className="text-2xl font-bold text-gray-900">No results found</div>
            <div className="mt-2 text-gray-600">
              Try changing search term or date range.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th className="text-right">Details</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((l) => {
                  const actorName =
                    l?.actor?.displayName ||
                    l?.actor?.email ||
                    l?.actor?.phone ||
                    "Admin";

                  return (
                    <tr key={l?._id}>
                      <td>
                        <div className="text-sm text-gray-700">{formatDate(l?.createdAt)}</div>
                        <div className="text-xs text-gray-500 font-mono">{String(l?._id || "")}</div>
                      </td>

                      <td>
                        <div className="font-semibold text-gray-900 truncate max-w-[240px]">
                          {actorName}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[240px]">
                          {l?.actor?.email || l?.actor?.phone || "—"}
                        </div>
                      </td>

                      <td>
                        <div className="font-semibold text-gray-900 truncate max-w-[320px]">
                          {String(l?.action || "—")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {l?.meta?.method ? `${l.meta.method} • ` : ""}
                          {l?.meta?.path || ""}
                        </div>
                      </td>

                      <td>
                        <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-gray-50">
                          {String(l?.entity || "—")}
                        </div>
                        {l?.entityId ? (
                          <div className="mt-2 text-xs text-gray-500 font-mono break-all max-w-[280px]">
                            {String(l.entityId)}
                          </div>
                        ) : null}
                      </td>

                      <td className="text-right">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline rounded-xl bg-white hover:bg-gray-50 border-gray-200"
                          onClick={() => setDrawerLog(l)}
                        >
                          <Eye size={16} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="p-4 border-t text-xs text-gray-500 flex flex-wrap items-center justify-between gap-3">
              <div>
                Showing{" "}
                <span className="font-semibold text-gray-900">{logs.length}</span>{" "}
                log(s) on this page • Total:{" "}
                <span className="font-semibold text-gray-900">{total}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline btn-sm rounded-xl bg-white hover:bg-gray-50 border-gray-200"
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
                  className="btn btn-outline btn-sm rounded-xl bg-white hover:bg-gray-50 border-gray-200"
                  onClick={() => goPage(page + 1)}
                  disabled={page >= pages || listQuery.isFetching || badRange}
                >
                  Next
                </button>

                {listQuery.isFetching ? (
                  <span className="inline-flex items-center gap-2 ml-2">
                    <Loader2 size={14} className="animate-spin" /> Updating...
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
