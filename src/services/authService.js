import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crudService from "./crudService.js";
import { getUserPermissions } from "./permissionService.js";

dotenv.config();

const crud = new crudService();

export class AuthService {
  async register({ name, middle_name, email, username, password }) {
    try {
      const role = "User"; // default role
     

      //  Check if email already exists
      const existing = await crud.findAll("user", { where: { email } });
      if (existing.success && existing.data.length > 0)
        return { success: false, message: "Email already registered" };

      //  Hash password
      const hashed = await bcrypt.hash(password, 10);

      //  Create user
      const userResult = await crud.create("user", {
        name,
        middle_name,
        email,
        username,
        password: hashed,
      });

      if (!userResult.success) return userResult;

      const user = userResult.data;

      //  Assign default role 
      const roleRecord = await crud.findAll("role", { where: { name: role } });
      if (roleRecord.success && roleRecord.data.length > 0) {
        await crud.create("userRole", {
          userId: user.id,
          roleId: roleRecord.data[0].id,
        });
      }

      //  Fetch user with roles
      const userWithRoles = await crud.findById("user", user.id, {
        include: { roles: { include: { role: true } } },
      });

      return {
        success: true,
        message: "User registered successfully",
        data: userWithRoles.data,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async login({ email, password }) {
    try {
      //  Find user with roles
      const userResult = await crud.findAll("user", {
        where: { email },
        include: { roles: { include: { role: true } } },
      });

      const user =
        userResult.success && userResult.data.length > 0
          ? userResult.data[0]
          : null;

      if (!user) return { success: false, message: "Invalid credentials" };

      //  Check password
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return { success: false, message: "Invalid credentials" };

      //  Fetch permissions
      const permissions = await getUserPermissions(user.id);
      const userRoleNames = user.roles.map((r) => r.role.name);

      //  Create JWT
      const token = jwt.sign(
        { id: user.id, roles: userRoleNames, permissions },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return {
        success: true,
        message: "Login successful",
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            roles: userRoleNames,
            permissions,
          },
        },
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
