import { useState, useEffect } from "react";
import { lawyerApi } from "../../services/lawyer.api";
import { Card, Button, Input, Checkbox } from "../../components/ui";

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
    return <div className="p-6 text-text-secondary">Loading...</div>;
  }

  return (
    <div>
      <Card title="Weekly Availability" subtitle="Set your available hours for each day">
        <div className="flex flex-col gap-4">
          {DAYS.map((day) => (
            <div
              key={day}
              className="border border-border rounded-lg p-4"
            >
              <div className={`flex justify-between items-center ${availability[day]?.enabled ? "mb-3" : ""}`}>
                <Checkbox
                  id={`day-${day}`}
                  label={DAY_LABELS[day]}
                  checked={availability[day]?.enabled || false}
                  onChange={() => toggleDay(day)}
                  containerClassName="mb-0"
                />
                {availability[day]?.enabled && (
                  <Button size="sm" variant="secondary" onClick={() => addSlot(day)}>
                    + Add Slot
                  </Button>
                )}
              </div>

              {availability[day]?.enabled && (
                <div className="flex flex-col gap-2 ml-8">
                  {(availability[day]?.slots || []).map((slot, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Input
                        type="time"
                        value={slot.start || "09:00"}
                        onChange={(e) => updateSlot(day, index, "start", e.target.value)}
                        containerClassName="mb-0 w-auto"
                        fullWidth={false}
                        className="py-2 px-3"
                      />
                      <span className="text-text-secondary">to</span>
                      <Input
                        type="time"
                        value={slot.end || "17:00"}
                        onChange={(e) => updateSlot(day, index, "end", e.target.value)}
                        containerClassName="mb-0 w-auto"
                        fullWidth={false}
                        className="py-2 px-3"
                      />
                      {(availability[day]?.slots || []).length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSlot(day, index)}
                          className="text-danger py-1 px-2"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            Save Availability
          </Button>
        </div>
      </Card>
    </div>
  );
}
