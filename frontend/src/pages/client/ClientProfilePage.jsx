import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { constantsApi } from "../../services/constants.api";
import { Card, Button, Input, Select, Textarea, ProfilePicture } from "../../components/ui";
import AuthLayout, { FormSection, FormRow } from "../auth/AuthLayout";

const GENDERS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" }
];

export default function ClientProfilePage() {
  const { user, profileLoading, loadProfile, updateProfile } = useAuth();
  const toast = useToast();
  const [cities, setCities] = useState([]);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    whatsapp: "",
    city: "",
    address: "",
    cnic: "",
    dateOfBirth: "",
    gender: "",
  });

  const profileLoadInitiated = useRef(false);

  useEffect(() => {
    // Only load profile if it hasn't been merged into auth state yet (e.g. bootstrap fetch failed).
    // Do not use fullName — new profiles can have an empty name after a successful fetch.
    if (
      user?.role &&
      !user?.profile &&
      !profileLoading &&
      !profileLoadInitiated.current
    ) {
      profileLoadInitiated.current = true;
      loadProfile();
    }
  }, [user?.role, user?.profile, profileLoading, loadProfile]);

  useEffect(() => {
    // Load cities only once
    loadCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phone: user.phone || "",
        whatsapp: user.whatsapp || "",
        city: user.city || "",
        address: user.address || "",
        cnic: user.cnic || "",
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
        gender: user.gender || "",
      });
    }
  }, [user]);

  const loadCities = async () => {
    try {
      const res = await constantsApi.getConstants();
      setCities(res.data?.cities || []);
    } catch (error) {
      console.error("Failed to load cities:", error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    
    try {
      await updateProfile(formData);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to save profile");
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [field]: value });
  };

  if (profileLoading && !user?.profile) {
    return <div className="p-6 text-text-secondary">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary mb-2">Complete Your Profile</h1>
        <p className="text-text-secondary">Please provide your information to get started</p>
      </div>

      <form onSubmit={handleSave}>
        <Card className="mb-6">
          <FormSection title="Profile Picture">
            <div className="flex items-center gap-6">
              <ProfilePicture
                user={user}
                imageUrl={user?.profileImage}
                onUpdate={(data) => {
                  // Profile picture updated, user data will be refreshed automatically
                }}
                size="lg"
                editable={true}
              />
              <div className="flex-1">
                <p className="text-sm text-text-secondary mb-2">
                  Upload a profile picture to help others recognize you
                </p>
                <p className="text-xs text-text-muted">
                  Supported formats: JPG, PNG, WEBP (max 2MB)
                </p>
              </div>
            </div>
          </FormSection>
        </Card>

        <Card className="mb-6">
          <FormSection title="Personal Information">
            <FormRow>
              <Input
                label="Full Name"
                value={formData.fullName}
                onChange={handleChange("fullName")}
                placeholder="Enter your full name"
                required
              />
              <Input
                label="CNIC"
                value={formData.cnic}
                onChange={handleChange("cnic")}
                placeholder="12345-1234567-1"
                helperText="Format: XXXXX-XXXXXXX-X"
              />
            </FormRow>

            <FormRow>
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={handleChange("phone")}
                placeholder="+92 300 1234567"
                required
              />
              <Input
                label="WhatsApp Number"
                type="tel"
                value={formData.whatsapp}
                onChange={handleChange("whatsapp")}
                placeholder="+92 300 1234567"
                helperText="Optional - for direct communication"
              />
            </FormRow>

            <FormRow>
              <Select
                label="City"
                value={formData.city}
                onChange={handleChange("city")}
                options={cities.map(c => ({ value: c, label: c }))}
                placeholder="Select your city"
              />
              <Select
                label="Gender"
                value={formData.gender}
                onChange={handleChange("gender")}
                options={GENDERS}
                placeholder="Select gender"
              />
            </FormRow>

            <Input
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange("dateOfBirth")}
              helperText="Optional"
            />

            <Textarea
              label="Address"
              value={formData.address}
              onChange={handleChange("address")}
              placeholder="Enter your complete address"
              rows={3}
              helperText="Optional"
            />
          </FormSection>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" loading={profileLoading}>
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
