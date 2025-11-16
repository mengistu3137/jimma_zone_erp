// src/routes/announcementRoute.js
import express from "express";
import { authenticate, checkPermission } from "../middleware/authMiddleware.js";

import {
  createAnnouncement,
  getAllAnnouncement,
  getDetailById,
  updateAnnouncement,
  softDeleteAnnouncement,
  restoreAnnouncement
} from "../controllers/announcementController.js";

const router = express.Router();

// CREATE
router.post(
  "/",
  authenticate,
  checkPermission("create_announcement"),
  createAnnouncement
);

// LIST
router.get(
  "/",
  authenticate,
  checkPermission("view_announcements"),
  getAllAnnouncement
);
router.put(
  "/restore",
  authenticate,
  checkPermission("restore_announcement"),
  restoreAnnouncement
);
// DETAIL
router.get(
  "/:id",
  authenticate,
  checkPermission("view_announcements"),
  getDetailById
);

// UPDATE
router.put(
  "/:id",
  authenticate,
  checkPermission("update_announcement"),
  updateAnnouncement
);

// SOFT DELETE
router.delete(
  "/:id",
  authenticate,
  checkPermission("delete_announcement"),
  softDeleteAnnouncement
);

// RESTORE
router.put(
  "/restore/:id",
  authenticate,
  checkPermission("restore_announcement"),
  restoreAnnouncement
);

export default router;
