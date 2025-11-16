import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function employeeSeeder() {
  try {
    console.log("🚀 Starting employee and manager seeding...");

    // --- 1. Ensure required roles exist ---
    const managerRole = await prisma.role.findUnique({
      where: { name: "Manager" },
    });
    const employeeRole = await prisma.role.findUnique({
      where: { name: "Employee" },
    });

    if (!managerRole || !employeeRole) {
      throw new Error(
        "❌ 'Manager' or 'Employee' role not found. Run role and permission seeders first."
      );
    }
    console.log("✅ Found required roles: Manager, Employee.");


    // --- 2. Create or find sample offices ---
 // --- 2. Create or find sample offices ---
let headOffice = await prisma.office.findFirst({
  where: { name: "Daldaala fi Carraa Hojii uumu" },
});

if (!headOffice) {
  headOffice = await prisma.office.create({
    data: {
      name: "Daldaala fi Carraa Hojii uumu",
      location: "Addis Ababa",
      gps_latitude: 9.0108,
      gps_longitude: 38.7613,
      phone: "+251900000000",
      email: "mainoffice@debo.com",
    },
  });
}

let branchOffice = await prisma.office.findFirst({
  where: { name: "Branch Office" },
});

if (!branchOffice) {
  branchOffice = await prisma.office.create({
    data: {
      name: "Branch Office",
      location: "Dire Dawa",
      parentId: headOffice.id,
      gps_latitude: 9.6000,
      gps_longitude: 41.8667,
      phone: "+251911111111",
      email: "branchoffice@debo.com",
    },
  });
}

// Additional offices — all now with required GPS
await prisma.office.createMany({
  skipDuplicates: true,
  data: [
    {
      name: "Bulchaa Bulchiinsa",
      location: "Addis Ababa",
      gps_latitude: 9.0050,
      gps_longitude: 38.7500,
    },
    {
      name: "Waajjiira Fayyaa",
      location: "Addis Ababa",
      gps_latitude: 9.0120,
      gps_longitude: 38.7521,
    },
    {
      name: "Gurmaa'insa Ummataa",
      location: "Adama",
      gps_latitude: 8.5400,
      gps_longitude: 39.2700,
    },
    {
      name: "Nagaa fi Milishaa",
      location: "Bishoftu",
      gps_latitude: 8.7500,
      gps_longitude: 38.9833,
    },
    {
      name: "Sab-Qunnamtii",
      location: "Dire Dawa",
      gps_latitude: 9.6005,
      gps_longitude: 41.8680,
    },
  ],
});

console.log("✅ Ensured sample offices exist.");

  

    const hashedPassword = await bcrypt.hash("password123", 10);

    const usersToCreate = [
      {
        email: "manager@debo.com",
        username: "manager",
        name: "Robert",
        middle_name: "Johnson",
        roleId: managerRole.id,
        officeId: headOffice.id,
        position: "Manager",
      },
      {
        email: "employee1@debo.com",
        username: "employee1",
        name: "John",
        middle_name: "Doe",
        roleId: employeeRole.id,
        officeId: branchOffice.id,
        position: "Software Developer",
      },
      {
        email: "employee2@debo.com",
        username: "employee2",
        name: "Jane",
        middle_name: "Smith",
        roleId: employeeRole.id,
        officeId: branchOffice.id,
        position: "QA Engineer",
      },
    ];

    for (const userData of usersToCreate) {
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: userData.email,
            username: userData.username,
            password: hashedPassword,
            name: userData.name,
            middle_name: userData.middle_name,
          },
        });
      }

      // Check and create user role relationship
      const existingUserRole = await prisma.userRole.findUnique({
        where: { 
          userId_roleId: { 
            userId: user.id, 
            roleId: userData.roleId 
          } 
        },
      });

      if (!existingUserRole) {
        await prisma.userRole.create({
          data: { 
            userId: user.id, 
            roleId: userData.roleId 
          },
        });
      }

      // Check and create employee record
      const existingEmployee = await prisma.employee.findUnique({
        where: { userId: user.id },
      });

      if (!existingEmployee) {
        await prisma.employee.create({
          data: {
           user: {
      connect: { id: user.id },
    },
    office: {
      connect: { id: userData.officeId },
    },
            hireDate: new Date("2023-01-15"),
            name:"Admin",
            middle_name: "User",
            last_name: "AdminUser",
            gender: "MALE",
            phone: "+251910101010",
            birthDate: new Date("01-01-1993"),
            placeOfBirth: "Jimma",
            maritusStatus: "Single",
        emergencyPerson:"Admin Support",
        emergencyContact:"+25910101010", 
        emergencyRelation:"BROTHER",    
        //     deviceHash: crypto  
        //       .createHash("sha256")
        //       .update(userData.email)
        //       .digest("hex")
        //       .substring(0, 16),
          },
        });
      }
    }
    await prisma.employee.createMany({data:[
  { "name": "Firaa", middle_name: "Mohaammadsiraj",gender:"MALE" },
  { "name": "Ahimad", middle_name: " Tamaam",gender:"MALE" },
  { "name": "Rehima", middle_name: " A/Biya", gender:"FEMALE" },
  { "name": "Daraartuu", middle_name: " Abbaa Jihaad" ,gender:"FEMALE"},
  { "name": "Kumaa", middle_name: " Sixoota",gender:"MALE" },
  { "name": "Abdoo", middle_name: " Abbaa Tamaam",gender:"MALE" },
  { "name": "Iftu", middle_name: " Mohaammadsiraj" ,gender:"FEMALE"},
  { "name": "Tofik", middle_name: "Tamaam",gender:"MALE" },
  { "name": "Jemal", middle_name: " A/Biya" ,gender:"MALE"},
  { "name": "Reshad", middle_name: " Jemal" ,gender:"MALE"},
  { "name": "Tullu", middle_name: " Sixoota",gender:"MALE" },
  { "name": "Mubarik", middle_name: " AbbaBiyya",gender:"MALE" },
  { "name": "Firaa", middle_name: " Mohaammadsan" ,gender:"MALE"},
  { "name": "Ahimad", middle_name: " Abrar",gender:"MALE" },
  { "name": "Fatuma", middle_name: " A/Jebel" ,gender:"FEMALE"},
  { "name": "Rehima", middle_name: " Sh/Kaman" ,gender:"FEMALE"},
  { "name": "Mustefa", middle_name: " A/Jebel",gender:"MALE" },
  { "name": "Mubarik", middle_name: " AbbaJihad",gender:"MALE" },
  { "name": "Husen", middle_name: " Mohaammadsiraj" ,gender:"MALE"},
  { "name": "Ahimad", middle_name: " Tamaam",gender:"MALE" },
  { "name": "Kelil", middle_name: " A/Biya",gender:"MALE" },
  { "name": "Caaltuu", middle_name: " Biyya" ,gender:"FEMALE"},
  { "name": "Ishatuu", middle_name: " Sixoota" ,gender:"MALE"},
  { "name": "Jemal", middle_name: " AbbaBiyaa" ,gender:"MALE"}
]});

    console.log(
      "✅ Seeded Manager and Employee users, linked roles, and created employee records."
    );
    console.log("🎉 Employee seeder completed successfully!");
  } catch (error) {
    console.error("❌ Employee seeder error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

employeeSeeder();