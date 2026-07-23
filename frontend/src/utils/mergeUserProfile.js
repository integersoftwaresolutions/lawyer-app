/**
 * Auth account fields live on User (/auth/me).
 * Role profile fields live on ClientProfile / LawyerProfile.
 * This helper merges them for the frontend without letting profile data
 * overwrite account-level fields.
 */

export const AUTH_USER_FIELDS = [
  "id",
  "email",
  "role",
  "isEmailVerified",
  "profileImage",
  "profileImageMediaId",
  "createdAt",
  "updatedAt"
];

const AUTH_FIELD_SET = new Set(AUTH_USER_FIELDS);

const PROFILE_META_FIELDS = new Set([
  "profile",
  "_id",
  "__v",
  "userId",
  "profileImageMediaId"
]);

export function pickAuthFields(user = {}) {
  return AUTH_USER_FIELDS.reduce((acc, field) => {
    if (user[field] !== undefined) {
      acc[field] = user[field];
    }
    return acc;
  }, {});
}

/**
 * Merge auth user + role profile into one object for useAuth().user
 */
export function mergeUserWithProfile(user, profileData) {
  if (!user) return null;
  if (!profileData || typeof profileData !== "object") return { ...user };

  const profile = { ...profileData };
  const authFields = pickAuthFields(user);

  return {
    ...profile,
    ...authFields,
    profileImage: user.profileImage || "",
    profileImageMediaId: user.profileImageMediaId ?? null,
    profile
  };
}

/**
 * Strip account-only fields before sending profile updates to the API.
 */
export function stripAuthFieldsFromProfilePayload(data = {}) {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !AUTH_FIELD_SET.has(key) && !PROFILE_META_FIELDS.has(key))
  );
}
