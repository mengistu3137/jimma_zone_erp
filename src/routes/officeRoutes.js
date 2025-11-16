import express from "express";
import { authenticate, checkPermission } from "../middleware/authMiddleware.js";

import {
  // Office Leaders
  createOfficeLeader,
  getAllOfficeLeaders,
  getOfficeLeaderById,
  updateOfficeLeader,

  // Offices
  createOffice,
  getAllOffices,
  getOfficeById,
  updateOffice,
  deleteOffice,
  getOfficeHierarchy,
} from "../controllers/officeController.js";

const router = express.Router();

/* --------------------------------------------
 * OFFICE LEADER ROUTES
 * -------------------------------------------- */
// Create office
router.post(
  "/",
  authenticate,
  checkPermission("create_office"),
  createOffice
);

// Get all offices
router.get(
  "/",
  authenticate,
  checkPermission("view_offices"),
  getAllOffices
);

// Create office leader
router.post(
  "/leaders",
  authenticate,
  checkPermission("create_office_leader"),
  createOfficeLeader
);

// Get all leaders
router.get(
  "/leaders",
  authenticate,
  checkPermission("view_office_leaders"),
  getAllOfficeLeaders
);


// Get office by ID
router.get(
  "/:id",
  authenticate,
  checkPermission("view_offices"),
  getOfficeById
);

// Update office
router.put(
  "/:id",
  authenticate,
  checkPermission("update_office"),
  updateOffice
);

// Soft delete office
router.delete(
  "/:id",
  authenticate,
  checkPermission("delete_office"),
  deleteOffice
);



// Office hierarchy tree
router.get(
  "/hierarchy/:officeId",
  authenticate,
  checkPermission("view_offices"),
  getOfficeHierarchy
);






// Get leader by ID
router.get(
  "/leaders/:id",
  authenticate,
  checkPermission("view_office_leaders"),
  getOfficeLeaderById
);

// Update leader
router.put(
  "/leaders/:id",
  authenticate,
  checkPermission("update_office_leader"),
  updateOfficeLeader
);

/* --------------------------------------------
 * OFFICE ROUTES
 * -------------------------------------------- */


// Offices under manager (filtered)

export default router;