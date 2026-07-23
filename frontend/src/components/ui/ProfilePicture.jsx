import { useState, useRef, useEffect } from "react";
import { FiCamera, FiEye, FiTrash2, FiUpload } from "react-icons/fi";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import { authApi } from "../../services/auth.api";
import { getProfilePictureUrl, getUserInitials, getProfilePictureData } from "../../utils/profilePicture";
import Popover from "./Popover";
import Modal from "./Modal";
import Button from "./Button";
import ConfirmModal from "./ConfirmModal";

/**
 * ProfilePicture Component
 * 
 * Displays and manages user profile picture with upload, replace, and delete functionality
 * 
 * @param {Object} props
 * @param {string} props.imageUrl - Current profile image URL
 * @param {string} props.userId - User ID (optional, for display only mode)
 * @param {Function} props.onUpdate - Callback when image is updated
 * @param {string} props.size - Size variant: "sm" | "md" | "lg" | "xl"
 * @param {boolean} props.editable - Whether the picture can be edited
 * @param {string} props.className - Additional CSS classes
 */
export default function ProfilePicture({
  imageUrl,
  user = null,
  name = null,
  userId,
  onUpdate,
  size = "md",
  editable = true,
  className = ""
}) {
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();
  const auth = useAuth();
  const refreshUser = auth?.refreshUser;

  const profileData = getProfilePictureData(user);
  const displayName = name || user?.fullName || user?.email || "User";
  const initials = getUserInitials(displayName);

  const sizeClasses = {
    sm: { box: "w-8 h-8", px: 32 },
    md: { box: "w-12 h-12", px: 48 },
    lg: { box: "w-24 h-24", px: 96 },
    xl: { box: "w-32 h-32", px: 128 }
  };

  const INITIAL_RATIO = 0.52;
  const { box: sizeBox, px: sizePx } = sizeClasses[size] || sizeClasses.md;
  const initialFontSize = Math.round(sizePx * INITIAL_RATIO);

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPG, PNG, or WEBP)");
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await authApi.uploadProfilePicture(formData);
      
      if (response.data?.profileImage) {
        const fullUrl = getProfilePictureUrl(response.data.profileImage);
        setImage(fullUrl || "");
        if (refreshUser) {
          try {
            await refreshUser();
          } catch (error) {
            // Silently fail - user can refresh manually if needed
          }
        }
        if (onUpdate) {
          onUpdate(response.data);
        }
        toast.success("Profile picture updated successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload profile picture");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };


  const handleView = () => {
    setPopoverOpen(false);
    setShowViewModal(true);
  };

  const handleUpdate = () => {
    setPopoverOpen(false);
    fileInputRef.current?.click();
  };

  const handleDelete = async () => {
    setPopoverOpen(false);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setUploading(true);
      const response = await authApi.deleteProfilePicture();
      
      setImage("");
      if (refreshUser) {
        try {
          await refreshUser();
        } catch (error) {
          // Silently fail
        }
      }
      if (onUpdate) {
        onUpdate(response.data || { profileImage: "", profileImageMediaId: null });
      }
      toast.success("Profile picture deleted successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete profile picture");
    } finally {
      setUploading(false);
      setConfirmDeleteOpen(false);
    }
  };

  // Update image when prop changes
  useEffect(() => {
    const url = imageUrl || user?.profileImage;
    const fullUrl = getProfilePictureUrl(url);
    setImage(fullUrl || "");
  }, [imageUrl, user?.profileImage]);

  if (!editable) {
    // Display-only mode
    return (
      <div className={`relative inline-block ${className}`}>
        <div
          className={`relative ${sizeBox} rounded-full overflow-hidden border-2 border-border bg-surface flex items-center justify-center`}
        >
          {image ? (
            <img
              src={image}
              alt="Profile"
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
              image ? "hidden" : ""
            }`}
            style={{ display: image ? "none" : "flex", fontSize: `${initialFontSize}px` }}
          >
            {initials}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative inline-block ${className}`}>
        <Popover
          isOpen={popoverOpen}
          onToggle={() => setPopoverOpen(!popoverOpen)}
          onClose={() => setPopoverOpen(false)}
          trigger={
            <div
              className={`relative ${sizeBox} rounded-full overflow-hidden border-2 border-border bg-surface flex items-center justify-center cursor-pointer ${
                uploading ? "opacity-50" : ""
              }`}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              {image ? (
                <img
                  src={image}
                  alt="Profile"
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
                  image ? "hidden" : ""
                }`}
                style={{ display: image ? "none" : "flex", fontSize: `${initialFontSize}px` }}
              >
                {initials}
              </div>

              {/* Overlay on hover */}
              {hovering && !uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <FiCamera className="text-white" size={iconSizes[size]} />
                </div>
              )}

              {/* Uploading indicator */}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          }
          placement="bottom-start"
          className="p-0"
        >
          <div className="py-1 min-w-[180px]">
            {image ? (
              <>
                <button
                  type="button"
                  onClick={handleView}
                  className="w-full px-4 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2"
                >
                  <FiEye size={16} />
                  View Profile Picture
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={uploading}
                  className="w-full px-4 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <FiUpload size={16} />
                  Update Picture
                </button>
                <div className="border-t border-border my-1" />
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={uploading}
                  className="w-full px-4 py-2 text-sm text-danger hover:bg-surface-hover transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <FiTrash2 size={16} />
                  Delete Picture
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleUpdate}
                disabled={uploading}
                className="w-full px-4 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FiUpload size={16} />
                Add Profile Picture
              </button>
            )}
          </div>
        </Popover>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Profile Picture"
        size="lg"
      >
        {image ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <img
              src={image}
              alt="Profile Picture"
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-32 h-32 rounded-full bg-primary text-primary-text flex items-center justify-center font-bold leading-none mb-4" style={{ fontSize: "67px" }}>
              {initials}
            </div>
            <p className="text-text-secondary">No profile picture</p>
          </div>
        )}
      </Modal>
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete profile picture?"
        confirmLabel="Delete permanently"
        confirmVariant="danger"
        loading={uploading}
      >
        <p className="text-text-secondary mt-0 mb-0">
          This will permanently remove your current profile picture. Your account will show initials
          until you upload a new image.
        </p>
      </ConfirmModal>
    </>
  );
}

