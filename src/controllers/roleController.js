import { prisma } from "../config/database.js";
import crudService from "../services/crudService.js";
const CRUDService=new crudService()
const model = "role";

export const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: permissions
          ? { create: permissions.map((permId) => ({ permissionId: permId })) }
          : undefined, // Nested create for many-to-many
      },
      include: { permissions: { include: { permission: true } } },
    });

    res.status(201).json({ success: true, data: role, message: "Role created successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getRoles = async (req, res) => {
  const result = await CRUDService.findAll(model, {
    include: { permissions: { include: { permission: true } } }, // Many-to-many include
  });
  res.status(result.success ? 200 : 500).json(result);
};

export const updateRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    // Update permissions (nested)
    if (permissions) {
      await prisma.rolePermission.deleteMany({ where: { roleId: req.params.id } });
      const permPromises = permissions.map((permId) =>
        prisma.rolePermission.create({ data: { roleId: req.params.id, permissionId: permId } })
      );
      await Promise.all(permPromises);
    }

    const result = await CRUDService.update(model, req.params.id, { name, description });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


export const Archive = async (req, res) => {
  try {
    const roleId = req.params.id;

    // 1️⃣ Get current archived status
    const role = await CRUDService.findById (model, roleId);
    if (!role.success) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    // 2️⃣ Toggle archived flag
    const newArchivedStatus = !role.data.archived;

    // 3️⃣ Update using CRUDService
    const result = await CRUDService.update(model, roleId, { archived: newArchivedStatus });

    res.status(result.success ? 200 : 400).json({
      success: result.success,
      data: result.data,
      message: `Role ${newArchivedStatus ? "archived" : "unarchived"} successfully`,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

