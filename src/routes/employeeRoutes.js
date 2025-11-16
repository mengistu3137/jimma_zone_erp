import express from "express";
import employeeController from "../controllers/employeeController.js";
import { authenticate, checkPermission } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Employee data management
 */

// --- Permission-Based Routes for Employee Management ---

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create a new employee profile
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'create_employee' permission.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Employee'
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       403:
 *         description: Forbidden - Missing 'create_employee' permission
 */
router.post(
  "/",
  authenticate,
  checkPermission("create_employee"),
  employeeController.createEmployee
);

/**
 * @swagger
 * /employees/bulk:
 *   post:
 *     summary: Bulk upload employees from a file
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'create_employee_bulk' permission.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Employees uploaded successfully
 *       403:
 *         description: Forbidden - Missing 'create_employee_bulk' permission
 */
router.post(
  "/bulk",
  authenticate,
  checkPermission("create_employee_bulk"),
  // NOTE: You will need to add a file upload middleware (like Multer) here
  // once it is created to handle the multipart/form-data.
  employeeController.bulkUpload
);

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: Get a list of all employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'view_employees' permission.
 *     responses:
 *       200:
 *         description: A list of employees
 *       403:
 *         description: Forbidden - Missing 'view_employees' permission
 */
router.get(
  "/",
  authenticate,
  checkPermission("view_employees"),
  employeeController.getAllEmployees
);

router.get(
  "/create-user",
  authenticate,
  checkPermission("create_user"),
  employeeController.createAccount
);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Get a single employee by their ID
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'view_employees' permission.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The employee's unique ID
 *     responses:
 *       200:
 *         description: Employee data
 *       404:
 *         description: Employee not found
 */
router.get(
  "/:id",
  authenticate,
  checkPermission("view_employees"),
  employeeController.getEmployeeById
);

/**
 * @swagger
 * /employees/user/{userId}:
 *   get:
 *     summary: Get an employee profile by their associated user ID
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     description: "Requires 'view_employees' permission."
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The associated user account ID
 *     responses:
 *       200:
 *         description: Employee data
 *       404:
 *         description: Employee not found
 */
router.get(
  "/user/:userId",
  authenticate,
  checkPermission("view_employees"),
  employeeController.getEmployeeByUserId
);

/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     summary: Update an employee's profile
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'update_employee' permission.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The employee's unique ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeUpdate'
 *     responses:
 *       200:
 *         description: The updated employee data
 *       403:
 *         description: Forbidden - Missing 'update_employee' permission
 */
router.put(
  "/:id",
  authenticate,
  checkPermission("update_employee"),
  employeeController.updateEmployee
);

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     summary: Delete an employee profile
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'delete_employee' permission.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The employee's unique ID
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *       403:
 *         description: Forbidden - Missing 'delete_employee' permission
 */
router.delete(
  "/:id",
  authenticate,
  checkPermission("delete_employee"),
  employeeController.deleteEmployee
);

/**
 * @swagger
 * /employees/office/{officeId}:
 *   get:
 *     summary: Get all employees belonging to a specific office
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'view_employees' permission.
 *     parameters:
 *       - in: path
 *         name: officeId
 *         required: true
 *         description: The office's unique ID
 *     responses:
 *       200:
 *         description: A list of employees in the specified office
 */
router.get(
  "/office/:officeId",
  authenticate,
  checkPermission("view_employees"),
  employeeController.getEmployeesByOffice
);

/**
 * @swagger
 * /under-manager:
 *   get:
 *     summary: Get all employees under the manager's office (including child offices)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'view_employees' permission. Returns all employees in the manager's office and its sub-offices.
 *     responses:
 *       200:
 *         description: A list of employees under the manager's office
 *       403:
 *         description: Forbidden - Missing 'view_employees' permission
 */
router.get(
  "/under-manager",
  authenticate,
  checkPermission("view_employees"),
  employeeController.getEmployeesUnderManager
);

/**
 * @swagger
 * /employees/create-user:
 *   post:
 *     summary: Create a user account for an existing employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'create_employee_user' permission. Generates username and password for the employee.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - email
 *             properties:
 *               employeeId:
 *                 type: string
 *               email:
 *                 type: string
 *                 description: The employee's unique ID
 *     responses:
 *       201:
 *         description: User created successfully with generated credentials
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
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     password:
 *                       type: string
 *       400:
 *         description: Bad request - Employee already has a user account
 *       404:
 *         description: Employee not found
 */
router.post(
  "/create-user",
  authenticate,
  employeeController.createUserForEmployee
);

export default router;
