import express from "express";
import FileController from "../controllers/fileController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

router.post("/get-url", FileController.getFileUrl);

// Get supported file types
router.get("/types", FileController.getSupportedTypes);

// Check if file exists
router.get("/check", FileController.checkFileExists);

// Upload single file
router.post("/upload", FileController.uploadSingle);

// Upload multiple files
router.post("/upload-multiple", FileController.uploadMultiple);

// Update or replace file
router.put("/update", FileController.updateFile);

// Delete single file
router.delete("/delete", FileController.deleteFile);

// Delete multiple files
router.delete("/bulk-delete", FileController.bulkDeleteFiles);

export default router;
