import { prisma } from "../config/database.js";
import { Prisma } from "@prisma/client";

export default class CrudService {
  // ✅ Auto-detect searchable string fields
  getSearchableFields(model) {
    const modelMeta = Prisma.dmmf.datamodel.models.find(
      (m) => m.name.toLowerCase() === model.toLowerCase()
    );
    if (!modelMeta) return [];
    return modelMeta.fields
      .filter((f) => f.type === "String" && !f.relationName)
      .map((f) => f.name);
  }

  // ✅ Build dynamic Prisma where filters
  buildDynamicFilters(filters = {}) {
    const where = {};
    for (const [key, value] of Object.entries(filters)) {
      if (typeof value === "object" && !Array.isArray(value)) {
        where[key] = {};
        for (const [op, val] of Object.entries(value)) {
          if (
            [
              "equals", "not", "in", "notIn", "lt", "lte",
              "gt", "gte", "contains", "startsWith", "endsWith",
            ].includes(op)
          ) {
            where[key][op] = val;
          }
        }
      } else {
        where[key] = value;
      }
    }
    return where;
  }

  // ✅ Parse Express query params into Prisma options
  parseQueryParams(query) {
    const {
      page = 1,
      pageSize = 10,
      search,
      sortBy,
      sortOrder = "asc",
      ...rest
    } = query;

    const filters = {};

    for (const [key, value] of Object.entries(rest)) {
      if (key.includes("[")) {
        const match = key.match(/(.*)\[(.*)\]/);
        if (match) {
          const field = match[1];
          const operator = match[2];
          filters[field] = {
            ...(filters[field] || {}),
            [operator]: this.castValue(value),
          };
        }
      } else {
        filters[key] = this.castValue(value);
      }
    }

    return {
      page: Number(page),
      pageSize: Number(pageSize),
      search,
      orderBy: sortBy
        ? { [sortBy]: sortOrder.toLowerCase() === "desc" ? "desc" : "asc" }
        : undefined,
      filters,
    };
  }

  // ✅ Auto-type casting helper
  castValue(value) {
    if (Array.isArray(value)) return value.map((v) => this.castValue(v));
    if (value === "true") return true;
    if (value === "false") return false;
    if (!isNaN(value)) return Number(value);
    return value;
  }

  // ✅ Recursive helper to apply soft-delete filter to included relations
applySoftDeleteToInclude(include) {
  if (!include) return undefined;

  const newInclude = {};

  for (const key in include) {
    const entry = include[key];

    // If boolean (include: true) → allow it directly
    if (entry === true) {
      newInclude[key] = true;
      continue;
    }

    // If select exists → DO NOT attach "where"
    if (entry.select) {
      newInclude[key] = {
        ...entry,
        include: this.applySoftDeleteToInclude(entry.include)
      };
      continue;
    }

    // Valid relation include → safe to apply soft-delete
    newInclude[key] = {
      ...entry,
      where: { ...(entry.where || {}), deletedAt: null },
      include: this.applySoftDeleteToInclude(entry.include),
    };
  }

  return newInclude;
}


  // ✅ Find first (with relations, excludes soft-deleted)
  async findFirst(model, where = {}, options = {}) {
    const finalWhere = { ...where };
    // const include = this.applySoftDeleteToInclude(options.include);

    return await prisma[model].findFirst({ where: finalWhere, ...options });
  }
  
async findUnique(model, where = {}, options = {}) {
    const finalWhere = { ...where };

    return await prisma[model].findUnique({ where: finalWhere, ...options });
  }
  

  

  // ✅ FIND BY ID (with relations, excludes soft-deleted)
  async findById(model, id, options = {}) {
    try {
      const include = this.applySoftDeleteToInclude(options.include);
      const item = await prisma[model].findUnique({ where: { id }, ...options, include });

      if (!item || item.deletedAt) {
        return { success: false, message: `${model} not found` };
      }

      return { success: true, data: item };
    } catch (error) {
      return { success: false, message: `Error fetching ${model}: ${error.message}` };
    }
  }

