export const API_VERSION = {
  version: "v1",
};

export const HASH_ROUNDS = 8;

export const ACCESS_TOKEN_COOKIE = "accessToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export const ERROR_MESSAGES = {
  NOT_LOGGED_IN: "You need to be logged in!",
  INVALID_CREDENTIALS: "Invalid email or password",
  UNAUTHORIZED: "You are not authorized to perform this action",
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Validation error",
  SERVER_ERROR: "Internal server error",
  DUPLICATE_ENTRY: "Email already exists",
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  SESSION_EXPIRED: "Session expired, please login again",
  INVALID_TOKEN: "Invalid token",
  PASSWORD_MIN_LENGTH: "New password must be at least 6 characters",
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  SIGNUP_SUCCESS: "Signup successful, check your email for verification code",
  UPDATE_SUCCESS: "Update successful",
  DELETE_SUCCESS: "Delete successful",
  CREATE_SUCCESS: "Create successful",
  FETCH_SUCCESS: "Fetched successfully",
  OTP_VERIFIED: "OTP verified successfully",
  OTP_RESENT: "OTP resent successfully",
  PASSWORD_RESET_LINK_SENT: "Kindly check your mail",
  PASSWORD_CHANGED: "Password changed successfully",
  PASSWORD_RESET_SUCCESS: "Password reset successful",
  TOKEN_REFRESHED: "Token refreshed successfully",
};

export const AUTH_MESSAGES = {
  OTP_EXPIRED: "OTP has expired or is invalid",
  INVALID_OTP: "Invalid OTP",
  EMAIL_ALREADY_VERIFIED: "Email is already verified",
  VERIFY_EMAIL_FIRST: "Please verify your email before logging in",
  INVALID_RESET_TOKEN: "Invalid or expired reset token",
};

export const TIME = {
  ONE_HOUR: 60 * 60,
  ONE_DAY: 60 * 60 * 24,
  ONE_WEEK: 60 * 60 * 24 * 7,
};
