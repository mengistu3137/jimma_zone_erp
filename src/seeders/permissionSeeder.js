import { prisma } from "../config/database.js";

const permissions = [
  // --- User Management ---
  { name: "view_self", roles: ["Admin", "Manager", "Employee"] },
  { name: "view_users", roles: ["Admin", "Manager"] },
  { name: "update_user", roles: ["Admin", "Manager"] },
  { name: "delete_user", roles: ["Admin"] },
  { name: "create_user", roles: ["Admin"] },
  { name: "restore_user", roles: ["Admin"] },

  // --- Role & Permission Management (Meta) ---
  { name: "view_roles", roles: ["Admin"] },
  { name: "create_role", roles: ["Admin"] },
  { name: "update_role", roles: ["Admin"] },
  { name: "archive_role", roles: ["Admin"] },
  { name: "view_permissions", roles: ["Admin"] },
  { name: "create_permission", roles: ["Admin"] },
  { name: "update_permission", roles: ["Admin"] },
  { name: "delete_permission", roles: ["Admin"] },

  // --- Employee Management ---
  { name: "view_employees", roles: ["Admin", "Manager"] },
  { name: "create_employee", roles: ["Admin", "Manager"] },
  { name: "update_employee", roles: ["Admin", "Manager"] },
  { name: "delete_employee", roles: ["Admin"] },
  { name: "create_employee_bulk", roles: ["Admin"] },

  // --- Office Management ---
  { name: "view_offices", roles: ["Admin", "Manager", "Employee"] },
  { name: "create_office", roles: ["Admin"] },
  { name: "update_office", roles: ["Admin"] },
  { name: "delete_office", roles: ["Admin"] },

  // --- Office Leader Management ---
  { name: "view_office_leaders", roles: ["Admin", "Manager"] },
  { name: "create_office_leader", roles: ["Admin"] },
  { name: "update_office_leader", roles: ["Admin"] },
  { name: "delete_office_leader", roles: ["Admin"] },

  // --- Letter Management ---
  { name: "view_letters", roles: ["Admin", "Manager", "Employee"] },
  { name: "create_letter", roles: ["Admin", "Manager", "Employee"] },
  { name: "update_letter", roles: ["Admin", "Manager", "Employee"] },
  { name: "delete_letter", roles: ["Admin"] },
  { name: "send_for_approval", roles: ["Admin", "Manager", "Employee"] },
  { name: "approve_letter", roles: ["Admin", "Manager"] },
  { name: "reject_letter", roles: ["Admin", "Manager"] },

  // --- Attendance Management ---
  { name: "view_own_attendance", roles: ["Admin", "Manager", "Employee"] },
  { name: "mark_own_attendance", roles: ["Admin", "Manager", "Employee"] },
  { name: "view_any_attendance", roles: ["Admin", "Manager"] },
  { name: "mark_any_attendance", roles: ["Admin"] },
  { name: "update_any_attendance", roles: ["Admin"] },
  { name: "delete_any_attendance", roles: ["Admin"] },
  // --- Announcement Management ---
  { name: "create_announcement", roles: ["Admin", "Manager"] },
  { name: "view_announcements", roles: ["Admin", "Manager", "Employee"] },
  { name: "update_announcement", roles: ["Admin", "Manager"] },
  { name: "delete_announcement", roles: ["Admin"] },
  { name: "restore_announcement", roles: ["Admin"] },

  // --- File Management ---
  { name: "upload_files", roles: ["Admin", "Manager", "Employee"] },
  { name: "update_files", roles: ["Admin"] },
  { name: "delete_files", roles: ["Admin"] },
  { name: "view_files_config", roles: ["Admin", "Manager", "Employee"] },
];

export const seedPermissions = async () => {
  console.log("🌱 Starting permission seeding...");
  try {
    for (const p of permissions) {
      // 1. Create the permission if it doesn't exist
      const permission = await prisma.permission.upsert({
        where: { name: p.name },
        update: {},
        create: {
          name: p.name,
          description: `Allows to ${p.name.replace(/_/g, " ")}`,
        },
      });

      // 2. Find the roles to link
      const rolesToLink = await prisma.role.findMany({
        where: { name: { in: p.roles } },
      });

      // 3. Link permission to each role
      for (const role of rolesToLink) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }
    console.log("✅ Permissions seeded and linked to roles successfully.");
  } catch (error) {
    console.error("❌ Error seeding permissions:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

seedPermissions();