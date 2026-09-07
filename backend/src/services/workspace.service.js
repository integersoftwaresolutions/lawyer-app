import crypto from "crypto";
import { ApiError } from "../helpers/apiError.js";
import {
  WORKSPACE_TYPES,
  MEMBERSHIP_STATUS,
  WORKSPACE_INVITE_STATUS,
  WORKSPACE_LIMITS,
  WORKSPACE_AUDIT_ACTIONS,
  BUILTIN_ROLE_KEYS
} from "../config/constants.js";
import { BUILTIN_ROLE_PRESETS, sanitizePermissionKeys } from "../workspaces/permissions.catalog.js";
import Workspace from "../models/Workspace.js";
import Membership from "../models/Membership.js";
import Role from "../models/Role.js";
import WorkspaceInvite from "../models/WorkspaceInvite.js";
import WorkspaceAuditLog from "../models/WorkspaceAuditLog.js";
import User from "../models/User.js";
import { listResult, getPagination } from "../utils/pagination.js";
import { parseListQuery } from "../utils/listQuery.js";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueFirmSlug(baseName) {
  let base = slugify(baseName) || "firm";
  let candidate = base;
  let i = 0;
  while (await Workspace.exists({ slug: candidate, deletedAt: null })) {
    i += 1;
    candidate = `${base}-${i}`;
  }
  return candidate;
}

export async function writeAudit({ workspaceId, actorUserId, action, meta = {} }) {
  await WorkspaceAuditLog.create({
    workspaceId,
    actorUserId: actorUserId || null,
    action,
    meta
  });
}

/**
 * Create PERSONAL workspace + owner membership for a new lawyer.
 * Call inside registration after User + LawyerProfile exist.
 */
export async function bootstrapPersonalWorkspace(userId, { fullName, email } = {}) {
  const name = fullName?.trim() || (email ? `${email.split("@")[0]}'s Practice` : "My Practice");

  const workspace = await Workspace.create({
    type: WORKSPACE_TYPES.PERSONAL,
    name,
    slug: null,
    ownerUserId: userId
  });

  await Membership.create({
    workspaceId: workspace._id,
    userId,
    isOwner: true,
    roleId: null,
    status: MEMBERSHIP_STATUS.ACTIVE,
    lastActiveAt: new Date()
  });

  await User.findByIdAndUpdate(userId, { activeWorkspaceId: workspace._id });

  const { startPersonalTrial } = await import("../billing/subscription.service.js");
  await startPersonalTrial(workspace._id);

  return workspace;
}

async function seedFirmBuiltinRoles(workspaceId) {
  const roles = [];
  for (const preset of Object.values(BUILTIN_ROLE_PRESETS)) {
    const role = await Role.create({
      workspaceId,
      key: preset.key,
      name: preset.name,
      permissions: [...preset.permissions],
      isSystem: false,
      isBuiltin: true
    });
    roles.push(role);
  }
  return roles;
}

function formatWorkspace(ws, membership = null, role = null, permissions = null) {
  return {
    id: ws._id,
    type: ws.type,
    name: ws.name,
    slug: ws.slug,
    ownerUserId: ws.ownerUserId,
    logoMediaId: ws.logoMediaId,
    address: ws.address,
    phone: ws.phone,
    website: ws.website,
    practiceAreas: ws.practiceAreas,
    city: ws.city,
    description: ws.description,
    planId: ws.planId,
    seatLimit: ws.seatLimit,
    createdAt: ws.createdAt,
    updatedAt: ws.updatedAt,
    membership: membership
      ? {
          id: membership._id,
          isOwner: membership.isOwner,
          roleId: membership.roleId,
          status: membership.status,
          lastActiveAt: membership.lastActiveAt,
          role: role
            ? { id: role._id, key: role.key, name: role.name, isBuiltin: role.isBuiltin }
            : null,
          permissions: permissions || []
        }
      : undefined
  };
}

export async function listMyWorkspaces(userId) {
  const memberships = await Membership.find({
    userId,
    status: MEMBERSHIP_STATUS.ACTIVE,
    deletedAt: null
  }).lean();

  if (!memberships.length) return [];

  const workspaceIds = memberships.map((m) => m.workspaceId);
  const workspaces = await Workspace.find({
    _id: { $in: workspaceIds },
    deletedAt: null
  }).lean();

  const roleIds = memberships.map((m) => m.roleId).filter(Boolean);
  const roles = roleIds.length
    ? await Role.find({ _id: { $in: roleIds }, deletedAt: null }).lean()
    : [];
  const roleMap = Object.fromEntries(roles.map((r) => [String(r._id), r]));

  const { expandPermissions } = await import("../workspaces/permissions.catalog.js");

  return workspaces
    .map((ws) => {
      const membership = memberships.find((m) => String(m.workspaceId) === String(ws._id));
      if (!membership) return null;
      const role = membership.roleId ? roleMap[String(membership.roleId)] : null;
      const permissions = expandPermissions({ isOwner: membership.isOwner, role });
      return formatWorkspace(ws, membership, role, permissions);
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.type === WORKSPACE_TYPES.PERSONAL) return -1;
      if (b.type === WORKSPACE_TYPES.PERSONAL) return 1;
      return a.name.localeCompare(b.name);
    });
}

