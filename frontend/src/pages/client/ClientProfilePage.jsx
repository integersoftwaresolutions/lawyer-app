import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { clientApi } from "../../services/client.api";
import { Card, Button, Input } from "../../components/ui";

export default function ClientProfilePage() {
  const { colors } = useTheme();
  const [profile, setProfile] = useState({
    fullName: "",
    phone: "",
    city: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await clientApi.getMyProfile();
      setProfile(res.data || {});
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await clientApi.updateMyProfile(profile);
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

  if (loading) {
    return <div style={{ padding: "24px", color: colors.text.secondary }}>Loading...</div>;
  }

  return (
    <div>
      <Card title="My Profile" subtitle="Update your personal information">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Input
            label="Full Name"
            value={profile.fullName || ""}
            onChange={(e) => handleChange("fullName", e.target.value)}
            placeholder="Enter your full name"
          />
          <Input
            label="Phone Number"
            value={profile.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="Enter your phone number"
          />
          <Input
            label="City"
            value={profile.city || ""}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Enter your city"
          />
          <Input
            label="Address"
            value={profile.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Enter your address"
          />
        </div>
        <div style={{ marginTop: "24px" }}>
          <Button onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
}
