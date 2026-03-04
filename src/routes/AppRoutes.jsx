import React, { useEffect, useState } from "react";
import {
  createBrowserRouter,
  Navigate,
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

import Root from "../pages/Root/Root";
import NotFound from "../pages/NotFound/NotFound";

import HomePage from "../pages/Home/HomePage";
import AboutUsPage from "../pages/Company/About/AboutUsPage";
import ContactUsPage from "../pages/Company/ContactUs/ContactUsPage";
import ShopPage from "../pages/Shop/ShopPage";
import CollectionsPage from "../pages/Collections/CollectionsPage";

import SignInPage from "../pages/Auth/SignInPage";
import SignUpPage from "../pages/Auth/SignUpPage";

// ✅ IMPORTANT: named import (because PublicOnlyRoute.jsx has no default export)
import PublicOnlyRoute from "./PublicOnlyRoute";

import PrivateRoute from "./PrivateRoute";

// Account pages
import AccountLayout, {
  AccountOverviewPage,
} from "../modules/Account/pages/AccountDashboardPage";
import OrderHistoryPage from "../modules/Account/pages/OrderHistoryPage";
import OrderDetailsPage from "../modules/Account/pages/OrderDetailsPage";
import ProfileSettingsPage from "../modules/Account/pages/ProfileSettingsPage";

// Extra pages
import CartPage from "../modules/Cart/pages/CartPage";
import ForgotPasswordPage from "../modules/Auth/pages/ForgotPasswordPage";
import TermsOfServicePage from "../pages/Legal/TermsOfServicePage";
import PrivacyPolicyPage from "../pages/Legal/PrivacyPolicyPage";

// ✅ NEW: Checkout (LIVE)
import CheckoutPage from "../modules/Checkout/pages/CheckoutPage";

// ✅ Admin
import AdminRoute from "./AdminRoute";
import AdminLayout from "../pages/Admin/AdminLayout";
import AdminShopControlPage from "../pages/Admin/AdminShopControlPage";
import AdminProductsPage from "../pages/Admin/AdminProductsPage";
import AdminOrdersPage from "../pages/Admin/AdminOrdersPage";

// ✅ NEW: Audit Logs page (LIVE)
import AdminAuditLogsPage from "../pages/Admin/AdminAuditLogsPage";

// ✅ NEW: Roles & Permissions page (LIVE)
import AdminRolesPage from "../pages/Admin/AdminRolesPage";
import AdminCustomersPage from "../pages/Admin/AdminCustomersPage";
import AdminCategoriesPage from "../pages/Admin/AdminCategoriesPage";
import AdminInventoryPage from "../pages/Admin/AdminInventoryPage";

// ✅ NEW: Admin Settings page (LIVE)
import AdminSettingsPage from "../pages/Admin/AdminSettingsPage";

// ✅ NEW: auth + api for order confirmation
import { useAuth } from "../shared/hooks/useAuth";
import api, { raw } from "../services/apiClient";

/**
 * ✅ 403 Forbidden Page (Enterprise)
 * - shows the requested path if provided via state.from
 * - provides safe actions
 */
function ForbiddenPage() {
  const loc = useLocation();
  const from =
    typeof loc?.state?.from === "string" && loc.state.from.startsWith("/")
      ? loc.state.from
      : "";

  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="container mx-auto px-6 py-10">
        <div className="rounded-3xl border bg-white p-6 md:p-8 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500">
            Access denied
          </div>

          <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">
            403 — Forbidden
          </h1>

          <p className="mt-2 text-gray-600 max-w-2xl">
            You don’t have permission to access this page. If you believe this is a
            mistake, please sign in with the correct account or contact support.
          </p>

          {from ? (
            <div className="mt-4 rounded-2xl border bg-gray-50 p-4 text-sm">
              <div className="text-gray-500 text-xs uppercase tracking-wide">
                Requested
              </div>
              <div className="mt-1 font-mono text-gray-900 break-all">{from}</div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-900 transition"
            >
              Go to home
            </Link>

            <Link
              to="/account"
              className="inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition"
            >
              Go to account
            </Link>

            <Link
              to="/signin"
              state={from ? { from } : undefined}
              className="inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin placeholder pages (so menu never hits 404).
 * We will replace these with real enterprise modules step-by-step.
 */
function AdminComingSoonPage({ title = "Coming soon", description }) {
  return (
    <div className="bg-white border rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">Admin</div>

      <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">
        {title}
      </h1>

      <p className="mt-2 text-gray-600 max-w-2xl">
        {description ||
          "This module is in progress. We will enable full enterprise features here (filters, search, pagination, audit logs, and performance optimizations)."}
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-5 bg-gray-50">
          <div className="text-sm font-semibold">Planned features</div>
          <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
            <li>Fast list view with caching and pagination</li>
            <li>Debounced search and filters</li>
            <li>Bulk actions and validation</li>
            <li>Audit-ready admin logs</li>
          </ul>
        </div>

        <div className="rounded-2xl border p-5 bg-gray-50">
          <div className="text-sm font-semibold">UX standards</div>
          <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
            <li>Skeleton loading (no layout shift)</li>
            <li>Optimistic updates (smooth UI)</li>
            <li>Soft alerts/toasts</li>
            <li>Mobile-first responsive</li>
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <Link
          to="/admin"
          className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-900 transition"
        >
          Back to overview
        </Link>
      </div>
    </div>
  );
}

function AdminNotFoundPage() {
  return (
    <div className="bg-white border rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">Admin</div>
      <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">
        Page not found
      </h1>
      <p className="mt-2 text-gray-600">
        The page you’re trying to access doesn’t exist or has been moved.
      </p>
      <div className="mt-6">
        <Link
          to="/admin"
          className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-900 transition"
        >
          Go to admin overview
        </Link>
      </div>
    </div>
  );
}

/**
 * ✅ NEW: Enterprise Order Confirmation (works for authed + guest)
 * - authed: GET /orders/:id (api)
 * - guest:  GET /orders/public/:id?phone=... (raw)
 */
function OrderConfirmationPage() {
  const { id } = useParams();
  const [sp, setSp] = useSearchParams();
  const { user } = useAuth();
  const isAuthed = !!user;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [order, setOrder] = useState(null);

  const phoneParam = String(sp.get("phone") || "").trim();

  function formatMoney(n) {
    const v = Number(n || 0);
    if (Number.isNaN(v)) return "৳0";
    return `৳${v.toFixed(0)}`;
  }

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr("");
      setOrder(null);

      try {
        if (!id) throw new Error("Missing order id");

        if (isAuthed) {
          const res = await api.get(`/orders/${id}`);
          if (!alive) return;
          setOrder(res?.data || null);
          return;
        }

        // guest
        if (!phoneParam) {
          // wait for user input
          if (!alive) return;
          setLoading(false);
          return;
        }

        const res = await raw.get(`/orders/public/${id}`, { params: { phone: phoneParam } });
        if (!alive) return;
        setOrder(res?.data || null);
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Failed to load order";
        if (!alive) return;
        setErr(String(msg));
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id, isAuthed, phoneParam]);

  const status = String(order?.status || "pending");
  const badgeClass =
    status === "delivered"
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : status === "cancelled"
      ? "bg-red-50 border-red-200 text-red-700"
      : status === "shipped"
      ? "bg-blue-50 border-blue-200 text-blue-700"
      : status === "processing"
      ? "bg-amber-50 border-amber-200 text-amber-700"
      : status === "paid"
      ? "bg-green-50 border-green-200 text-green-700"
      : "bg-gray-50 border-gray-200 text-gray-700";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="container mx-auto px-6 py-10">
        <div className="rounded-3xl border bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Order confirmation
              </div>
              <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">
                {order?._id ? "Thank you! Your order is placed." : "Order details"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs bg-gray-50 text-gray-700">
                  <ShieldCheck size={14} /> Secure
                </span>

                {order?._id ? (
                  <span className={["inline-flex items-center rounded-full border px-3 py-1 text-xs", badgeClass].join(" ")}>
                    Status: <span className="ml-1 font-semibold">{status}</span>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition"
              >
                Continue shopping
              </Link>
              <Link
                to="/cart"
                className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-900 transition"
              >
                View cart
              </Link>
            </div>
          </div>

          <div className="mt-6">
            {!isAuthed ? (
              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5" size={18} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900">
                      Guest order lookup
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      আপনার অর্ডার দেখতে checkout এ দেওয়া <span className="font-semibold">Phone</span> দিন।
                    </div>

                    <div className="mt-3 flex flex-col sm:flex-row gap-3">
                      <input
                        value={phoneParam}
                        onChange={(e) => {
                          const v = String(e.target.value || "");
                          const next = new URLSearchParams(sp);
                          if (v.trim()) next.set("phone", v);
                          else next.delete("phone");
                          setSp(next, { replace: true });
                        }}
                        placeholder="01XXXXXXXXX"
                        className="input input-bordered w-full sm:max-w-xs rounded-2xl bg-white border-gray-200"
                      />
                      <Link
                        to="/signin"
                        state={{ from: `/order-confirmation/${id}${phoneParam ? `?phone=${encodeURIComponent(phoneParam)}` : ""}` }}
                        className="inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-white transition"
                      >
                        Sign in instead
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {loading ? (
              <div className="mt-6 flex items-center gap-2 text-gray-600">
                <Loader2 size={18} className="animate-spin" />
                Loading order...
              </div>
            ) : err ? (
              <div className="mt-6 rounded-2xl border bg-red-50 p-4 text-sm text-red-700">
                {err}
              </div>
            ) : !order?._id ? (
              <div className="mt-6 rounded-2xl border bg-gray-50 p-6 text-sm text-gray-700">
                Enter phone (guest) or sign in to view order details.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-3">
                  <div className="rounded-2xl border p-5">
                    <div className="text-sm font-semibold text-gray-900">Items</div>
                    <div className="mt-3 space-y-3">
                      {(order.items || []).map((it, idx) => (
                        <div key={`${it.title}-${idx}`} className="flex items-center gap-3 rounded-2xl border p-3">
                          <div className="w-12 h-12 rounded-2xl bg-gray-100 border overflow-hidden flex-shrink-0">
                            {it.image ? (
                              <img src={it.image} alt={it.title} className="w-full h-full object-cover" loading="lazy" />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-900 truncate">{it.title}</div>
                            <div className="text-xs text-gray-500">
                              Qty: {it.qty} • {formatMoney(it.price)}
                            </div>
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            {formatMoney((it.price || 0) * (it.qty || 0))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border p-5">
                    <div className="text-sm font-semibold text-gray-900">Shipping</div>
                    <div className="mt-3 text-sm text-gray-700 space-y-1">
                      <div><span className="text-gray-500">Name:</span> {order?.shippingAddress?.name || "-"}</div>
                      <div><span className="text-gray-500">Phone:</span> {order?.shippingAddress?.phone || "-"}</div>
                      <div><span className="text-gray-500">Address:</span> {order?.shippingAddress?.addressLine || "-"}</div>
                      <div><span className="text-gray-500">City:</span> {order?.shippingAddress?.city || "-"}</div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-3">
                  <div className="rounded-2xl border p-5">
                    <div className="text-sm font-semibold text-gray-900">Summary</div>
                    <div className="mt-3 text-sm text-gray-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-semibold">{formatMoney(order.subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Shipping</span>
                        <span className="font-semibold">{formatMoney(order.shipping || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Discount</span>
                        <span className="font-semibold">{formatMoney(order.discount || 0)}</span>
                      </div>
                      <div className="h-px bg-gray-100" />
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold">{formatMoney(order.total)}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle2 size={14} />
                      Your order is recorded and being processed.
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-gray-50 p-5 text-xs text-gray-600">
                    <div className="font-semibold text-gray-900">Tip</div>
                    <div className="mt-1">
                      Guest order হলে এই page দেখতে আপনার phone লাগবে। Sign in করলে order history তে সব দেখবেন।
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const AppRoutes = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    errorElement: <NotFound />,
    children: [
      { index: true, Component: HomePage },

      { path: "shop", Component: ShopPage },
      { path: "collections", Component: CollectionsPage },
      { path: "about", Component: AboutUsPage },
      { path: "contact", Component: ContactUsPage },

      { path: "cart", Component: CartPage },

      // ✅ NEW: Checkout + Confirmation (LIVE)
      { path: "checkout", Component: CheckoutPage },
      { path: "order-confirmation/:id", Component: OrderConfirmationPage },

      // ✅ Enterprise: Forbidden route
      { path: "403", element: <ForbiddenPage /> },

      {
        path: "signin",
        element: (
          <PublicOnlyRoute>
            <SignInPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: "signup",
        element: (
          <PublicOnlyRoute>
            <SignInPage /> {/* ✅ keep as-is? (আপনার কোডে SignUpPage ছিল, সেটা রাখা হলো নিচে) */}
          </PublicOnlyRoute>
        ),
      },
      {
        path: "signup",
        element: (
          <PublicOnlyRoute>
            <SignUpPage />
          </PublicOnlyRoute>
        ),
      },

      { path: "forgot-password", Component: ForgotPasswordPage },
      { path: "terms", Component: TermsOfServicePage },
      { path: "privacy", Component: PrivacyPolicyPage },

      {
        path: "settings",
        element: (
          <PrivateRoute>
            <Navigate to="/account/profile" replace />
          </PrivateRoute>
        ),
      },

      {
        path: "account",
        element: (
          <PrivateRoute>
            <AccountLayout />
          </PrivateRoute>
        ),
        children: [
          { index: true, Component: AccountOverviewPage },
          { path: "orders", Component: OrderHistoryPage },
          { path: "orders/:id", Component: OrderDetailsPage },
          { path: "profile", Component: ProfileSettingsPage },
        ],
      },

      // Root wildcard (nice 404 inside Root shell)
      { path: "*", Component: NotFound },
    ],
  },

  // ✅ Admin routes (separate layout)
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    errorElement: <NotFound />,
    children: [
      { index: true, Component: AdminShopControlPage },
      { path: "products", Component: AdminProductsPage },

      // ✅ NOW REAL: Admin Orders (server connected)
      { path: "orders", Component: AdminOrdersPage },

      // ✅ Placeholder modules so Admin menu never 404
      { path: "customers", Component: AdminCustomersPage },
      { path: "categories", Component: AdminCategoriesPage },
      { path: "inventory", Component: AdminInventoryPage },
      {
        path: "promotions",
        element: (
          <AdminComingSoonPage
            title="Promotions"
            description="Coupons, discounts, campaigns and pricing rules."
          />
        ),
      },
      {
        path: "support",
        element: (
          <AdminComingSoonPage
            title="Support"
            description="Support inbox, tickets and customer service workflows."
          />
        ),
      },

      // ✅ UPDATED: Settings is now LIVE
      { path: "settings", Component: AdminSettingsPage },

      // ✅ UPDATED: Roles & Permissions is now LIVE
      { path: "roles", Component: AdminRolesPage },

      // ✅ UPDATED: Audit Logs is now LIVE
      { path: "audit-logs", Component: AdminAuditLogsPage },

      // Admin wildcard
      { path: "*", element: <AdminNotFoundPage /> },
    ],
  },
]);