export async function getActiveMembership(userId, workspaceId) {
  const membership = await Membership.findOne({
    workspaceId,
    userId,
    status: MEMBERSHIP_STATUS.ACTIVE,
    deletedAt: null
  }).lean();
  if (!membership) return null;

  const workspace = await Workspace.findOne({ _id: workspaceId, deletedAt: null }).lean();
  if (!workspace) return null;

  let role = null;
  if (membership.roleId) {
    role = await Role.findOne({ _id: membership.roleId, deletedAt: null }).lean();
  }

  const { expandPermissions } = await import("../workspaces/permissions.catalog.js");
  const permissions = expandPermissions({ isOwner: membership.isOwner, role });

  return { workspace, membership, role, permissions };
}

export async function activateWorkspace(userId, workspaceId) {
  const ctx = await getActiveMembership(userId, workspaceId);
  if (!ctx) throw new ApiError(403, "You are not a member of this workspace");

  await Membership.updateOne(
    { _id: ctx.membership._id },
    { $set: { lastActiveAt: new Date() } }
  );
  await User.findByIdAndUpdate(userId, { activeWorkspaceId: workspaceId });

  return formatWorkspace(ctx.workspace, { ...ctx.membership, lastActiveAt: new Date() }, ctx.role, ctx.permissions);
}

export async function createFirm(userId, body = {}) {
  const name = String(body.name || "").trim();
  if (!name) throw new ApiError(400, "Firm name is required");

  const ownedCount = await Workspace.countDocuments({
    ownerUserId: userId,
    type: WORKSPACE_TYPES.FIRM,
    deletedAt: null
  });
  if (ownedCount >= WORKSPACE_LIMITS.MAX_OWNED_FIRMS) {
    throw new ApiError(400, `You can own at most ${WORKSPACE_LIMITS.MAX_OWNED_FIRMS} firms`);
  }

  const firmMemberships = await Membership.find({
    userId,
    status: MEMBERSHIP_STATUS.ACTIVE,
    deletedAt: null
  }).lean();
  const firmWsIds = firmMemberships.map((m) => m.workspaceId);
  const firmCount = await Workspace.countDocuments({
    _id: { $in: firmWsIds },
    type: WORKSPACE_TYPES.FIRM,
    deletedAt: null
  });
  if (firmCount >= WORKSPACE_LIMITS.MAX_OWNED_FIRMS + WORKSPACE_LIMITS.MAX_JOINED_FIRMS) {
    throw new ApiError(400, "Firm membership limit reached");
  }

  const slug = body.slug ? slugify(body.slug) : await uniqueFirmSlug(name);
  if (await Workspace.exists({ slug, deletedAt: null })) {
    throw new ApiError(409, "Firm slug already taken");
  }

  const { isStripeConfigured } = await import("../billing/providers/stripe.provider.js");
  const { createFirmCheckout } = await import("../billing/subscription.service.js");
  const { env } = await import("../config/env.js");

  if (isStripeConfigured() && !body.skipCheckout) {
    const base = env.appBaseUrl || env.clientOrigin;
    const checkout = await createFirmCheckout({
      actorUserId: userId,
      firmPayload: { ...body, name, slug },
      successUrl: `${base}/lawyer/billing?firmCheckout=success`,
      cancelUrl: `${base}/lawyer/billing?firmCheckout=cancel`
    });
    if (checkout?.checkoutUrl) {
      return {
        requiresCheckout: true,
        checkoutUrl: checkout.checkoutUrl,
        sessionId: checkout.sessionId
      };
    }
  }

  // Dev / no Stripe: create firm with manual Firm plan
  return finalizeFirmCreate(userId, {
    name,
    slug,
    address: body.address || "",
    phone: body.phone || "",
    website: body.website || "",
    practiceAreas: Array.isArray(body.practiceAreas) ? body.practiceAreas : [],
    city: body.city || "",
    description: body.description || "",
    logoMediaId: body.logoMediaId || null
  });
}

