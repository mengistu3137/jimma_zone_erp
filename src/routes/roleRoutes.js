import express from "express";
import { authenticate, checkPermission } from "../middleware/authMiddleware.js";
import {
  createRole,
  getRoles,
  updateRole,
  Archive,
} from "../controllers/roleController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management and permission assignment
 */

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'create_role' permission.
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
 *                 description: The unique name of the role.
 *                 example: "Content Editor"
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: An array of permission IDs to associate with this role.
 *                 example: ["create_letter", "update_letter", "view_letters"]
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Bad request (e.g., role name already exists)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing 'create_role' permission)
 */
router.post("/", authenticate, checkPermission("create_role"), createRole);

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get a list of all roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'view_roles' permission.
 *     responses:
 *       200:
 *         description: A list of roles with their associated permissions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing 'view_roles' permission)
 */
router.get("/", authenticate, checkPermission("view_roles"), getRoles);

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     summary: Update an existing role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'update_role' permission. Allows changing the role's name and its assigned permissions.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the role to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The new name of the role.
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: A complete array of new permission IDs for the role.
 *     responses:
 *       200:
 *         description: The updated role data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing 'update_role' permission)
 *       404:
 *         description: Role not found
 */
router.put("/:id", authenticate, checkPermission("update_role"), updateRole);

/**
 * @swagger
 * /roles/{id}/archive:
 *   put:
 *     summary: Archive a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     description: Requires 'archive_role' permission. Deactivates a role, preventing it from being assigned to new users.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the role to archive.
 *     responses:
 *       200:
 *         description: Role archived successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing 'archive_role' permission)
 *       404:
 *         description: Role not found
 */
router.put(
  "/:id/archive",
  authenticate,
  checkPermission("archive_role"),
  Archive
);

export default router;
