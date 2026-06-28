import crypto from "crypto";

export const generateAlphaNumeric = (length: number): string => {
  if (length <= 0 || !Number.isInteger(length)) {
    throw new Error("OTP length must be a positive integer");
  }

  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
  let otp = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    otp += chars.charAt(randomIndex);
  }

  return otp;
};
