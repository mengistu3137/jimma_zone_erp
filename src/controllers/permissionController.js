import { prisma } from "../config/database.js";
import crudService from "../services/crudService.js";
const CRUDService=new crudService()
const model = "permission";

/**
 * GET /api/permissions
 * Optional filters: ?role=<roleId|roleName>&name=<string>
 */

export const getPermissions = async (req, res) => {
  try {
    const { role, name } = req.query;

    // Base Prisma "where" filter
    const where = {};

    // Filter by permission name
    if (name) {
      where.name = {
        contains: name,
      };
    }

    // If filtering by role name or id
    if (role) {
      const roleRecord = await prisma.role.findFirst({
        where: {
          OR: [{ id: role }, { name: role }],
        },
      });

      if (!roleRecord) {
        return res
          .status(404)
          .json({ success: false, message: "Role not found" });
      }

      // Find all permissions for that role
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId: roleRecord.id },
        include: {
          permission: {
            include: {
              roles: {
                include: { role: true },
              },
            },
          },
        },
      });

      // Extract permission data
      let permissions = rolePermissions.map((rp) => rp.permission);

      // If also filtering by name
      if (name) {
        permissions = permissions.filter((p) =>
          p.name.toLowerCase().includes(name.toLowerCase())
        );
      }

      return res.status(200).json({
        success: true,
        count: permissions.length,
        data: permissions,
      });
    }

    // If only name filter (no role)
    const permissions = await prisma.permission.findMany({
      where,
      include: { roles: { include: { role: true } } },
      orderBy: { name: "asc" },
    });

    res.status(200).json({
      success: true,
      count: permissions.length,
      data: permissions,
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * POST /api/permissions
 */
export const createPermission = async (req, res) => {
  try {
    const { name, description, roles } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }

    const existing = await prisma.permission.findUnique({ where: { name } });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Permission already exists" });
    }

    const permission = await prisma.permission.create({
      data: {
        name,
        description,
        roles: roles
          ? { create: roles.map((roleId) => ({ roleId })) }
          : undefined,
      },
      include: { roles: { include: { role: true } } },
    });

    res.status(201).json({
      success: true,
      data: permission,
      message: "Permission created successfully",
    });
  } catch (error) {
    console.error("Error creating permission:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/permissions/:id
 */
export const getPermissionById = async (req, res) => {
  const result = await CRUDService.findById(model, req.params.id, {
    include: { roles: { include: { role: true } } },
  });
  res.status(result.success ? 200 : 404).json(result);
};

/**
 * PUT /api/permissions/:id
 */
export const updatePermission = async (req, res) => {
  try {
    const result = await CRUDService.update(model, req.params.id, req.body);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/permissions/:id
 */
export const deletePermission = async (req, res) => {
  try {
    const result = await CRUDService.delete(model, req.params.id);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
