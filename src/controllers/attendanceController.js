// src/controllers/attendanceController.js
import attendanceService from "../services/attendanceService.js";

class AttendanceController {
  async markAttendance(req, res) {
    return await attendanceService.markAttendance(req, res);
  }

  async getAll(req, res) {
    return await attendanceService.index(req, res);
  }
  async getDetail(req, res) {
    return await attendanceService.getDetails(req, res);
  }
  // Mark full day attendance (both shifts)
  async markFullDayAttendance(req, res) {
    return await attendanceService.markFullDayAttendance(attendanceData);
  }

  // Mark user as absent (Admin only)
  async markUserAbsent(req, res) {
    try {
      const { userId, date, reason } = req.body;

      if (!userId || !date) {
        return res.status(400).json({
          success: false,
          message: "userId and date are required",
        });
      }

      const isAdmin = await attendanceService.isAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Admin access required to mark manual attendance",
        });
      }

      const result = await attendanceService.markManualAttendance({
        userId,
        date,
        status: "ABSENT",
        reason,
      });

      res.status(201).json({
        success: true,
        message: "User marked as absent successfully",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Mark user as leave (Admin only)
  async markUserLeave(req, res) {
    try {
      const { userId, date, reason } = req.body;

      if (!userId || !date) {
        return res.status(400).json({
          success: false,
          message: "userId and date are required",
        });
      }

      const isAdmin = await attendanceService.isAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Admin access required to mark manual attendance",
        });
      }

      const result = await attendanceService.markManualAttendance({
        userId,
        date,
        status: "LEAVE",
        reason,
      });

      res.status(201).json({
        success: true,
        message: "User marked as leave successfully",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Bulk mark users as absent/leave (Admin only)
  async bulkMarkManualAttendance(req, res) {
    try {
      const { users } = req.body;

      if (!users || !Array.isArray(users) || users.length === 0) {
        return res.status(400).json({
          success: false,
          message: "users array is required and must not be empty",
        });
      }

      const isAdmin = await attendanceService.isAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Admin access required for bulk operations",
        });
      }

      const results = [];
      const errors = [];

      for (const userData of users) {
        try {
          const result = await attendanceService.markManualAttendance(userData);
          results.push({
            userId: userData.userId,
            success: true,
            data: result,
          });
        } catch (error) {
          errors.push({
            userId: userData.userId,
            success: false,
            error: error.message,
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `Bulk operation completed. Success: ${results.length}, Failed: ${errors.length}`,
        data: {
          successful: results,
          failed: errors,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get attendance by ID
  async getAttendanceById(req, res) {
    try {
      const attendance = await attendanceService.getAttendanceById(
        req.params.id
      );
      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: "Attendance record not found",
        });
      }
      res.status(200).json({
        success: true,
        data: attendance,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get attendance by user ID
  async getAttendanceByUserId(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        status: req.query.status,
        shiftType: req.query.shiftType,
        checkType: req.query.checkType,
      };

      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const result = await attendanceService.getAttendanceByUserId(
        req.params.userId,
        filters,
        page,
        pageSize
      );
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get attendance by date range
  async getAttendanceByDateRange(req, res) {
    try {
      const { startDate, endDate, officeId } = req.query;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
      }

      const result = await attendanceService.getAttendanceByDateRange(
        startDate,
        endDate,
        officeId,
        page,
        pageSize
      );
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update attendance
  async updateAttendance(req, res) {
    return await attendanceService.updateAttendance(req.params.id, req.body);
  }

  // Delete attendance
  async deleteAttendance(req, res) {
    try {
      await attendanceService.deleteAttendance(req.params.id);
      res.status(200).json({
        success: true,
        message: "Attendance record deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get today's attendance summary
  async getTodaysAttendanceSummary(req, res) {
    try {
      const summary = await attendanceService.getTodaysAttendanceSummary(
        req.query.officeId
      );
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get weekly summary
  async getWeeklySummary(req, res) {
    try {
      const { userId, year, week } = req.params;

      if (!year || !week) {
        return res.status(400).json({
          success: false,
          message: "Year and week are required",
        });
      }

      const summary = await attendanceService.getWeeklySummary(
        userId || req.user.id,
        parseInt(year),
        parseInt(week)
      );
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get monthly summary
  async getMonthlySummary(req, res) {
    try {
      const { userId, year, month } = req.params;

      if (!year || !month) {
        return res.status(400).json({
          success: false,
          message: "Year and month are required",
        });
      }

      const summary = await attendanceService.getMonthlySummary(
        userId || req.user.id,
        parseInt(year),
        parseInt(month)
      );
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get yearly summary
  async getYearlySummary(req, res) {
    try {
      const { userId, year } = req.params;

      if (!year) {
        return res.status(400).json({
          success: false,
          message: "Year is required",
        });
      }

      const summary = await attendanceService.getYearlySummary(
        userId || req.user.id,
        parseInt(year)
      );
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get user attendance statistics
  async getUserAttendanceStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
      }

      const stats = await attendanceService.getUserAttendanceStats(
        req.params.userId,
        startDate,
        endDate
      );
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get my attendance (for authenticated user)
  async getMyAttendance(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        status: req.query.status,
        shiftType: req.query.shiftType,
        checkType: req.query.checkType,
      };

      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const result = await attendanceService.getAttendanceByUserId(
        req.user.id,
        filters,
        page,
        pageSize
      );
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Mark my attendance (for authenticated user)
  async markMyAttendance(req, res) {
    return attendanceService.markAttendance(req, res);
  }

  // Mark my full day attendance
  async markMyFullDayAttendance(req, res) {
    try {
      const attendanceData = {
        ...req.body,
        userId: req.user.id,
      };

      const results = await attendanceService.markFullDayAttendance(
        attendanceData
      );
      res.status(201).json({
        success: true,
        message: "Full day attendance marked successfully",
        data: results,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Submit attendance from mobile app
  async submitAttendance(req, res) {
    try {
      const {
        gpsLatitude,
        gpsLongitude,
        dateTime,
        deviceHash,
        attendanceType,
      } = req.body;

      if (
        !gpsLatitude ||
        !gpsLongitude ||
        !dateTime ||
        !deviceHash ||
        !attendanceType
      ) {
        return res.status(400).json({
          success: false,
          message:
            "gpsLatitude, gpsLongitude, dateTime, deviceHash, and attendanceType are required.",
        });
      }

      const attendanceDate = new Date(dateTime);
      if (isNaN(attendanceDate.getTime())) {
        throw new Error(
          "Invalid dateTime format. Use ISO format like: 2025-11-03T16:30:00Z"
        );
      }

      const validAttendanceTypes = [
        "MORNING_IN",
        "AFTERNOON_IN",
        "MORNING_OUT",
        "AFTERNOON_OUT",
      ];
      if (!validAttendanceTypes.includes(attendanceType)) {
        return res.status(400).json({
          success: false,
          message:
            "attendanceType must be one of: MORNING_IN, AFTERNOON_IN, MORNING_OUT, AFTERNOON_OUT",
        });
      }

      const attendance = await attendanceService.submitAttendance({
        userId: req.user.id,
        gpsLatitude: parseFloat(gpsLatitude),
        gpsLongitude: parseFloat(gpsLongitude),
        dateTime: new Date(dateTime),
        deviceHash,
        attendanceType,
      });

      res.status(201).json({
        success: true,
        message: "Attendance submitted successfully.",
        data: attendance,
      });
    } catch (error) {
      console.error("Attendance submission error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to submit attendance.",
      });
    }
  }

  // Leave Request Methods
  async createLeaveRequest(req, res) {
    try {
      const { startDate, employeeId, daysOfLeave, leaveType } = req.body;

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "Employee record not found for user",
        });
      }

      const result = await attendanceService.createLeaveRequest({
        employeeId,
        startDate,
        daysOfLeave,
        leaveType,
      });

      return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getLeaveRequests(req, res) {
    try {
      const { status, page = 1, pageSize = 10 } = req.query;
      const userId = req.user.id;
      console.log("userid", userId);

      const employeeData = await attendanceService.getEmployeeByUserId(userId);
      if (!employeeData || !employeeData.id) {
        return res.status(400).json({
          success: false,
          message: "Employee record not found for user",
        });
      }

      let result;

      if (!req.query.myRequests && employeeData.officeId) {
        // User sees all requests from their office
        result = await attendanceService.getLeaveRequests({
          officeId: employeeData.officeId,
          status,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
        });
      } else {
        // User sees only their requests
        result = await attendanceService.getLeaveRequests({
          employeeId: employeeData.id,
          status,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
        });
      }

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  async getPendingLeaveRequests(req, res) {
    try {
      const { page = 1, pageSize = 10 } = req.query;
      const userId = req.user.id;

      const employeeData = await attendanceService.getEmployeeByUserId(userId);
      if (!employeeData || !employeeData.id) {
        return res.status(400).json({
          success: false,
          message: "Employee record not found for user",
        });
      }

      if (!employeeData.officeId) {
        return res.status(400).json({
          success: false,
          message: "Office not found for user",
        });
      }

      const result = await attendanceService.getLeaveRequests({
        officeId: employeeData.officeId,
        status: "PENDING",
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      });

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  async approveLeaveRequest(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const employeeData = await attendanceService.getEmployeeByUserId(userId);
      if (!employeeData || !employeeData.id) {
        return res.status(400).json({
          success: false,
          message: "Employee record not found for user",
        });
      }

      // Check if user is admin or office manager in the same office as the leave request
      const isAdmin = await attendanceService.isAdmin(userId);
      const leaveRequest = await attendanceService.getLeaveRequestById(id);

      if (!leaveRequest.success) {
        return res.status(404).json({
          success: false,
          message: "Leave request not found",
        });
      }

      // Get the office of the employee who made the leave request
      const requestEmployee = await attendanceService.getEmployeeByUserId(
        leaveRequest.data.userId
      );

      if (
        !isAdmin &&
        (!employeeData.officeId ||
          employeeData.officeId !== requestEmployee.officeId)
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only approve leave requests from your office",
        });
      }

      const result = await attendanceService.approveLeaveRequest(id, userId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async rejectLeaveRequest(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const employeeData = await attendanceService.getEmployeeByUserId(userId);
      if (!employeeData || !employeeData.id) {
        return res.status(400).json({
          success: false,
          message: "Employee record not found for user",
        });
      }

      // Check if user is admin or in the same office as the leave request
      const isAdmin = await attendanceService.isAdmin(userId);
      const leaveRequest = await attendanceService.getLeaveRequestById(id);

      if (!leaveRequest.success) {
        return res.status(404).json({
          success: false,
          message: "Leave request not found",
        });
      }

      // Get the office of the employee who made the leave request
      const requestEmployee = await attendanceService.getEmployeeByUserId(
        leaveRequest.data.userId
      );

      if (
        !isAdmin &&
        (!employeeData.officeId ||
          employeeData.officeId !== requestEmployee.officeId)
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only reject leave requests from your office",
        });
      }

      const result = await attendanceService.rejectLeaveRequest(id, userId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  async getLeaveRequestById(req, res) {
    try {
      const { id } = req.params;
      const result = await attendanceService.getLeaveRequestById(id);

      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }}
  // Get attendance by office hierarchy (for managers)
  async getAttendanceByOfficeHierarchy(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        attendanceType: req.query.attendanceType,
        employeeName: req.query.employeeName,
        status: req.query.status,
      };

      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const result = await attendanceService.getAttendanceByOfficeHierarchy(
        req.user.id,
        filters,
        page,
        pageSize
      );

      res.status(200).json({
        success: true,
        message: "Attendance records retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Get attendance by office hierarchy error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve attendance records",

      });
    }
  }
}

export default new AttendanceController();
