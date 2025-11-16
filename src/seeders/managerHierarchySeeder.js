import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedManagerHierarchy() {
  console.log("🌱 Starting Manager Hierarchy Seeder...");

  try {
    // 🧹 Clean up existing test data first
    console.log("🧹 Cleaning up existing test data...");
    
    // Delete in correct order to respect foreign key constraints
    await prisma.officeLeader.deleteMany({
      where: {
        user: {
          email: {
            in: [
              "manager@debo.com",
              "tigist@debo.com",
              "dawit@debo.com",
              "meron@debo.com",
              "yohannes@debo.com",
              "sara@debo.com",
              "hanna@debo.com",
              "daniel@debo.com",
              "kidus@debo.com",
              "bethlehem@debo.com",
              "eyob@debo.com",
              "mahlet@debo.com",
              "samuel@debo.com",
            ],
          },
        },
      },
    });

    await prisma.employee.deleteMany({
      where: {
        user: {
          email: {
            in: [
              "manager@debo.com",
              "tigist@debo.com",
              "dawit@debo.com",
              "meron@debo.com",
              "yohannes@debo.com",
              "sara@debo.com",
              "hanna@debo.com",
              "daniel@debo.com",
              "kidus@debo.com",
              "bethlehem@debo.com",
              "eyob@debo.com",
              "mahlet@debo.com",
              "samuel@debo.com",
            ],
          },
        },
      },
    });

    await prisma.userRole.deleteMany({
      where: {
        user: {
          email: {
            in: [
              "manager@debo.com",
              "tigist@debo.com",
              "dawit@debo.com",
              "meron@debo.com",
              "yohannes@debo.com",
              "sara@debo.com",
              "hanna@debo.com",
              "daniel@debo.com",
              "kidus@debo.com",
              "bethlehem@debo.com",
              "eyob@debo.com",
              "mahlet@debo.com",
              "samuel@debo.com",
            ],
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "manager@debo.com",
            "tigist@debo.com",
            "dawit@debo.com",
            "meron@debo.com",
            "yohannes@debo.com",
            "sara@debo.com",
            "hanna@debo.com",
            "daniel@debo.com",
            "kidus@debo.com",
            "bethlehem@debo.com",
            "eyob@debo.com",
            "mahlet@debo.com",
            "samuel@debo.com",
          ],
        },
      },
    });

    await prisma.office.deleteMany({
      where: {
        name: {
          in: [
            "Jimma Head Office",
            "Branch A - Sales",
            "Branch B - Operations",
            "Sub-Branch A1 - Zone Sales",
            "Sub-Branch A2 - Zone Customer Service",
            "Sub-Branch B1 - Zone Logistics",
          ],
        },
      },
    });

    console.log("✅ Cleanup completed");

    // 1️⃣ Create Office Hierarchy
    console.log("\n📍 Creating office hierarchy...");

    // Main Office (Root)
    const mainOffice = await prisma.office.create({
      data: {
        name: "Jimma Head Office",
        location: "Jimma, Ethiopia",
      },
    });
    console.log(`✅ Created: ${mainOffice.name}`);

    // Branch A (Child of Main Office)
    const branchA = await prisma.office.create({
      data: {
        name: "Branch A - Sales",
        location: "Jimma, Ethiopia",
        parentId: mainOffice.id,
      },
    });
    console.log(`✅ Created: ${branchA.name}`);

    // Branch B (Child of Main Office)
    const branchB = await prisma.office.create({
      data: {
        name: "Branch B - Operations",
        location: "Jimma, Ethiopia",
        parentId: mainOffice.id,
      },
    });
    console.log(`✅ Created: ${branchB.name}`);

    // Sub-Branch A1 (Child of Branch A)
    const subBranchA1 = await prisma.office.create({
      data: {
        name: "Sub-Branch A1 - Zone Sales",
        location: "Jimma, Ethiopia",
        parentId: branchA.id,
      },
    });
    console.log(`✅ Created: ${subBranchA1.name}`);

    // Sub-Branch A2 (Child of Branch A)
    const subBranchA2 = await prisma.office.create({
      data: {
        name: "Sub-Branch A2 - Zone Customer Service",
        location: "Jimma, Ethiopia",
        parentId: branchA.id,
      },
    });
    console.log(`✅ Created: ${subBranchA2.name}`);

    // Sub-Branch B1 (Child of Branch B)
    const subBranchB1 = await prisma.office.create({
      data: {
        name: "Sub-Branch B1 - Zone Logistics",
        location: "Jimma, Ethiopia",
        parentId: branchB.id,
      },
    });
    console.log(`✅ Created: ${subBranchB1.name}`);

    // 2️⃣ Create Roles and Permissions
    console.log("\n🔐 Creating roles and permissions...");

    // Check if permissions exist, if not create them
    let viewEmployeesPermission = await prisma.permission.findUnique({
      where: { name: "view_employees" },
    });
    if (!viewEmployeesPermission) {
      viewEmployeesPermission = await prisma.permission.create({
        data: {
          name: "view_employees",
          description: "Can view employee information",
        },
      });
    }

    let viewOfficesPermission = await prisma.permission.findUnique({
      where: { name: "view_offices" },
    });
    if (!viewOfficesPermission) {
      viewOfficesPermission = await prisma.permission.create({
        data: {
          name: "view_offices",
          description: "Can view office information",
        },
      });
    }

    // Create Manager Role
    let managerRole = await prisma.role.findUnique({
      where: { name: "Manager" },
    });
    if (!managerRole) {
      managerRole = await prisma.role.create({
        data: {
          name: "Manager",
          description: "Office Manager with hierarchy access",
        },
      });
    }

    // Assign permissions to Manager role
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: viewEmployeesPermission.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: viewEmployeesPermission.id,
      },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: viewOfficesPermission.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: viewOfficesPermission.id,
      },
    });

    console.log(`✅ Created/Updated role: ${managerRole.name}`);

    // 3️⃣ Create Users and Employees
    console.log("\n👥 Creating users and employees...");

    const hashedPassword = await bcrypt.hash("password123", 10);

    // Manager at Head Office
    const managerUser = await prisma.user.create({
      data: {
        email: "manager@debo.com",
        username: "manager_head",
        password: hashedPassword,
        name: "Abebe",
        middle_name: "Kebede",
        officeId: mainOffice.id,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: managerUser.id,
        roleId: managerRole.id,
      },
    });

    const managerEmployee = await prisma.employee.create({
      data: {
        userId: managerUser.id,
        name: "Abebe",
        middle_name: "Kebede",
        last_name: "Tesfaye",
        gender: "MALE",
        phone: "+251911234567",
        officeId: mainOffice.id,
        hireDate: new Date("2020-01-15"),
      },
    });

    await prisma.officeLeader.create({
      data: {
        userId: managerUser.id,
        officeId: mainOffice.id,
      },
    });

    console.log(`✅ Created Manager: ${managerUser.email} at ${mainOffice.name}`);

    // Employees at Head Office
    const headOfficeEmployees = [
      { name: "Tigist", middle_name: "Haile", email: "tigist@debo.com" },
      { name: "Dawit", middle_name: "Alemayehu", email: "dawit@debo.com" },
    ];

    for (const emp of headOfficeEmployees) {
      const user = await prisma.user.create({
        data: {
          email: emp.email,
          username: emp.email.split("@")[0],
          password: hashedPassword,
          name: emp.name,
          middle_name: emp.middle_name,
          officeId: mainOffice.id,
        },
      });

      await prisma.employee.create({
        data: {
          userId: user.id,
          name: emp.name,
          middle_name: emp.middle_name,
          last_name: "Mengistu",
          gender: "MALE",
          phone: `+25191${Math.floor(1000000 + Math.random() * 9000000)}`,
          officeId: mainOffice.id,
          hireDate: new Date("2021-03-01"),
        },
      });

      console.log(`✅ Created Employee: ${emp.email} at ${mainOffice.name}`);
    }

    // Employees at Branch A
    const branchAEmployees = [
      { name: "Meron", middle_name: "Tadesse", email: "meron@debo.com" },
      { name: "Yohannes", middle_name: "Bekele", email: "yohannes@debo.com" },
      { name: "Sara", middle_name: "Girma", email: "sara@debo.com" },
    ];

    for (const emp of branchAEmployees) {
      const user = await prisma.user.create({
        data: {
          email: emp.email,
          username: emp.email.split("@")[0],
          password: hashedPassword,
          name: emp.name,
          middle_name: emp.middle_name,
          officeId: branchA.id,
        },
      });

      await prisma.employee.create({
        data: {
          userId: user.id,
          name: emp.name,
          middle_name: emp.middle_name,
          last_name: "Assefa",
          gender: emp.name === "Sara" || emp.name === "Meron" ? "FEMALE" : "MALE",
          phone: `+25191${Math.floor(1000000 + Math.random() * 9000000)}`,
          officeId: branchA.id,
          hireDate: new Date("2021-06-15"),
        },
      });

      console.log(`✅ Created Employee: ${emp.email} at ${branchA.name}`);
    }

    // Employees at Branch B
    const branchBEmployees = [
      { name: "Hanna", middle_name: "Wolde", email: "hanna@debo.com" },
      { name: "Daniel", middle_name: "Tefera", email: "daniel@debo.com" },
    ];

    for (const emp of branchBEmployees) {
      const user = await prisma.user.create({
        data: {
          email: emp.email,
          username: emp.email.split("@")[0],
          password: hashedPassword,
          name: emp.name,
          middle_name: emp.middle_name,
          officeId: branchB.id,
        },
      });

      await prisma.employee.create({
        data: {
          userId: user.id,
          name: emp.name,
          middle_name: emp.middle_name,
          last_name: "Desta",
          gender: emp.name === "Hanna" ? "FEMALE" : "MALE",
          phone: `+25191${Math.floor(1000000 + Math.random() * 9000000)}`,
          officeId: branchB.id,
          hireDate: new Date("2021-09-01"),
        },
      });

      console.log(`✅ Created Employee: ${emp.email} at ${branchB.name}`);
    }

    // Employees at Sub-Branch A1
    const subBranchA1Employees = [
      { name: "Kidus", middle_name: "Getachew", email: "kidus@debo.com" },
      { name: "Bethlehem", middle_name: "Solomon", email: "bethlehem@debo.com" },
    ];

    for (const emp of subBranchA1Employees) {
      const user = await prisma.user.create({
        data: {
          email: emp.email,
          username: emp.email.split("@")[0],
          password: hashedPassword,
          name: emp.name,
          middle_name: emp.middle_name,
          officeId: subBranchA1.id,
        },
      });

      await prisma.employee.create({
        data: {
          userId: user.id,
          name: emp.name,
          middle_name: emp.middle_name,
          last_name: "Mulugeta",
          gender: emp.name === "Bethlehem" ? "FEMALE" : "MALE",
          phone: `+25191${Math.floor(1000000 + Math.random() * 9000000)}`,
          officeId: subBranchA1.id,
          hireDate: new Date("2022-01-10"),
        },
      });

      console.log(`✅ Created Employee: ${emp.email} at ${subBranchA1.name}`);
    }

    // Employees at Sub-Branch A2
    const subBranchA2Employees = [
      { name: "Eyob", middle_name: "Negash", email: "eyob@debo.com" },
    ];

    for (const emp of subBranchA2Employees) {
      const user = await prisma.user.create({
        data: {
          email: emp.email,
          username: emp.email.split("@")[0],
          password: hashedPassword,
          name: emp.name,
          middle_name: emp.middle_name,
          officeId: subBranchA2.id,
        },
      });

      await prisma.employee.create({
        data: {
          userId: user.id,
          name: emp.name,
          middle_name: emp.middle_name,
          last_name: "Yimer",
          gender: "MALE",
          phone: `+25191${Math.floor(1000000 + Math.random() * 9000000)}`,
          officeId: subBranchA2.id,
          hireDate: new Date("2022-03-20"),
        },
      });

      console.log(`✅ Created Employee: ${emp.email} at ${subBranchA2.name}`);
    }

    // Employees at Sub-Branch B1
    const subBranchB1Employees = [
      { name: "Mahlet", middle_name: "Berhanu", email: "mahlet@debo.com" },
      { name: "Samuel", middle_name: "Tilahun", email: "samuel@debo.com" },
    ];

    for (const emp of subBranchB1Employees) {
      const user = await prisma.user.create({
        data: {
          email: emp.email,
          username: emp.email.split("@")[0],
          password: hashedPassword,
          name: emp.name,
          middle_name: emp.middle_name,
          officeId: subBranchB1.id,
        },
      });

      await prisma.employee.create({
        data: {
          userId: user.id,
          name: emp.name,
          middle_name: emp.middle_name,
          last_name: "Gebre",
          gender: emp.name === "Mahlet" ? "FEMALE" : "MALE",
          phone: `+25191${Math.floor(1000000 + Math.random() * 9000000)}`,
          officeId: subBranchB1.id,
          hireDate: new Date("2022-05-15"),
        },
      });

      console.log(`✅ Created Employee: ${emp.email} at ${subBranchB1.name}`);
    }

    // 4️⃣ Summary
    console.log("\n📊 Seeding Summary:");
    console.log("=".repeat(50));
    console.log(`📍 Offices Created: 6`);
    console.log(`   - ${mainOffice.name} (Root)`);
    console.log(`   - ${branchA.name} (Child of Head Office)`);
    console.log(`   - ${branchB.name} (Child of Head Office)`);
    console.log(`   - ${subBranchA1.name} (Child of Branch A)`);
    console.log(`   - ${subBranchA2.name} (Child of Branch A)`);
    console.log(`   - ${subBranchB1.name} (Child of Branch B)`);
    console.log(`\n👥 Total Employees: 13 (1 Manager + 12 Employees)`);
    console.log(`\n🔑 Test Credentials:`);
    console.log(`   Manager: manager@debo.com / password123`);
    console.log(`   Employee: tigist@debo.com / password123`);
    console.log(`\n📝 Manager's User ID: ${managerUser.id}`);
    console.log(`📝 Manager's Office ID: ${mainOffice.id}`);
    console.log("=".repeat(50));

    console.log("\n✅ Manager Hierarchy Seeding Completed Successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedManagerHierarchy()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
