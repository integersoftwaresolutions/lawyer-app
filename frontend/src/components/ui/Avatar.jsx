import { getProfilePictureData, getProfilePictureUrl, getUserInitials } from "../../utils/profilePicture";

/** Initial letter size as a fraction of avatar diameter — consistent across all sizes. */
const INITIAL_RATIO = 0.52;

const AVATAR_SIZES = {
  xs: { className: "w-6 h-6", px: 24 },
  sm: { className: "w-8 h-8", px: 32 },
  md: { className: "w-10 h-10", px: 40 },
  lg: { className: "w-12 h-12", px: 48 },
  xl: { className: "w-16 h-16", px: 64 },
  "2xl": { className: "w-24 h-24", px: 96 }
};

/**
 * Avatar Component
 *
 * Display-only component for showing user profile pictures or initials
 */
export default function Avatar({
  user = null,
  imageUrl = null,
  name = null,
  size = "md",
  className = "",
  showBorder = false
}) {
  const profileData = getProfilePictureData(user);
  const url = imageUrl ? getProfilePictureUrl(imageUrl) : profileData.url;
  const initials = name ? getUserInitials(name) : profileData.initials;
  const { className: sizeClass, px } = AVATAR_SIZES[size] || AVATAR_SIZES.md;
  const initialFontSize = Math.round(px * INITIAL_RATIO);

  return (
    <div
      className={`relative ${sizeClass} rounded-full overflow-hidden flex items-center justify-center bg-primary text-primary-text ${
        showBorder ? "border-2 border-border" : ""
      } ${className}`}
    >
      {url ? (
        <img
          src={url}
          alt={name || user?.fullName || "Profile"}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = "none";
            const fallback = e.target.nextElementSibling;
            if (fallback) fallback.style.display = "flex";
          }}
        />
      ) : null}
      <div
        className={`w-full h-full flex items-center justify-center bg-primary text-primary-text font-bold leading-none ${
          url ? "hidden" : ""
        }`}
        style={{ display: url ? "none" : "flex", fontSize: `${initialFontSize}px` }}
      >
        {initials}
      </div>
    </div>
  );
}
