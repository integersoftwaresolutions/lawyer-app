import { useState, useEffect } from "react";
import { lawyerApi } from "../../services/lawyer.api";
import { constantsApi } from "../../services/constants.api";
import { Card, Button, Input, Select, Textarea } from "../../components/ui";

export default function LawyerProfilePage() {
  const [profile, setProfile] = useState({
    fullName: "",
    phone: "",
    email: "",
    whatsapp: "",
    city: "",
    officeAddress: "",
    specialization: [],
    languages: [],
    experienceYears: 0,
    hourlyRate: 0,
    consultationFee: 0,
    bio: "",
  });
  const [constants, setConstants] = useState({ specializations: [], cities: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, constantsRes] = await Promise.all([
        lawyerApi.getMyProfile(),
        constantsApi.getConstants()
      ]);
      setProfile(profileRes.data || {});
      setConstants(constantsRes.data || { specializations: [], cities: [] });
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await lawyerApi.updateMyProfile(profile);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert(error.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleSpecializationToggle = (spec) => {
    const current = profile.specialization || [];
    if (current.includes(spec)) {
      handleChange("specialization", current.filter((s) => s !== spec));
    } else {
      handleChange("specialization", [...current, spec]);
    }
  };

  if (loading) {
    return <div className="p-6 text-text-secondary">Loading...</div>;
  }

  return (
    <div>
      <Card title="Basic Information" className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={profile.fullName || ""}
            onChange={(e) => handleChange("fullName", e.target.value)}
            placeholder="Enter your full name"
          />
          <Input
            label="Email"
            type="email"
            value={profile.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="Enter your email"
          />
          <Input
            label="Phone Number"
            value={profile.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="Enter your phone number"
          />
          <Input
            label="WhatsApp"
            value={profile.whatsapp || ""}
            onChange={(e) => handleChange("whatsapp", e.target.value)}
            placeholder="Enter your WhatsApp number"
          />
          <Select
            label="City"
            value={profile.city || ""}
            onChange={(e) => handleChange("city", e.target.value)}
            options={constants.cities.map((c) => ({ value: c, label: c }))}
            placeholder="Select your city"
          />
          <Input
            label="Office Address"
            value={profile.officeAddress || ""}
            onChange={(e) => handleChange("officeAddress", e.target.value)}
            placeholder="Enter your office address"
          />
        </div>
      </Card>

      <Card title="Professional Details" className="mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Input
            label="Years of Experience"
            type="number"
            value={profile.experienceYears || 0}
            onChange={(e) => handleChange("experienceYears", parseInt(e.target.value) || 0)}
          />
          <Input
            label="Hourly Rate ($)"
            type="number"
            value={profile.hourlyRate || 0}
            onChange={(e) => handleChange("hourlyRate", parseInt(e.target.value) || 0)}
          />
          <Input
            label="Consultation Fee ($)"
            type="number"
            value={profile.consultationFee || 0}
            onChange={(e) => handleChange("consultationFee", parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-text-secondary">
            Specializations
          </label>
          <div className="flex flex-wrap gap-2">
            {constants.specializations.map((spec) => (
              <button
                key={spec}
                onClick={() => handleSpecializationToggle(spec)}
                className={`py-2 px-4 rounded-full border cursor-pointer text-xs transition-all ${
                  (profile.specialization || []).includes(spec)
                    ? "border-primary bg-primary text-primary-text"
                    : "border-border bg-transparent text-text-secondary"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          label="Professional Bio"
          value={profile.bio || ""}
          onChange={(e) => handleChange("bio", e.target.value)}
          placeholder="Tell clients about your experience, expertise, and approach..."
          rows={5}
        />
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
