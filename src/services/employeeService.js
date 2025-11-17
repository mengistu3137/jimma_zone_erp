import {
  Prisma
} from "@prisma/client";
import bcrypt from "bcryptjs";
import crudService from "./crudService.js";
import userService from "./userService.js";
const crud = new crudService();
import crypto from 'crypto';
import officeService from "./officeService.js";
class EmployeeService {
  constructor() {
    this.model = "employee";
  }

  async bulkUpload(employeesData) {
    if (!Array.isArray(employeesData) || employeesData.length === 0) {
      throw new Error("Request body must be a non-empty array of employees.");
    }
    const createdEmployees = [];
    const errors = [];

    for (const emp of employeesData) {
      try {
        if (!emp.email || !emp.password || !emp.name || !emp.position) {
          throw new Error("Missing required fields for employee creation.");
        }
        const userRes = await crud.create("user", {
          email: emp.email,
          username: emp.username,
          password: emp.password, // ⚠️ hash before save in production
          name: emp.name,
          middle_name: emp.middle_name || "",
          officeId: emp.officeId || null,
        });
        if (!userRes.success) throw new Error(userRes.message);

        // Create employee
        const employeeRes = await crud.create("employee", {
          userId: userRes.data.id,
          officeId: emp.officeId || null,
          position: emp.position,
          hireDate: new Date(emp.hireDate || Date.now()),
          salary: emp.salary || null,
        });
        if (!employeeRes.success) throw new Error(employeeRes.message);

        createdEmployees.push(employeeRes.data);
      } catch (error) {
        errors.push({
          employee: emp,
          error: error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002" ?
            `Duplicate field value: ${error.meta.target.join(", ")}` :
            error.message,
        });
      }
    }

    return {
      success: errors.length === 0,
      message: `Bulk upload completed: ${createdEmployees.length} employees created, ${errors.length} failed.`,
      data: {
        createdEmployees,
        errors
      },
    };
  }
  generateStrongPassword(length = 16) {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
      'abcdefghijklmnopqrstuvwxyz' +
      '0123456789' +
      '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    let password = '';
    const randomBytes = crypto.randomBytes(length * 2);

    for (let i = 0; password.length < length && i < randomBytes.length; i++) {
      const index = randomBytes[i] % characters.length;
      password += characters[index];
    }
    if (password.length !== length) {
      throw new Error('Failed to generate password of the requested length.');
    }

    return password;
  }
  async createAccount(req, res) {

    const {
      employeeId
    } = req.query;
    let status = 404;
    let message = "Employee Not Found";
    if (employeeId) {
      const employee = await crud.findFirst("employee", {
        id: employeeId
      });
      if (employee) {
        const generatedEmial = `${employee.name.trim()}.${employee.middle_name.trim()}@jimmazone.com`;
        const email = employee.emial ?? generatedEmial.trim();
        const username = email;
        const password = this.generateStrongPassword();
        const {
          name,
          middle_name,
          officeId
        } = employee;
        const employeeRole = await crud.findUnique("role",
          {
            name: "Employee"
          },
        );


        const user = await userService.createUser({
          email,
          username,
          password,
          name,
          middle_name,
          officeId
        });
        if (user.data && employeeRole) {
          const userId = user.data?.id;
          await crud.update("employee", employee.id, { userId: userId });
          const userRole = await crud.create("userRole", { userId: userId, roleId: employeeRole.id });
          if (userRole)
            message = { username: username, pass: password, role: "Employee", email: email };
          status = 201;
        }

      }
    }
    return res.status(status).json({ message: { ...message } });
  }

  // 🔹 Create single employee
  async createEmployee(data) {
    if (!data || Object.keys(data).length === 0) {
      throw new Error("Request body is empty.");
    }

    const {
      userId,
      officeId,
      position,
      hireDate,
      name,
      middle_name,
      last_name,
      gender,
    } =
      data;

    const employeeData = { name, middle_name, last_name,gender };
    if (hireDate) employeeData.hireDate = new Date(hireDate);
    if (userId) employeeData.userId = new Date(userId);

    if (officeId) employeeData.office = {
      connect: {
        id: officeId
      }
    } || null;
    if (position)
      employeeData.positions = {
        connect: {
          id: position
        }
      } || null;
    const emp=await crud.create("employee", employeeData);
    return emp;
  }

