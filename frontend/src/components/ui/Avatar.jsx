import { getProfilePictureData, getProfilePictureUrl, getUserInitials } from "../../utils/profilePicture";

/**
 * Avatar Component
 * 
 * Display-only component for showing user profile pictures or initials
 * Use this for read-only display (no upload/edit functionality)
 * 
 * @param {Object} props
 * @param {Object} props.user - User object (can have profileImage, fullName, email, etc.)
 * @param {string} props.imageUrl - Direct image URL (optional, overrides user.profileImage)
 * @param {string} props.name - Display name for initials (optional, overrides user.fullName)
 * @param {string} props.size - Size variant: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showBorder - Show border around avatar
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

  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
    "2xl": "w-24 h-24 text-xl"
  };

  return (
    <div
      className={`relative ${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center bg-primary text-primary-text ${
        showBorder ? "border-2 border-border" : ""
      } ${className}`}
    >
      {url ? (
        <img
          src={url}
          alt={name || user?.fullName || "Profile"}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide image on error, show fallback
            e.target.style.display = "none";
            const fallback = e.target.nextElementSibling;
            if (fallback) fallback.style.display = "flex";
          }}
        />
      ) : null}
      <div
        className={`w-full h-full flex items-center justify-center bg-primary text-primary-text font-semibold ${
          url ? "hidden" : ""
        }`}
        style={{ display: url ? "none" : "flex" }}
      >
        {initials}
      </div>
    </div>
  );
}

