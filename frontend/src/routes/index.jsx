import { Routes, Route, Navigate } from "react-router-dom";
import MarketingPage from "../pages/public/MarketingPage.jsx";
import LawyerSearch from "../pages/public/LawyerSearch.jsx";
import LawyerProfile from "../pages/public/LawyerProfile.jsx";
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import VerifyEmail from "../pages/auth/VerifyEmail.jsx";

import ClientDashboardLayout from "../pages/client/ClientDashboardLayout.jsx";
import ClientOverviewPage from "../pages/client/ClientOverviewPage.jsx";
import ClientBookingsPage from "../pages/client/ClientBookingsPage.jsx";
import ClientWalletPage from "../pages/client/ClientWalletPage.jsx";
import ClientReviewsPage from "../pages/client/ClientReviewsPage.jsx";
import ClientProfilePage from "../pages/client/ClientProfilePage.jsx";

import LawyerDashboardLayout from "../pages/lawyer/LawyerDashboardLayout.jsx";
import LawyerOverviewPage from "../pages/lawyer/LawyerOverviewPage.jsx";
import LawyerProfilePage from "../pages/lawyer/LawyerProfilePage.jsx";
import LawyerAvailabilityPage from "../pages/lawyer/LawyerAvailabilityPage.jsx";
import LawyerBookingsPage from "../pages/lawyer/LawyerBookingsPage.jsx";
import LawyerEarningsPage from "../pages/lawyer/LawyerEarningsPage.jsx";
import LawyerVerificationPage from "../pages/lawyer/LawyerVerificationPage.jsx";
import LawyerReviewsPage from "../pages/lawyer/LawyerReviewsPage.jsx";

import AdminDashboardLayout from "../pages/admin/AdminDashboardLayout.jsx";
import AdminOverviewPage from "../pages/admin/AdminOverviewPage.jsx";
import AdminLawyersPage from "../pages/admin/AdminLawyersPage.jsx";
import AdminUsersPage from "../pages/admin/AdminUsersPage.jsx";
import AdminBookingsPage from "../pages/admin/AdminBookingsPage.jsx";
import AdminVerificationPage from "../pages/admin/AdminVerificationPage.jsx";
import AdminDisputesPage from "../pages/admin/AdminDisputesPage.jsx";
import AdminSettingsPage from "../pages/admin/AdminSettingsPage.jsx";

import SessionChat from "../pages/client/SessionChat.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import AuthRoute from "./AuthRoute.jsx";

export default function RoutesRoot() {
  return (
    <Routes>
      <Route path="/" element={<MarketingPage />} />
      <Route path="/marketing" element={<MarketingPage />} />
      <Route path="/pricing" element={<MarketingPage />} />
      
      {/* Client Dashboard Routes */}
      <Route
        path="/client"
        element={
          <ProtectedRoute roles={["CLIENT"]}>
            <ClientDashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<ClientOverviewPage />} />
        <Route path="bookings" element={<ClientBookingsPage />} />
        <Route path="wallet" element={<ClientWalletPage />} />
        <Route path="reviews" element={<ClientReviewsPage />} />
        <Route path="profile" element={<ClientProfilePage />} />
        <Route path="dashboard" element={<Navigate to="/client/overview" replace />} />
      </Route>
      
      {/* Lawyer Dashboard Routes */}
      <Route
        path="/lawyer"
        element={
          <ProtectedRoute roles={["LAWYER"]}>
            <LawyerDashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<LawyerOverviewPage />} />
        <Route path="profile" element={<LawyerProfilePage />} />
        <Route path="availability" element={<LawyerAvailabilityPage />} />
        <Route path="bookings" element={<LawyerBookingsPage />} />
        <Route path="earnings" element={<LawyerEarningsPage />} />
        <Route path="verification" element={<LawyerVerificationPage />} />
        <Route path="reviews" element={<LawyerReviewsPage />} />
        <Route path="dashboard" element={<Navigate to="/lawyer/overview" replace />} />
      </Route>
      
      {/* Admin Dashboard Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminDashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<AdminOverviewPage />} />
        <Route path="lawyers" element={<AdminLawyersPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
        <Route path="verification" element={<AdminVerificationPage />} />
        <Route path="disputes" element={<AdminDisputesPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="dashboard" element={<Navigate to="/admin/overview" replace />} />
      </Route>
      
      {/* Public Lawyer Search/Profile */}
      <Route
        path="/lawyers"
        element={
          <ProtectedRoute>
            <LawyerSearch />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lawyers/:id"
        element={
          <ProtectedRoute>
            <LawyerProfile />
          </ProtectedRoute>
        }
      />

      {/* Auth Routes - Redirect authenticated users to dashboard */}
      <Route 
        path="/login" 
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <AuthRoute>
            <Register />
          </AuthRoute>
        } 
      />
      <Route 
        path="/verify-email" 
        element={
          <AuthRoute>
            <VerifyEmail />
          </AuthRoute>
        } 
      />

      {/* Chat Route */}
      <Route
        path="/chat/:bookingId"
        element={
          <ProtectedRoute roles={["CLIENT", "LAWYER"]}>
            <SessionChat />
          </ProtectedRoute>
        }
      />

      {/* 404 Route - Must be last */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
