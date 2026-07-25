import User from "../../models/User.js";
import Workspace from "../../models/Workspace.js";
import { notifyAsync } from "../notification.service.js";
import { NOTIFICATION_TYPES } from "../../config/notification.constants.js";
import { env } from "../../config/env.js";

/**
 * Email + in-app (when user exists) for firm invites.
 */
export async function notifyWorkspaceInvite({ invite, workspaceId, invitedByUserId }) {
  if (!invite?.email && !invite?.token) return;

  const workspace = await Workspace.findById(workspaceId).select("name").lean();
  const inviter = await User.findById(invitedByUserId).select("email").lean();
  const baseUrl = env.appBaseUrl || env.clientOrigin || "http://localhost:5173";
  const acceptUrl = `${baseUrl}/lawyer/workspace?invite=${invite.token}`;

  const variables = {
    workspaceName: workspace?.name || "a firm",
    inviterEmail: inviter?.email || "A colleague",
    acceptUrl,
    inviteToken: invite.token
  };

  const recipients = [];

  if (invite.email) {
    const existing = await User.findOne({ email: invite.email }).select("_id email").lean();
    recipients.push({
      email: invite.email,
      userId: existing?._id?.toString() || undefined,
      variables
    });
  }

  if (recipients.length) {
    notifyAsync(NOTIFICATION_TYPES.WORKSPACE_INVITE, recipients);
  }
}
