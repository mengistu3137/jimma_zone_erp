import express from "express";
import {
  getPermissions,
  createPermission,
  getPermissionById,
  updatePermission,
  deletePermission,
} from "../controllers/permissionController.js";
import { authenticate, checkPermission } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: "System permission management (for administrators)"
 */

/**
 * @swagger
 * /permissions:
 *   post:
 *     summary: Create a new permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'create_permission' permission. Creates a new permission and can assign it to roles.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: "The unique name of the permission (e.g., 'create_user')."
 *                 example: "create_payroll_report"
 *               description:
 *                 type: string
 *                 description: "A friendly description of what the permission allows."
 *                 example: "Allows a user to create new payroll reports."
 *     responses:
 *       201:
 *         description: Permission created successfully
 *       400:
 *         description: Bad request (e.g., permission name already exists)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing 'create_permission' permission)
 */
router.post(
  "/",
  authenticate,
  checkPermission("create_permission"),
  createPermission
);

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Get a list of all permissions
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'view_permissions' permission.
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter permissions by partial name match.
 *     responses:
 *       200:
 *         description: A list of permissions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing 'view_permissions' permission)
 */
router.get(
  "/",
  authenticate,
  checkPermission("view_permissions"),
  getPermissions
);

/**
 * @swagger
 * /permissions/{id}:
 *   get:
 *     summary: Get a single permission by its ID
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'view_permissions' permission.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the permission.
 *     responses:
 *       200:
 *         description: The permission data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing 'view_permissions' permission)
 *       404:
 *         description: Permission not found
 */
router.get(
  "/:id",
  authenticate,
  checkPermission("view_permissions"),
  getPermissionById
);

/**
 * @swagger
 * /permissions/{id}:
 *   put:
 *     summary: Update an existing permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'update_permission' permission.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the permission to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The new name of the permission.
 *               description:
 *                 type: string
 *                 description: The new description of the permission.
 *     responses:
 *       200:
 *         description: The updated permission data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing 'update_permission' permission)
 *       404:
 *         description: Permission not found
 */
router.put(
  "/:id",
  authenticate,
  checkPermission("update_permission"),
  updatePermission
);

/**
 * @swagger
 * /permissions/{id}:
 *   delete:
 *     summary: Delete a permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'delete_permission' permission. This is a destructive action.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the permission to delete.
 *     responses:
 *       200:
 *         description: Permission deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing 'delete_permission' permission)
 *       404:
 *         description: Permission not found
 */
router.delete(
  "/:id",
  authenticate,
  checkPermission("delete_permission"),
  deletePermission
);

export default router;
