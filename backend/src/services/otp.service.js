// Placeholder OTP provider (Phase 1 skeleton)
export async function sendOtp(email) {
  // In production: send via email/SMS provider
  const code = "123456";
  return { code };
}

export async function verifyOtp(email, code) {
  // Replace with real storage/check logic
  return code === "123456";
}
