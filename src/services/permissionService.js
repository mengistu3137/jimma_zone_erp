import { prisma } from "../config/database.js";

/**
 * Get all permission names assigned to a user through roles
 * @param {string} userId
 * @returns {Promise<string[]>} Array of permission names
 */
export async function getUserPermissions(userId) {
  try {
    const userWithRoles = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true, // fetch actual permission details
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userWithRoles) return [];

    // Extract permission names from all roles
    const permissions = userWithRoles.roles.flatMap((userRole) =>
      userRole.role.permissions.map((rp) => rp.permission.name)
    );

    // Remove duplicates
    return [...new Set(permissions)];
  } catch (error) {
    console.error("❌ Error fetching user permissions:", error);
    return [];
  }
}
