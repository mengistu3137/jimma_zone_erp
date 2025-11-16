import CrudService from "./crudService.js";
const crud = new CrudService();
const model = "user";
import bcrypt from "bcryptjs";

class UserService {
  // ✅ Get user by ID (includes relations)
  async getUserById(userId) {
    try {
      // No manual deletedAt filter needed — CrudService handles it
      const user = await crud.findById(model, userId, {
        include: {
          roles: { include: { role: true } },
          office: true,
        },
      });

      if (!user.success || !user.data) {
        return { success: false, message: "User not found" };
      }

      return { success: true, data: user.data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ✅ Get all users (with pagination, filtering, etc.)
  async getAllUsers(query = {}) {
    try {
      const { page, pageSize, search,orderBy } = crud.parseQueryParams(query);
      const result = await crud.findAll(model, {
        page,
        pageSize,
        search,
        select: {
          id: true,
          name: true,
          middle_name: true,
          last_name: true,
          username: true,
          email: true,
          createdAt: true,
        },
        include: {
          roles: { include: { role: true } },
          office: true,
        },
        orderBy: orderBy ?? { createdAt: "desc" },
      });
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ✅ Update user (with role update logic)
  async updateUser(requester, userId, data) {
    try {
      // Only admins or the user themselves can update
      if (requester.id !== userId && !requester.roles?.includes("Admin")) {
        return {
          success: false,
          message: "You are not authorized to update this user.",
        };
      }

      // Handle roles separately (admins only)
      if (data.roles) {
        if (!requester.roles?.includes("Admin")) {
          delete data.roles;
        } else {
          const rolesArray = Array.isArray(data.roles)
            ? data.roles
            : [data.roles];

          // Soft-delete old roles (not hard delete)
          await crud.updateMany("userRole", { userId }, { deletedAt: new Date() });

          // Fetch valid roles
          const roleRecords = await crud.findAll("role", {
            where: { name: { in: rolesArray } },
          });

          // Reassign new roles
          for (const role of roleRecords.data || []) {
            await crud.create("userRole", { userId, roleId: role.id });
          }

          delete data.roles;
        }
      }

      // Update user data
      const updated = await crud.update(model, userId, data);
      return updated;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ✅ Soft delete user and related records
  async deleteUser(userId) {
    try {
      const deletedAt = new Date();

      // All updateMany() calls already respect soft delete logic elsewhere
      await Promise.all([
        crud.updateMany("userRole", { userId }, { deletedAt }),
        crud.updateMany("attendance", { userId }, { deletedAt }),
        crud.updateMany("appointment", { userId }, { deletedAt }),
        crud.updateMany("letter", { OR: [{ userId }, { approvedBy: userId }] }, { deletedAt }),
        crud.updateMany("employee", { userId }, { deletedAt }),
      ]);

      // Soft-delete user record
      const result = await crud.update(model, userId, {
        deletedAt,
        isActive: false,
      });

      return {
        success: true,
        message: "User and related records soft-deleted successfully.",
        data: result.data,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

 async restoreUser(where = {}) {
   try {
      const result = await crud.restoreSoftDeleted(model, where);
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async createUser(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const data = { ...userData, password: hashedPassword }
    return await crud.create("user", data);

  }
}


export default new UserService();
