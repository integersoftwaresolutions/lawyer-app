import { useCallback, useEffect, useState } from "react";
import { FiBell, FiMail, FiSmartphone } from "react-icons/fi";
import { notificationsApi } from "../../services/notifications.api";
import { useToast } from "../../hooks/useToast";
import { Badge, Button, Card, PageHeader, Switch } from "../../components/ui";

const BULK_ACTIONS = [
  { id: "enable_all_email", label: "Enable all email" },
  { id: "disable_all_email", label: "Disable all email" },
  { id: "enable_all_in_app", label: "Enable all in-app" },
  { id: "disable_all_in_app", label: "Disable all in-app" },
  { id: "reset", label: "Reset to defaults" }
];

function ChannelToggle({ label, icon: Icon, channel, item, savingKey, onToggle }) {
  const channelState = item.channels?.[channel];
  if (!channelState?.supported) return <span className="text-xs text-text-muted">—</span>;

  const key = `${item.type}:${channel}`;
  const isSaving = savingKey === key;
  const isLocked = channelState.mandatory;

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
      <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      {isLocked ? (
        <Badge variant="secondary" size="sm" bordered>
          Required
        </Badge>
      ) : (
        <Switch
          checked={channelState.enabled}
          disabled={isSaving}
          label={`${item.label} ${label}`}
          onChange={(enabled) => onToggle(item.type, channel, enabled)}
        />
      )}
    </div>
  );
}

export default function NotificationSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [savingKey, setSavingKey] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(null);

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.getPreferences();
      setCategories(res.data?.categories || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load notification preferences");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const applyResponse = (res) => {
    setCategories(res.data?.categories || []);
  };

  const handleToggle = async (type, channel, enabled) => {
    const key = `${type}:${channel}`;
    try {
      setSavingKey(key);
      const res = await notificationsApi.updatePreference({ type, channel, enabled });
      applyResponse(res);
      toast.success("Notification preference updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update preference");
    } finally {
      setSavingKey(null);
    }
  };

  const handleBulk = async (action) => {
    try {
      setBulkLoading(action);
      const res = await notificationsApi.bulkPreferences(action);
      applyResponse(res);
      toast.success(
        action === "reset" ? "Preferences reset to defaults" : "Notification preferences updated"
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update preferences");
    } finally {
      setBulkLoading(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-text-secondary">Loading notification settings...</div>;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={FiBell}
        title="Notification Settings"
        subtitle="Choose how you want to be notified for each activity"
      />

      <Card padding="p-4">
        <div className="flex flex-wrap gap-2">
          {BULK_ACTIONS.map(({ id, label }) => (
            <Button
              key={id}
              size="sm"
              variant={id === "reset" ? "secondary" : "primary"}
              outline={id !== "reset"}
              loading={bulkLoading === id}
              disabled={Boolean(bulkLoading)}
              onClick={() => handleBulk(id)}
            >
              {label}
            </Button>
          ))}
        </div>
      </Card>

      {categories.map((category) => (
        <Card key={category.id} title={category.label}>
          <div className="divide-y divide-border">
            {category.items.map((item) => (
              <div
                key={item.type}
                className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-sm font-semibold text-text-primary">{item.label}</p>
                  <p className="m-0 mt-0.5 text-xs text-text-muted">{item.description}</p>
                </div>

                <div className="flex items-center gap-6 sm:shrink-0">
                  <ChannelToggle
                    label="Email"
                    icon={FiMail}
                    channel="email"
                    item={item}
                    savingKey={savingKey}
                    onToggle={handleToggle}
                  />
                  <ChannelToggle
                    label="In-app"
                    icon={FiSmartphone}
                    channel="in_app"
                    item={item}
                    savingKey={savingKey}
                    onToggle={handleToggle}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
