import { ApiError } from "../helpers/apiError.js";
import Availability from "../models/Availability.js";

const DEFAULT_SLOTS = [{ start: "09:00", end: "17:00" }];

export async function getAvailability(lawyerUserId) {
  let availability = await Availability.findOne({ lawyerUserId });
  
  if (!availability) {
    availability = await Availability.create({
      lawyerUserId,
      monday: { enabled: true, slots: DEFAULT_SLOTS },
      tuesday: { enabled: true, slots: DEFAULT_SLOTS },
      wednesday: { enabled: true, slots: DEFAULT_SLOTS },
      thursday: { enabled: true, slots: DEFAULT_SLOTS },
      friday: { enabled: true, slots: DEFAULT_SLOTS },
      saturday: { enabled: false, slots: [] },
      sunday: { enabled: false, slots: [] }
    });
  }
  
  return availability.toObject();
}

export async function updateAvailability(lawyerUserId, data) {
  let availability = await Availability.findOne({ lawyerUserId });
  
  if (!availability) {
    availability = new Availability({ lawyerUserId });
  }
  
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  
  for (const day of days) {
    if (data[day] !== undefined) {
      availability[day] = data[day];
    }
  }
  
  await availability.save();
  return availability.toObject();
}

export async function getAvailableSlots(lawyerUserId, date) {
  const availability = await getAvailability(lawyerUserId);
  const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  
  const dayAvailability = availability[dayOfWeek];
  if (!dayAvailability || !dayAvailability.enabled) {
    return [];
  }
  
  return dayAvailability.slots;
}