async function finalizeFirmCreate(userId, firm, billing = {}) {
  const workspace = await Workspace.create({
    type: WORKSPACE_TYPES.FIRM,
    name: firm.name,
    slug: firm.slug,
    ownerUserId: userId,
    address: firm.address || "",
    phone: firm.phone || "",
    website: firm.website || "",
    practiceAreas: Array.isArray(firm.practiceAreas) ? firm.practiceAreas : [],
    city: firm.city || "",
    description: firm.description || "",
    logoMediaId: firm.logoMediaId || null,
    planId: "firm",
    seatLimit: billing.seatLimit ?? 10
  });

  await seedFirmBuiltinRoles(workspace._id);

  await Membership.create({
    workspaceId: workspace._id,
    userId,
    isOwner: true,
    roleId: null,
    status: MEMBERSHIP_STATUS.ACTIVE,
    lastActiveAt: new Date()
  });

  await writeAudit({
    workspaceId: workspace._id,
    actorUserId: userId,
    action: WORKSPACE_AUDIT_ACTIONS.FIRM_CREATED,
    meta: { name: firm.name, slug: firm.slug }
  });

  const { PLAN_KEYS, getPlanDefinition } = await import("../billing/planCatalog.js");
  const { ensureSubscription, applyStripeSubscription, adminGrantPlan } = await import(
    "../billing/subscription.service.js"
  );
  const { stripeBillingProvider } = await import("../billing/providers/stripe.provider.js");

  if (billing.stripeSubscriptionId) {
    const stripeSub = await stripeBillingProvider.retrieveSubscription(billing.stripeSubscriptionId);
    if (stripeSub) {
      const sub = await ensureSubscription(workspace._id);
      if (billing.stripeCustomerId) {
        sub.stripeCustomerId = billing.stripeCustomerId;
        await sub.save();
      }
      await applyStripeSubscription(workspace._id, stripeSub, {
        planKey: PLAN_KEYS.FIRM,
        stripeCustomerId: billing.stripeCustomerId
      });
    }
  } else {
    await adminGrantPlan({
      workspaceId: workspace._id,
      planKey: PLAN_KEYS.FIRM,
      adminUserId: userId,
      reason: billing.reason || "firm_create_manual",
      seatLimit: getPlanDefinition(PLAN_KEYS.FIRM).limits["seats"]
    });
  }

  const { expandPermissions } = await import("../workspaces/permissions.catalog.js");
  return formatWorkspace(
    workspace.toObject(),
    {
      isOwner: true,
      roleId: null,
      status: MEMBERSHIP_STATUS.ACTIVE,
      lastActiveAt: new Date()
    },
    null,
    expandPermissions({ isOwner: true, role: null })
  );
}

/**
 * Called from Stripe webhook after Firm Checkout completes.
 */
export async function createFirmFromBillingCheckout({
  actorUserId,
  stripeCustomerId,
  stripeSubscriptionId,
  firm
}) {
  const name = String(firm.name || "").trim();
  if (!name) throw new ApiError(400, "Firm name missing from checkout metadata");

  let slug = firm.slug ? slugify(firm.slug) : await uniqueFirmSlug(name);
  if (await Workspace.exists({ slug, deletedAt: null })) {
    slug = await uniqueFirmSlug(name);
  }

  return finalizeFirmCreate(actorUserId, {
    name,
    slug,
    address: firm.address || "",
    phone: firm.phone || "",
    website: firm.website || "",
    practiceAreas: firm.practiceAreas || [],
    city: firm.city || "",
    description: firm.description || ""
  }, {
    stripeCustomerId,
    stripeSubscriptionId,
    reason: "stripe_firm_checkout"
  });
}

export async function updateFirm(userId, workspaceId, body = {}) {
  const ctx = await getActiveMembership(userId, workspaceId);
  if (!ctx) throw new ApiError(403, "Not a member");
  if (ctx.workspace.type !== WORKSPACE_TYPES.FIRM) {
    throw new ApiError(400, "Only firm workspaces have editable firm profiles");
  }

  const { hasPermission, PERMISSIONS } = await import("../workspaces/permissions.catalog.js");
  if (!hasPermission(ctx.permissions, PERMISSIONS.WORKSPACE_SETTINGS) && !ctx.membership.isOwner) {
    throw new ApiError(403, "Missing permission: workspace.settings");
  }

  const updates = {};
  if (body.name != null) updates.name = String(body.name).trim();
  if (body.address != null) updates.address = String(body.address);
  if (body.phone != null) updates.phone = String(body.phone);
  if (body.website != null) updates.website = String(body.website);
  if (body.city != null) updates.city = String(body.city);
  if (body.description != null) updates.description = String(body.description);
  if (body.practiceAreas != null) {
    updates.practiceAreas = Array.isArray(body.practiceAreas) ? body.practiceAreas : [];
  }
  if (body.logoMediaId !== undefined) updates.logoMediaId = body.logoMediaId || null;
  if (body.slug != null) {
    const slug = slugify(body.slug);
    if (!slug) throw new ApiError(400, "Invalid slug");
    const clash = await Workspace.exists({
      slug,
      deletedAt: null,
      _id: { $ne: workspaceId }
    });
    if (clash) throw new ApiError(409, "Firm slug already taken");
    updates.slug = slug;
  }

  const workspace = await Workspace.findOneAndUpdate(
    { _id: workspaceId, deletedAt: null },
    { $set: updates },
    { new: true }
  ).lean();

  await writeAudit({
    workspaceId,
    actorUserId: userId,
    action: WORKSPACE_AUDIT_ACTIONS.FIRM_UPDATED,
    meta: { fields: Object.keys(updates) }
  });

  return formatWorkspace(workspace, ctx.membership, ctx.role, ctx.permissions);
}

export async function getWorkspaceDetail(userId, workspaceId) {
  const ctx = await getActiveMembership(userId, workspaceId);
  if (!ctx) throw new ApiError(403, "Not a member");
  return formatWorkspace(ctx.workspace, ctx.membership, ctx.role, ctx.permissions);
}

