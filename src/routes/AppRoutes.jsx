import React, { useEffect, useMemo, useState } from "react";
import {
  createBrowserRouter,
  Navigate,
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

import Root from "../pages/Root/Root";
import NotFound from "../pages/NotFound/NotFound";

import HomePage from "../pages/Home/HomePage";
import AboutUsPage from "../pages/Company/About/AboutUsPage";
import ContactUsPage from "../pages/Company/ContactUs/ContactUsPage";
import ShopPage from "../pages/Shop/ShopPage";
import CollectionsPage from "../pages/Collections/CollectionsPage";
import ProductDetailsPage from "../pages/ProductDetails/ProductDetailsPage";

import SignInPage from "../pages/Auth/SignInPage";
import SignUpPage from "../pages/Auth/SignUpPage";

import PublicOnlyRoute from "./PublicOnlyRoute";
import PrivateRoute from "./PrivateRoute";

// Account
import AccountLayout, {
  AccountOverviewPage,
} from "../modules/Account/pages/AccountDashboardPage";
import OrderHistoryPage from "../modules/Account/pages/OrderHistoryPage";
import OrderDetailsPage from "../modules/Account/pages/OrderDetailsPage";
import ProfileSettingsPage from "../modules/Account/pages/ProfileSettingsPage";

// Other pages
import CartPage from "../modules/Cart/pages/CartPage";
import ForgotPasswordPage from "../modules/Auth/pages/ForgotPasswordPage";
import TermsOfServicePage from "../pages/Legal/TermsOfServicePage";
import PrivacyPolicyPage from "../pages/Legal/PrivacyPolicyPage";

// Checkout
import CheckoutPage from "../modules/Checkout/pages/CheckoutPage";

// Admin
import AdminRoute from "./AdminRoute";
import AdminLayout from "../pages/Admin/AdminLayout";
import AdminOverviewPage from "../pages/Admin/AdminOverviewPage";
import AdminShopControlPage from "../pages/Admin/AdminShopControlPage";
import AdminProductsPage from "../pages/Admin/AdminProductsPage";
import AdminOrdersPage from "../pages/Admin/AdminOrdersPage";
import AdminAuditLogsPage from "../pages/Admin/AdminAuditLogsPage";
import AdminRolesPage from "../pages/Admin/AdminRolesPage";
import AdminCustomersPage from "../pages/Admin/AdminCustomersPage";
import AdminCategoriesPage from "../pages/Admin/AdminCategoriesPage";
import AdminInventoryPage from "../pages/Admin/AdminInventoryPage";
import AdminSettingsPage from "../pages/Admin/AdminSettingsPage";
import AdminHomeConfigPage from "../pages/Admin/AdminHomeConfigPage";
import AdminPromotionsPage from "../pages/Admin/AdminPromotionsPage";
import AdminNewsletterPage from "../pages/Admin/AdminNewsletterPage";
import AdminSupportPage from "../pages/Admin/AdminSupportPage";
import AdminContactControlPage from "../pages/Admin/AdminContactControlPage";
import AdminCollectionsControlPage from "../pages/Admin/AdminCollectionsControlPage";

import { useAuth } from "../shared/hooks/useAuth";
import api, { raw } from "../services/apiClient";

function normalizePermissions(user) {
  const list = Array.isArray(user?.permissions) ? user.permissions : [];
  const out = [];
  const seen = new Set();

  for (const rawValue of list) {
    const value = String(rawValue || "").trim().toLowerCase();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }

  return out;
}

function canAny({ userPerms, isSuper }, perms = []) {
  if (isSuper) return true;
  if (!Array.isArray(perms) || perms.length === 0) return true;
  if (userPerms.includes("*")) return true;

  return perms.some((perm) =>
    userPerms.includes(String(perm || "").trim().toLowerCase())
  );
}

function canMinLevel(roleLevel, minLevel) {
  const current = Number(roleLevel || 0);
  const target = Number(minLevel || 0);

  if (!Number.isFinite(target)) return true;
  return Number.isFinite(current) && current >= target;
}

function ForbiddenPage() {
  const location = useLocation();
  const from =
    typeof location?.state?.from === "string" && location.state.from.startsWith("/")
      ? location.state.from
      : "";

  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="container mx-auto px-6 py-10">
        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Access denied
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
            403 — Forbidden
          </h1>

          <p className="mt-2 max-w-2xl text-gray-600">
            You do not have permission to open this page. If this looks incorrect, sign in
            with the appropriate account or contact an administrator.
          </p>

          {from ? (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                Requested path
              </div>
              <div className="mt-1 break-all font-mono text-gray-900">{from}</div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              Go to home
            </Link>

            <Link
              to="/account"
              className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              Go to account
            </Link>

            <Link
              to="/signin"
              state={from ? { from } : undefined}
              className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPermissionRoute({
  children,
  requiresAny = [],
  minLevel = null,
  roles = [],
}) {
  const location = useLocation();
  const { user } = useAuth();

  const role = String(user?.role || "").toLowerCase();
  const roleLevel = Number(user?.roleLevel || 0);
  const userPerms = useMemo(() => normalizePermissions(user), [user]);

  const isSuper = role === "superadmin" || roleLevel >= 100 || userPerms.includes("*");

  const roleOk = Array.isArray(roles) && roles.length ? roles.includes(role) : true;
  const minLevelOk = minLevel != null ? canMinLevel(roleLevel, minLevel) : true;
  const permOk = canAny({ userPerms, isSuper }, requiresAny);

  if (!(roleOk && minLevelOk && permOk)) {
    return <Navigate to="/403" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function AdminNotFoundPage() {
  return (
    <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
        Admin
      </div>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
        Page not found
      </h1>

      <p className="mt-2 text-gray-600">
        The admin page you are trying to open does not exist or may have been moved.
      </p>

      <div className="mt-6">
        <Link
          to="/admin"
          className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
        >
          Go to admin overview
        </Link>
      </div>
    </div>
  );
}

function OrderConfirmationPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isAuthed = !!user;

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [order, setOrder] = useState(null);

  const phoneParam = String(searchParams.get("phone") || "").trim();

  function formatMoney(value) {
    const amount = Number(value || 0);
    if (Number.isNaN(amount)) return "৳0";
    return `৳${amount.toFixed(0)}`;
  }

  useEffect(() => {
    let alive = true;

    async function loadOrder() {
      setLoading(true);
      setErrorMessage("");
      setOrder(null);

      try {
        if (!id) {
          throw new Error("Missing order id");
        }

        if (isAuthed) {
          const response = await api.get(`/orders/${id}`);
          if (!alive) return;
          setOrder(response?.data || null);
          return;
        }

        if (!phoneParam) {
          if (alive) setLoading(false);
          return;
        }

        const response = await raw.get(`/orders/public/${id}`, {
          params: { phone: phoneParam },
        });

        if (!alive) return;
        setOrder(response?.data || null);
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to load order";

        if (!alive) return;
        setErrorMessage(String(message));
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadOrder();

    return () => {
      alive = false;
    };
  }, [id, isAuthed, phoneParam]);

  const status = String(order?.status || "pending").toLowerCase();

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
        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Order confirmation
              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                {order?._id ? "Thank you. Your order has been placed." : "Order details"}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700">
                  <ShieldCheck size={14} />
                  Secure
                </span>

                {order?._id ? (
                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs",
                      badgeClass,
                    ].join(" ")}
                  >
                    Status:
                    <span className="ml-1 font-semibold">{status}</span>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Continue shopping
              </Link>

              <Link
                to="/cart"
                className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                View cart
              </Link>
            </div>
          </div>

          <div className="mt-6">
            {!isAuthed ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5" size={18} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900">Guest order lookup</div>
                    <div className="mt-1 text-sm text-gray-600">
                      To view your order, enter the phone number used during checkout.
                    </div>

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <input
                        value={phoneParam}
                        onChange={(e) => {
                          const value = String(e.target.value || "");
                          const next = new URLSearchParams(searchParams);

                          if (value.trim()) next.set("phone", value);
                          else next.delete("phone");

                          setSearchParams(next, { replace: true });
                        }}
                        placeholder="01XXXXXXXXX"
                        className="input input-bordered w-full rounded-2xl border-gray-200 bg-white sm:max-w-xs"
                      />

                      <Link
                        to="/signin"
                        state={{
                          from: `/order-confirmation/${id}${
                            phoneParam ? `?phone=${encodeURIComponent(phoneParam)}` : ""
                          }`,
                        }}
                        className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-white"
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
            ) : errorMessage ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : !order?._id ? (
              <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700">
                Enter phone number for guest lookup, or sign in to view your order details.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-3 lg:col-span-8">
                  <div className="rounded-2xl border border-gray-200 p-5">
                    <div className="text-sm font-semibold text-gray-900">Items</div>

                    <div className="mt-3 space-y-3">
                      {(order.items || []).map((item, idx) => (
                        <div
                          key={`${item.title}-${idx}`}
                          className="flex items-center gap-3 rounded-2xl border border-gray-200 p-3"
                        >
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl border bg-gray-100">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-gray-900">
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              Qty: {item.qty} • {formatMoney(item.price)}
                            </div>
                          </div>

                          <div className="text-sm font-bold text-gray-900">
                            {formatMoney((item.price || 0) * (item.qty || 0))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 p-5">
                    <div className="text-sm font-semibold text-gray-900">Shipping</div>

                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      <div>
                        <span className="text-gray-500">Name:</span>{" "}
                        {order?.shippingAddress?.name || "-"}
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>{" "}
                        {order?.shippingAddress?.phone || "-"}
                      </div>
                      <div>
                        <span className="text-gray-500">Address:</span>{" "}
                        {order?.shippingAddress?.addressLine || "-"}
                      </div>
                      <div>
                        <span className="text-gray-500">City:</span>{" "}
                        {order?.shippingAddress?.city || "-"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 lg:col-span-4">
                  <div className="rounded-2xl border border-gray-200 p-5">
                    <div className="text-sm font-semibold text-gray-900">Summary</div>

                    <div className="mt-3 space-y-2 text-sm text-gray-700">
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
                      Your order has been recorded and is being processed.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-xs text-gray-600">
                    <div className="font-semibold text-gray-900">Tip</div>
                    <div className="mt-1">
                      Guest order lookup requires the phone number used during checkout. After
                      sign-in, you can review all orders from your account history.
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
      { path: "products/:id", Component: ProductDetailsPage },
      { path: "collections", Component: CollectionsPage },
      { path: "about", Component: AboutUsPage },
      { path: "contact", Component: ContactUsPage },

      { path: "cart", Component: CartPage },
      { path: "checkout", Component: CheckoutPage },
      { path: "order-confirmation/:id", Component: OrderConfirmationPage },

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

      { path: "*", Component: NotFound },
    ],
  },

  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: (
          <AdminPermissionRoute minLevel={1}>
            <AdminOverviewPage />
          </AdminPermissionRoute>
        ),
      },
      {
        path: "shop-control",
        element: (
          <AdminPermissionRoute minLevel={1}>
            <AdminShopControlPage />
          </AdminPermissionRoute>
        ),
      },
      {
        path: "products",
        element: (
          <AdminPermissionRoute requiresAny={["products:read", "products:write"]}>
            <AdminProductsPage />
          </AdminPermissionRoute>
        ),
      },
      {
        path: "orders",
        element: (
          <AdminPermissionRoute requiresAny={["orders:read", "orders:write"]}>
            <AdminOrdersPage />
          </AdminPermissionRoute>
        ),
      },
      {
        path: "customers",
        element: (
          <AdminPermissionRoute requiresAny={["users:read", "users:write"]}>
            <AdminCustomersPage />
          </AdminPermissionRoute>
        ),
      },
      {
        path: "categories",
        element: (
          <AdminPermissionRoute requiresAny={["products:read", "products:write"]}>
            <AdminCategoriesPage />
          </AdminPermissionRoute>
        ),
      },
      {
        path: "inventory",
        element: (
          <AdminPermissionRoute requiresAny={["products:read", "products:write"]}>
            <AdminInventoryPage />
          </AdminPermissionRoute>
        ),
      },
      {
        path: "promotions",
        element: (
          <AdminPermissionRoute requiresAny={["settings:write"]}>
            <AdminPromotionsPage />
          </AdminPermissionRoute>
        ),
      },
      {
        path: "newsletter",
        element: (
          <AdminPermissionRoute requiresAny={["newsletter:read", "newsletter:write"]}>
            <AdminNewsletterPage />
          </AdminPermissionRoute>
        ),
      },
      {
        path: "support",
        element: (
          <AdminPermissionRoute
            requiresAny={["users:read", "users:write", "orders:read"]}
          >
            <AdminSupportPage />
          </AdminPermissionRoute>
        ),
      },
      {
        path: "contact-control",
        element: (
          <AdminPermissionRoute requiresAny={["settings:read", "settings:write"]}>
            <AdminContactControlPage />
          </AdminPermissionRoute>
        ),
      },
      {
        path: "collections-control",
        element: (
          <AdminPermissionRoute requiresAny={["settings:read", "settings:write"]}>
            <AdminCollectionsControlPage />
          </AdminPermissionRoute>
        ),
      },
      {
        path: "home-config",
        element: (
          <AdminPermissionRoute requiresAny={["settings:read", "settings:write"]}>
            <AdminHomeConfigPage />
          </AdminPermissionRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <AdminPermissionRoute requiresAny={["settings:read", "settings:write"]}>
            <AdminSettingsPage />
          </AdminPermissionRoute>
        ),
      },
      {
        path: "roles",
        element: (
          <AdminPermissionRoute
            requiresAny={["users:read", "users:write"]}
            minLevel={20}
          >
            <AdminRolesPage />
          </AdminPermissionRoute>
        ),
      },
      {
        path: "audit-logs",
        element: (
          <AdminPermissionRoute requiresAny={["audit:read"]}>
            <AdminAuditLogsPage />
          </AdminPermissionRoute>
        ),
      },

      { path: "*", element: <AdminNotFoundPage /> },
    ],
  },
]);