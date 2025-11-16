// authMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// ✅ Verify JWT token
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role } or { id, roles }
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// ✅ Restrict route access to specific roles
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: "Access denied: no user info" });
    }

    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles
      : [req.user.role]; // handle both singular 'role' or plural 'roles'

    const hasPermission = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasPermission) {
      return res
        .status(403)
        .json({ message: "Access denied: insufficient permissions" });
    }

    next();
  };
};

// Permission-based authorization
export const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res
        .status(403)
        .json({ message: "Access denied: No permissions found." });
    }

    const userPermissions = req.user.permissions;

    if (!userPermissions.includes(requiredPermission)) {
      return res.status(403).json({
        message: `Access denied: Missing permission.`,
      });
    }

    next();
  };
};
