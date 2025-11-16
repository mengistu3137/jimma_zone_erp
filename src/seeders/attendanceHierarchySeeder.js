import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting attendance hierarchy seeding...');

  // Clean up existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning up existing test data...');
  await prisma.attendanceDetail.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.employeePosition.deleteMany({});
  await prisma.employee.deleteMany({
    where: {
      user: {
        email: {
          in: [
            'abebe.kebede@debo.com',
            'chaltu.tadesse@debo.com',
            'dawit.haile@debo.com',
            'fikadu.negash@debo.com',
            'genet.assefa@debo.com',
            'hiwot.bekele@debo.com',
          ],
        },
      },
    },
  });
  await prisma.officeLeader.deleteMany({});
  await prisma.office.deleteMany({
    where: {
      name: {
        in: [
          'Jimma Head Office',
          'Jimma Sales Department',
          'Jimma Marketing Department',
          'Jimma Merkato Branch',
          'Jimma Kochi Branch',
        ],
      },
    },
  });
  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: {
          in: [
            'abebe.kebede@debo.com',
            'chaltu.tadesse@debo.com',
            'dawit.haile@debo.com',
            'fikadu.negash@debo.com',
            'genet.assefa@debo.com',
            'hiwot.bekele@debo.com',
          ],
        },
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'abebe.kebede@debo.com',
          'chaltu.tadesse@debo.com',
          'dawit.haile@debo.com',
          'fikadu.negash@debo.com',
          'genet.assefa@debo.com',
          'hiwot.bekele@debo.com',
        ],
      },
    },
  });

  // 1. Create Office Hierarchy
  console.log('🏢 Creating office hierarchy...');
  
  const headOffice = await prisma.office.create({
    data: {
      name: 'Jimma Head Office',
      location: 'Jimma City Center, Near Jimma University',
    },
  });

  const salesDept = await prisma.office.create({
    data: {
      name: 'Jimma Sales Department',
      location: 'Jimma, Ginjo Guduru Area',
      parentId: headOffice.id,
    },
  });

  const marketingDept = await prisma.office.create({
    data: {
      name: 'Jimma Marketing Department',
      parentId: headOffice.id,
      location: 'Jimma, Ajip Area',
    },
  });

  const salesTeamA = await prisma.office.create({
    data: {
      name: 'Jimma Merkato Branch',
      parentId: salesDept.id,
      location: 'Jimma, Merkato Area',
    },
  });

  const salesTeamB = await prisma.office.create({
    data: {
      name: 'Jimma Kochi Branch',
      parentId: salesDept.id,
      location: 'Jimma, Kochi Area',
    },
  });

  console.log(`✅ Created offices: ${headOffice.name}, ${salesDept.name}, ${marketingDept.name}, ${salesTeamA.name}, ${salesTeamB.name}`);

  // 2. Get or Create Role
  console.log('👥 Setting up roles...');
  let managerRole = await prisma.role.findFirst({
    where: { name: 'Manager' },
  });

  if (!managerRole) {
    managerRole = await prisma.role.create({
      data: {
        name: 'Manager',
        description: 'Manager role for testing',
      },
    });
  }

  let employeeRole = await prisma.role.findFirst({
    where: { name: 'Employee' },
  });

  if (!employeeRole) {
    employeeRole = await prisma.role.create({
      data: {
        name: 'Employee',
        description: 'Employee role for testing',
      },
    });
  }

  // 3. Create Users and Employees
  console.log('👤 Creating users and employees...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Manager User - Abebe Kebede
  const managerUser = await prisma.user.create({
    data: {
      email: 'abebe.kebede@debo.com',
      username: 'abebekebede',
      password: hashedPassword,
      name: 'Abebe',
      middle_name: 'Kebede',
      officeId: salesDept.id,
      roles: {
        create: {
          roleId: managerRole.id,
        },
      },
    },
  });

  const managerEmployee = await prisma.employee.create({
    data: {
      userId: managerUser.id,
      name: 'Abebe',
      middle_name: 'Kebede',
      last_name: 'Tesfaye',
      gender: 'MALE',
      phone: '+251917123456',
      officeId: salesDept.id,
      hireDate: new Date('2023-01-01'),
    },
  });

  console.log(`✅ Created manager: ${managerUser.email}`);

  // Employee 1 - Chaltu Tadesse (Sales Department)
  const employee1User = await prisma.user.create({
    data: {
      email: 'chaltu.tadesse@debo.com',
      username: 'chaltutadesse',
      password: hashedPassword,
      name: 'Chaltu',
      middle_name: 'Tadesse',
      officeId: salesDept.id,
      roles: {
        create: {
          roleId: employeeRole.id,
        },
      },
    },
  });

  const employee1 = await prisma.employee.create({
    data: {
      userId: employee1User.id,
      name: 'Chaltu',
      middle_name: 'Tadesse',
      last_name: 'Alemayehu',
      gender: 'FEMALE',
      phone: '+251918234567',
      officeId: salesDept.id,
      hireDate: new Date('2023-02-01'),
    },
  });

  // Employee 2 - Dawit Haile (Merkato Branch)
  const employee2User = await prisma.user.create({
    data: {
      email: 'dawit.haile@debo.com',
      username: 'dawithaile',
      password: hashedPassword,
      name: 'Dawit',
      middle_name: 'Haile',
      officeId: salesTeamA.id,
      roles: {
        create: {
          roleId: employeeRole.id,
        },
      },
    },
  });

  const employee2 = await prisma.employee.create({
    data: {
      userId: employee2User.id,
      name: 'Dawit',
      middle_name: 'Haile',
      last_name: 'Gebre',
      gender: 'MALE',
      phone: '+251919345678',
      officeId: salesTeamA.id,
      hireDate: new Date('2023-03-01'),
    },
  });

  // Employee 3 - Fikadu Negash (Merkato Branch)
  const employee3User = await prisma.user.create({
    data: {
      email: 'fikadu.negash@debo.com',
      username: 'fikadunegash',
      password: hashedPassword,
      name: 'Fikadu',
      middle_name: 'Negash',
      officeId: salesTeamA.id,
      roles: {
        create: {
          roleId: employeeRole.id,
        },
      },
    },
  });

  const employee3 = await prisma.employee.create({
    data: {
      userId: employee3User.id,
      name: 'Fikadu',
      middle_name: 'Negash',
      last_name: 'Mulugeta',
      gender: 'MALE',
      phone: '+251920456789',
      officeId: salesTeamA.id,
      hireDate: new Date('2023-04-01'),
    },
  });

  // Employee 4 - Genet Assefa (Kochi Branch)
  const employee4User = await prisma.user.create({
    data: {
      email: 'genet.assefa@debo.com',
      username: 'genetassefa',
      password: hashedPassword,
      name: 'Genet',
      middle_name: 'Assefa',
      officeId: salesTeamB.id,
      roles: {
        create: {
          roleId: employeeRole.id,
        },
      },
    },
  });

  const employee4 = await prisma.employee.create({
    data: {
      userId: employee4User.id,
      name: 'Genet',
      middle_name: 'Assefa',
      last_name: 'Bekele',
      gender: 'FEMALE',
      phone: '+251921567890',
      officeId: salesTeamB.id,
      hireDate: new Date('2023-05-01'),
    },
  });

  // Employee 5 - Hiwot Bekele (Marketing - should NOT appear in manager's results)
  const employee5User = await prisma.user.create({
    data: {
      email: 'hiwot.bekele@debo.com',
      username: 'hiwotbekele',
      password: hashedPassword,
      name: 'Hiwot',
      middle_name: 'Bekele',
      officeId: marketingDept.id,
      roles: {
        create: {
          roleId: employeeRole.id,
        },
      },
    },
  });

  const employee5 = await prisma.employee.create({
    data: {
      userId: employee5User.id,
      name: 'Hiwot',
      middle_name: 'Bekele',
      last_name: 'Worku',
      gender: 'FEMALE',
      phone: '+251922678901',
      officeId: marketingDept.id,
      hireDate: new Date('2023-06-01'),
    },
  });

  console.log(`✅ Created 5 employees`);

  // 4. Create Attendance Records
  console.log('📅 Creating attendance records...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const employees = [
    { emp: employee1, user: employee1User },
    { emp: employee2, user: employee2User },
    { emp: employee3, user: employee3User },
    { emp: employee4, user: employee4User },
    { emp: employee5, user: employee5User },
  ];

  const dates = [today, yesterday, twoDaysAgo];
  const statuses = ['PRESENT', 'LATE', 'PRESENT'];

  for (let i = 0; i < employees.length; i++) {
    for (let j = 0; j < dates.length; j++) {
      const attendance = await prisma.attendance.create({
        data: {
          userId: employees[i].user.id,
          employeeId: employees[i].emp.id,
          date: dates[j],
          status: statuses[j],
        },
      });

      // Create attendance details
      const morningCheckInTime = new Date(dates[j]);
      morningCheckInTime.setHours(8, 30 + (i * 5), 0, 0);

      const morningCheckOutTime = new Date(dates[j]);
      morningCheckOutTime.setHours(12, 0, 0, 0);

      const afternoonCheckInTime = new Date(dates[j]);
      afternoonCheckInTime.setHours(14, 0, 0, 0);

      const afternoonCheckOutTime = new Date(dates[j]);
      afternoonCheckOutTime.setHours(17, 30, 0, 0);

      await prisma.attendanceDetail.createMany({
        data: [
          {
            attendanceId: attendance.id,
            timestamp: morningCheckInTime,
            type: 'morningCheckIn',
            gps_latitude: 7.6769 + (i * 0.002),
            gps_longitude: 36.8344 + (i * 0.002),
            deviceId: `device-${i + 1}`,
          },
          {
            attendanceId: attendance.id,
            timestamp: morningCheckOutTime,
            type: 'morningCheckOut',
            gps_latitude: 7.6769 + (i * 0.002),
            gps_longitude: 36.8344 + (i * 0.002),
            deviceId: `device-${i + 1}`,
          },
          {
            attendanceId: attendance.id,
            timestamp: afternoonCheckInTime,
            type: 'afternoonCheckIn',
            gps_latitude: 7.6769 + (i * 0.002),
            gps_longitude: 36.8344 + (i * 0.002),
            deviceId: `device-${i + 1}`,
          },
          {
            attendanceId: attendance.id,
            timestamp: afternoonCheckOutTime,
            type: 'afternoonCheckOut',
            gps_latitude: 7.6769 + (i * 0.002),
            gps_longitude: 36.8344 + (i * 0.002),
            deviceId: `device-${i + 1}`,
          },
        ],
      });
    }
  }

  console.log(`✅ Created attendance records for 3 days`);

  // Summary
  console.log('\n📊 Seeding Summary:');
  console.log('==================');
  console.log(`✅ Offices: 5 (Head Office → Sales Dept → Teams A & B, Marketing Dept)`);
  console.log(`✅ Users: 6 (1 manager + 5 employees)`);
  console.log(`✅ Attendance Records: ${employees.length * dates.length} (3 days × 5 employees)`);
  console.log(`✅ Attendance Details: ${employees.length * dates.length * 4} (4 check-ins per day)`);
  console.log('\n🔑 Test Credentials:');
  console.log('==================');
  console.log('Manager (Jimma Sales Department):');
  console.log('  Email: abebe.kebede@debo.com');
  console.log('  Password: password123');
  console.log('  Name: Abebe Kebede Tesfaye');
  console.log('  Office: Jimma Sales Department');
  console.log('  Can see: Sales Dept, Merkato Branch, Kochi Branch employees');
  console.log('\nEmployees:');
  console.log('  chaltu.tadesse@debo.com - Chaltu Tadesse (Sales Department)');
  console.log('  dawit.haile@debo.com - Dawit Haile (Merkato Branch)');
  console.log('  fikadu.negash@debo.com - Fikadu Negash (Merkato Branch)');
  console.log('  genet.assefa@debo.com - Genet Assefa (Kochi Branch)');
  console.log('  hiwot.bekele@debo.com - Hiwot Bekele (Marketing - NOT in manager hierarchy)');
  console.log('  All passwords: password123');
  console.log('\n📍 Location Info:');
  console.log('==================');
  console.log('All offices located in Jimma, Ethiopia');
  console.log('GPS Coordinates: ~7.677°N, 36.834°E (Jimma City Center)');
  console.log('\n🎯 Expected Results:');
  console.log('==================');
  console.log('When abebe.kebede@debo.com calls /attendance/manager/hierarchy:');
  console.log('  ✅ Should see: Chaltu, Dawit, Fikadu, Genet (4 employees)');
  console.log('  ❌ Should NOT see: Hiwot (Marketing department)');
  console.log('  📅 Should see: 12 attendance records (4 employees × 3 days)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('\n✅ Seeding completed successfully!');
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
