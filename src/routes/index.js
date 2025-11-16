import express from "express";
const router = express.Router();

import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import roleRoutes from "./roleRoutes.js";
import officeRoutes from "./officeRoutes.js";
import permissionRoutes from "./permissionRoutes.js";
import employeeRoutes from "./employeeRoutes.js";
import attendanceRoutes from "./attendanceRoutes.js";
import fileRoutes from "./fileRoutes.js";
import letterRoutes from "./letterRoutes.js";
import safeMiddleware from "../middleware/safeMiddleware.js";
import announcementRoutes from "./announcementRoute.js";

router.use("/auth", authRoutes);

// Apply safeMiddleware to sanitize responses sensetive data is not returned
router.use(safeMiddleware);
router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/offices", officeRoutes);
router.use("/permissions", permissionRoutes);
router.use("/employees", employeeRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/files", fileRoutes);
router.use("/letters", letterRoutes);
router.use("/announcements", announcementRoutes);

export default router;