export async function listMembers(userId, workspaceId, query = {}) {
  const ctx = await getActiveMembership(userId, workspaceId);
  if (!ctx) throw new ApiError(403, "Not a member");

  const { hasPermission, PERMISSIONS } = await import("../workspaces/permissions.catalog.js");
  if (!hasPermission(ctx.permissions, PERMISSIONS.MEMBERS_VIEW)) {
    throw new ApiError(403, "Missing permission: members.view");
  }

  const pagination = getPagination(query, { limit: 20, maxLimit: 50 });

  if (ctx.workspace.type === WORKSPACE_TYPES.PERSONAL) {
    const user = await User.findById(userId).select("email").lean();
    return listResult({
      items: [
        {
          id: ctx.membership._id,
          userId,
          email: user?.email,
          isOwner: true,
          role: null,
          status: MEMBERSHIP_STATUS.ACTIVE,
          joinedAt: ctx.membership.createdAt
        }
      ],
      total: 1,
      pagination
    });
  }

  const filter = {
    workspaceId,
    status: MEMBERSHIP_STATUS.ACTIVE,
    deletedAt: null
  };

  const [memberships, total] = await Promise.all([
    Membership.find(filter)
      .sort({ isOwner: -1, createdAt: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Membership.countDocuments(filter)
  ]);

  const userIds = memberships.map((m) => m.userId);
  const users = await User.find({ _id: { $in: userIds } }).select("email").lean();
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

  const roleIds = memberships.map((m) => m.roleId).filter(Boolean);
  const roles = roleIds.length
    ? await Role.find({ _id: { $in: roleIds }, deletedAt: null }).lean()
    : [];
  const roleMap = Object.fromEntries(roles.map((r) => [String(r._id), r]));

  const items = memberships.map((m) => ({
    id: m._id,
    userId: m.userId,
    email: userMap[String(m.userId)]?.email || null,
    isOwner: m.isOwner,
    role: m.roleId
      ? {
          id: roleMap[String(m.roleId)]?._id,
          key: roleMap[String(m.roleId)]?.key,
          name: roleMap[String(m.roleId)]?.name
        }
      : null,
    status: m.status,
    joinedAt: m.createdAt,
    lastActiveAt: m.lastActiveAt
  }));

  return listResult({ items, total, pagination });
}

export async function listRoles(userId, workspaceId, query = {}) {
  const ctx = await getActiveMembership(userId, workspaceId);
  if (!ctx) throw new ApiError(403, "Not a member");

  const { hasPermission, PERMISSIONS } = await import("../workspaces/permissions.catalog.js");
  const canListRoles =
    ctx.membership.isOwner ||
    hasPermission(ctx.permissions, PERMISSIONS.ROLES_MANAGE) ||
    hasPermission(ctx.permissions, PERMISSIONS.MEMBERS_VIEW) ||
    hasPermission(ctx.permissions, PERMISSIONS.MEMBERS_MANAGE_ROLES) ||
    hasPermission(ctx.permissions, PERMISSIONS.MEMBERS_INVITE);
  if (!canListRoles) {
    throw new ApiError(403, "Missing permission to view roles");
  }

  const pagination = getPagination(query, { limit: 20, maxLimit: 50 });

  if (ctx.workspace.type === WORKSPACE_TYPES.PERSONAL) {
    return listResult({ items: [], total: 0, pagination });
  }

  const { filter, sort } = parseListQuery(query, {
    defaults: { limit: 20, maxLimit: 50 },
    baseFilter: { workspaceId, deletedAt: null },
    sort: { default: { isBuiltin: -1, name: 1 } }
  });

  const [roles, total] = await Promise.all([
    Role.find(filter)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Role.countDocuments(filter)
  ]);

  const items = roles.map((r) => ({
    id: r._id,
    key: r.key,
    name: r.name,
    permissions: r.permissions,
    isBuiltin: r.isBuiltin,
    isSystem: r.isSystem
  }));

  return listResult({ items, total, pagination });
}

export async function createCustomRole(userId, workspaceId, body = {}) {
  const ctx = await getActiveMembership(userId, workspaceId);
  if (!ctx) throw new ApiError(403, "Not a member");
  if (ctx.workspace.type !== WORKSPACE_TYPES.FIRM) {
    throw new ApiError(400, "Custom roles are only available on firm workspaces");
  }

  const { hasPermission, PERMISSIONS } = await import("../workspaces/permissions.catalog.js");
  if (!hasPermission(ctx.permissions, PERMISSIONS.ROLES_MANAGE)) {
    throw new ApiError(403, "Missing permission: roles.manage");
  }

  const name = String(body.name || "").trim();
  if (!name) throw new ApiError(400, "Role name is required");

  let key = String(body.key || name)
    .toUpperCase()
    .replace(/[^A-Z0-9_]+/g, "_")
    .slice(0, 64);
  if (!key || Object.values(BUILTIN_ROLE_KEYS).includes(key)) {
    key = `CUSTOM_${key || "ROLE"}_${Date.now().toString(36).toUpperCase()}`;
  }

  if (await Role.exists({ workspaceId, key, deletedAt: null })) {
    throw new ApiError(409, "A role with this key already exists");
  }

  let permissions = sanitizePermissionKeys(body.permissions || []);
  if (body.cloneFromRoleId) {
    const source = await Role.findOne({
      _id: body.cloneFromRoleId,
      workspaceId,
      deletedAt: null
    }).lean();
    if (!source) throw new ApiError(404, "Source role not found");
    permissions = sanitizePermissionKeys(body.permissions?.length ? body.permissions : source.permissions);
  }

  const role = await Role.create({
    workspaceId,
    key,
    name,
    permissions,
    isBuiltin: false,
    isSystem: false
  });

  await writeAudit({
    workspaceId,
    actorUserId: userId,
    action: WORKSPACE_AUDIT_ACTIONS.ROLE_CREATED,
    meta: { roleId: role._id, key, name }
  });

  return {
    id: role._id,
    key: role.key,
    name: role.name,
    permissions: role.permissions,
    isBuiltin: false
  };
}

export async function updateCustomRole(userId, workspaceId, roleId, body = {}) {
  const ctx = await getActiveMembership(userId, workspaceId);
  if (!ctx) throw new ApiError(403, "Not a member");

  const { hasPermission, PERMISSIONS } = await import("../workspaces/permissions.catalog.js");
  if (!hasPermission(ctx.permissions, PERMISSIONS.ROLES_MANAGE)) {
    throw new ApiError(403, "Missing permission: roles.manage");
  }

  const role = await Role.findOne({ _id: roleId, workspaceId, deletedAt: null });
  if (!role) throw new ApiError(404, "Role not found");
  if (role.isBuiltin) {
    throw new ApiError(400, "Builtin roles are immutable — clone to a custom role instead");
  }

  if (body.name != null) role.name = String(body.name).trim();
  if (body.permissions != null) role.permissions = sanitizePermissionKeys(body.permissions);
  await role.save();

  await writeAudit({
    workspaceId,
    actorUserId: userId,
    action: WORKSPACE_AUDIT_ACTIONS.ROLE_UPDATED,
    meta: { roleId: role._id }
  });

  return {
    id: role._id,
    key: role.key,
    name: role.name,
    permissions: role.permissions,
    isBuiltin: role.isBuiltin
  };
}

export async function deleteCustomRole(userId, workspaceId, roleId) {
  const ctx = await getActiveMembership(userId, workspaceId);
  if (!ctx) throw new ApiError(403, "Not a member");

  const { hasPermission, PERMISSIONS } = await import("../workspaces/permissions.catalog.js");
  if (!hasPermission(ctx.permissions, PERMISSIONS.ROLES_MANAGE)) {
    throw new ApiError(403, "Missing permission: roles.manage");
  }

  const role = await Role.findOne({ _id: roleId, workspaceId, deletedAt: null });
  if (!role) throw new ApiError(404, "Role not found");
  if (role.isBuiltin) throw new ApiError(400, "Cannot delete builtin roles");

  const inUse = await Membership.countDocuments({
    workspaceId,
    roleId,
    status: MEMBERSHIP_STATUS.ACTIVE,
    deletedAt: null
  });
  if (inUse > 0) {
    throw new ApiError(400, "Reassign members before deleting this role");
  }

  role.deletedAt = new Date();
  await role.save();

  await writeAudit({
    workspaceId,
    actorUserId: userId,
    action: WORKSPACE_AUDIT_ACTIONS.ROLE_DELETED,
    meta: { roleId }
  });

  return { deleted: true };
}

export async function changeMemberRole(actorUserId, workspaceId, memberUserId, roleId) {
  const ctx = await getActiveMembership(actorUserId, workspaceId);
  if (!ctx) throw new ApiError(403, "Not a member");

  const { hasPermission, PERMISSIONS } = await import("../workspaces/permissions.catalog.js");
  if (!hasPermission(ctx.permissions, PERMISSIONS.MEMBERS_MANAGE_ROLES)) {
    throw new ApiError(403, "Missing permission: members.manage_roles");
  }

  const membership = await Membership.findOne({
    workspaceId,
    userId: memberUserId,
    status: MEMBERSHIP_STATUS.ACTIVE,
    deletedAt: null
  });
  if (!membership) throw new ApiError(404, "Member not found");
  if (membership.isOwner) throw new ApiError(400, "Cannot change the owner's role");

  const role = await Role.findOne({ _id: roleId, workspaceId, deletedAt: null });
  if (!role) throw new ApiError(404, "Role not found");

  membership.roleId = role._id;
  await membership.save();

  await writeAudit({
    workspaceId,
    actorUserId: actorUserId,
    action: WORKSPACE_AUDIT_ACTIONS.MEMBER_ROLE_CHANGED,
    meta: { memberUserId, roleId }
  });

  return { ok: true };
}

export async function removeMember(actorUserId, workspaceId, memberUserId) {
  const ctx = await getActiveMembership(actorUserId, workspaceId);
  if (!ctx) throw new ApiError(403, "Not a member");

  const { hasPermission, PERMISSIONS } = await import("../workspaces/permissions.catalog.js");
  if (!hasPermission(ctx.permissions, PERMISSIONS.MEMBERS_REMOVE) && !ctx.membership.isOwner) {
    throw new ApiError(403, "Missing permission: members.remove");
  }

  const membership = await Membership.findOne({
    workspaceId,
    userId: memberUserId,
    status: MEMBERSHIP_STATUS.ACTIVE,
    deletedAt: null
  });
  if (!membership) throw new ApiError(404, "Member not found");
  if (membership.isOwner) throw new ApiError(400, "Cannot remove the workspace owner");

  membership.status = MEMBERSHIP_STATUS.REMOVED;
  membership.deletedAt = new Date();
  await membership.save();

  const user = await User.findById(memberUserId);
  if (user && String(user.activeWorkspaceId) === String(workspaceId)) {
    const personal = await Workspace.findOne({
      ownerUserId: memberUserId,
      type: WORKSPACE_TYPES.PERSONAL,
      deletedAt: null
    });
    user.activeWorkspaceId = personal?._id || null;
    await user.save();
  }

  await writeAudit({
    workspaceId,
    actorUserId: actorUserId,
    action: WORKSPACE_AUDIT_ACTIONS.MEMBER_REMOVED,
    meta: { memberUserId }
  });

  return { ok: true };
}

export async function leaveWorkspace(userId, workspaceId) {
  const ctx = await getActiveMembership(userId, workspaceId);
  if (!ctx) throw new ApiError(403, "Not a member");
  if (ctx.workspace.type === WORKSPACE_TYPES.PERSONAL) {
    throw new ApiError(400, "Cannot leave your personal workspace");
  }
  if (ctx.membership.isOwner) {
    throw new ApiError(400, "Transfer ownership before leaving the firm");
  }

  await Membership.updateOne(
    { _id: ctx.membership._id },
    { $set: { status: MEMBERSHIP_STATUS.LEFT, deletedAt: new Date() } }
  );

  const user = await User.findById(userId);
  if (user && String(user.activeWorkspaceId) === String(workspaceId)) {
    const personal = await Workspace.findOne({
      ownerUserId: userId,
      type: WORKSPACE_TYPES.PERSONAL,
      deletedAt: null
    });
    user.activeWorkspaceId = personal?._id || null;
    await user.save();
  }

  await writeAudit({
    workspaceId,
    actorUserId: userId,
    action: WORKSPACE_AUDIT_ACTIONS.MEMBER_LEFT,
    meta: {}
  });

  return { ok: true };
}

export async function transferOwnership(actorUserId, workspaceId, newOwnerUserId) {
  const ctx = await getActiveMembership(actorUserId, workspaceId);
  if (!ctx) throw new ApiError(403, "Not a member");
  if (!ctx.membership.isOwner) throw new ApiError(403, "Only the owner can transfer ownership");
  if (ctx.workspace.type !== WORKSPACE_TYPES.FIRM) {
    throw new ApiError(400, "Only firm ownership can be transferred");
  }
  if (String(newOwnerUserId) === String(actorUserId)) {
    throw new ApiError(400, "Already the owner");
  }

  const newOwnerMembership = await Membership.findOne({
    workspaceId,
    userId: newOwnerUserId,
    status: MEMBERSHIP_STATUS.ACTIVE,
    deletedAt: null
  });
  if (!newOwnerMembership) throw new ApiError(400, "New owner must be an active member");

  // Give previous owner the ADMIN builtin role
  const adminRole = await Role.findOne({
    workspaceId,
    key: BUILTIN_ROLE_KEYS.ADMIN,
    deletedAt: null
  });

  const prevOwner = await Membership.findOne({
    workspaceId,
    userId: actorUserId,
    status: MEMBERSHIP_STATUS.ACTIVE,
    deletedAt: null
  });

  prevOwner.isOwner = false;
  prevOwner.roleId = adminRole?._id || null;
  await prevOwner.save();

  newOwnerMembership.isOwner = true;
  newOwnerMembership.roleId = null;
  await newOwnerMembership.save();

  await Workspace.updateOne({ _id: workspaceId }, { $set: { ownerUserId: newOwnerUserId } });

  await writeAudit({
    workspaceId,
    actorUserId: actorUserId,
    action: WORKSPACE_AUDIT_ACTIONS.OWNERSHIP_TRANSFERRED,
    meta: { from: actorUserId, to: newOwnerUserId }
  });

  return { ok: true };
}

export async function dissolveFirm(userId, workspaceId) {
  const ctx = await getActiveMembership(userId, workspaceId);
  if (!ctx) throw new ApiError(403, "Not a member");
  if (!ctx.membership.isOwner) throw new ApiError(403, "Only the owner can dissolve the firm");
  if (ctx.workspace.type !== WORKSPACE_TYPES.FIRM) {
    throw new ApiError(400, "Cannot dissolve a personal workspace");
  }

  const otherMembers = await Membership.countDocuments({
    workspaceId,
    status: MEMBERSHIP_STATUS.ACTIVE,
    deletedAt: null,
    userId: { $ne: userId }
  });
  if (otherMembers > 0) {
    throw new ApiError(400, "Remove all other members before dissolving the firm");
  }

  const now = new Date();
  await Workspace.updateOne({ _id: workspaceId }, { $set: { deletedAt: now } });
  await Membership.updateOne(
    { _id: ctx.membership._id },
    { $set: { status: MEMBERSHIP_STATUS.LEFT, deletedAt: now } }
  );
  await Role.updateMany({ workspaceId, deletedAt: null }, { $set: { deletedAt: now } });
  await WorkspaceInvite.updateMany(
    { workspaceId, status: WORKSPACE_INVITE_STATUS.PENDING },
    { $set: { status: WORKSPACE_INVITE_STATUS.REVOKED } }
  );

  const personal = await Workspace.findOne({
    ownerUserId: userId,
    type: WORKSPACE_TYPES.PERSONAL,
    deletedAt: null
  });
  await User.findByIdAndUpdate(userId, { activeWorkspaceId: personal?._id || null });

  await writeAudit({
    workspaceId,
    actorUserId: userId,
    action: WORKSPACE_AUDIT_ACTIONS.FIRM_DISSOLVED,
    meta: {}
  });

  return { ok: true };
}

function inviteToken() {
  return crypto.randomBytes(24).toString("hex");
}

export async function createInvite(actorUserId, workspaceId, body = {}) {
  const ctx = await getActiveMembership(actorUserId, workspaceId);
  if (!ctx) throw new ApiError(403, "Not a member");
  if (ctx.workspace.type !== WORKSPACE_TYPES.FIRM) {
    throw new ApiError(400, "Invites are only for firm workspaces");
  }

  const { hasPermission, PERMISSIONS } = await import("../workspaces/permissions.catalog.js");
  if (!hasPermission(ctx.permissions, PERMISSIONS.MEMBERS_INVITE)) {
    throw new ApiError(403, "Missing permission: members.invite");
  }

  const { assertCanAddSeat } = await import("../billing/entitlement.service.js");
  await assertCanAddSeat(workspaceId);

  const role = await Role.findOne({ _id: body.roleId, workspaceId, deletedAt: null });
  if (!role) throw new ApiError(400, "roleId is required and must belong to this firm");

  const isEmailInvite = Boolean(body.email);
  const email = isEmailInvite ? String(body.email).toLowerCase().trim() : null;
  if (isEmailInvite) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new ApiError(400, "Invalid email");
  }

  const maxUses = isEmailInvite ? 1 : Math.min(Number(body.maxUses) || 25, 100);
  const days = Number(body.expiresInDays) || 14;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const token = inviteToken();

  const invite = await WorkspaceInvite.create({
    workspaceId,
    email,
    token,
    roleId: role._id,
    createdByUserId: actorUserId,
    status: WORKSPACE_INVITE_STATUS.PENDING,
    expiresAt,
    maxUses,
    useCount: 0
  });

  await writeAudit({
    workspaceId,
    actorUserId: actorUserId,
    action: WORKSPACE_AUDIT_ACTIONS.MEMBER_INVITED,
    meta: { inviteId: invite._id, email, maxUses }
  });

  return {
    id: invite._id,
    email: invite.email,
    token: invite.token,
    roleId: invite.roleId,
    expiresAt: invite.expiresAt,
    maxUses: invite.maxUses,
    useCount: invite.useCount,
    status: invite.status
  };
}

export async function listInvites(userId, workspaceId, query = {}) {
  const ctx = await getActiveMembership(userId, workspaceId);
  if (!ctx) throw new ApiError(403, "Not a member");

  const { hasPermission, PERMISSIONS } = await import("../workspaces/permissions.catalog.js");
  if (!hasPermission(ctx.permissions, PERMISSIONS.MEMBERS_INVITE)) {
    throw new ApiError(403, "Missing permission: members.invite");
  }

  const { filter, sort, pagination } = parseListQuery(query, {
    defaults: { limit: 20, maxLimit: 50 },
    baseFilter: { workspaceId },
    sort: { default: { createdAt: -1 } }
  });

  const [invites, total] = await Promise.all([
    WorkspaceInvite.find(filter)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    WorkspaceInvite.countDocuments(filter)
  ]);

  const items = invites.map((i) => ({
    id: i._id,
    email: i.email,
    token: i.token,
    roleId: i.roleId,
    status: i.status,
    expiresAt: i.expiresAt,
    maxUses: i.maxUses,
    useCount: i.useCount,
    createdAt: i.createdAt
  }));

  return listResult({ items, total, pagination });
}

export async function revokeInvite(userId, workspaceId, inviteId) {
  const ctx = await getActiveMembership(userId, workspaceId);
  if (!ctx) throw new ApiError(403, "Not a member");

  const { hasPermission, PERMISSIONS } = await import("../workspaces/permissions.catalog.js");
  if (!hasPermission(ctx.permissions, PERMISSIONS.MEMBERS_INVITE)) {
    throw new ApiError(403, "Missing permission: members.invite");
  }

  const invite = await WorkspaceInvite.findOne({ _id: inviteId, workspaceId });
  if (!invite) throw new ApiError(404, "Invite not found");
  invite.status = WORKSPACE_INVITE_STATUS.REVOKED;
  await invite.save();

  await writeAudit({
    workspaceId,
    actorUserId: userId,
    action: WORKSPACE_AUDIT_ACTIONS.INVITE_REVOKED,
    meta: { inviteId }
  });

  return { ok: true };
}

export async function acceptInvite(userId, { token }) {
  if (!token) throw new ApiError(400, "Invite token is required");

  const user = await User.findById(userId);
  if (!user || user.role !== "LAWYER") {
    throw new ApiError(403, "Only lawyers can accept firm invites");
  }

  const invite = await WorkspaceInvite.findOne({ token });
  if (!invite) throw new ApiError(404, "Invite not found");
  if (invite.status !== WORKSPACE_INVITE_STATUS.PENDING) {
    throw new ApiError(400, "Invite is no longer valid");
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    invite.status = WORKSPACE_INVITE_STATUS.EXPIRED;
    await invite.save();
    throw new ApiError(400, "Invite has expired");
  }
  if (invite.useCount >= invite.maxUses) {
    throw new ApiError(400, "Invite has reached its maximum uses");
  }
  if (invite.email && invite.email !== user.email.toLowerCase()) {
    throw new ApiError(403, "This invite was sent to a different email address");
  }

  const workspace = await Workspace.findOne({
    _id: invite.workspaceId,
    type: WORKSPACE_TYPES.FIRM,
    deletedAt: null
  });
  if (!workspace) throw new ApiError(404, "Firm no longer exists");

  const { assertCanAddSeat } = await import("../billing/entitlement.service.js");
  await assertCanAddSeat(workspace._id);

  const existing = await Membership.findOne({
    workspaceId: workspace._id,
    userId,
    status: MEMBERSHIP_STATUS.ACTIVE,
    deletedAt: null
  });
  if (existing) throw new ApiError(409, "Already a member of this firm");

  const firmMemberships = await Membership.find({
    userId,
    status: MEMBERSHIP_STATUS.ACTIVE,
    deletedAt: null
  }).lean();
  const firmWs = await Workspace.countDocuments({
    _id: { $in: firmMemberships.map((m) => m.workspaceId) },
    type: WORKSPACE_TYPES.FIRM,
    deletedAt: null
  });
  if (firmWs >= WORKSPACE_LIMITS.MAX_JOINED_FIRMS + WORKSPACE_LIMITS.MAX_OWNED_FIRMS) {
    throw new ApiError(400, "Firm membership limit reached");
  }

  // Reactivate soft-deleted membership if any
  const prior = await Membership.findOne({ workspaceId: workspace._id, userId });
  if (prior) {
    prior.status = MEMBERSHIP_STATUS.ACTIVE;
    prior.deletedAt = null;
    prior.isOwner = false;
    prior.roleId = invite.roleId;
    prior.lastActiveAt = new Date();
    await prior.save();
  } else {
    await Membership.create({
      workspaceId: workspace._id,
      userId,
      isOwner: false,
      roleId: invite.roleId,
      status: MEMBERSHIP_STATUS.ACTIVE,
      lastActiveAt: new Date()
    });
  }

  invite.useCount += 1;
  if (invite.useCount >= invite.maxUses) {
    invite.status = WORKSPACE_INVITE_STATUS.ACCEPTED;
  }
  await invite.save();

  await writeAudit({
    workspaceId: workspace._id,
    actorUserId: userId,
    action: WORKSPACE_AUDIT_ACTIONS.MEMBER_JOINED,
    meta: { inviteId: invite._id }
  });

  return activateWorkspace(userId, workspace._id);
}

export async function listAuditLogs(userId, workspaceId, query = {}) {
  const ctx = await getActiveMembership(userId, workspaceId);
  if (!ctx) throw new ApiError(403, "Not a member");

  const { hasPermission, PERMISSIONS } = await import("../workspaces/permissions.catalog.js");
  if (!hasPermission(ctx.permissions, PERMISSIONS.WORKSPACE_AUDIT) && !ctx.membership.isOwner) {
    throw new ApiError(403, "Missing permission: workspace.audit");
  }

  const { filter, sort, pagination } = parseListQuery(query, {
    defaults: { limit: 50, maxLimit: 200 },
    baseFilter: { workspaceId },
    sort: { default: { createdAt: -1 } }
  });

  const [logs, total] = await Promise.all([
    WorkspaceAuditLog.find(filter)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    WorkspaceAuditLog.countDocuments(filter)
  ]);

  const items = logs.map((l) => ({
    id: l._id,
    action: l.action,
    actorUserId: l.actorUserId,
    meta: l.meta,
    createdAt: l.createdAt
  }));

  return listResult({ items, total, pagination });
}

export async function adminListWorkspaces(query = {}) {
  const { filter, sort, pagination } = parseListQuery(query, {
    defaults: { limit: 50, maxLimit: 100 },
    baseFilter: { deletedAt: null },
    filters: [{ key: "type", path: "type", type: "eq" }],
    sort: { default: { createdAt: -1 } }
  });

  const [items, total] = await Promise.all([
    Workspace.find(filter)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Workspace.countDocuments(filter)
  ]);

  const ids = items.map((w) => w._id);
  const memberCounts = await Membership.aggregate([
    {
      $match: {
        workspaceId: { $in: ids },
        status: MEMBERSHIP_STATUS.ACTIVE,
        deletedAt: null
      }
    },
    { $group: { _id: "$workspaceId", count: { $sum: 1 } } }
  ]);
  const countMap = Object.fromEntries(memberCounts.map((c) => [String(c._id), c.count]));

  return listResult({
    items: items.map((w) => ({
      id: w._id,
      type: w.type,
      name: w.name,
      slug: w.slug,
      ownerUserId: w.ownerUserId,
      city: w.city,
      memberCount: countMap[String(w._id)] || 0,
      createdAt: w.createdAt
    })),
    total,
    pagination
  });
}

export async function getPermissionCatalog() {
  const { ALL_PERMISSION_KEYS, BUILTIN_ROLE_PRESETS, PERMISSIONS } = await import(
    "../workspaces/permissions.catalog.js"
  );
  return {
    permissions: ALL_PERMISSION_KEYS,
    permissionMap: PERMISSIONS,
    builtins: BUILTIN_ROLE_PRESETS
  };
}
