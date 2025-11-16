Absolutely ✅ — here’s a clean, developer-friendly **`CrudService.md`** documentation file you can include in your project.
It clearly explains every method, its parameters, and examples of how to use the CRUD + soft delete + restore system.

---

# 🧩 CRUD Service Documentation

A generic, reusable **Prisma-based CRUD utility** that provides powerful data management with:

* 🔄 Dynamic filtering and search
* 🧾 Pagination
* 🔍 Auto-detection of searchable fields
* 🪶 Soft delete / restore functionality
* 🧱 Relation-aware includes
* ⚙️ Safe dynamic query parsing

---

## 📁 Importing the Service

```js
import CrudService from "../services/CrudService.js";
const crudService = new CrudService();
```

---

## ⚙️ General Method Overview

| Method                                       | Description                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| `findAll(model, options)`                    | Fetch list of records with pagination, search, and filters |
| `findById(model, id)`                        | Fetch single record by ID (ignores soft-deleted ones)      |
| `findFirst(model, where)`                    | Find first record matching filters                         |
| `create(model, data)`                        | Create a new record                                        |
| `update(model, id, data)`                    | Update a record by ID                                      |
| `updateMany(model, where, data)`             | Update multiple records at once                            |
| `upsert(model, data, condition, updateData)` | Create or update if exists                                 |
| `delete(model, id)`                          | Permanently delete a record                                |
| `deleteMany(model, where)`                   | Permanently delete multiple records                        |
| `softDelete(model, where)`                   | Mark record(s) as deleted (sets `deletedAt`)               |
| `restoreSoftDeleted(model, where)`           | Restore soft-deleted record(s) (sets `deletedAt = null`)   |

---

## 🧠 Automatic Soft-Delete Support

All **read** operations automatically exclude soft-deleted records (`deletedAt != null`).
Relations are also filtered to include only non-deleted child entities.

---

## 🔍 Query & Filtering Helpers

The `CrudService` provides a query parser that transforms HTTP query params into Prisma-compatible filters.

### Example

```http
GET /api/users?page=1&pageSize=10&search=John&sortBy=name&sortOrder=asc
```

Automatically parses into:

```js
{
  page: 1,
  pageSize: 10,
  search: "John",
  orderBy: { name: "asc" }
}
```

Supports advanced operators:

```http
GET /api/users?age[gte]=20&age[lte]=30&status[in]=active,inactive
```

---

## 🔹 findAll()

Fetch multiple records with pagination, filters, and relations.

### Example

```js
const users = await crudService.findAll("user", {
  page: 1,
  pageSize: 10,
  search: "John",
  searchFields: ["name", "email"],
  orderBy: { createdAt: "desc" },
  include: { profile: true },
});
```

### Returns

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 52,
    "totalPages": 6,
    "currentPage": 1,
    "pageSize": 10
  }
}
```

---

## 🔹 findById()

Fetch a single record by its ID (ignores soft-deleted ones).

```js
const result = await crudService.findById("user", "user_123");
```

---

## 🔹 create()

Create a new record.

```js
await crudService.create("user", {
  name: "John Doe",
  email: "john@example.com",
});
```

---

## 🔹 update()

Update a single record by its ID.

```js
await crudService.update("user", "user_123", {
  name: "John Updated",
});
```

---

## 🔹 updateMany()

Bulk update records matching a filter.

```js
await crudService.updateMany("employee", { officeId: "office_001" }, { active: false });
```

---

## 🔹 upsert()

Create or update a record if it already exists.

```js
await crudService.upsert(
  "role",
  { name: "Manager", description: "Manages teams" },
  { name: "Manager" },
  { description: "Updated description" }
);
```

---

## 🔹 delete() (Hard Delete)

Removes a record permanently.

```js
await crudService.delete("user", "user_123");
```

---

## 🔹 deleteMany() (Hard Delete)

Permanently delete multiple records.

```js
await crudService.deleteMany("user", { role: "guest" });
```

---

## 🪶 Soft Delete Support

### softDelete()

Marks a record (or multiple) as deleted by setting `deletedAt = new Date()`.

```js
await crudService.softDelete("user", { id: "user_123" });

// or multiple
await crudService.softDelete("employee", { officeId: "office_001" });
```

> 🧩 Soft-deleted records are **excluded** automatically from `findAll`, `findById`, etc.

---

## 🧬 restoreSoftDeleted()

Restores previously soft-deleted records (sets `deletedAt = null`).

```js
// Restore one
await crudService.restoreSoftDeleted("user", { id: "user_123" });

// Restore all
await crudService.restoreSoftDeleted("user");
```

Returns:

```json
{
  "success": true,
  "data": { "count": 3 },
  "message": "3 user record(s) restored successfully"
}
```

---

## 🧹 Soft Delete vs Hard Delete

| Action                 | deletedAt      | Record Exists in DB |
| ---------------------- | -------------- | ------------------- |
| `softDelete()`         | ✅ `new Date()` | ✅ Yes               |
| `restoreSoftDeleted()` | ✅ `null`       | ✅ Yes               |
| `delete()`             | ❌ removed      | ❌ No                |

---

## 💡 Example Controller Integration

```js
import CrudService from "../services/CrudService.js";
const crud = new CrudService();

export const getUsers = async (req, res) => {
  const query = crud.parseQueryParams(req.query);
  const result = await crud.findAll("user", query);
  res.json(result);
};

export const softDeleteUser = async (req, res) => {
  const result = await crud.softDelete("user", { id: req.params.id });
  res.json(result);
};

export const restoreUser = async (req, res) => {
  const result = await crud.restoreSoftDeleted("user", { id: req.params.id });
  res.json(result);
};
```

---

## 🧰 Tips

* Add a `deletedAt` field (nullable `DateTime`) to all models that support soft delete.
* All queries automatically exclude soft-deleted records.
* You can temporarily include soft-deleted ones by adding a custom `where` filter (e.g. `{ deletedAt: { not: null } }`).

---

## 📚 Requirements

* **Node.js ≥ 18**
* **Prisma ≥ 5.x**
* Database models with:

  ```prisma
  model User {
    id         String   @id @default(cuid())
    name       String
    email      String   @unique
    deletedAt  DateTime?
    createdAt  DateTime @default(now())
    updatedAt  DateTime @updatedAt
  }
  ```

---

## 🏁 Summary

✅ Universal CRUD service
✅ Auto soft delete / restore support
✅ Query parsing & filtering
✅ Ready for REST or GraphQL APIs
✅ Extendable and production-ready

---

Would you like me to add a **“Quick Start Example”** section that shows how to wire this service into your Express API endpoints (`GET`, `POST`, `PATCH`, `DELETE`)?