  // 🔹 Get all employees (pagination + search)
  async getAllEmployees(req, res) {
    const {
      page = 1, pageSize = 10, search, sortBy, sortOrder
    } = req.query;
    const user = await userService.getUserById(req.user?.id);
    if (!user?.data?.office?.id)
      return res.status(500).json({ success: false, message: "You are not assigned to office, please contact" });

    const subOffices = await officeService.findAllSubOffices(user?.data?.office?.id);
    const subOfficeIds = subOffices.map((office) => {
      return office.id
    });
    const offices = [user?.data?.office?.id, ...subOfficeIds];
    const conditions = {
      officeId: { in: offices }
    };
    if (search)
      conditions.OR = [{
        name: {
          contains: search
        }
      },
      {
        middle_name: {
          contains: search
        }
      },
      {
        last_name: {
          contains: search
        }
      },
      {
        phone: {
          contains: search
        }
      },
      {
        office: {
          name: {
            contains: search
          }
        }
      },
      ];
    const emp = await crud.findAll("employee", {
      page: Number(page),
      pageSize: Number(pageSize),
      where: conditions,
      orderBy: sortBy ? {
        [sortBy]: sortOrder || "asc"
      } : {
        hireDate: "desc"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            roles: {
              include: {
                role: true
              }
            },
          },
        },
        office: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
      },
    });
    if (emp)
      return res.status(200).json(emp);
    return res.status(500).json({ success: false, message: "Cannot Filter employee" });
  }

  // 🔹 Get employee by ID
  async getEmployeeById(id) {
    if (!id) throw new Error("Employee ID is required.");

    const result = await crud.findById("employee", id, {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            middle_name: true,
          },
        },
        office: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        attendance: {
          orderBy: {
            timestamp: "desc"
          },
          take: 30
        },
      },
    });

    return result.success ?
      result :
      {
        success: false,
        message: "Employee not found."
      };
  }

  // 🔹 Get employee by userId
  async getEmployeeByUserId(userId) {
    if (!userId) throw new Error("User ID is required.");

    const res = await crud.findAll("employee", {
      filters: {
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        },
        office: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
      },
    });
    return res.data.length > 0 ?
      {
        success: true,
        data: res.data[0]
      } :
      {
        success: false,
        message: "Employee not found for this user."
      };
  }

  // 🔹 Update employee
  async updateEmployee(id, data) {
    console.log(id);
    if (!id) throw new Error("Employee ID is required.");
    if (!data || Object.keys(data).length === 0)
      throw new Error("Update data is required.");

    // const payload = {
    //   officeId: data.officeId || undefined,
    //   position: data.position || undefined,
    //   hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
    //   salary: data.salary || undefined,
    // };

    return await crud.update("employee", id, data);
  }

  // 🔹 Delete employee
  async deleteEmployee(id) {
    if (!id) throw new Error("Employee ID is required.");
    return await crud.delete("employee", id);
  }

  // 🔹 Get employees by office
  async getEmployeesByOffice(officeId, query = {}) {
    if (!officeId) throw new Error("Office ID is required.");

    const {
      page = 1, pageSize = 10
    } = query;

    return await crud.findAll("employee", {
      page: Number(page),
      pageSize: Number(pageSize),
      filters: {
        officeId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        },
        office: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
      },
      orderBy: {
        hireDate: "desc"
      },
    });
  }
  // 🔹 Get employees by office
  async getEmployeesByOffice(officeId, query = {}) {
    if (!officeId) throw new Error("Office ID is required.");

    const {
      page = 1, pageSize = 10
    } = query;

    return await crud.findAll("employee", {
      page: Number(page),
      pageSize: Number(pageSize),
      filters: {
        officeId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        },
        office: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
      },
      orderBy: {
        hireDate: "desc"
      },
    });
  }
  async getEmployeesUnderManager(userId, query = {}) {
    if (!userId) throw new Error("User ID is required.");

    // 1️⃣ Find the manager’s employee record using crud (disable pagination)
    const managerResult = await crud.findAll(
      "employee", {
      filters: {
        userId
      },
      include: {
        office: {
          select: {
            id: true
          }
        }
      },
    },
      true // disable pagination (since we expect only one employee record)
    );

    if (
      !managerResult.success ||
      !managerResult.data ||
      managerResult.data.length === 0
    ) {
      throw new Error("Manager not found.");
    }

    // There’s only one employee record per userId; take the first
    const manager = managerResult.data[0];
    const managerOfficeId = manager.officeId ?? manager.office?.id;

    if (!managerOfficeId) {
      throw new Error("Manager does not belong to any office.");
    }

    // 2️⃣ Collect office IDs: manager’s + all descendants
    const officeIds = await getAllChildOfficeIdsUsingCrud(managerOfficeId);
    officeIds.push(managerOfficeId); // include manager’s own office

    // 3️⃣ Use crud.findAll to fetch employees in all those offices (with pagination)
    const {
      page = 1, pageSize = 10
    } = query;

    return await crud.findAll("employee", {
      page: Number(page),
      pageSize: Number(pageSize),
      filters: {
        officeId: {
          in: officeIds
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          },
        },
        office: {
          select: {
            id: true,
            name: true,
            location: true,
            parentId: true
          },
        },
      },
      orderBy: {
        hireDate: "desc"
      },
    });
  }

  // 🔹 Create user account for existing employee
  async createUserForEmployee(employeeId, email) {
    if (!employeeId) throw new Error("Employee ID is required.");
    if (!email) throw new Error("email is required.");

    // 1. Get employee details
    const employeeResult = await crud.findById("employee", employeeId, {
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        },
        office: {
          select: {
            id: true,
            name: true
          }
        },
      },
    });

    if (!employeeResult.success) {
      throw new Error("Employee not found.");
    }

    const employee = employeeResult.data;

    // 2. Check if employee already has a user account
    if (employee.userId || employee.user) {
      throw new Error("Employee already has a user account.");
    }

    // 3. Generate username from name
    const username = this.generateUsername(
      employee.name,
      employee.middle_name,
      employee.last_name
    );

    // 4. Generate random password
    const plainPassword = this.generateRandomPassword();
    // 5. Hash password for storage
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    // 6. Create user
    const userData = {
      email: email,
      username: username,
      password: hashedPassword, // Store hashed password in database
      name: employee.name,
      middle_name: employee.middle_name || "",
      officeId: employee.officeId || null,
    };

    const userRes = await crud.create("user", userData);

    if (!userRes.success) {
      throw new Error(`Failed to create user: ${userRes.message}`);
    }

    // 7. Update employee with userId
    const updateRes = await crud.update("employee", employeeId, {
      userId: userRes.data.id,
    });

    if (!updateRes.success) {
      // Rollback user creation if employee update fails
      await crud.delete("user", userRes.data.id);
      throw new Error("Failed to link user to employee.");
    }

    return {
      success: true,
      message: "User account created successfully for employee",
      data: {
        username: username,
        generatedPassword: plainPassword,
      },
    };
  }

  /**
   * 🔹 Generate username from employee name
   */
  generateUsername(firstName, middleName, lastName) {
    // Clean and format names
    const cleanName = (name) => {
      return name ? name.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
    };

    const first = cleanName(firstName);
    const middle = cleanName(middleName);
    const last = cleanName(lastName);

    let username = "";

    if (first && last) {
      username = `${first}.${last}`;
    } else if (first && middle) {
      username = `${first}.${middle}`;
    } else if (first) {
      username = first;
    } else {
      throw new Error("Invalid employee name for username generation");
    }

    // Add random numbers to ensure uniqueness
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${username}${randomSuffix}`;
  }

  /**
   * 🔹 Generate random password
   */
  generateRandomPassword(length = 12) {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}

/**
 * 🧩 Helper: Recursively gather all child office IDs using crudService only.
 * Returns an array of office IDs (strings).
 */
async function getAllChildOfficeIdsUsingCrud(officeId) {
  const collected = [];

  // Fetch direct children (disable pagination)
  const childrenResult = await crud.findAll(
    "office", {
    filters: {
      parentId: officeId
    },
    // no need to include anything — we only care about ids
  },
    true // disable pagination
  );

  if (!childrenResult.success) {
    throw new Error(
      `Error fetching child offices: ${childrenResult.message || "unknown"}`
    );
  }

  const children = childrenResult.data || [];

  // Recursively collect grandchildren
  for (const child of children) {
    if (child?.id) {
      collected.push(child.id);
      const subChildren = await getAllChildOfficeIdsUsingCrud(child.id);
      collected.push(...subChildren);
    }
  }

  return collected;
}
export default new EmployeeService();