import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LifeBuoy,
  Search,
  RefreshCw,
  Loader2,
  Inbox,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  CircleDot,
  ChevronRight,
  Mail,
  Phone,
  ClipboardList,
  Tag,
  Filter,
  MessageSquareText,
  User,
  CalendarDays,
  Save,
  ShieldAlert,
} from "lucide-react";
import api from "../../services/apiClient";

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
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

function formatShortDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-BD", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function getErrorMessage(error, fallback = "Something went wrong.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function statusLabel(value) {
  const status = String(value || "").trim().toLowerCase();

  if (status === "open") return "Open";
  if (status === "in_progress") return "In progress";
  if (status === "resolved") return "Resolved";
  if (status === "spam") return "Spam";
  if (status === "archived") return "Archived";

  return "Open";
}

function priorityLabel(value) {
  const priority = String(value || "").trim().toLowerCase();

  if (priority === "urgent") return "Urgent";
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  if (priority === "low") return "Low";

  return "Medium";
}

function inquiryTypeLabel(value) {
  const type = String(value || "").trim().toLowerCase();

  if (type === "general") return "General question";
  if (type === "order_support") return "Order support";
  if (type === "delivery") return "Delivery update";
  if (type === "return_refund") return "Return or refund";
  if (type === "payment") return "Payment issue";
  if (type === "business") return "Business inquiry";
  if (type === "press") return "Media and press";

  return "General question";
}

