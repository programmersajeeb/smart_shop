import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import Root from "../pages/Root/Root";
import NotFound from "../pages/NotFound/NotFound";

import HomePage from "../pages/Home/HomePage";
import AboutUsPage from "../pages/Company/About/AboutUsPage";
import ContactUsPage from "../pages/Company/ContactUs/ContactUsPage";
import ShopPage from "../pages/Shop/ShopPage";
import CollectionsPage from "../pages/Collections/CollectionsPage";

import SignInPage from "../pages/Auth/SignInPage";
import SignUpPage from "../pages/Auth/SignUpPage";

import PublicOnlyRoute from "./PublicOnlyRoute";
import PrivateRoute from "./PrivateRoute";

// Account pages
import AccountLayout, {
  AccountOverviewPage,
} from "../modules/Account/pages/AccountDashboardPage";
import OrderHistoryPage from "../modules/Account/pages/OrderHistoryPage";
import OrderDetailsPage from "../modules/Account/pages/OrderDetailsPage";
import ProfileSettingsPage from "../modules/Account/pages/ProfileSettingsPage";

// Extra pages to avoid 404 from Header/Auth links
import CartPage from "../modules/Cart/pages/CartPage";
import ForgotPasswordPage from "../modules/Auth/pages/ForgotPasswordPage";
import TermsOfServicePage from "../pages/Legal/TermsOfServicePage";
import PrivacyPolicyPage from "../pages/Legal/PrivacyPolicyPage";

export const AppRoutes = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    errorElement: <NotFound />,
    children: [
      // Home: Loader removed (HomePage uses React Query and shows skeletons)
      { index: true, Component: HomePage },

      // Public pages
      { path: "shop", Component: ShopPage },
      { path: "collections", Component: CollectionsPage },
      { path: "about", Component: AboutUsPage },
      { path: "contact", Component: ContactUsPage },

      // Cart (Header uses /cart)
      { path: "cart", Component: CartPage },

      // Auth pages (blocked for logged-in users)
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

      // Forgot password (SignIn uses /forgot-password)
      { path: "forgot-password", Component: ForgotPasswordPage },

      // Legal pages (SignIn/SignUp links)
      { path: "terms", Component: TermsOfServicePage },
      { path: "privacy", Component: PrivacyPolicyPage },

      // Settings shortcut (Header uses /settings)
      {
        path: "settings",
        element: (
          <PrivateRoute>
            <Navigate to="/account/profile" replace />
          </PrivateRoute>
        ),
      },

      // Account (Protected)
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
    ],
  },
]);
