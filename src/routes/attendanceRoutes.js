import express from "express";
import attendanceController from "../controllers/attendanceController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);





router.post("/", attendanceController.markAttendance);


router.post(
  "/full-day",
  authorize("Admin"),
  attendanceController.markFullDayAttendance
);



// router.post("/absent", attendanceController.markUserAbsent);


// router.post("/leave", attendanceController.markUserLeave);


// router.post("/bulk-manual", attendanceController.bulkMarkManualAttendance);


router.get("/", attendanceController.getAll);
router.get("/attendance-detail", attendanceController.getDetail);


router.get("/me/today", attendanceController.getTodaysAttendanceSummary);



router.get("/:id", attendanceController.getAttendanceById);


router.get("/user/:userId", attendanceController.getAttendanceByUserId);


router.put("/:id", attendanceController.updateAttendance);


router.delete("/:id", attendanceController.deleteAttendance);

router.get("/stats/:userId", attendanceController.getUserAttendanceStats);


router.post("/submit", attendanceController.submitAttendance);


router.get("/manager/hierarchy", attendanceController.getAttendanceByOfficeHierarchy);


router.post(
  "/me/attendance/full-day",
  attendanceController.markMyFullDayAttendance
);


// router.get("/me/weekly/:year/:week", attendanceController.getWeeklySummary);


// router.get("/me/monthly/:year/:month", attendanceController.getMonthlySummary);


router.get("/me/yearly/:year", attendanceController.getYearlySummary);
// Leave Request Routes start here
router.post("/leave-requests", attendanceController.createLeaveRequest);
router.get("/leave-requests/get", attendanceController.getLeaveRequests);
router.get(
  "/leave-requests/pending",
  attendanceController.getPendingLeaveRequests
);
router.put(
  "/leave-requests/:id/approve",
  attendanceController.approveLeaveRequest
);
router.put(
  "/leave-requests/:id/reject",
  attendanceController.rejectLeaveRequest
);
router.get("/leave-requests/:id", attendanceController.getLeaveRequestById);
// Leave Request Routes end here
export default router;
