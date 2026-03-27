import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  Package,
  Users,
  Boxes,
  AlertTriangle,
  BadgeDollarSign,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Activity,
  Store,
  CalendarRange,
  Layers3,
  Settings,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import api from "../../services/apiClient";
import { useAuth } from "../../shared/hooks/useAuth";

const RANGE_OPTIONS = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
];

const TAB_OPTIONS = [
  { key: "overview", label: "Overview" },
  { key: "sales", label: "Sales" },
  { key: "operations", label: "Operations" },
];

const ICON_MAP = {
  ClipboardList,
  Package,
  Users,
  Boxes,
  Store,
  Settings,
  FileText,
  ShieldCheck,
};

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function money(v) {
  return `৳${num(v).toFixed(0)}`;
}

function shortMoney(v) {
  const n = num(v);
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(1)}K`;
  return `৳${n.toFixed(0)}`;
}

function normalizePermissions(u) {
  const list = Array.isArray(u?.permissions) ? u.permissions : [];
  const out = [];
  const seen = new Set();

  for (const raw of list) {
    const p = String(raw || "").trim().toLowerCase();
    if (!p) continue;
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }

  return out;
}

function canAny({ userPerms, isSuper }, perms = []) {
  if (isSuper) return true;
  if (!Array.isArray(perms) || perms.length === 0) return true;
  if (userPerms.includes("*")) return true;

  return perms.some((p) => userPerms.includes(String(p || "").trim().toLowerCase()));
}

function canMinLevel(roleLevel, minLevel) {
  const current = Number(roleLevel || 0);
  const target = Number(minLevel || 0);
  if (!Number.isFinite(target)) return true;
  return Number.isFinite(current) && current >= target;
}

function getRoleLabel(role, roleLevel) {
  const r = String(role || "").toLowerCase();
  const lvl = Number(roleLevel || 0);

  if (lvl >= 100) return "Super Admin";
  if (r === "manager") return "Manager";
  if (r === "support") return "Support";
  if (r === "editor") return "Editor";
  if (r === "auditor") return "Auditor";
  if (r === "admin") return "Admin";
  return "User";
}

function getOrderDate(order) {
  const raw =
    order?.createdAt ||
    order?.created_at ||
    order?.date ||
    order?.placedAt ||
    order?.updatedAt;

  const d = raw ? new Date(raw) : null;
  return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
}

function getOrderTotal(order) {
  return (
    num(order?.total) ||
    num(order?.grandTotal) ||
    num(order?.amount) ||
    num(order?.subtotalWithShipping) ||
    0
  );
}

function getOrderItemsCount(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  return items.reduce((sum, item) => sum + num(item?.qty, 0), 0);
}

function getStatusBadgeClass(status) {
  const s = String(status || "").toLowerCase();

  if (s === "delivered") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (s === "cancelled") return "border-red-200 bg-red-50 text-red-700";
  if (s === "shipped") return "border-blue-200 bg-blue-50 text-blue-700";
  if (s === "processing") return "border-amber-200 bg-amber-50 text-amber-700";
  if (s === "paid") return "border-green-200 bg-green-50 text-green-700";
  return "border-gray-200 bg-gray-50 text-gray-700";
}

function getAlertToneClass(tone) {
  const t = String(tone || "").toLowerCase();

  if (t === "danger") return "border-red-200 bg-red-50 text-red-800";
  if (t === "warning") return "border-amber-200 bg-amber-50 text-amber-800";
  if (t === "info") return "border-blue-200 bg-blue-50 text-blue-800";
  if (t === "success") return "border-emerald-200 bg-emerald-50 text-emerald-800";

  return "border-gray-200 bg-gray-50 text-gray-800";
}

function formatStatusText(value) {
  const s = String(value || "").trim();
  if (!s) return "Pending";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function SkeletonBlock({ className = "" }) {
  return <div className={["animate-pulse rounded-2xl bg-gray-100", className].join(" ")} />;
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <SkeletonBlock className="h-5 w-36" />
        <SkeletonBlock className="mt-4 h-10 w-80 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-[30rem] max-w-full" />
        <div className="mt-6 flex flex-wrap gap-3">
          <SkeletonBlock className="h-11 w-28" />
          <SkeletonBlock className="h-11 w-28" />
          <SkeletonBlock className="h-11 w-28" />
          <SkeletonBlock className="h-11 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-4 h-9 w-28" />
            <SkeletonBlock className="mt-3 h-3 w-36" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm xl:col-span-8">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="mt-2 h-4 w-56" />
          <SkeletonBlock className="mt-6 h-80 w-full" />
        </div>
        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm xl:col-span-4">
          <SkeletonBlock className="h-5 w-28" />
          <SkeletonBlock className="mt-2 h-4 w-44" />
          <SkeletonBlock className="mt-6 h-80 w-full" />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, hint, icon: Icon, tone = "default" }) {
  const toneWrap =
    tone === "danger"
      ? "border-red-200 bg-gradient-to-br from-red-50 to-white"
      : tone === "warning"
      ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white"
      : tone === "success"
      ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
      : "border-gray-200 bg-gradient-to-br from-gray-50 to-white";

  const toneIcon =
    tone === "danger"
      ? "border-red-200 bg-red-100 text-red-700"
      : tone === "warning"
      ? "border-amber-200 bg-amber-100 text-amber-700"
      : tone === "success"
      ? "border-emerald-200 bg-emerald-100 text-emerald-700"
      : "border-gray-200 bg-white text-gray-700";

  return (
    <div
      className={[
        "rounded-[28px] border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
        toneWrap,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            {title}
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
            {value}
          </div>
          {hint ? <div className="mt-2 text-xs leading-5 text-gray-500">{hint}</div> : null}
        </div>

        <div
          className={[
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm",
            toneIcon,
          ].join(" ")}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, action, children, padded = true }) {
  return (
    <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm transition duration-200 hover:shadow-md">
      <div className="flex flex-col gap-4 px-5 pt-5 md:flex-row md:items-start md:justify-between md:px-6 md:pt-6">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 md:text-xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm leading-6 text-gray-500">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className={padded ? "p-5 md:p-6" : "pt-5"}>{children}</div>
    </section>
  );
}

function ChartEmpty({ label = "No data available yet." }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center text-sm text-gray-500">
      {label}
    </div>
  );
}

function SegmentButton({ active, children, onClick, dark = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        active
          ? dark
            ? "border-white/30 bg-white text-gray-950 shadow-lg ring-2 ring-white/20 focus-visible:ring-white"
            : "border-gray-900 bg-gray-900 text-white shadow-md ring-2 ring-gray-900/10 focus-visible:ring-gray-900"
          : dark
          ? "border-white/12 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white focus-visible:ring-white"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-gray-900",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function HeaderStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function DashboardHeader({
  visibleTabs,
  activeTab,
  activeRangeKey,
  activeRangeLabel,
  onTabChange,
  onRangeChange,
  roleLabel,
  filteredOrdersCount,
  filteredRevenue,
  lowStock,
  customerCount,
  isFetching,
  ordersLink,
  shopControlLink,
}) {
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-gray-900/70 bg-gradient-to-br from-gray-950 via-gray-900 to-slate-800 p-6 shadow-sm md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_26%)]" />

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-200">
              <Sparkles size={14} />
              Dashboard overview
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-200">
              <ShieldCheck size={14} />
              {roleLabel}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-4xl">
            Admin overview
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300 md:text-base">
            Monitor revenue, order activity, stock pressure and operational updates from a
            single dashboard view.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {ordersLink ? (
              <Link
                to={ordersLink}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              >
                Open orders
              </Link>
            ) : null}

            {shopControlLink ? (
              <Link
                to={shopControlLink}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              >
                Open shop control
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:min-w-[340px]">
          <HeaderStat label={`${activeRangeLabel} orders`} value={filteredOrdersCount} />
          <HeaderStat label={`${activeRangeLabel} revenue`} value={money(filteredRevenue)} />
          <HeaderStat label="Low stock" value={lowStock} />
          <HeaderStat label="Customers" value={customerCount} />
        </div>
      </div>

      <div className="relative mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {visibleTabs.map((tab) => (
            <SegmentButton
              key={tab.key}
              active={activeTab === tab.key}
              onClick={() => onTabChange(tab.key)}
              dark
            >
              <span className="inline-flex items-center gap-2">
                <Layers3 size={15} />
                {tab.label}
              </span>
            </SegmentButton>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((range) => (
            <SegmentButton
              key={range.key}
              active={activeRangeKey === range.key}
              onClick={() => onRangeChange(range.key)}
              dark
            >
              <span className="inline-flex items-center gap-2">
                <CalendarRange size={15} />
                {range.label}
              </span>
            </SegmentButton>
          ))}
        </div>
      </div>

      {isFetching ? (
        <div className="relative mt-5 inline-flex items-center gap-2 text-xs text-gray-300">
          <RefreshCw size={14} className="animate-spin" />
          Refreshing data...
        </div>
      ) : null}
    </section>
  );
}

function SalesWidgets({
  rangeLabel,
  rangeDays,
  rangeSeries,
  filteredOrdersCount,
  filteredRevenue,
  topProducts,
}) {
  const hasRevenueSeries = rangeSeries.some((item) => item.revenue > 0);
  const hasOrderSeries = rangeSeries.some((item) => item.orders > 0);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
      <div className="space-y-5 xl:col-span-8">
        <SectionCard
          title="Revenue trend"
          subtitle={`Revenue performance across the last ${rangeDays} days.`}
        >
          {hasRevenueSeries ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rangeSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(v) => shortMoney(v)}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip
                    formatter={(value) => [money(value), "Revenue"]}
                    labelFormatter={(label) => `Day: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    strokeWidth={2.5}
                    fillOpacity={0.14}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty label={`Revenue data for the last ${rangeDays} days is not available yet.`} />
          )}
        </SectionCard>

        <SectionCard
          title="Order trend"
          subtitle={`Order volume across the last ${rangeDays} days.`}
        >
          {hasOrderSeries ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rangeSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [value, "Orders"]} />
                  <Bar dataKey="orders" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty label={`Order volume data for the last ${rangeDays} days is not available yet.`} />
          )}
        </SectionCard>
      </div>

      <div className="space-y-5 xl:col-span-4">
        <SectionCard
          title="Top products"
          subtitle="Best-performing items from currently available product data."
        >
          {topProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
              Product performance data is not available yet.
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-gray-200 p-4 transition duration-200 hover:bg-gray-50 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-gray-200 bg-gray-50 px-2 text-[11px] font-semibold text-gray-700">
                          #{idx + 1}
                        </span>
                        <div className="truncate text-sm font-semibold text-gray-900">
                          {product.title}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-1">
                          Sold: {product.sold}
                        </span>
                        <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-1">
                          Stock: {product.stock}
                        </span>
                        {product.revenue > 0 ? (
                          <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-1">
                            Revenue: {money(product.revenue)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Sales snapshot"
          subtitle={`Summary for the selected ${rangeLabel.toLowerCase()} range.`}
        >
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                Orders
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{filteredOrdersCount}</div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                Revenue
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{money(filteredRevenue)}</div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                Average order value
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {filteredOrdersCount > 0 ? money(filteredRevenue / filteredOrdersCount) : "৳0"}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function OperationsWidgets({
  rangeLabel,
  statusChartData,
  recentOrders,
  healthAlerts,
  lowStockProducts,
  quickActions,
}) {
  const hasStatusSeries = statusChartData.some((item) => item.value > 0);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
      <div className="space-y-5 xl:col-span-7">
        <SectionCard
          title="Order status"
          subtitle={`Operational pipeline for the selected ${rangeLabel.toLowerCase()} period.`}
        >
          {hasStatusSeries ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusChartData}
                  layout="vertical"
                  margin={{ top: 8, right: 8, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    width={84}
                  />
                  <Tooltip formatter={(value) => [value, "Orders"]} />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty label="Operational status data is not available yet." />
          )}
        </SectionCard>

        <SectionCard
          title="Recent orders"
          subtitle="Latest operational activity requiring review."
        >
          {recentOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
              No recent orders found.
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order, idx) => {
                const status = String(order?.status || "pending");
                const orderId = order?._id || order?.id || order?.orderId || `order-${idx}`;
                const customer =
                  order?.customer ||
                  order?.shippingAddress?.name ||
                  order?.customerName ||
                  order?.user?.name ||
                  order?.user?.displayName ||
                  order?.email ||
                  "Customer";
                const date = getOrderDate(order);

                return (
                  <div
                    key={orderId}
                    className="rounded-2xl border border-gray-200 p-4 transition duration-200 hover:bg-gray-50 hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-gray-900">
                          {customer}
                        </div>
                        <div className="mt-1 break-all text-xs text-gray-500">
                          #{String(orderId)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {date ? date.toLocaleString() : "Date unavailable"}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={[
                            "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                            getStatusBadgeClass(status),
                          ].join(" ")}
                        >
                          {formatStatusText(status)}
                        </span>

                        <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                          {getOrderItemsCount(order)} item(s)
                        </span>

                        <div className="text-sm font-bold text-gray-900">
                          {money(getOrderTotal(order))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="space-y-5 xl:col-span-5">
        <SectionCard
          title="Alerts & system health"
          subtitle="High-priority operational checks."
        >
          <div className="space-y-3">
            {healthAlerts.map((item) => (
              <div
                key={item.label}
                className={["rounded-2xl border p-4", getAlertToneClass(item.tone)].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="mt-1 text-xs leading-5 opacity-80">{item.helper}</div>
                  </div>
                  <div className="shrink-0 text-2xl font-bold">{item.value}</div>
                </div>
              </div>
            ))}

            {lowStockProducts.length > 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <ShieldAlert size={16} />
                  Low stock watchlist
                </div>

                <div className="mt-3 space-y-2">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-3 transition duration-200 hover:shadow-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-gray-900">
                          {product.title}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">Stock running low</div>
                      </div>
                      <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        {product.stock} left
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <div className="font-semibold">Inventory status is stable</div>
                <div className="mt-1 text-xs leading-5 opacity-90">
                  No immediate low-stock items were detected from the current product data.
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Quick actions"
          subtitle="Open the admin areas used most often."
        >
          <div className="space-y-3">
            {quickActions.map((item) => {
              const Icon = ICON_MAP[item.icon] || Settings;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block rounded-2xl border border-gray-200 p-4 transition duration-200 hover:bg-gray-50 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
                        <Icon size={18} className="text-gray-700" />
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                        <div className="mt-1 text-sm leading-6 text-gray-500">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <ArrowRight size={16} className="mt-1 shrink-0 text-gray-500" />
                  </div>
                </Link>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const { user } = useAuth();

  const [activeRange, setActiveRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");

  const role = useMemo(() => String(user?.role || "").toLowerCase(), [user]);
  const roleLevel = useMemo(() => {
    const n = Number(user?.roleLevel || 0);
    return Number.isFinite(n) ? n : 0;
  }, [user]);
  const userPerms = useMemo(() => normalizePermissions(user), [user]);
  const isSuper = role === "superadmin" || roleLevel >= 100 || userPerms.includes("*");

  const accessFromUser = useMemo(() => {
    const ctx = { userPerms, isSuper };

    return {
      orders: canAny(ctx, ["orders:read", "orders:write"]),
      products: canAny(ctx, ["products:read", "products:write"]),
      users: canAny(ctx, ["users:read", "users:write"]),
      settings: canAny(ctx, ["settings:read", "settings:write"]),
      audit: canAny(ctx, ["audit:read"]),
      shopControl: canMinLevel(roleLevel, 1),
      roles: canAny(ctx, ["users:read", "users:write"]) && canMinLevel(roleLevel, 20),
    };
  }, [userPerms, isSuper, roleLevel]);

  const rangeConfig = useMemo(
    () => RANGE_OPTIONS.find((item) => item.key === activeRange) || RANGE_OPTIONS[0],
    [activeRange]
  );

  const overviewQuery = useQuery({
    queryKey: ["admin-overview-summary", activeRange],
    queryFn: async () =>
      (await api.get("/admin-overview/summary", { params: { range: activeRange } })).data,
    staleTime: 60_000,
    retry: 1,
  });

  const data = overviewQuery.data || {};
  const backendAccess = data?.access || {};
  const access = { ...accessFromUser, ...backendAccess };

  const visibleTabs = useMemo(() => {
    return TAB_OPTIONS.filter((tab) => {
      if (tab.key === "overview") return true;
      if (tab.key === "sales") return access.orders;
      if (tab.key === "operations") return access.orders || access.products;
      return false;
    });
  }, [access]);

  const safeActiveTab = useMemo(() => {
    return visibleTabs.some((t) => t.key === activeTab)
      ? activeTab
      : visibleTabs[0]?.key || "overview";
  }, [activeTab, visibleTabs]);

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const recentOrders = Array.isArray(data?.recentOrders) ? data.recentOrders : [];
  const topProducts = Array.isArray(data?.topProducts) ? data.topProducts : [];
  const lowStockProducts = Array.isArray(data?.lowStockProducts) ? data.lowStockProducts : [];
  const quickActions = Array.isArray(data?.quickActions) ? data.quickActions : [];
  const healthAlerts = Array.isArray(data?.healthAlerts) ? data.healthAlerts : [];

  const inventorySummary = {
    lowStock: num(stats?.lowStock),
    outOfStock: num(stats?.outOfStock),
    totalStock: num(stats?.totalStock),
  };

  const analytics = {
    totalRevenue: num(stats?.totalRevenue),
    todayRevenue: num(stats?.todayRevenue),
    filteredRevenue: num(stats?.filteredRevenue),
    todayOrdersCount: num(stats?.todayOrders),
    filteredOrdersCount: num(stats?.filteredOrders),
    rangeSeries: Array.isArray(charts?.rangeSeries) ? charts.rangeSeries : [],
    statusChartData: Array.isArray(charts?.statusChartData) ? charts.statusChartData : [],
  };

  const orderCount = num(stats?.totalOrders);
  const productCount = num(stats?.products);
  const customerCount = num(stats?.customers);

  if (overviewQuery.isLoading) {
    return <DashboardLoadingSkeleton />;
  }

  if (overviewQuery.isError) {
    return (
      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="text-sm font-semibold text-red-900">Couldn’t load dashboard data</div>
          <div className="mt-1 text-sm leading-6 text-red-700">
            The overview widgets could not fetch dashboard data from the server.
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => overviewQuery.refetch()}
              className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasOrdersAccess = access.orders;
  const hasProductsAccess = access.products;
  const hasUsersAccess = access.users;

  const kpiCards = [
    hasOrdersAccess
      ? {
          title: "Total orders",
          value: orderCount,
          hint: "All available admin orders",
          icon: ClipboardList,
          tone: "default",
        }
      : null,
    hasOrdersAccess
      ? {
          title: `${rangeConfig.label} orders`,
          value: analytics.filteredOrdersCount,
          hint: `Orders in the selected ${rangeConfig.label.toLowerCase()} window`,
          icon: Activity,
          tone: "success",
        }
      : null,
    hasOrdersAccess
      ? {
          title: "Total revenue",
          value: money(analytics.totalRevenue),
          hint: "Revenue calculated from order totals",
          icon: BadgeDollarSign,
          tone: "default",
        }
      : null,
    hasOrdersAccess
      ? {
          title: `${rangeConfig.label} revenue`,
          value: money(analytics.filteredRevenue),
          hint: `Revenue for the selected ${rangeConfig.label.toLowerCase()} period`,
          icon: TrendingUp,
          tone: "success",
        }
      : null,
    hasUsersAccess
      ? {
          title: "Customers",
          value: customerCount,
          hint: "Registered customer records",
          icon: Users,
          tone: "default",
        }
      : null,
    hasProductsAccess
      ? {
          title: "Products",
          value: productCount,
          hint: "Catalog items available in admin",
          icon: Package,
          tone: "default",
        }
      : null,
    hasProductsAccess
      ? {
          title: "Low stock",
          value: inventorySummary.lowStock,
          hint: "Items that need replenishment attention",
          icon: AlertTriangle,
          tone: "warning",
        }
      : null,
    hasProductsAccess
      ? {
          title: "Out of stock",
          value: inventorySummary.outOfStock,
          hint: "Unavailable products that may affect conversion",
          icon: Boxes,
          tone: "danger",
        }
      : null,
  ].filter(Boolean);

  const noWidgetAccess = !hasOrdersAccess && !hasProductsAccess && !hasUsersAccess;

  return (
    <div className="space-y-5">
      <DashboardHeader
        visibleTabs={visibleTabs}
        activeTab={safeActiveTab}
        activeRangeKey={activeRange}
        activeRangeLabel={rangeConfig.label}
        onTabChange={(tab) => setActiveTab(tab)}
        onRangeChange={(range) => setActiveRange(range)}
        roleLabel={getRoleLabel(role, roleLevel)}
        filteredOrdersCount={hasOrdersAccess ? analytics.filteredOrdersCount : 0}
        filteredRevenue={hasOrdersAccess ? analytics.filteredRevenue : 0}
        lowStock={hasProductsAccess ? inventorySummary.lowStock : 0}
        customerCount={hasUsersAccess ? customerCount : 0}
        isFetching={overviewQuery.isFetching}
        ordersLink={access.orders ? "/admin/orders" : ""}
        shopControlLink={access.shopControl ? "/admin/shop-control" : ""}
      />

      {noWidgetAccess ? (
        <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
            <CheckCircle2 size={14} />
            Limited access view
          </div>

          <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
            Dashboard access is currently limited for this role
          </h2>

          <p className="mt-2 max-w-3xl text-gray-600">
            This page is running in a restricted mode. As additional permissions are assigned,
            sales, operations, inventory and customer widgets will appear automatically.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {quickActions.length > 0 ? (
              quickActions.map((item) => {
                const Icon = ICON_MAP[item.icon] || Settings;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="block rounded-2xl border border-gray-200 p-5 transition duration-200 hover:bg-gray-50 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
                          <Icon size={18} className="text-gray-700" />
                        </div>

                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                          <div className="mt-1 text-sm leading-6 text-gray-500">
                            {item.description}
                          </div>
                        </div>
                      </div>

                      <ArrowRight size={16} className="mt-1 shrink-0 text-gray-500" />
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
                No dashboard widgets are available for this role yet.
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          {kpiCards.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {kpiCards.map((card) => (
                <KpiCard key={card.title} {...card} />
              ))}
            </div>
          ) : null}

          {safeActiveTab === "overview" ? (
            <div className="space-y-5">
              {hasOrdersAccess ? (
                <SalesWidgets
                  rangeLabel={rangeConfig.label}
                  rangeDays={rangeConfig.days}
                  rangeSeries={analytics.rangeSeries}
                  filteredOrdersCount={analytics.filteredOrdersCount}
                  filteredRevenue={analytics.filteredRevenue}
                  topProducts={hasProductsAccess ? topProducts : []}
                />
              ) : null}

              {hasOrdersAccess || hasProductsAccess ? (
                <OperationsWidgets
                  rangeLabel={rangeConfig.label}
                  statusChartData={hasOrdersAccess ? analytics.statusChartData : []}
                  recentOrders={hasOrdersAccess ? recentOrders : []}
                  healthAlerts={healthAlerts}
                  lowStockProducts={hasProductsAccess ? lowStockProducts : []}
                  quickActions={quickActions}
                />
              ) : null}
            </div>
          ) : null}

          {safeActiveTab === "sales" && hasOrdersAccess ? (
            <SalesWidgets
              rangeLabel={rangeConfig.label}
              rangeDays={rangeConfig.days}
              rangeSeries={analytics.rangeSeries}
              filteredOrdersCount={analytics.filteredOrdersCount}
              filteredRevenue={analytics.filteredRevenue}
              topProducts={hasProductsAccess ? topProducts : []}
            />
          ) : null}

          {safeActiveTab === "operations" && (hasOrdersAccess || hasProductsAccess) ? (
            <OperationsWidgets
              rangeLabel={rangeConfig.label}
              statusChartData={hasOrdersAccess ? analytics.statusChartData : []}
              recentOrders={hasOrdersAccess ? recentOrders : []}
              healthAlerts={healthAlerts}
              lowStockProducts={hasProductsAccess ? lowStockProducts : []}
              quickActions={quickActions}
            />
          ) : null}
        </>
      )}
    </div>
  );
}