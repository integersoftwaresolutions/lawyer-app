import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { constantsApi } from "../../services/constants.api";
import { Card, Button, Input, Select, Textarea, ProfilePicture } from "../../components/ui";
import AuthLayout, { FormSection, FormRow } from "../auth/AuthLayout";

const BAR_COUNCILS = [
  { value: "Punjab Bar Council", label: "Punjab Bar Council" },
  { value: "Sindh Bar Council", label: "Sindh Bar Council" },
  { value: "Khyber Pakhtunkhwa Bar Council", label: "Khyber Pakhtunkhwa Bar Council" },
  { value: "Balochistan Bar Council", label: "Balochistan Bar Council" },
  { value: "Islamabad Bar Council", label: "Islamabad Bar Council" }
];

const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Urdu", label: "Urdu" },
  { value: "Punjabi", label: "Punjabi" },
  { value: "Sindhi", label: "Sindhi" },
  { value: "Pashto", label: "Pashto" },
  { value: "Balochi", label: "Balochi" }
];

export default function LawyerProfilePage() {
  const { user, profileLoading, loadProfile, updateProfile } = useAuth();
  const toast = useToast();
  const [constants, setConstants] = useState({ specializations: [], cities: [] });
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    whatsapp: "",
    city: "",
    officeAddress: "",
    cnic: "",
    barCouncilNumber: "",
    barCouncil: "",
    specialization: [],
    languages: ["English", "Urdu"],
    experienceYears: 0,
    hourlyRate: 0,
    consultationFee: 0,
    bio: "",
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
    // Load constants only once
    loadConstants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phone: user.phone || "",
        email: user.email || "",
        whatsapp: user.whatsapp || "",
        city: user.city || "",
        officeAddress: user.officeAddress || "",
        cnic: user.cnic || "",
        barCouncilNumber: user.barCouncilNumber || "",
        barCouncil: user.barCouncil || "",
        specialization: user.specialization || [],
        languages: user.languages || ["English", "Urdu"],
        experienceYears: user.experienceYears || 0,
        hourlyRate: user.hourlyRate || 0,
        consultationFee: user.consultationFee || 0,
        bio: user.bio || "",
      });
    }
  }, [user]);

  const loadConstants = async () => {
    try {
      const res = await constantsApi.getConstants();
      setConstants(res.data || { specializations: [], cities: [] });
    } catch (error) {
      console.error("Failed to load constants:", error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!formData.barCouncilNumber.trim()) {
      toast.error("Bar Council Number is required");
      return;
    }
    if (!formData.barCouncil) {
      toast.error("Bar Council is required");
      return;
    }
    if (formData.specialization.length === 0) {
      toast.error("Please select at least one specialization");
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

  const handleSpecializationToggle = (spec) => {
    const current = formData.specialization || [];
    if (current.includes(spec)) {
      setFormData({ ...formData, specialization: current.filter((s) => s !== spec) });
    } else {
      setFormData({ ...formData, specialization: [...current, spec] });
    }
  };

  const handleLanguageToggle = (lang) => {
    const current = formData.languages || [];
    if (current.includes(lang)) {
      setFormData({ ...formData, languages: current.filter((l) => l !== lang) });
    } else {
      setFormData({ ...formData, languages: [...current, lang] });
    }
  };

  if (profileLoading && !user?.profile) {
    return <div className="p-6 text-text-secondary">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary mb-2">Complete Your Profile</h1>
        <p className="text-text-secondary">Please provide your professional information</p>
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
                  Upload a professional profile picture to build trust with clients
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
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                placeholder="lawyer@example.com"
              />
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={handleChange("phone")}
                placeholder="+92 300 1234567"
                required
              />
            </FormRow>

            <FormRow>
              <Input
                label="WhatsApp Number"
                type="tel"
                value={formData.whatsapp}
                onChange={handleChange("whatsapp")}
                placeholder="+92 300 1234567"
                helperText="Optional - for direct communication"
              />
              <Select
                label="City"
                value={formData.city}
                onChange={handleChange("city")}
                options={constants.cities.map(c => ({ value: c, label: c }))}
                placeholder="Select your city"
              />
            </FormRow>

            <Input
              label="Office Address"
              value={formData.officeAddress}
              onChange={handleChange("officeAddress")}
              placeholder="Enter your office address"
              helperText="Optional"
            />
          </FormSection>
        </Card>

        <Card className="mb-6">
          <FormSection title="Professional Credentials">
            <FormRow>
              <Input
                label="Bar Council Number"
                value={formData.barCouncilNumber}
                onChange={handleChange("barCouncilNumber")}
                placeholder="Enter your bar council registration number"
                required
              />
              <Select
                label="Bar Council"
                value={formData.barCouncil}
                onChange={handleChange("barCouncil")}
                options={BAR_COUNCILS}
                placeholder="Select your bar council"
                required
              />
            </FormRow>
          </FormSection>
        </Card>

        <Card className="mb-6">
          <FormSection title="Professional Details">
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-text-secondary">
                Specializations <span className="text-danger">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {constants.specializations.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => handleSpecializationToggle(spec)}
                    className={`py-2 px-4 rounded-full border text-xs transition-all ${
                      formData.specialization.includes(spec)
                        ? "border-primary bg-primary text-primary-text"
                        : "border-border bg-card hover:bg-card-hover text-text-secondary"
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
              {formData.specialization.length === 0 && (
                <p className="mt-1 text-xs text-danger">Please select at least one specialization</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-text-secondary">
                Languages
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => handleLanguageToggle(lang.value)}
                    className={`py-2 px-4 rounded-full border text-xs transition-all ${
                      formData.languages.includes(lang.value)
                        ? "border-primary bg-primary text-primary-text"
                        : "border-border bg-card hover:bg-card-hover text-text-secondary"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <FormRow>
              <Input
                label="Years of Experience"
                type="number"
                min="0"
                value={formData.experienceYears}
                onChange={handleChange("experienceYears")}
                required
              />
              <Input
                label="Hourly Rate (PKR)"
                type="number"
                min="0"
                value={formData.hourlyRate}
                onChange={handleChange("hourlyRate")}
                placeholder="0"
                required
              />
            </FormRow>

            <Input
              label="Consultation Fee (PKR)"
              type="number"
              min="0"
              value={formData.consultationFee}
              onChange={handleChange("consultationFee")}
              placeholder="0"
              helperText="One-time consultation fee"
            />

            <Textarea
              label="Professional Bio"
              value={formData.bio}
              onChange={handleChange("bio")}
              placeholder="Tell clients about your experience, expertise, and approach..."
              rows={5}
              helperText="Describe your legal practice and areas of expertise"
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
