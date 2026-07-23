/**
 * Account fields belong on User (auth identity).
 * Profile models store role-specific data only.
 */

export const AUTH_USER_FIELDS = [
  "id",
  "email",
  "role",
  "isEmailVerified",
  "profileImage",
  "profileImageMediaId",
  "createdAt",
  "updatedAt"
];

export const CLIENT_PROFILE_FIELDS = [
  "fullName",
  "phone",
  "whatsapp",
  "city",
  "address",
  "cnic",
  "dateOfBirth",
  "gender",
  "profileImage"
];

export const LAWYER_PROFILE_FIELDS = [
  "fullName",
  "phone",
  "whatsapp",
  "city",
  "officeAddress",
  "cnic",
  "barCouncilNumber",
  "barCouncil",
  "specialization",
  "languages",
  "experienceYears",
  "hourlyRate",
  "consultationFee",
  "bio",
  "profileImage"
];
