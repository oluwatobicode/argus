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
  T00_MANY_REQUEST: 429,
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
  PROJECT_LIMIT: "Free plan limited to 1 project",
  QUOTA_EXCEEDED: "Monthly event limit exceeded",
  INVALID_DSN_KEY: "Invalid DSN key",
  RATE_LIMITED: "Too many requests",
  PLAN_RESTRICTED: "Upgrade your plan to access this feature",
  SUBSCRIPTION_REQUIRED: "Active subscription required",
  PROJECT_NOT_FOUND: "Project not found",
  ISSUE_NOT_FOUND: "Issue not found",
  EVENT_NOT_FOUND: "Event not found",
  ALERT_NOT_FOUND: "Alert rule not found",
  SLUG_TAKEN: "This slug is already in use",
  FORBIDDEN: "You do not have permission to perform this action",
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
  PROJECT_CREATED: "Project created successfully",
  PROJECT_UPDATED: "Project updated successfully",
  PROJECT_DELETED: "Project deleted successfully",
  PROJECTS_FETCHED: "Projects fetched successfully",
  ISSUES_FETCHED: "Issues fetched successfully",
  ISSUE_FETCHED: "Issue fetched successfully",
  ISSUE_STATUS_UPDATED: "Issue status updated",
  EVENTS_FETCHED: "Events fetched successfully",
  TRANSACTIONS_FETCHED: "Transactions fetched successfully",
  VITALS_FETCHED: "Web vitals fetched successfully",
  ALERT_CREATED: "Alert rule created",
  ALERT_UPDATED: "Alert rule updated",
  ALERT_DELETED: "Alert rule deleted",
  ALERTS_FETCHED: "Alert rules fetched",
  CHECKOUT_CREATED: "Checkout session created",
  PORTAL_CREATED: "Billing portal session created",
  USAGE_FETCHED: "Usage data fetched successfully",
  EVENT_RECEIVED: "Event received successfully",
};

export const ORGANIZATION_MESSAGES = {
  NO_PROJECTS: "No projects are in these organization",
  ALL_PROJECTS: "Found your projects",
  ONE_PROJECT: "You can only create one project in the free plan",
};

export const AUTH_MESSAGES = {
  OTP_EXPIRED: "OTP has expired or is invalid",
  INVALID_OTP: "Invalid OTP",
  EMAIL_ALREADY_VERIFIED: "Email is already verified",
  VERIFY_EMAIL_FIRST: "Please verify your email before logging in",
  INVALID_RESET_TOKEN: "Invalid or expired reset token",
};

export const PLAN_EVENT_LIMITS = {
  FREE: 10_000,
  PRO: 500_000,
};

export const RATE_LIMIT = {
  MAX_EVENTS_PER_WINDOW: 100,
  WINDOW_MS: 60_000,
};

export const TIME = {
  ONE_HOUR: 60 * 60,
  ONE_DAY: 60 * 60 * 24,
  ONE_WEEK: 60 * 60 * 24 * 7,
};
