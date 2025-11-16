// middlewares/sanitizeResponse.js

const SENSITIVE_FIELDS = [
  "password",
  "token",
  "refreshToken",
  "otp",
  "secret",
  "apiKey",
  "deletedAt",
];

function sanitize(obj) {
  if (obj === null || obj === undefined) return obj;

  // 1️⃣ Allow Date objects to pass unchanged
  if (obj instanceof Date) return obj;

  if (typeof obj !== "object") return obj;

  // 2️⃣ Array handling
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item));
  }

  // 3️⃣ Normal object handling
  const clean = {};
  for (const key in obj) {
    if (SENSITIVE_FIELDS.includes(key)) continue;

    const value = obj[key];

    clean[key] =
      typeof value === "object" && value !== null
        ? sanitize(value)
        : value;
  }

  return clean;
}

const safeMiddleware = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (payload) => {
    if (payload && typeof payload === "object") {
      if ("data" in payload) {
        payload.data = sanitize(payload.data);
      } else {
        payload = sanitize(payload);
      }
    }
    return originalJson(payload);
  };

  next();
};

export default safeMiddleware;
