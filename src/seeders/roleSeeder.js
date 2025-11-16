import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";

export const seedRoles = async () => {
  console.log("🌱 Starting role and user seeding...");
  try {
    // 1️⃣ Define roles to seed (added 'User')
    const roles = [
      {
        name: "Admin",
        description:
          "Full system access. Can manage users, roles, and permissions.",
      },
      {
        name: "Manager",
        description:
          "Can manage users, employees, and approve documents within their scope.",
      },
      {
        name: "Employee",
        description:
          "Standard user. Can perform self-service actions and basic document tasks.",
      },
      {
        name: "User",
        description: "Basic user role with limited permissions.",
      },
    ];

    // 2️⃣ Seed roles (upsert for safety)
    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: { description: role.description },
        create: {
          name: role.name,
          description: role.description,
        },
      });
    }

    console.log("✅ Roles seeded successfully.");

    // 3️⃣ Ensure Admin role exists
    const adminRole = await prisma.role.findUnique({
      where: { name: "Admin" },
    });

    if (!adminRole) throw new Error("❌ Admin role not found after seeding.");

    // 4️⃣ Ensure Admin user exists
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const adminUser = await prisma.user.upsert({
      where: { email: "admin@deboerp.com" },
      update: {
        password: hashedPassword,
        name: "System",
        middle_name: "Admin",
      },
      create: {
        email: "admin@deboerp.com",
        username: "admin",
        password: hashedPassword,
        name: "System",
        middle_name: "Admin",
      },
    });

    console.log(`ℹ️ Admin user ensured: ${adminUser.email}`);

    // 5️⃣ Link Admin user to Admin role
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });

    // 6️⃣ Get all permissions and link them to Admin role (skip existing)
    const permissions = await prisma.permission.findMany();
    
    // Use createMany with skipDuplicates to avoid unique constraint errors
    const rolePermissionsData = permissions.map((perm) => ({
      roleId: adminRole.id,
      permissionId: perm.id,
    }));

    await prisma.rolePermission.createMany({
      data: rolePermissionsData,
      skipDuplicates: true, // This prevents the unique constraint error
    });

    console.log(`✅ Linked ${permissions.length} permissions to Admin role successfully.`);
    console.log("🎉 Role and user seeding completed successfully.");
  } catch (error) {
    console.error("❌ Error during seeding:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

// Run seeder
seedRoles();