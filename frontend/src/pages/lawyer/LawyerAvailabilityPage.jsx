import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { lawyerApi } from "../../services/lawyer.api";
import { Card, Button } from "../../components/ui";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export default function LawyerAvailabilityPage() {
  const { colors } = useTheme();
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const res = await lawyerApi.getMyAvailability();
      setAvailability(res.data || {});
    } catch (error) {
      console.error("Failed to load availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await lawyerApi.updateMyAvailability(availability);
      alert("Availability updated successfully!");
    } catch (error) {
      console.error("Failed to save availability:", error);
      alert(error.response?.data?.message || "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day) => {
    setAvailability({
      ...availability,
      [day]: {
        ...availability[day],
        enabled: !availability[day]?.enabled,
      },
    });
  };

  const updateSlot = (day, index, field, value) => {
    const slots = [...(availability[day]?.slots || [])];
    slots[index] = { ...slots[index], [field]: value };
    setAvailability({
      ...availability,
      [day]: { ...availability[day], slots },
    });
  };

  const addSlot = (day) => {
    const slots = [...(availability[day]?.slots || []), { start: "09:00", end: "17:00" }];
    setAvailability({
      ...availability,
      [day]: { ...availability[day], slots },
    });
  };

  const removeSlot = (day, index) => {
    const slots = (availability[day]?.slots || []).filter((_, i) => i !== index);
    setAvailability({
      ...availability,
      [day]: { ...availability[day], slots },
    });
  };

  if (loading) {
    return <div style={{ padding: "24px", color: colors.text.secondary }}>Loading...</div>;
  }

  const inputStyles = {
    padding: "8px 12px",
    border: `1px solid ${colors.border}`,
    borderRadius: "4px",
    backgroundColor: colors.input.background,
    color: colors.input.text,
    fontSize: "14px",
  };

  return (
    <div>
      <Card title="Weekly Availability" subtitle="Set your available hours for each day">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {DAYS.map((day) => (
            <div
              key={day}
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={availability[day]?.enabled || false}
                    onChange={() => toggleDay(day)}
                    style={{ width: "18px", height: "18px" }}
                  />
                  <span style={{ fontWeight: "600", color: colors.text.primary }}>
                    {DAY_LABELS[day]}
                  </span>
                </label>
                {availability[day]?.enabled && (
                  <Button size="sm" variant="secondary" onClick={() => addSlot(day)}>
                    + Add Slot
                  </Button>
                )}
              </div>

              {availability[day]?.enabled && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginLeft: "30px" }}>
                  {(availability[day]?.slots || []).map((slot, index) => (
                    <div key={index} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <input
                        type="time"
                        value={slot.start || "09:00"}
                        onChange={(e) => updateSlot(day, index, "start", e.target.value)}
                        style={inputStyles}
                      />
                      <span style={{ color: colors.text.secondary }}>to</span>
                      <input
                        type="time"
                        value={slot.end || "17:00"}
                        onChange={(e) => updateSlot(day, index, "end", e.target.value)}
                        style={inputStyles}
                      />
                      {(availability[day]?.slots || []).length > 1 && (
                        <button
                          onClick={() => removeSlot(day, index)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#dc3545",
                            cursor: "pointer",
                            fontSize: "18px",
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={handleSave} loading={saving}>
            Save Availability
          </Button>
        </div>
      </Card>
    </div>
  );
}
