/**
 * Profile Picture Utility
 * 
 * Reusable utilities for handling profile pictures across the application
 */

/**
 * Get the full URL for a profile picture
 * Handles both absolute URLs and relative paths
 * 
 * @param {string|null|undefined} imageUrl - Profile image URL (can be relative or absolute)
 * @param {string} baseUrl - Base API URL (defaults to VITE_API_BASE)
 * @returns {string|null} Full URL or null if no image
 */
export function getProfilePictureUrl(imageUrl, baseUrl = null) {
  if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
    return null;
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  const apiBase = baseUrl || import.meta.env.VITE_API_BASE || "";
  if (!apiBase) return null;
  
  const cleanBase = apiBase.replace(/\/$/, "");
  const cleanImageUrl = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  
  return `${cleanBase}${cleanImageUrl}`;
}

/**
 * Get user initials from name or email
 * 
 * @param {string} name - Full name or email
 * @returns {string} Initials (1-2 characters)
 */
export function getUserInitials(name) {
  if (!name || name.trim() === "") {
    return "?";
  }

  const parts = name.trim().split(" ");
  
  if (parts.length >= 2) {
    // First letter of first name + first letter of last name
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  
  // Single name or email - use first character
  return name[0].toUpperCase();
}

/**
 * Get profile picture data from user object
 * Handles different user object structures
 * 
 * @param {Object} user - User object (can be from User, LawyerProfile, ClientProfile, etc.)
 * @returns {Object} { url: string|null, initials: string }
 */
export function getProfilePictureData(user) {
  if (!user) {
    return { url: null, initials: "?" };
  }

  const imageUrl = user.profileImage || user.profileImageUrl || user.avatar || user.image || null;
  const url = imageUrl && typeof imageUrl === "string" && imageUrl.trim() !== "" 
    ? getProfilePictureUrl(imageUrl) 
    : null;
  const displayName = user.fullName || user.name || user.email || "User";

  return { url, initials: getUserInitials(displayName) };
}

