<h1 align="center">🌐 Debo ERP API</h1>

<p align="center">
  <strong>Node.js + Express + Prisma + MySQL</strong><br>
  A robust backend API for the Debo ERP system with fine-grained permission-based access control.
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Node.js-18+-green?logo=node.js" alt="Node.js"></a>
  <a href="#"><img src="https://img.shields.io/badge/Express.js-Framework-lightgrey?logo=express" alt="Express.js"></a>
  <a href="#"><img src="https://img.shields.io/badge/Prisma-ORM-blue?logo=prisma" alt="Prisma"></a>
  <a href="#"><img src="https://img.shields.io/badge/MySQL-Database-orange?logo=mysql" alt="MySQL"></a>
  <a href="#"><img src="https://img.shields.io/badge/Swagger-Docs-green?logo=swagger" alt="Swagger"></a>
</p>

---

## 🧩 Overview

**Debo ERP API** is a modern backend service for enterprise resource management, built to handle user, employee, attendance, and communication modules with **secure authentication** and **permission-based access**.

It leverages **Node.js**, **Express**, and **Prisma ORM** for scalable, maintainable, and type-safe development.

---

## 🚀 Core Features

### 🔐 Authentication & Authorization

- JWT-based secure login & registration.
- Password hashing using `bcryptjs`.
- Permission-based access control (PBAC) for granular security.

### 🛡️ Security & Role Management

- Full CRUD for roles and permissions.
- Dynamic linking between roles and permissions.

### 🏢 ERP Modules

- User & Employee Management
- Office & Branch Hierarchy
- Letter Creation & Approval Workflow
- Employee Attendance Tracking
- File Upload Management

### 🗃️ Database & Seeding

- Managed by **Prisma ORM**.
- Includes seeders for:
  - Default Roles & Permissions
  - Admin User
  - Sample Employees

### 📚 Documentation

- Live and interactive Swagger documentation (`/api-docs`).

---

## 🏗️ Tech Stack

| Layer    | Technology            |
| -------- | --------------------- |
| Backend  | Express.js            |
| Database | MySQL                 |
| ORM      | Prisma                |
| Auth     | JWT (JSON Web Tokens) |
| Hashing  | bcryptjs              |
| API Docs | Swagger (OpenAPI 3.0) |
| Config   | dotenv                |

---

## 📁 Folder Structure

```

debo-erp-api/
├── prisma/
│   └── schema.prisma
├── public/
│   └── uploads/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── swaggerConfig.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── employeeController.js
│   │   ├── letterController.js
│   │   ├── officeController.js
│   │   ├── permissionController.js
│   │   ├── roleController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── upload.middleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── employeeRoutes.js
│   │   ├── fileRoutes.js
│   │   ├── officeRoutes.js
│   │   ├── permissionRoutes.js
│   │   ├── roleRoutes.js
│   │   ├── userRoutes.js
│   │   └── index.js
│   ├── seeders/
│   │   ├── roleSeeder.js
│   │   ├── permissionSeeder.js
│   │   ├── userSeeder.js
│   │   └── employeeSeeder.js
│   ├── services/
│   │   ├── attendanceService.js
│   │   ├── employeeService.js
│   │   ├── letterService.js
│   │   ├── permissionService.js
│   │   └── userService.js
│   └── app.js
├── .env
├── package.json
└── server.js

```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/mamofideno/debo-erp-api.git
cd debo-erp-api
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment Variables

Create a `.env` file in the root directory and add:

```env
DATABASE_URL="mysql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:3306/debo_erp"
JWT_SECRET="your_strong_jwt_secret_key"
PORT=5000
```

### 4️⃣ Database Migration

Ensure a MySQL database named `debo_erp` exists, then run:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5️⃣ Run Seeders

```bash
node src/seeders/roleSeeder.js
node src/seeders/permissionSeeder.js
node src/seeders/userSeeder.js
node src/seeders/employeeSeeder.js
```

🧑‍💼 **Default Admin Credentials**

| Email                                         | Password |
| --------------------------------------------- | -------- |
| [admin@deboerp.com](mailto:admin@deboerp.com) | admin123 |

---

## 📡 API Documentation

Access live Swagger docs at:
➡️ **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

---

## 🧪 Testing with Postman

### 1. Start the Server

```bash
npm run dev
```

### 2. Login to Get Token

```
POST http://localhost:5000/api/auth/login
```

**Body (JSON):**

```json
{
  "email": "admin@deboerp.com",
  "password": "admin123"
}
```

### 3. Use Token for Protected Routes

Add Header:

```
Authorization: Bearer <token>
```

Example:

```
GET http://localhost:5000/api/users
```

---

## 🧰 Available Scripts

This project includes a set of useful npm scripts to streamline your development workflow.

### General

| Command       | Description                                                             |
| ------------- | ----------------------------------------------------------------------- |
| `npm start`   | Starts the server in production mode.                                   |
| `npm run dev` | Starts the server with `nodemon` for auto-reloading during development. |
| `npm test`    | Runs the test suite using Jest.                                         |

### Prisma (Database Management)

| Command                   | Description                                                                  |
| ------------------------- | ---------------------------------------------------------------------------- |
| `npm run prisma:migrate`  | Applies pending schema changes from `prisma/schema.prisma` to the database.  |
| `npm run prisma:generate` | Regenerates the Prisma Client based on your schema. Run after model changes. |
| `npm run prisma:studio`   | Opens a local, web-based GUI to view and edit your database data.            |

### Seeding

| Command                    | Description                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| `npm run seed:roles`       | Seeds only the roles.                                                  |
| `npm run seed:permissions` | Seeds only the permissions.                                            |
| `npm run seed:users`       | Seeds only the admin user.                                             |
| `npm run seed:employees`   | Seeds only the sample employees.                                       |
| **`npm run seed`**         | **Master script:** Runs all the above seeders in the correct sequence. |

### Full Database Reset

| Command                | Description                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`npm run db:reset`** | **For development:** A powerful script that drops the database, recreates it, applies all migrations, and runs all seeders. Perfect for a clean slate. |

---

## 👨‍💻 Author

**Debo Engineering Team**
🌍 [http://deboengineering.com](http://deboengineering.com)
there is  office array 
if any office has child
