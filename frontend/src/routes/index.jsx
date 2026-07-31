import { Routes, Route, Navigate } from "react-router-dom";
import MarketingPage from "../pages/public/MarketingPage.jsx";
import LawyerSearch from "../pages/public/LawyerSearch.jsx";
import LawyerProfile from "../pages/public/LawyerProfile.jsx";
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import VerifyEmail from "../pages/auth/VerifyEmail.jsx";
import ForgotPassword from "../pages/auth/ForgotPassword.jsx";
import { AccountSettingsLayout, WorkspaceSettingsLayout } from "../components/layout";
import SecuritySettingsPage from "../pages/settings/SecuritySettingsPage.jsx";
import NotificationSettingsPage from "../pages/settings/NotificationSettingsPage.jsx";

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
import LawyerAiAssistantPage from "../pages/lawyer/LawyerAiAssistantPage.jsx";
import LawyerCrossExamPage from "../pages/lawyer/LawyerCrossExamPage.jsx";
import LawyerDocumentsPage from "../pages/lawyer/LawyerDocumentsPage.jsx";
import LawyerCasesPage from "../pages/lawyer/LawyerCasesPage.jsx";
import LawyerCaseDetailPage from "../pages/lawyer/LawyerCaseDetailPage.jsx";
import LawyerPlannerPage from "../pages/lawyer/LawyerPlannerPage.jsx";
import WorkspaceOverviewPage from "../pages/lawyer/workspace/WorkspaceOverviewPage.jsx";
import WorkspaceMembersPage from "../pages/lawyer/workspace/WorkspaceMembersPage.jsx";
import WorkspaceRolesPage from "../pages/lawyer/workspace/WorkspaceRolesPage.jsx";
import WorkspaceInvitesPage from "../pages/lawyer/workspace/WorkspaceInvitesPage.jsx";
import WorkspaceProfilePage from "../pages/lawyer/workspace/WorkspaceProfilePage.jsx";
import RequirePermission from "../components/workspace/RequirePermission.jsx";
import { PERMISSIONS } from "../workspaces/permissions.js";
import AdminWorkspacesPage from "../pages/admin/AdminWorkspacesPage.jsx";

import AdminDashboardLayout from "../pages/admin/AdminDashboardLayout.jsx";
import AdminOverviewPage from "../pages/admin/AdminOverviewPage.jsx";
import AdminLawyersPage from "../pages/admin/AdminLawyersPage.jsx";
import AdminUsersPage from "../pages/admin/AdminUsersPage.jsx";
import AdminBookingsPage from "../pages/admin/AdminBookingsPage.jsx";
import AdminVerificationPage from "../pages/admin/AdminVerificationPage.jsx";
import AdminDisputesPage from "../pages/admin/AdminDisputesPage.jsx";
import AdminSettingsPage from "../pages/admin/AdminSettingsPage.jsx";
import AdminCaseLawPage from "../pages/admin/AdminCaseLawPage.jsx";

import SessionChat from "../pages/client/SessionChat.jsx";
import NotificationsPage from "../components/notifications/NotificationsPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import AuthRoute from "./AuthRoute.jsx";
import VerifyEmailRoute from "./VerifyEmailRoute.jsx";
import LandingRoute from "./LandingRoute.jsx";

