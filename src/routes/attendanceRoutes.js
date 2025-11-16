import express from "express";
import attendanceController from "../controllers/attendanceController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);



/**
 * @swagger
 * /attendance:
 *   post:
 *     summary: Mark attendance
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gps_longitude:
 *                 type:long
 *                 example:36.8333
 *               deviceId:
 *                 type:string
 *               shiftType:
 *                 type: string
 *                 enum: [morning, afternoon]
 *               checkType:
 *                 type: string
 *                 enum: [checkIn, checkOut]
 *               officeId:
 *                 type: string
 *               deviceId:
 *                 type: string
 *               gpsLocation:
 *                 type: object
 *     responses:
 *       201:
 *         description: Attendance marked successfully
 *       401:
 *         description: Unauthorized
 */

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

/**
 * @swagger
 * /attendance/manager/hierarchy:
 *   get:
 *     summary: Get attendance records for employees under manager's office hierarchy
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: attendanceType
 *         schema:
 *           type: string
 *           enum: [morningCheckIn, morningCheckOut, afternoonCheckIn, afternoonCheckOut]
 *         description: Filter by attendance type
 *       - in: query
 *         name: employeeName
 *         schema:
 *           type: string
 *         description: Filter by employee name (partial match)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PRESENT, LATE, PERMISSION, LEAVE, ABSENT]
 *         description: Filter by attendance status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       employeeId:
 *                         type: string
 *                       employeeName:
 *                         type: string
 *                       officeName:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 *                       details:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             timestamp:
 *                               type: string
 *                               format: date-time
 *                             attendanceType:
 *                               type: string
 *                             gps_latitude:
 *                               type: number
 *                             gps_longitude:
 *                               type: number
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/manager/hierarchy", attendanceController.getAttendanceByOfficeHierarchy);

/**
 * @swagger
 * /attendance/weekly/{userId}/{year}/{week}:
 *   get:
 *     summary: Get weekly summary
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *       - in: path
 *         name: year
 *         schema:
 *           type: integer
 *         required: true
 *         description: The year
 *       - in: path
 *         name: week
 *         schema:
 *           type: integer
 *         required: true
 *         description: The week number
 *     responses:
 *       200:
 *         description: The weekly attendance summary
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/weekly/:userId/:year/:week",
  attendanceController.getWeeklySummary
);

// router.get(
//   "/weekly/:userId/:year/:week",
//   attendanceController.getWeeklySummary
// );


// router.get(
//   "/monthly/:userId/:year/:month",
//   attendanceController.getMonthlySummary
// );


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
