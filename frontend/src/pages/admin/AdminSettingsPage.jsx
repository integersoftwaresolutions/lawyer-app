import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { adminApi } from "../../services/admin.api";
import { Card, Button, Input } from "../../components/ui";

export default function AdminSettingsPage() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState({
    commissionPercent: 10,
    verificationFee: 0,
    monthlyCreditGrant: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await adminApi.getSettings();
      setSettings(res.data || {});
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminApi.updateSettings(settings);
      alert("Settings updated successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return <div style={{ padding: "24px", color: colors.text.secondary }}>Loading...</div>;
  }

  return (
    <div>
      <Card title="Platform Settings" subtitle="Configure platform-wide settings">
        <div style={{ maxWidth: "500px" }}>
          <Input
            label="Commission Percentage (%)"
            type="number"
            value={settings.commissionPercent || 0}
            onChange={(e) => handleChange("commissionPercent", parseFloat(e.target.value) || 0)}
            helperText="Percentage of each consultation fee taken as platform commission"
          />
          <Input
            label="Verification Fee ($)"
            type="number"
            value={settings.verificationFee || 0}
            onChange={(e) => handleChange("verificationFee", parseFloat(e.target.value) || 0)}
            helperText="One-time fee charged to lawyers for verification"
          />
          <Input
            label="Monthly Credit Grant"
            type="number"
            value={settings.monthlyCreditGrant || 0}
            onChange={(e) => handleChange("monthlyCreditGrant", parseInt(e.target.value) || 0)}
            helperText="Number of free credits given to new users monthly"
          />
        </div>
        <div style={{ marginTop: "24px" }}>
          <Button onClick={handleSave} loading={saving}>
            Save Settings
          </Button>
        </div>
      </Card>

      <Card title="Platform Information" style={{ marginTop: "24px" }}>
        <div style={{ color: colors.text.secondary }}>
          <h4 style={{ color: colors.text.primary, marginBottom: "12px" }}>Commission Model</h4>
          <p style={{ marginBottom: "16px" }}>
            The platform takes a {settings.commissionPercent}% commission on each completed consultation.
            For example, if a lawyer charges $100 for a session, the platform receives ${(100 * settings.commissionPercent / 100).toFixed(2)} 
            and the lawyer receives ${(100 - 100 * settings.commissionPercent / 100).toFixed(2)}.
          </p>

          <h4 style={{ color: colors.text.primary, marginBottom: "12px" }}>Credit System</h4>
          <p style={{ marginBottom: "16px" }}>
            New users receive {settings.monthlyCreditGrant} credits monthly. Credits can be used to book consultations
            with lawyers. Additional credits can be purchased through the wallet.
          </p>

          <h4 style={{ color: colors.text.primary, marginBottom: "12px" }}>Verification</h4>
          <p>
            Lawyers must submit verification documents (Bar License, Government ID) to be verified.
            {settings.verificationFee > 0 
              ? ` A one-time fee of $${settings.verificationFee} is charged for verification.`
              : " Verification is currently free."}
          </p>
        </div>
      </Card>
    </div>
  );
}