  async findAllWithOutpagination(model, options = {}) {
    return prisma[model].findMany(options);
  }
  // ✅ FIND ALL (with relations, excludes soft-deleted)
  async findAll(model, options = {}, disablePagination = false) {
    try {
      const {
        page, pageSize, select, where = {}, include, orderBy, search, searchFields, filters
      } = options;

      const dynamicFilters = this.buildDynamicFilters(filters);
      // const baseWhere = { deletedAt: null };
      const mergedWhere = {  ...where, ...dynamicFilters };

      const effectiveSearchFields =
        searchFields?.length > 0 ? searchFields : this.getSearchableFields(model);

      let searchFilter = {};
      if (search && effectiveSearchFields.length > 0) {
        searchFilter = {
          OR: effectiveSearchFields.map(field => ({
            [field]: { contains: search, mode: "insensitive" }
          }))
        };
      }

      const finalWhere = { ...mergedWhere, ...(searchFilter.OR ? searchFilter : {}) };
      const finalInclude = this.applySoftDeleteToInclude(include);

      if (page && pageSize) {
        const skip = disablePagination ? 0 : (Number(page) - 1) * Number(pageSize);
        const filter = { skip, where: finalWhere, include: finalInclude, orderBy };
        if (!disablePagination) filter.take = Number(pageSize);

        const [data, total] = await Promise.all([
          prisma[model].findMany(filter),
          prisma[model].count({ where: finalWhere }),
        ]);

        const totalPages = Math.ceil(total / pageSize);
        return { success: true, data, pagination: { total, totalPages, currentPage: page, pageSize: Number(pageSize) } };
      }

      const items = await prisma[model].findMany({ where: finalWhere, include: finalInclude, orderBy });
      return { success: true, data: items };
    } catch (error) {
      return { success: false, message: `Error fetching ${model}: ${error.message}` };
    }
  }

  // ✅ CREATE
  async create(model, data) {
    try {
      const item = await prisma[model].create({ data });
      return { success: true, data: item, message: `${model} created successfully` };
    } catch (error) {
      return { success: false, message: `Error creating ${model}: ${error.message}` };
    }
  }

  // ✅ UPDATE by ID
  async update(model, id, data) {
    try {
      const updated = await prisma[model].update({ where: { id }, data });
      return { success: true, data: updated, message: `${model} updated successfully` };
    } catch (error) {
      return { success: false, message: `Error updating ${model}: ${error.message}` };
    }
  }

  // ✅ UPDATE MANY
  async updateMany(model, where, data) {
    try {
      const updated = await prisma[model].updateMany({ where, data });
      return { success: true, data: updated, message: `${model} updated successfully` };
    } catch (error) {
      return { success: false, message: `Error updating ${model}: ${error.message}` };
    }
  }

  // ✅ HARD DELETE by ID (permanent)
  async delete(model, id) {
    try {
      await prisma[model].delete({ where: { id } });
      return { success: true, message: `${model} deleted permanently` };
    } catch (error) {
      return { success: false, message: `Error deleting ${model}: ${error.message}` };
    }
  }

  // ✅ HARD DELETE MANY (permanent)
  async deleteMany(model, where) {
    try {
      const deleted = await prisma[model].deleteMany({ where });
      return { success: true, data: deleted, message: `${model} records permanently deleted` };
    } catch (error) {
      return { success: false, message: `Error deleting ${model}: ${error.message}` };
    }
  }

  


  // ✅ RESTORE SOFT-DELETED RECORDS (sets deletedAt = null)
  async restoreSoftDeleted(model, where = {}) {
    try {
      const restored = await prisma[model].updateMany({
        where: { ...where, deletedAt: { not: null } },
        data: { deletedAt: null },
      });

      if (restored.count === 0) {
        return { success: false, message: `No soft-deleted ${model} records found to restore` };
      }

      return {
        success: true,
        data: restored,
        message: `${restored.count} ${model} record(s) restored successfully`,
      };
    } catch (error) {
      return { success: false, message: `Error restoring ${model}: ${error.message}` };
    }
  }
}
