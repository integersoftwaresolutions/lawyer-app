import {
  FiBriefcase,
  FiCreditCard,
  FiSettings,
  FiShield,
  FiUserPlus,
  FiUsers
} from "react-icons/fi";
import { PERMISSIONS, canAccessWorkspaceItem } from "./permissions";

/**
 * Declarative workspace admin nav.
 * Add a row here to extend — set `requireFirm` and/or `permissions` (AND).
 */
export const WORKSPACE_NAV_ITEMS = Object.freeze([
  {
    id: "overview",
    label: "Overview",
    icon: FiBriefcase
  },
  {
    id: "billing",
    label: "Billing",
    icon: FiCreditCard,
    to: "/lawyer/billing/subscription",
    anyPermissions: [PERMISSIONS.BILLING_VIEW, PERMISSIONS.BILLING_MANAGE]
  },
  {
    id: "members",
    label: "Members",
    icon: FiUsers,
    requireFirm: true,
    permissions: [PERMISSIONS.MEMBERS_VIEW]
  },
  {
    id: "roles",
    label: "Roles",
    icon: FiShield,
    requireFirm: true,
    permissions: [PERMISSIONS.ROLES_MANAGE]
  },
  {
    id: "invites",
    label: "Invites",
    icon: FiUserPlus,
    requireFirm: true,
    permissions: [PERMISSIONS.MEMBERS_INVITE]
  },
  {
    id: "profile",
    label: "Firm profile",
    icon: FiSettings,
    requireFirm: true,
    permissions: [PERMISSIONS.WORKSPACE_SETTINGS]
  }
]);

export function filterWorkspaceNavItems({ isFirm, permissions }) {
  return WORKSPACE_NAV_ITEMS.filter((item) =>
    canAccessWorkspaceItem(item, { isFirm, permissions })
  );
}

export function getWorkspaceNavItem(id) {
  return WORKSPACE_NAV_ITEMS.find((item) => item.id === id) || null;
}
