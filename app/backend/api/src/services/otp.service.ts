import redisClient from "../config/redis.config";
import { generateAlphaNumeric } from "../utils/otp.utils";
import { TIME } from "../config/constants.config";

const OTP_LENGTH = 6;
const OTP_TTL = 10 * 60; // 10 minutes in seconds
const OTP_PREFIX = "argus:otp:";

/**
 * Generate an OTP, store it in Redis with a TTL, and return it.
 */
export async function createOtp(email: string): Promise<string> {
  const otp = generateAlphaNumeric(OTP_LENGTH);
  const key = `${OTP_PREFIX}${email}`;

  // SET with EX — auto-expires after OTP_TTL seconds
  await redisClient.set(key, otp, "EX", OTP_TTL);

  return otp;
}

/**
 * Verify the OTP against what's stored in Redis.
 * Returns true if valid, false if expired or wrong.
 * Deletes the OTP from Redis after successful verification (single-use).
 */
export async function verifyOtp(
  email: string,
  otp: string,
): Promise<boolean> {
  const key = `${OTP_PREFIX}${email}`;
  const storedOtp = await redisClient.get(key);

  if (!storedOtp || storedOtp !== otp) {
    return false;
  }

  // OTP is valid — delete it so it can't be reused
  await redisClient.del(key);
  return true;
}

/**
 * Delete any existing OTP for this email (used before generating a new one on resend).
 */
export async function deleteOtp(email: string): Promise<void> {
  const key = `${OTP_PREFIX}${email}`;
  await redisClient.del(key);
}
