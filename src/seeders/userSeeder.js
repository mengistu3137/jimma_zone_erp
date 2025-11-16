import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";

const seedUsers = async () => {
  console.log("🌱 Starting admin user seeding...");
  try {
    const adminRole = await prisma.role.findUnique({
      where: { name: "Admin" },
    });

    if (!adminRole) {
      throw new Error(
        "❌ Admin role not found. Please run roleSeeder.js first."
      );
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);


    
    // Create the admin user if they don't exist
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@deboerp.com" },
      update: {},
      create: {
        email: "admin@deboerp.com",
        username: "admin",
        password: hashedPassword,
        name: "System",
        middle_name: "Admin",
      },
    });

    console.log(`ℹ️ Admin user with email 'admin@deboerp.com' ensured.`);

    // Link user to Admin role
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

    console.log("✅ Admin user linked to 'Admin' role successfully.");
    console.log("🎉 Admin user seeding completed successfully.");
  } catch (error) {
    console.error("❌ Error seeding admin user:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

seedUsers();