function statusBadgeClass(value) {
  const status = String(value || "").trim().toLowerCase();

  if (status === "resolved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "in_progress") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "spam") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "archived") {
    return "border-gray-200 bg-gray-100 text-gray-600";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function priorityBadgeClass(value) {
  const priority = String(value || "").trim().toLowerCase();

  if (priority === "urgent") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "high") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (priority === "low") {
    return "border-gray-200 bg-gray-100 text-gray-600";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function sourceLabel(value) {
  const source = String(value || "").trim().toLowerCase();

  if (source === "contact_page") return "Contact page";
  if (source === "admin_manual") return "Admin manual";
  if (source === "email_import") return "Email import";

  return "Contact page";
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
        <Inbox size={20} />
      </div>

      <h2 className="mt-4 text-xl font-semibold text-gray-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-gray-600">
        {description}
      </p>
    </div>
  );
}

export default function AdminSupportPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [searchText, setSearchText] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const [editForm, setEditForm] = useState({
    status: "",
    priority: "",
    adminNotes: "",
    resolutionSummary: "",
  });

  const [actionState, setActionState] = useState({
    type: "",
    message: "",
  });

  const summaryQuery = useQuery({
    queryKey: ["admin-support-summary"],
    queryFn: async () => {
      const { data } = await api.get("/support/admin/summary");
      return data;
    },
    staleTime: 30_000,
  });

  const listQuery = useQuery({
    queryKey: [
      "admin-support-list",
      {
        page,
        limit,
        q: searchValue,
        status: statusFilter,
        priority: priorityFilter,
      },
    ],
    queryFn: async () => {
      const { data } = await api.get("/support/admin/list", {
        params: {
          page,
          limit,
          q: searchValue || undefined,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
        },
      });

      return data;
    },
    placeholderData: (previousData) => previousData,
  });

  const rows = Array.isArray(listQuery.data?.data) ? listQuery.data.data : [];
  const pagination = listQuery.data?.pagination || {
    page: 1,
    limit,
    total: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  };

  useEffect(() => {
    if (!rows.length) {
      setSelectedId("");
      return;
    }

    const exists = rows.some((item) => item?._id === selectedId);
    if (!selectedId || !exists) {
      setSelectedId(rows[0]?._id || "");
    }
  }, [rows, selectedId]);

  const detailsQuery = useQuery({
    queryKey: ["admin-support-one", selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      const { data } = await api.get(`/support/admin/${selectedId}`);
      return data;
    },
    staleTime: 10_000,
  });

  const selectedTicket = detailsQuery.data?.data || null;

  useEffect(() => {
    if (!selectedTicket) return;

    setEditForm({
      status: selectedTicket?.status || "open",
      priority: selectedTicket?.priority || "medium",
      adminNotes: selectedTicket?.adminNotes || "",
      resolutionSummary: selectedTicket?.resolutionSummary || "",
    });
  }, [selectedTicket]);

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.patch(`/support/admin/${selectedId}`, payload);
      return data;
    },
    onSuccess: async (data) => {
      setActionState({
        type: "success",
        message: data?.message || "Support ticket updated successfully.",
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-support-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-support-list"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-support-one", selectedId] }),
      ]);
    },
    onError: (error) => {
      setActionState({
        type: "error",
        message: getErrorMessage(error, "Failed to update support ticket."),
      });
    },
  });

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    setSearchValue(searchText);
    setActionState({ type: "", message: "" });
  }

  function handleReset() {
    setSearchText("");
    setSearchValue("");
    setStatusFilter("");
    setPriorityFilter("");
    setPage(1);
    setActionState({ type: "", message: "" });
  }

  function handleSave() {
    if (!selectedId || updateMutation.isPending) return;

    setActionState({ type: "", message: "" });

    updateMutation.mutate({
      status: editForm.status,
      priority: editForm.priority,
      adminNotes: editForm.adminNotes,
      resolutionSummary: editForm.resolutionSummary,
    });
  }

  const summary = summaryQuery.data?.data || {};
  const isInitialLoading =
    summaryQuery.isLoading || (listQuery.isLoading && !listQuery.data);

  const totalPages = clamp(Number(pagination?.totalPages || 1), 1, 100000);
  const currentPage = clamp(Number(pagination?.page || 1), 1, totalPages);

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-600">
              <LifeBuoy size={14} />
              Support inbox
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
              Manage customer and business inquiries
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
              Review incoming contact requests, update ticket status, and keep support work
              organized from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActionState({ type: "", message: "" });
              summaryQuery.refetch();
              listQuery.refetch();
              if (selectedId) detailsQuery.refetch();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh inbox
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <StatCard
          icon={Inbox}
          label="Total tickets"
          value={Number(summary?.total || 0)}
          hint="All support records"
        />
        <StatCard
          icon={CircleDot}
          label="Open"
          value={Number(summary?.open || 0)}
          hint="Needs first response or review"
        />
        <StatCard
          icon={Clock3}
          label="In progress"
          value={Number(summary?.inProgress || 0)}
          hint="Already being handled"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved"
          value={Number(summary?.resolved || 0)}
          hint="Completed support items"
        />
        <StatCard
          icon={AlertTriangle}
          label="Urgent"
          value={Number(summary?.urgent || 0)}
          hint="High-priority requests"
        />
      </section>

      <section className="rounded-[30px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <form
            onSubmit={handleSearchSubmit}
            className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_220px_220px]"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-800">
                Search inbox
              </span>
              <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-4">
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search by ticket, name, email, subject, order reference"
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
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
                <option value="spam">Spam</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-800">
                Priority
              </span>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none"
              >
                <option value="">All priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
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
                onClick={handleReset}
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

      {isInitialLoading ? (
        <section className="rounded-[30px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 size={18} className="animate-spin" />
            Loading support inbox...
          </div>
        </section>
      ) : rows.length === 0 ? (
        <section className="rounded-[30px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <EmptyState
            title="No support messages found"
            description="There are no matching inquiries for the current search or filters."
          />
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="rounded-[30px] border border-gray-200 bg-white shadow-sm xl:col-span-5">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 md:px-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Inbox list</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Total matched records: {Number(pagination?.total || 0)}
                </p>
              </div>

              {listQuery.isFetching ? (
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 size={16} className="animate-spin" />
                  Refreshing...
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
                  <Filter size={14} />
                  {rows.length} on page
                </div>
              )}
            </div>

            <div className="max-h-[760px] overflow-y-auto p-4">
              <div className="space-y-3">
                {rows.map((item) => {
                  const active = selectedId === item._id;

                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => {
                        setSelectedId(item._id);
                        setActionState({ type: "", message: "" });
                      }}
                      className={[
                        "w-full rounded-[24px] border p-4 text-left transition",
                        active
                          ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                          : "border-gray-200 bg-white hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div
                            className={[
                              "truncate text-sm font-semibold",
                              active ? "text-white" : "text-gray-900",
                            ].join(" ")}
                          >
                            {item.name || "Unknown sender"}
                          </div>

                          <div
                            className={[
                              "mt-1 truncate text-xs",
                              active ? "text-gray-300" : "text-gray-500",
                            ].join(" ")}
                          >
                            {item.email || "No email"}
                          </div>
                        </div>

                        <ChevronRight
                          size={16}
                          className={active ? "text-white/70" : "text-gray-400"}
                        />
                      </div>

                      <div
                        className={[
                          "mt-3 line-clamp-2 text-sm leading-6",
                          active ? "text-gray-100" : "text-gray-600",
                        ].join(" ")}
                      >
                        {item.subject}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span
                          className={[
                            "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
                            active
                              ? "border-white/20 bg-white/10 text-white"
                              : statusBadgeClass(item.status),
                          ].join(" ")}
                        >
                          {statusLabel(item.status)}
                        </span>

                        <span
                          className={[
                            "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
                            active
                              ? "border-white/20 bg-white/10 text-white"
                              : priorityBadgeClass(item.priority),
                          ].join(" ")}
                        >
                          {priorityLabel(item.priority)}
                        </span>
                      </div>

                      <div
                        className={[
                          "mt-4 text-xs",
                          active ? "text-gray-300" : "text-gray-500",
                        ].join(" ")}
                      >
                        {formatShortDate(item.createdAt)}
                      </div>
                    </button>
                  );
                })}
              </div>
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
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-gray-200 bg-white shadow-sm xl:col-span-7">
            {!selectedId ? (
              <div className="p-6">
                <EmptyState
                  title="No ticket selected"
                  description="Choose a ticket from the left to review the full message and update its status."
                />
              </div>
            ) : detailsQuery.isLoading ? (
              <div className="p-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 size={18} className="animate-spin" />
                  Loading ticket details...
                </div>
              </div>
            ) : detailsQuery.isError ? (
              <div className="p-6">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {getErrorMessage(detailsQuery.error, "Failed to load ticket details.")}
                </div>
              </div>
            ) : selectedTicket ? (
              <>
                <div className="border-b border-gray-200 px-5 py-5 md:px-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                          {sourceLabel(selectedTicket.source)}
                        </span>
                        <span
                          className={[
                            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                            statusBadgeClass(selectedTicket.status),
                          ].join(" ")}
                        >
                          {statusLabel(selectedTicket.status)}
                        </span>
                        <span
                          className={[
                            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                            priorityBadgeClass(selectedTicket.priority),
                          ].join(" ")}
                        >
                          {priorityLabel(selectedTicket.priority)}
                        </span>
                      </div>

                      <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
                        {selectedTicket.subject || "Support request"}
                      </h2>

                      <p className="mt-2 text-sm leading-7 text-gray-600">
                        {inquiryTypeLabel(selectedTicket.inquiryType)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                      <div className="font-semibold text-gray-900">Ticket ID</div>
                      <div className="mt-1">
                        {selectedTicket.ticketNo || selectedTicket._id}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-5 md:p-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <User size={16} />
                        Sender
                      </div>
                      <div className="mt-3 text-sm text-gray-700">
                        <div className="font-medium text-gray-900">
                          {selectedTicket.name || "—"}
                        </div>
                        <div className="mt-1">{selectedTicket.email || "—"}</div>
                        <div className="mt-1">
                          {selectedTicket.phone || "No phone provided"}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <CalendarDays size={16} />
                        Timeline
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-gray-700">
                        <div>
                          <span className="font-medium text-gray-900">Created:</span>{" "}
                          {formatDateTime(selectedTicket.createdAt)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Updated:</span>{" "}
                          {formatDateTime(selectedTicket.updatedAt)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Resolved:</span>{" "}
                          {formatDateTime(selectedTicket.resolvedAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-[24px] border border-gray-200 bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Tag size={16} />
                        Inquiry type
                      </div>
                      <div className="mt-3 text-sm text-gray-700">
                        {inquiryTypeLabel(selectedTicket.inquiryType)}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-gray-200 bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <ClipboardList size={16} />
                        Order reference
                      </div>
                      <div className="mt-3 text-sm text-gray-700">
                        {selectedTicket.orderReference || "Not provided"}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-gray-200 bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <MessageSquareText size={16} />
                        Source
                      </div>
                      <div className="mt-3 text-sm text-gray-700">
                        {sourceLabel(selectedTicket.source)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                    <div className="text-sm font-semibold text-gray-900">Message</div>
                    <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                      {selectedTicket.message || "No message body available."}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-800">
                        Status
                      </span>
                      <select
                        value={editForm.status}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, status: e.target.value }))
                        }
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="spam">Spam</option>
                        <option value="archived">Archived</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-800">
                        Priority
                      </span>
                      <select
                        value={editForm.priority}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, priority: e.target.value }))
                        }
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </label>

                    <div className="md:col-span-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-gray-800">
                          Internal notes
                        </span>
                        <textarea
                          rows={5}
                          value={editForm.adminNotes}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              adminNotes: e.target.value,
                            }))
                          }
                          placeholder="Add internal notes for the support team"
                          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none"
                        />
                      </label>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-gray-800">
                          Resolution summary
                        </span>
                        <textarea
                          rows={4}
                          value={editForm.resolutionSummary}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              resolutionSummary: e.target.value,
                            }))
                          }
                          placeholder="Add a short resolution summary when the issue is completed"
                          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <a
                      href={`mailto:${selectedTicket.email || ""}?subject=${encodeURIComponent(
                        `Re: ${selectedTicket.subject || "Your request"}`
                      )}`}
                      className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
                    >
                      <Mail size={18} />
                      Reply by email
                    </a>

                    <a
                      href={selectedTicket.phone ? `tel:${selectedTicket.phone}` : "#"}
                      className={[
                        "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition",
                        selectedTicket.phone
                          ? "border-gray-200 text-gray-900 hover:bg-gray-50"
                          : "pointer-events-none border-gray-200 text-gray-400",
                      ].join(" ")}
                    >
                      <Phone size={18} />
                      Call contact
                    </a>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Save changes
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    <div className="flex items-start gap-3">
                      <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                      <div>
                        Keep internal notes clear and professional. These notes are meant for
                        the admin team and help maintain continuity when multiple people handle
                        the same request.
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}