export default function RoutesRoot() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingRoute>
            <MarketingPage />
          </LandingRoute>
        }
      />
      <Route
        path="/marketing"
        element={
          <LandingRoute>
            <MarketingPage />
          </LandingRoute>
        }
      />
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
        <Route path="profile" element={<Navigate to="/client/settings/profile" replace />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="dashboard" element={<Navigate to="/client/overview" replace />} />
      </Route>

      <Route
        path="/client/settings"
        element={
          <ProtectedRoute roles={["CLIENT"]}>
            <AccountSettingsLayout basePath="/client/settings" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<ClientProfilePage />} />
        <Route path="security" element={<SecuritySettingsPage />} />
        <Route path="notifications" element={<NotificationSettingsPage />} />
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
        <Route
          path="ai"
          element={
            <RequirePermission permissions={[PERMISSIONS.AI_USE]} redirectTo="/lawyer/overview">
              <LawyerAiAssistantPage />
            </RequirePermission>
          }
        />
        <Route
          path="cross-exam"
          element={
            <RequirePermission permissions={[PERMISSIONS.AI_USE]} redirectTo="/lawyer/overview">
              <LawyerCrossExamPage />
            </RequirePermission>
          }
        />
        <Route
          path="documents"
          element={
            <RequirePermission permissions={[PERMISSIONS.DOCS_VIEW]} redirectTo="/lawyer/overview">
              <LawyerDocumentsPage />
            </RequirePermission>
          }
        />
        <Route
          path="cases"
          element={
            <RequirePermission permissions={[PERMISSIONS.CASES_VIEW]} redirectTo="/lawyer/overview">
              <LawyerCasesPage />
            </RequirePermission>
          }
        />
        <Route
          path="cases/:caseId"
          element={
            <RequirePermission permissions={[PERMISSIONS.CASES_VIEW]} redirectTo="/lawyer/overview">
              <LawyerCaseDetailPage />
            </RequirePermission>
          }
        />
        <Route path="planner" element={<LawyerPlannerPage />} />
        <Route path="profile" element={<Navigate to="/lawyer/settings/profile" replace />} />
        <Route path="availability" element={<LawyerAvailabilityPage />} />
        <Route path="bookings" element={<LawyerBookingsPage />} />
        <Route path="earnings" element={<LawyerEarningsPage />} />
        <Route path="verification" element={<LawyerVerificationPage />} />
        <Route path="reviews" element={<LawyerReviewsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="dashboard" element={<Navigate to="/lawyer/overview" replace />} />
      </Route>

      <Route
        path="/lawyer/workspace"
        element={
          <ProtectedRoute roles={["LAWYER"]}>
            <WorkspaceSettingsLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<WorkspaceOverviewPage />} />
        <Route
          path="members"
          element={
            <RequirePermission requireFirm permissions={[PERMISSIONS.MEMBERS_VIEW]}>
              <WorkspaceMembersPage />
            </RequirePermission>
          }
        />
        <Route
          path="roles"
          element={
            <RequirePermission requireFirm permissions={[PERMISSIONS.ROLES_MANAGE]}>
              <WorkspaceRolesPage />
            </RequirePermission>
          }
        />
        <Route
          path="invites"
          element={
            <RequirePermission requireFirm permissions={[PERMISSIONS.MEMBERS_INVITE]}>
              <WorkspaceInvitesPage />
            </RequirePermission>
          }
        />
        <Route
          path="profile"
          element={
            <RequirePermission requireFirm permissions={[PERMISSIONS.WORKSPACE_SETTINGS]}>
              <WorkspaceProfilePage />
            </RequirePermission>
          }
        />
        <Route path="settings" element={<Navigate to="../profile" replace />} />
      </Route>

      <Route
        path="/lawyer/settings"
        element={
          <ProtectedRoute roles={["LAWYER"]}>
            <AccountSettingsLayout basePath="/lawyer/settings" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<LawyerProfilePage />} />
        <Route path="security" element={<SecuritySettingsPage />} />
        <Route path="notifications" element={<NotificationSettingsPage />} />
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
        <Route path="workspaces" element={<AdminWorkspacesPage />} />
        <Route path="lawyers" element={<AdminLawyersPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
        <Route path="verification" element={<AdminVerificationPage />} />
        <Route path="disputes" element={<AdminDisputesPage />} />
        <Route path="case-law" element={<AdminCaseLawPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="dashboard" element={<Navigate to="/admin/overview" replace />} />
        <Route path="account" element={<Navigate to="/admin/account/security" replace />} />
      </Route>

      <Route
        path="/admin/account"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AccountSettingsLayout basePath="/admin/account" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="security" replace />} />
        <Route path="security" element={<SecuritySettingsPage />} />
        <Route path="notifications" element={<NotificationSettingsPage />} />
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
          <VerifyEmailRoute>
            <VerifyEmail />
          </VerifyEmailRoute>
        } 
      />
      <Route 
        path="/forgot-password" 
        element={<ForgotPassword />}
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
