import { useState } from "react";
import { adminApi } from "../../services/admin.api";
import { Card, Button, Input, StateHandler } from "../../components/ui";
import { useStateHandler } from "../../hooks/useStateHandler";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);

  const { loading, error, data, retry, setData } = useStateHandler(
    async () => {
      const res = await adminApi.getSettings();
      return res.data || {
        commissionPercent: 10,
        verificationFee: 0,
        monthlyCreditGrant: 30,
      };
    }
  );

  const settings = data || {
    commissionPercent: 10,
    verificationFee: 0,
    monthlyCreditGrant: 30,
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminApi.updateSettings(settings);
      alert("Settings updated successfully!");
      retry();
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setData({ ...settings, [field]: value });
  };

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <div>
      <Card title="Platform Settings" subtitle="Configure platform-wide settings">
        <div className="max-w-[500px]">
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
        <div className="mt-6">
          <Button onClick={handleSave} loading={saving}>
            Save Settings
          </Button>
        </div>
      </Card>

      <Card title="Platform Information" className="mt-6">
        <div className="text-text-secondary">
          <h4 className="text-text-primary mb-3">Commission Model</h4>
          <p className="mb-4">
            The platform takes a {settings.commissionPercent}% commission on each completed consultation.
            For example, if a lawyer charges $100 for a session, the platform receives ${(100 * settings.commissionPercent / 100).toFixed(2)} 
            and the lawyer receives ${(100 - 100 * settings.commissionPercent / 100).toFixed(2)}.
          </p>

          <h4 className="text-text-primary mb-3">Credit System</h4>
          <p className="mb-4">
            New users receive {settings.monthlyCreditGrant} credits monthly. Credits can be used to book consultations
            with lawyers. Additional credits can be purchased through the wallet.
          </p>

          <h4 className="text-text-primary mb-3">Verification</h4>
          <p>
            Lawyers must submit verification documents (Bar License, Government ID) to be verified.
            {settings.verificationFee > 0 
              ? ` A one-time fee of $${settings.verificationFee} is charged for verification.`
              : " Verification is currently free."}
          </p>
        </div>
      </Card>
      </div>
    </StateHandler>
  );
}
