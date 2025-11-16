import express from "express";
import { authenticate, checkPermission } from "../middleware/authMiddleware.js";
import { uploadSingle } from "../middleware/upload.middleware.js";
import {
  createLetter,
  getLetters,
  getLetterById,
  updateLetter,
  deleteLetter,
  sendLetterForApproval,
  approveLetter,
  rejectLetter,
  createDirectedLetter,
  getDirectedLetters,
  getDirectedLetterById,
  updateDirectedLetter,
  deleteDirectedLetter
} from "../controllers/letterController.js";

const router = express.Router();
// Directed Letter Routes

router.post(
  "/direct",
  authenticate,
  checkPermission("create_letter"),
  createDirectedLetter
);

router.get(
  "/direct",
  authenticate, 
  checkPermission("view_letters"),
  getDirectedLetters
);

router.get(
  "/direct/:id",
  authenticate,
  checkPermission("view_letters"),
  getDirectedLetterById
);

router.put(
  "/direct/:id",
  authenticate,
  checkPermission("update_letter"),
  updateDirectedLetter
);
router.delete(
  "/direct/:id",
  authenticate,
  checkPermission("delete_letter"),
  deleteDirectedLetter
);

// Standard Letter Routes
router.post(
  "/",
  authenticate,
  checkPermission("create_letter"),
  uploadSingle("letterFile"),
  createLetter
);


 
router.get("/", authenticate, checkPermission("view_letters"), getLetters);


router.get(
  "/:id",
  authenticate,
  checkPermission("view_letters"),
  getLetterById
);


 
router.put(
  "/:id",
  authenticate,
  checkPermission("update_letter"),
  uploadSingle("letterFile"),
  updateLetter
);


 
router.delete(
  "/:id",
  authenticate,
  checkPermission("delete_letter"),
  deleteLetter
);



router.post(
  "/:id/send",
  authenticate,
  checkPermission("send_for_approval"),
  sendLetterForApproval
);


 
router.post(
  "/:id/approve",
  authenticate,
  checkPermission("approve_letter"),
  approveLetter
);


 
router.post(
  "/:id/reject",
  authenticate,
  checkPermission("reject_letter"),
  rejectLetter
);

export default router;
