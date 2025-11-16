import employeeService from "../services/employeeService.js";

class EmployeeController {
  // 🔹 Bulk upload employees
  async bulkUpload(req, res) {
    try {
      const result = await employeeService.bulkUpload(req.body);
      const statusCode = result.success
        ? 201
        : result.data?.createdEmployees?.length > 0
        ? 207
        : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async createAccount(req, res) {
    return await employeeService.createAccount(req,res);
  }

  // 🔹 Create employee
  async createEmployee(req, res) {
    try {
      const result = await employeeService.createEmployee(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAllEmployees(req, res) {
    return await employeeService.getAllEmployees(req,res);
   
  }

  async getEmployeeById(req, res) {
    try {
      const result = await employeeService.getEmployeeById(req.params.id);
      const statusCode = result.success ? 200 : 404;
      res.status(statusCode).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getEmployeeByUserId(req, res) {
    try {
      const result = await employeeService.getEmployeeByUserId(
        req.params.userId
      );
      const statusCode = result.success ? 200 : 404;
      res.status(statusCode).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 🔹 Update employee
  async updateEmployee(req, res) {
    try {
      const result = await employeeService.updateEmployee(
        req.params.id,
        req.body
      );
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 🔹 Delete employee
  async deleteEmployee(req, res) {
    try {
      const result = await employeeService.deleteEmployee(req.params.id);
      const statusCode = result.success ? 200 : 404;
      res.status(statusCode).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 🔹 Get employees by office
  async getEmployeesByOffice(req, res) {
    try {
      const result = await employeeService.getEmployeesByOffice(
        req.params.officeId,
        req.query
      );
      const statusCode = result.success ? 200 : 404;
      res.status(statusCode).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get employees under manager
  async getEmployeesUnderManager(req, res) {
    try {
      const userId = req.user.id;
      const employees = await employeeService.getEmployeesUnderManager(userId);
      res.status(200).json(employees);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Error fetching employees", error: error.message });
    }
  }
  async createUserForEmployee(req, res) {
    try {
      const { employeeId, email } = req.body;

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "Employee ID is required in request body",
        });
      }
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "email is required in request body",
        });
      }

      const result = await employeeService.createUserForEmployee(
        employeeId,
        email
      );
      const statusCode = result.success ? 201 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new EmployeeController();
