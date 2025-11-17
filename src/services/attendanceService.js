import crudService from "./crudService.js";

import { format } from "date-fns";



import officeService from "./officeService.js";
import userService from "./userService.js";

const crud = new crudService();
// Configuration for shifts and timing
class AttendanceService {
  shiftConfig = {
    morning: {
      checkIn: { start: 0, end: 11 },
      checkOut: { start: 11, end: 13 },
    },
    afternoon: {
      checkIn: { start: 13, end: 16 },
      checkOut: { start: 16, end: 23 },
    },
    fridayAfternoon: {
      checkIn: { start: 14, end: 16 },
      checkOut: { start: 16, end: 23 },
    },
  };

  MAX_DISTANCE_METERS = 1000;

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
      Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  formatAttendanceResponse(data) {
    if (!data) return [];

    const records = Array.isArray(data) ? data : [data];
    return records.map((a) => ({
      id: a.id,
      user: a.user
        ? {
          id: a.user.id,
          name: a.user.name,
          email: a.user.email,
        }
        : null,
      employee: a.employee
        ? {
          id: a.employee.id,
          office: a.employee.office || null,
        }
        : null,
      date: a.date,
      status: a.status,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  }


  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // ----- Authorization / simple validators -----
  async isAdmin(userId) {
    try {
      const resp = await userService.getUserById(userId);
      if (!resp.success) return false;
      const user = resp.data;
      if (!user || !user.roles) return false;
      return user.roles.some((userRole) =>
        userRole.role.name.toLowerCase().includes("admin")
      );
    } catch (err) {
      return false;
    }
  }

  // Validate device ID
  async validateDevice(userId, deviceId) {
    if (!deviceId) {
      throw new Error("Device ID is required");
    }

    // 🔹 Fetch employee by userId
    const employeeRes = await crud.findAll("employee", {
      filters: { userId },
    });

    if (!employeeRes.success || employeeRes.data.length === 0) {
      throw new Error("Employee record not found for this user.");
    }

    const employee = employeeRes.data[0];

    // 🔹 If employee has no registered device yet → hash and store
    if (!employee.deviceHash) {
      const hashedDevice = await bcrypt.hash(deviceHash, 10); // 10 = salt rounds

      const updateRes = await crud.update("employee", employee.id, {
        deviceHash: hashedDevice,
      });

      if (!updateRes.success) {
        throw new Error(updateRes.message);
      }

      console.log("📱 New device registered for employee:", employee.id);
      return true;
    }

    // 🔹 If device hash doesn’t match → reject
    const isMatch = await bcrypt.compare(deviceHash, employee.deviceHash);
    if (!isMatch) {
      throw new Error("Unauthorized device detected. Access denied.");
    }

    // ✅ All checks passed
    return true;
  }

  async validateLocation(userId, gpsLatitude, gpsLongitude) {
    try {
      const distance = this.calculateDistance(
        gpsLatitude,
        gpsLongitude,
        this.staticOfficeLocation.latitude,
        this.staticOfficeLocation.longitude
      );

      if (distance > this.MAX_DISTANCE_METERS) {
        throw new Error(
          `Attendance must be submitted within ${this.MAX_DISTANCE_METERS
          }m of workplace location. Current distance: ${distance.toFixed(2)}m`
        );
      }

      return distance;
    } catch (error) {
      throw error;
    }
  }

  mapToAttendanceType(shiftType, checkType) {
    const typeMap = {
      morning_checkIn: "MORNING_IN",
      morning_checkOut: "MORNING_OUT",
      afternoon_checkIn: "AFTERNOON_IN",
      afternoon_checkOut: "AFTERNOON_OUT",
    };

    const key = `${shiftType}_${checkType}`;
    if (!typeMap[key]) {
      throw new Error(
        `Invalid shiftType/checkType combination: ${shiftType}/${checkType}`
      );
    }

    return typeMap[key];
  }

  determineStatus(shiftType, checkType, currentTime = new Date()) {
    const hour = currentTime.getHours();
    const shiftTime = this.shiftConfig[shiftType][checkType];
    return hour >= shiftTime.start && hour <= shiftTime.end
      ? "PRESENT"
      : "LATE";
  }

  isWithinShiftTime(shiftType, checkType, currentTime = new Date()) {
    const hour = currentTime.getHours();
    const shiftTime = this.shiftConfig[shiftType][checkType];
    return hour >= shiftTime.start && hour <= shiftTime.end;
  }
  getShift(currentTime = new Date()) {
    const dayOfWeek = currentTime.getDay();
    const currentHour = currentTime.getHours() - 3; // back to UTC
    const isWithinRange = (start, end) =>
      currentHour >= start && currentHour < end;
    if (
      isWithinRange(
        this.shiftConfig.morning.checkIn.start,
        this.shiftConfig.morning.checkIn.end
      )
    ) {
      return "morningCheckIn";
    }
    if (
      isWithinRange(
        this.shiftConfig.morning.checkOut.start,
        this.shiftConfig.morning.checkOut.end
      )
    ) {
      return "morningCheckOut";
    }
    let afternoonConfig;
    if (dayOfWeek === 5) {
      afternoonConfig = this.shiftConfig.fridayAfternoon;
    } else if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      afternoonConfig = this.shiftConfig.afternoon;
    } else {
      return null;
    }
    if (
      isWithinRange(afternoonConfig.checkIn.start, afternoonConfig.checkIn.end)
    ) {
      return "afternoonCheckIn";
    }
    if (
      isWithinRange(
        afternoonConfig.checkOut.start,
        afternoonConfig.checkOut.end
      )
    ) {
      return "afternoonCheckOut";
    }

    return null;
  }
  // Leave type durations
  leaveTypeDurations = {
    MATERNITY: 40,
    PATERNITY: 4,
  };

  // Add these methods to your class for leace management

  // Check if user is office manager
  // async isOfficeManager(userId) {
  //   try {
  //     const officeLeaderResp = await crud.findAll("OfficeLeader", {
  //       filters: {
  //         userId,
  //         endDate: null, // Currently active office leader
  //       },
  //     });

  //     return officeLeaderResp.success && officeLeaderResp.data.length > 0;
  //   } catch (error) {
  //     return false;
  //   }
  // }

  // Calculate end date excluding weekends
  calculateEndDate(startDate, daysOfLeave) {
    const isWeekend = (date) => {
      const day = date.getDay();
      return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
    };

    let currentDate = new Date(startDate);
    let daysCounted = 1; // Start counting from 1 (include the start date)

    // If start date is weekend, we still count it as day 1 but need to adjust
    if (isWeekend(currentDate)) {
      daysCounted = 1; // Still count the start date as day 1 even if weekend
    }

    // Move forward until we reach the required number of days
    while (daysCounted < daysOfLeave) {
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);

      // Only count if it's a weekday
      if (!isWeekend(currentDate)) {
        daysCounted++;
      }
    }

    return currentDate;
  }

  // Get employee by user ID
  async getEmployeeByUserId(userId) {
    try {
      const employeeResp = await crud.findAll("employee", {
        filters: { userId },
        page: 1,
        pageSize: 1,
      });

      if (!employeeResp.success || employeeResp.data.length === 0) {
        return null;
      }

      return employeeResp.data[0];
    } catch (error) {
      return null;
    }
  }

  // Get user's office ID
  // async getUserOfficeId(userId) {
  //   try {
  //     // First try to get from OfficeLeader (for office managers)
  //     const officeLeaderResp = await crud.findAll("OfficeLeader", {
  //       filters: {
  //         userId,
  //         endDate: null, // Currently active office leader
  //       },
  //       page: 1,
  //       pageSize: 1,
  //     });

  //     if (officeLeaderResp.success && officeLeaderResp.data.length > 0) {
  //       return officeLeaderResp.data[0].officeId;
  //     }

  //     // If not office leader, get from employee record
  //     const employeeData = await this.getEmployeeByUserId(userId);
  //     if (employeeData && employeeData.officeId) {
  //       return employeeData.officeId;
  //     }

  //     return null;
  //   } catch (error) {
  //     return null;
  //   }
  // }
  // leave management ends here

  async fillAttendance(empId, data) {
    const { userId, deviceId, gps_longitude, gps_latitude, timeTaken } = data;

    const currentTime = new Date(timeTaken);
    currentTime.setUTCHours(0, 0, 0, 0);

    const shift = this.getShift(new Date(timeTaken));

    const existAttendance = await crud.findFirst("attendance", {
      employeeId: empId,
      date: currentTime,
    });

    let attendance;
    if (!existAttendance) {
      const created = await crud.create("attendance", {
        employeeId: empId,
        date: currentTime,
        userId,
      });
      console.log(created);

      if (!created.success) {
        return {
          status: 500,
          success: false,
          message: "Failed to create attendance",
        };
      }
      attendance = created.data; // ✅ Important line
    } else {
      // console.log("exist",existAttendance);
      attendance = existAttendance ? existAttendance : null;
    }

    const existingDetails = await crud.findFirst("AttendanceDetail", {
      type: shift,
      attendanceId: attendance?.id,
    });
    if (existingDetails) {
      return {
        status: 409,
        success: false,
        message: "Attendance is already taken",
      };
    }
    const attendanceDetails = await crud.create("AttendanceDetail", {
      deviceId,
      gps_longitude,
      gps_latitude,
      timestamp: new Date(timeTaken),
      attendanceId: attendance?.id,
      type: shift,
    });

    if (attendanceDetails.success) {
      const allDetails = await crud.findAll("AttendanceDetail", {
        where: { attendanceId: attendance.id },
      });

      if (shift === "afternoonCheckOut" && allDetails.data.length >= 3) {
        await crud.update("attendance", attendance.id, { status: "PRESENT" });
      }

      return {
        success: true,
        data: attendanceDetails.data,
        message: "Attendance is taken successfully",
      };
    }

    return { status: 404, success: false, message: attendanceDetails.message };
  }

  async filterEmployeeIds(employees) {
    if (!employees || employees.length === 0) {
      return { existingIds: [], nonExistentIds: [] };
    }
    const uniqueIdsToCheck = [...new Set(employees)];

    const existingEmployees = await crud.findAll("employee", {
      where: { id: { in: uniqueIdsToCheck } },
      select: { id: true },
    });
    const existingIdSet = new Set(existingEmployees.data?.map((emp) => emp.id));
    const existingIds = Array.from(existingIdSet);
    const nonExistentIds = uniqueIdsToCheck.filter(
      (id) => !existingIdSet.has(id)
    );
    return { existingIds, nonExistentIds };
  }
  async markAttendance(req, res) {

    const data =
      {
        ...req.body,
        userId: req.user.id,
      } ?? [];
    try {
      if (!data.timeTaken) { res.status(400).json({ success: false, message: "Time attendance taken is required" }); }
      if (data.employees) {
        const isAdmin = this.isAdmin(req.user?.id);
        if (!isAdmin)
          res.status(403).json({
            success: false,
            message: "Only Admin can Submit employee Attendance",
          });
        const { existingIds, nonExistentIds } = await this.filterEmployeeIds(
          data.employees
        );
        if (existingIds.length == 0) {
          res
            .status(404)
            .json({ success: false, message: "invalid employee ids" });
        }

        const updatePromises = existingIds.map((id) => {
          return this.fillAttendance(id, {
            timeTaken: data.timeTaken,
            userId: null,
            deviceId: null,
            gps_longitude: null,
            gps_latitude: null,
          });
        });
        const results = await Promise.all(updatePromises);
        const filledAttendance = results
          .map((item) => item.data ?? null)
          .filter((data) => data != null);
        return res.status(filledAttendance.length > 0 ? 201 : 400).json({
          success: filledAttendance.length > 0,
          data: filledAttendance,
          message:
            filledAttendance.length > 0
              ? "Successfully submitted"
              : "Please try again",
        });
      } else {
        //this attendance coming from mobile app
        let empId = data.employeeId;
        if (data.userId) {
          const userData = await crud.findById("user", data.userId, {
            include: { employee: true },
          });
          const user = userData.data;
          if (user.employee) empId = data.employeeId ?? user?.employee?.id;
        }
        if (!empId) {
          res
            .status(404)
            .json({ success: false, message: "Employee not found" });
        }
        const { status, ...response } = await this.fillAttendance(empId, data);
        const stat = status ? Number(status) : response.success ? 200 : 400; //handle incase if undefined returned
        return res.status(stat).json({ ...response });
      }
      // Validate device , This will be applied later
      // await this.validateDevice(userId, deviceId);
    } catch (error) {
      throw error;
    }
  }

  async groupAttendanceByEmployee(data) {
    const groupedMap = data.reduce((acc, currentRecord) => {
      const employeeId = currentRecord.employeeId;
      if (!employeeId || !currentRecord.employee) {
        return acc;
      }
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employee: currentRecord.employee,
          attendances: [],
        };
      }
      const attendanceDetails = { ...currentRecord };
      delete attendanceDetails.employee;
      delete attendanceDetails.employeeId;
      acc[employeeId].attendances.push(attendanceDetails);
      return acc;
    }, []);
    return Object.values(groupedMap);
  }

  async getEmployeeAttendance(employeeId, conditions) {
    const attendance = await crud.findAll(
      "attendance",
      {
        where: { ...conditions, employeeId },
        include: { details: true },
      },
      true
    );
    const transformedAttendance = attendance.data?.reduce((acc, att) => {
        const formattedDateKey = format(new Date(att?.date), "yyyy-MM-dd");
        if (formattedDateKey) {
          acc[formattedDateKey] = att?.status ?? "";
        }
      return acc;
    }, {});
    const details =await attendance.data?.reduce((acc, att) => {
        const formattedDateKey = format(new Date(att.date), "yyyy-MM-dd");
        acc[formattedDateKey] = att.details;
      return acc;
    }, {});

    return { ...attendance, data: transformedAttendance, details: details };
  }

  async getDetails(req, res) {
    const { attendanceDate, empId } = req.query;
    const date = new Date(attendanceDate);
    const attendance = await crud.findFirst("attendance", {
      date: date,
      employeeId: empId,
    });
    const details = await crud.findAll("AttendanceDetail", {
      where: { attendanceId: attendance[0].id },
    });
    if (res.success) res.status(201).json({ ...details });
  }

  async index(req, res) {
    const {
      startDate = null,
      endDate = null,
      pageSize = 10,
      page = 1,
      search,
    } = req.query;
    const user = await userService.getUserById(req.user?.id);
    if (!user?.data?.office?.id)
      return res.status(500).json({ success: false, message: "You are not assigned to office, please contact" });
    const subOffices = await officeService.findAllSubOffices(user?.data?.office?.id);
    const subOfficeIds = subOffices.map((office) => {
      return office.id
    });
    const offices = [user?.data?.office?.id, ...subOfficeIds];
    const conditions = { };
    const employeeFilter = { officeId: { in: offices }};
    const isAdmin = await this.isAdmin(req.user.id);
    if (startDate) {
      conditions.date = {};
      conditions.date.gte = new Date(startDate);
    }
    if (endDate) {
      if (!conditions.date) {
        conditions.date = {};
      }
      let finalEndDate = new Date(endDate);
      finalEndDate.setHours(23, 59, 59, 999);
      conditions.date.lte = finalEndDate;
    }
    if (search) {
      employeeFilter.OR = [
        { name: { contains: search } },
        { middle_name: { contains: search } },
        { last_name: { contains: search } },
      ];
    }
    if (!isAdmin) {
      employeeFilter.userId = user.id;
    }
    const employees = await crud.findAll("employee", {
      where: { ...employeeFilter },
      includes: {
        name: true,
        middle_name: true,
        last_name: true,
        id: true,
        gender: true,
      },
      page,
      pageSize,
    }, true);

    const attendancePromises =await  employees.data.map(async (emp) => {
      const att = await this.getEmployeeAttendance(emp.id, conditions);
      return {
        id: emp.id,
        name: `${emp.name} ${emp.middle_name} ${emp.last_name}`,
        office: emp?.office?.name,
        attendance: att.data,
        details: att.details,
      };
    });

    const attendancesData = (await Promise.all(attendancePromises));
    const resp = {};
    let status = 404;
    if (employees.success) {
      status = 201;
      resp.success = true;
      resp.data = attendancesData;
      resp.pagination = employees.pagination;
      res.message = "Successfully retrieved";
    }
    res.status(status).json({ ...resp });
  }

  async markFullDayAttendance(data) {
    try {
      const { userId, officeId, deviceId, gpsLocation } = data;

      const userResp = await crud.findById("user", userId);
      if (!userResp.success || !userResp.data)
        throw new Error("User not found");

      const empResp = await crud.findAll("employee", {
        filters: { userId },
        page: 1,
        pageSize: 1,
      });
      if (!empResp.success || !empResp.data || empResp.data.length === 0) {
        throw new Error("Employee record not found for user");
      }
      const employee = empResp.data[0];

      const userIsAdmin = await this.isAdmin(userId);
      const baseTime = new Date();

      let distance = 0;
      if (!userIsAdmin) {
        if (!gpsLocation || !gpsLocation.latitude || !gpsLocation.longitude) {
          throw new Error("GPS location is required for non-admin users");
        }
        distance = await this.validateLocation(
          userId,
          gpsLocation.latitude,
          gpsLocation.longitude
        );
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const attendanceTypes = [
        {
          shiftType: "morning",
          checkType: "checkIn",
          attendanceType: "MORNING_IN",
          hour: 9,
          minute: 0,
        },
        {
          shiftType: "morning",
          checkType: "checkOut",
          attendanceType: "MORNING_OUT",
          hour: 12,
          minute: 0,
        },
        {
          shiftType: "afternoon",
          checkType: "checkIn",
          attendanceType: "AFTERNOON_IN",
          hour: 14,
          minute: 0,
        },
        {
          shiftType: "afternoon",
          checkType: "checkOut",
          attendanceType: "AFTERNOON_OUT",
          hour: 17,
          minute: 0,
        },
      ];

      // Get existing records for today
      const existingResp = await crud.findAll("attendance", {
        filters: {
          userId,
          timestamp: { gte: today.toISOString(), lt: tomorrow.toISOString() },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          employee: {
            include: { office: { select: { id: true, name: true } } },
          },
        },
      });
      if (!existingResp.success)
        throw new Error(
          existingResp.message || "Failed to fetch existing attendances"
        );

      const existingMap = new Map();
      (existingResp.data || []).forEach((a) =>
        existingMap.set(a.attendance_type, a)
      );

      const results = [];

      for (const {
        shiftType,
        checkType,
        attendanceType,
        hour,
        minute,
      } of attendanceTypes) {
        try {
          const recordTime = new Date(baseTime);
          recordTime.setHours(hour, minute, 0, 0);

          if (existingMap.has(attendanceType)) {
            const existing = existingMap.get(attendanceType);
            const updateResp = await crud.update("attendance", existing.id, {
              timestamp: recordTime,
              gps_latitude:
                gpsLocation?.latitude || this.staticOfficeLocation.latitude,
              gps_longitude:
                gpsLocation?.longitude || this.staticOfficeLocation.longitude,
              device_hash: deviceId,
              status: "PRESENT",
              distance_from_office: distance,
            });
            if (!updateResp.success) {
              // log and skip, but preserve original behavior (continue)
              console.error(
                `Failed to update ${attendanceType}:`,
                updateResp.message
              );
              continue;
            }
            // fetch updated full
            const full = await crud.findById("attendance", existing.id, {
              include: {
                user: { select: { id: true, name: true, email: true } },
                employee: {
                  include: { office: { select: { id: true, name: true } } },
                },
              },
            });
            if (full.success)
              results.push(this.formatAttendanceResponse(full.data));
          } else {
            const createResp = await crud.create("attendance", {
              userId,
              employeeId: employee.id,
              timestamp: recordTime,
              attendance_type: attendanceType,
              gps_latitude:
                gpsLocation?.latitude || this.staticOfficeLocation.latitude,
              gps_longitude:
                gpsLocation?.longitude || this.staticOfficeLocation.longitude,
              device_hash: deviceId,
              status: "PRESENT",
              distance_from_office: distance,
            });
            if (!createResp.success) {
              console.error(
                `Failed to create ${attendanceType}:`,
                createResp.message
              );
              continue;
            }
            const createdId = createResp.data.id;
            const full = await crud.findById("attendance", createdId, {
              include: {
                user: { select: { id: true, name: true, email: true } },
                employee: {
                  include: { office: { select: { id: true, name: true } } },
                },
              },
            });
            if (full.success)
              results.push(this.formatAttendanceResponse(full.data));
          }
        } catch (error) {
          console.error(`Failed to process ${attendanceType}:`, error.message);
        }
      }

      if (results.length < 4) {
        console.warn(
          `Full-day attendance processed only ${results.length} records instead of 4`
        );
        throw new Error(
          `Failed to create all 4 attendance records. Only ${results.length} were processed.`
        );
      }

      // results are already formatted possibly as arrays or objects; normalize to array of records
      const unwrapped = results.flatMap((r) => (Array.isArray(r) ? r : [r]));
      return this.formatAttendanceResponse(unwrapped);
    } catch (error) {
      throw error;
    }
  }

  // Get attendance by ID
  async getAttendanceById(id) {
    const resp = await crud.findById("attendance", id, {
      include: {
        user: { select: { id: true, name: true, email: true } },
        employee: { include: { office: { select: { id: true, name: true } } } },
      },
    });
    if (!resp.success)
      throw new Error(resp.message || "Attendance record not found");
    return this.formatAttendanceResponse(resp.data);
  }

  // Get attendance by user ID with pagination & filters
  async getAttendanceByUserId(userId, filters = {}, page = 1, pageSize = 10) {
    try {
      const { startDate, endDate, status, shiftType, checkType } = filters;
      const whereFilters = { userId };

      if (startDate || endDate) {
        whereFilters.timestamp = {};
        if (startDate)
          whereFilters.timestamp.gte = new Date(startDate).toISOString();
        if (endDate)
          whereFilters.timestamp.lte = new Date(endDate).toISOString();
      }

      if (status) whereFilters.status = status;

      if (shiftType && checkType) {
        const attendanceType = this.mapToAttendanceType(shiftType, checkType);
        whereFilters.attendance_type = attendanceType;
      }

      const resp = await crud.findAll("attendance", {
        page,
        pageSize,
        filters: whereFilters,
        include: {
          user: { select: { id: true, name: true, email: true } },
          employee: {
            include: { office: { select: { id: true, name: true } } },
          },
        },
        orderBy: { timestamp: "desc" },
      });

      if (!resp.success)
        throw new Error(resp.message || "Failed to fetch attendance");

      const formattedAttendance = this.formatAttendanceResponse(resp.data);
      return {
        data: formattedAttendance,
        pagination: resp.pagination || {
          total: resp.data.length,
          totalPages: 1,
          currentPage: page,
          pageSize,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Get attendance by date range with pagination
  async getAttendanceByDateRange(
    startDate,
    endDate,
    officeId = null,
    page = 1,
    pageSize = 10
  ) {
    try {
      const whereFilters = {
        timestamp: {
          gte: new Date(startDate).toISOString(),
          lte: new Date(endDate).toISOString(),
        },
      };

      if (officeId) {
        // use relation filter
        whereFilters.employee = { officeId };
      }

      const resp = await crud.findAll("attendance", {
        page,
        pageSize,
        filters: whereFilters,
        include: {
          user: { select: { id: true, name: true, email: true } },
          employee: {
            include: { office: { select: { id: true, name: true } } },
          },
        },
        orderBy: { timestamp: "desc" },
      });

      if (!resp.success)
        throw new Error(
          resp.message || "Failed to fetch attendance by date range"
        );

      const formattedAttendance = this.formatAttendanceResponse(resp.data);
      return {
        data: formattedAttendance,
        pagination: resp.pagination || {
          total: resp.data.length,
          totalPages: 1,
          currentPage: page,
          pageSize,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Update attendance
  async updateAttendance(id, data) {
    const resp = await crud.update("attendance", id, {
      status: data.status,
      ...(data.timestamp && { timestamp: new Date(data.timestamp) }),
    });
    if (!resp.success)
      throw new Error(resp.message || "Failed to update attendance");

    const full = await crud.findById("attendance", id, {
      include: {
        user: { select: { id: true, name: true, email: true } },
        employee: { include: { office: { select: { id: true, name: true } } } },
      },
    });
    if (!full.success)
      throw new Error(full.message || "Failed to fetch updated attendance");

    return this.formatAttendanceResponse(full.data);
  }

  // Delete attendance
  async deleteAttendance(id) {
    const resp = await crud.delete("attendance", id);
    if (!resp.success)
      throw new Error(resp.message || "Failed to delete attendance");
    // return minimal info same as previous behaviour (formatted)
    return { success: true, message: resp.message };
  }

  // Get today's attendance summary
  async getTodaysAttendanceSummary(officeId = null) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const filters = {
        date: { gte: today.toISOString(), lt: tomorrow.toISOString() },
      };

      if (officeId) filters.employee = { officeId };

      const resp = await crud.findAll("attendance", {
        filters,
        include: {
          user: { select: { id: true, name: true, email: true } },
          employee: {
            include: { office: { select: { id: true, name: true } } },
          },
        },
      });

      if (!resp.success)
        throw new Error(resp.message || "Failed to fetch today's attendance");

      const formattedAttendance = this.formatAttendanceResponse(resp.data);

      const presentRecords = formattedAttendance.filter(
        (a) => a.status === "PRESENT" || a.status === "LATE"
      );
      const leaveRecords = formattedAttendance.filter(
        (a) => a.status === "LEAVE"
      );

      const summary = {
        total: formattedAttendance.length,
        present: presentRecords.length,
        onTime: formattedAttendance.filter((a) => a.status === "PRESENT")
          .length,
        late: formattedAttendance.filter((a) => a.status === "LATE").length,
        leave: leaveRecords.length,
        absent: 0,
        morningCheckIn: formattedAttendance.filter(
          (a) => a.attendance_type === "MORNING_IN"
        ).length,
        morningCheckOut: formattedAttendance.filter(
          (a) => a.attendance_type === "MORNING_OUT"
        ).length,
        afternoonCheckIn: formattedAttendance.filter(
          (a) => a.attendance_type === "AFTERNOON_IN"
        ).length,
        afternoonCheckOut: formattedAttendance.filter(
          (a) => a.attendance_type === "AFTERNOON_OUT"
        ).length,
        records: formattedAttendance,
      };

      return summary;
    } catch (error) {
      throw error;
    }
  }

  // Submit attendance for mobile app
  async submitAttendance(data) {
    try {
      const {
        userId,
        gpsLatitude,
        gpsLongitude,
        dateTime,
        deviceHash,
        attendanceType,
      } = data;

      if (
        !userId ||
        gpsLatitude === undefined ||
        gpsLongitude === undefined ||
        !dateTime ||
        !deviceHash ||
        !attendanceType
      ) {
        throw new Error("All fields are required");
      }

      await this.checkDailyLimit(userId, dateTime);

      const userResp = await crud.findById("user", userId);
      if (!userResp.success || !userResp.data)
        throw new Error("User not found");

      const empResp = await crud.findAll("employee", {
        filters: { userId },
        page: 1,
        pageSize: 1,
      });
      if (!empResp.success || !empResp.data || empResp.data.length === 0) {
        throw new Error("Employee record not found for user");
      }
      const employee = empResp.data[0];

      await this.validateDevice(userId, deviceHash);

      const userIsAdmin = await this.isAdmin(userId);
      let distance = 0;
      if (!userIsAdmin) {
        distance = await this.validateLocation(
          userId,
          gpsLatitude,
          gpsLongitude
        );
      }

      const status = userIsAdmin ? "PRESENT" : "PRESENT";

      const attendanceDate = new Date(dateTime);
      attendanceDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(attendanceDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const existingCheck = await crud.findAll("attendance", {
        filters: {
          userId,
          timestamp: {
            gte: attendanceDate.toISOString(),
            lt: nextDay.toISOString(),
          },
          attendance_type: attendanceType,
        },
        page: 1,
        pageSize: 1,
      });
      if (!existingCheck.success)
        throw new Error(
          existingCheck.message || "Failed to check existing attendance"
        );
      if (existingCheck.pagination && existingCheck.pagination.total > 0) {
        throw new Error(`Attendance already marked for ${attendanceType}`);
      }

      const createResp = await crud.create("attendance", {
        userId,
        employeeId: employee.id,
        timestamp: new Date(dateTime),
        attendance_type: attendanceType,
        gps_latitude: gpsLatitude,
        gps_longitude: gpsLongitude,
        device_hash: deviceHash,
        status: status,
        distance_from_office: distance,
      });

      if (!createResp.success)
        throw new Error(createResp.message || "Failed to create attendance");

      const fullResp = await crud.findById("attendance", createResp.data.id, {
        include: {
          user: { select: { id: true, name: true, email: true } },
          employee: {
            include: { office: { select: { id: true, name: true } } },
          },
        },
      });
      if (!fullResp.success)
        throw new Error(
          fullResp.message || "Failed to fetch created attendance"
        );

      return this.formatAttendanceResponse(fullResp.data);
    } catch (error) {
      throw error;
    }
  }

  // Get user attendance statistics
  async getUserAttendanceStats(userId, startDate, endDate) {
    const result = await this.getAttendanceByUserId(
      userId,
      { startDate, endDate },
      1,
      10000
    );
    const uniqueDays = new Set(
      result.data.map((a) => new Date(a.timestamp).toDateString())
    ).size;

    const presentRecords = result.data.filter(
      (a) => a.status === "PRESENT" || a.status === "LATE"
    );
    const leaveRecords = result.data.filter((a) => a.status === "LEAVE");

    const totalPossibleShifts = uniqueDays * 4;
    const actualShifts = presentRecords.length;
    const attendanceRate =
      totalPossibleShifts > 0 ? (actualShifts / totalPossibleShifts) * 100 : 0;

    const stats = {
      totalDays: uniqueDays,
      present: presentRecords.length,
      onTime: result.data.filter((a) => a.status === "PRESENT").length,
      late: result.data.filter((a) => a.status === "LATE").length,
      leave: leaveRecords.length,
      absent: 0,
      attendanceRate: Math.round(attendanceRate),
      shifts: {
        morningCheckIn: result.data.filter(
          (a) => a.attendance_type === "MORNING_IN"
        ).length,
        morningCheckOut: result.data.filter(
          (a) => a.attendance_type === "MORNING_OUT"
        ).length,
        afternoonCheckIn: result.data.filter(
          (a) => a.attendance_type === "AFTERNOON_IN"
        ).length,
        afternoonCheckOut: result.data.filter(
          (a) => a.attendance_type === "AFTERNOON_OUT"
        ).length,
      },
    };

    return stats;
  }

  // Weekly, monthly, yearly summaries (use getAttendanceByUserId internally)
  async getWeeklySummary(userId, year, week) {
    const startDate = this.getDateFromWeek(year, week);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const result = await this.getAttendanceByUserId(
      userId,
      { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      1,
      10000
    );
    return this.calculatePeriodSummary(result.data, "week");
  }

  async getMonthlySummary(userId, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const result = await this.getAttendanceByUserId(
      userId,
      { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      1,
      10000
    );
    return this.calculatePeriodSummary(result.data, "month");
  }

  async getYearlySummary(userId, year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const result = await this.getAttendanceByUserId(
      userId,
      { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      1,
      10000
    );
    return this.calculatePeriodSummary(result.data, "year");
  }
  // leave management endpoints start here
  // Create leave request
  async createLeaveRequest(data) {
    try {
      const { employeeId, startDate, daysOfLeave, leaveType, attachmentUrl } =
        data;

      // Validate leave type
      const maxDays = this.leaveTypeDurations[leaveType];
      if (!maxDays) {
        return {
          success: false,
          message:
            "Invalid leave type. Only MATERNITY and PATERNITY are supported",
        };
      }

      if (daysOfLeave > maxDays) {
        return {
          success: false,
          message: `Maximum ${maxDays} days allowed for ${leaveType} leave`,
        };
      }

      // First, verify the employee exists
      const employeeResp = await crud.findById("employee", employeeId);
      if (!employeeResp.success) {
        return {
          success: false,
          message: "Employee not found",
        };
      }

      // Calculate end date excluding weekends
      const start = new Date(startDate);
      const endDate = this.calculateEndDate(start, daysOfLeave);

      // Check for overlapping leave requests
      const existingLeaves = await crud.findAll("LeaveRequest", {
        where: {
          employeeId: employeeId,
          status: { in: ["PENDING", "APPROVED"] }, // Check both pending and approved
          OR: [
            {
              // New start date falls within existing leave period
              startDate: { lte: start },
              endDate: { gte: start },
            },
            {
              // New end date falls within existing leave period
              startDate: { lte: endDate },
              endDate: { gte: endDate },
            },
            {
              // New leave completely covers existing leave
              startDate: { gte: start },
              endDate: { lte: endDate },
            },
          ],
        },
      });

      if (existingLeaves.success && existingLeaves.data.length > 0) {
        return {
          success: false,
          message:
            "Leave request overlaps with existing approved or pending leave",
        };
      }

      // Create leave request using relation connection
      const leaveRequestResp = await crud.create("LeaveRequest", {
        employee: {
          connect: { id: employeeId },
        },
        startDate: start,
        daysOfLeave,
        endDate,
        leaveType,
        status: "PENDING",
      });

      if (!leaveRequestResp.success) {
        return leaveRequestResp;
      }

      // Format dates properly for response
      const formattedData = {
        ...leaveRequestResp.data,
        startDate: leaveRequestResp.data.startDate.toISOString(),
        endDate: leaveRequestResp.data.endDate.toISOString(),
      };

      return {
        success: true,
        data: formattedData,
        message: "Leave request submitted successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Get leave requests with filters

  async getLeaveRequests(filters = {}) {
    try {
      const { employeeId, officeId, status, page = 1, pageSize = 10 } = filters;

      let whereConditions = {};

      if (employeeId) {
        whereConditions.employeeId = employeeId;
      } else if (officeId) {
        const employeesResp = await crud.findAll("employee", {
          filters: { officeId },
          select: { id: true },
        });

        if (!employeesResp.success || !employeesResp.data.length) {
          return {
            success: true,
            data: [],
            pagination: {
              total: 0,
              totalPages: 0,
              currentPage: page,
              pageSize,
            },
          };
        }

        const employeeIds = employeesResp.data.map((emp) => emp.id);
        whereConditions.employeeId = { in: employeeIds };
      }

      if (status && status !== "all") {
        whereConditions.status = status;
      }

      const result = await crud.findAll("LeaveRequest", {
        where: whereConditions,
        include: {
          employee: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
              office: {
                select: { id: true, name: true },
              },
            },
          },
          user: {
            select: { name: true, email: true },
          },
        },
        // Remove orderBy or use a field that exists in your schema
        // orderBy: { createdAt: "desc" },
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      });

      if (!result.success) {
        return result;
      }

      const formattedData = result.data.map((leaveRequest) => ({
        id: leaveRequest.id,
        employeeId: leaveRequest.employeeId,
        employeeName: `${leaveRequest.employee?.name || ""} ${leaveRequest.employee?.middle_name || ""
          } ${leaveRequest.employee?.last_name || ""}`.trim(),
        officeName: leaveRequest.employee?.office?.name,
        startDate: leaveRequest.startDate?.toISOString(),
        endDate: leaveRequest.endDate?.toISOString(),
        daysOfLeave: leaveRequest.daysOfLeave,
        leaveType: leaveRequest.leaveType,
        status: leaveRequest.status,
        attachmentUrl: leaveRequest.attachmentUrl,
        approvedByName: leaveRequest.user?.name,
        // Remove createdAt and updatedAt since they don't exist in your schema
      }));

      return {
        success: true,
        data: formattedData,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error in getLeaveRequests service:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Approve leave request
  async approveLeaveRequest(leaveRequestId, approvedBy) {
    try {
      // Update leave request status
      const updateResp = await crud.update("LeaveRequest", leaveRequestId, {
        status: "APPROVED",
        approvedBy,
      });

      if (!updateResp.success) {
        return updateResp;
      }

      // Create full-day permission attendance records for leave period
      await this.createFullDayPermissionRecords(updateResp.data);

      const formattedData = {
        ...updateResp.data,
        startDate: updateResp.data.startDate.toISOString(),
        endDate: updateResp.data.endDate.toISOString(),
      };

      return {
        success: true,
        data: formattedData,
        message: "Leave request approved successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async createFullDayPermissionRecords(leaveRequest) {
    const { employeeId, startDate, endDate } = leaveRequest;
    const currentDate = new Date(startDate);
    const finalEndDate = new Date(endDate);

    const isWeekend = (date) => {
      const day = date.getDay();
      return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
    };

    const attendanceTypes = [
      { type: "morningCheckIn", hour: 9, minute: 0 },
      { type: "morningCheckOut", hour: 12, minute: 0 },
      { type: "afternoonCheckIn", hour: 14, minute: 0 },
      { type: "afternoonCheckOut", hour: 17, minute: 0 },
    ];

    while (currentDate <= finalEndDate) {
      // Skip weekends
      if (!isWeekend(currentDate)) {
        const attendanceDate = new Date(currentDate);
        attendanceDate.setHours(0, 0, 0, 0);

        // Check if attendance record already exists for this date
        let attendance = await crud.findFirst("attendance", {
          employeeId,
          date: attendanceDate,
        });

        if (attendance.length === 0) {
          // Create main attendance record
          const created = await crud.create("attendance", {
            employeeId,
            date: attendanceDate,
            status: "PERMISSION",
          });
          attendance = created.data;
        } else {
          // Update existing record to PERMISSION
          await crud.update("attendance", attendance[0].id, {
            status: "PERMISSION",
          });
          attendance = attendance[0];
        }

        // Create all 4 attendance details for full day
        for (const { type, hour, minute } of attendanceTypes) {
          const recordTime = new Date(currentDate);
          recordTime.setHours(hour, minute, 0, 0);

          // Check if detail already exists
          const existingDetail = await crud.findFirst("AttendanceDetail", {
            attendanceId: attendance.id,
            type: type,
          });

          if (existingDetail.length === 0) {
            await crud.create("AttendanceDetail", {
              timestamp: recordTime,
              attendanceId: attendance.id,
              type: type,
              gps_latitude: null,
              gps_longitude: null,
              deviceId: null,
            });
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // Reject leave request
  async rejectLeaveRequest(leaveRequestId, rejectedBy) {
    try {
      const updateResp = await crud.update("LeaveRequest", leaveRequestId, {
        status: "REJECTED",
        approvedBy: rejectedBy,
      });

      if (!updateResp.success) {
        return updateResp;
      }

      const formattedData = {
        ...updateResp.data,
        startDate: updateResp.data.startDate.toISOString(),
        endDate: updateResp.data.endDate.toISOString(),
      };

      return {
        success: true,
        data: formattedData, // Use formattedData instead of updateResp.data
        message: "Leave request rejected successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Get leave request by ID
  async getLeaveRequestById(id) {
    try {
      const result = await crud.findById("LeaveRequest", id, {
        include: {
          employee: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
              office: {
                select: { name: true },
              },
            },
          },
          user: {
            select: { name: true, email: true },
          },
        },
      });

      if (!result.success) {
        return result;
      }

      // Extract only necessary fields
      const formattedData = {
        id: result.data.id,
        employeeId: result.data.employeeId,
        approvedBy: result.data.approvedBy,
        startDate: result.data.startDate.toISOString(),
        daysOfLeave: result.data.daysOfLeave,
        endDate: result.data.endDate.toISOString(),
        leaveType: result.data.leaveType,
        status: result.data.status,
        // Employee basic info
        userId: result.data.employee?.user?.id,
        name: result.data.employee?.name,
        middle_name: result.data.employee?.middle_name,
        last_name: result.data.employee?.last_name,
        // Office info
        officeName: result.data.employee?.office?.name,
        // Approver info if exists
        approvedByName: result.data.user?.name,
        approvedByEmail: result.data.user?.email,
        attachmentUrl: result.data.attachmentUrl,
      };

      return {
        success: true,
        data: formattedData,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Create attendance records for approved leave
  async createLeaveAttendanceRecords(leaveRequest) {
    const { employeeId, startDate, endDate } = leaveRequest;
    const currentDate = new Date(startDate);
    const finalEndDate = new Date(endDate);

    const isWeekend = (date) => {
      const day = date.getDay();
      return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
    };

    while (currentDate <= finalEndDate) {
      // Skip weekends
      if (!isWeekend(currentDate)) {
        const attendanceDate = new Date(currentDate);
        attendanceDate.setHours(0, 0, 0, 0);

        // Check if attendance record already exists for this date
        const existingAttendance = await crud.findFirst("attendance", {
          employeeId,
          date: attendanceDate,
        });

        if (existingAttendance.length === 0) {
          // Create attendance record with PERMISSION status
          await crud.create("attendance", {
            employeeId,
            date: attendanceDate,
            status: "PERMISSION",
          });
        } else {
          // Update existing record to PERMISSION
          await crud.update("attendance", existingAttendance[0].id, {
            status: "PERMISSION",
          });
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  // leave management endpont ends here

  calculatePeriodSummary(attendance, periodType) {
    const uniqueDays = new Set(
      attendance.map((a) => new Date(a.timestamp).toDateString())
    ).size;
    const presentRecords = attendance.filter(
      (a) => a.status === "PRESENT" || a.status === "LATE"
    );
    const leaveRecords = attendance.filter((a) => a.status === "LEAVE");
    const totalPossibleShifts = uniqueDays * 4;
    const actualShifts = presentRecords.length;
    const attendanceRate =
      totalPossibleShifts > 0 ? (actualShifts / totalPossibleShifts) * 100 : 0;

    const summary = {
      periodType,
      totalDays: uniqueDays,
      present: presentRecords.length,
      onTime: attendance.filter((a) => a.status === "PRESENT").length,
      late: attendance.filter((a) => a.status === "LATE").length,
      leave: leaveRecords.length,
      absent: 0,
      shifts: {
        morning: {
          checkIn: attendance.filter((a) => a.attendance_type === "MORNING_IN")
            .length,
          checkOut: attendance.filter(
            (a) => a.attendance_type === "MORNING_OUT"
          ).length,
        },
        afternoon: {
          checkIn: attendance.filter(
            (a) => a.attendance_type === "AFTERNOON_IN"
          ).length,
          checkOut: attendance.filter(
            (a) => a.attendance_type === "AFTERNOON_OUT"
          ).length,
        },
      },
      attendanceRate: Math.round(attendanceRate),
    };

    return summary;
  }

  getDateFromWeek(year, week) {
    const date = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  // Get attendance for employees under manager's office hierarchy with filters
  async getAttendanceByOfficeHierarchy(userId, filters = {}, page = 1, pageSize = 10) {
    try {
      const managerResult = await crud.findAll(
        "employee",
        {
          filters: { userId },
          include: { office: { select: { id: true, name: true } } },
        },
        true
      );

      if (!managerResult.success || !managerResult.data?.length) {
        throw new Error("Manager not found.");
      }

      const manager = managerResult.data[0];
      const managerOfficeId = manager.officeId ?? manager.office?.id;

      if (!managerOfficeId) {
        throw new Error("Manager does not belong to any office.");
      }

      // 2. Get all child office IDs recursively
      const officeIds = await officeService.getAllChildOfficeIds(managerOfficeId);
      officeIds.push(managerOfficeId); // include manager's own office

      // 3. Build filters
      const { startDate, endDate, attendanceType, employeeName, status } = filters;
      const whereFilters = {};

      // Date range
      if (startDate || endDate) {
        whereFilters.date = {};
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          whereFilters.date.gte = start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          whereFilters.date.lte = end;
        }
      }

      // Status
      if (status) {
        whereFilters.status = status;
      }

      // Employee filters (using relation)
      const employeeFilter = { officeId: { in: officeIds } };

      if (employeeName) {
        employeeFilter.OR = [
          { name: { contains: employeeName, mode: "insensitive" } },
          { middle_name: { contains: employeeName, mode: "insensitive" } },
          { last_name: { contains: employeeName, mode: "insensitive" } },
        ];
      }

      whereFilters.employee = { is: employeeFilter };

      const resp = await crud.findAll("attendance", {
        page: Number(page),
        pageSize: Number(pageSize),
        filters: whereFilters,
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              middle_name: true,
              last_name: true,
              office: { select: { id: true, name: true } },
            },
          },
          details: {
            select: {
              id: true,
              timestamp: true,
              type: true,
              gps_latitude: true,
              gps_longitude: true,
            },
          },
        },
        orderBy: { date: "desc" },
      });

      if (!resp.success) {
        throw new Error(resp.message || "Failed to fetch attendance records");
      }

      // 5. Format response
      const formattedData = resp.data.map((record) => {
        const fullName = [
          record.employee?.name,
          record.employee?.middle_name,
          record.employee?.last_name,
        ]
          .filter(Boolean)
          .join(" ");
        const officeName = record.employee?.office?.name || "N/A";

        let details = record.details || [];
        if (attendanceType) {
          details = details.filter((d) => d.type === attendanceType);
        }

        return {
          id: record.id,
          employeeId: record.employeeId,
          employeeName: fullName,
          officeName,
          date: record.date,
          status: record.status,
          details: details.map((d) => ({
            id: d.id,
            timestamp: d.timestamp,
            attendanceType: d.type,
            gps_latitude: d.gps_latitude,
            gps_longitude: d.gps_longitude,
          })),
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        };
      });

      return {
        success: true,
        data: formattedData,
        pagination: resp.pagination || {
          total: resp.data.length,
          totalPages: 1,
          currentPage: page,
          pageSize,
        },
      };
    } catch (error) {
      throw error;
    }
  }

}

export default new AttendanceService();
