// src/services/announcementService.js
import CrudService from "../services/crudService.js";
const crud = new CrudService();

class AnnouncementService {
  // ✔ CREATE
  async create(req, res) {
    try {
      const { subject, body, date, officeId, filePath, type, expiresAt, pinned } = req.body;

      if (!subject) return res.status(400).json({ success: false, message: "subject is required" });
      if (!body) return res.status(400).json({ success: false, message: "body is required" });
      if (!type) return res.status(400).json({ success: false, message: "type is required" });
      if (!expiresAt) return res.status(400).json({ success: false, message: "expiresAt is required" });

      if ((type === "OFFICE" || type === "OFFICE_CHILDREN") && !officeId) {
        return res.status(400).json({ success: false, message: "officeId is required for OFFICE or OFFICE_CHILDREN announcements" });
      }

      const created = await crud.create("announcement", {
        subject,
        body,
        date: date ? new Date(date) : undefined,
        officeId: officeId || null,
        filePath: filePath || null,
        type,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        pinned: pinned ?? false,
      });

      return res.status(created.success ? 201 : 400).json(created);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✔ INDEX — pinned first, hide expired, full filters, pagination
  async index(req, res) {
    try {
      const params = crud.parseQueryParams(req.query);

      const now = new Date();

      const result = await crud.findAll(
        "announcement",
        {
          page: params.page,
          pageSize: params.pageSize,
          search: params.search,
          filters: {
            ...params.filters,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
          orderBy: params.orderBy || [
            { pinned: "desc" },
            { date: "desc" },
          ],
          include: { office: true },
        }
      );

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✔ DETAILS — auto-increment views, auto-delete expired
  async getDetails(req, res) {
    try {
      const { id } = req.params;

      // ✔ Use CRUD service instead of direct Prisma
      const found = await crud.findById("announcement", id);
      if (!found.success) {
        return res.status(404).json({ success: false, message: "Announcement not found" });
      }
      const announcement = found.data;

      if (!announcement || announcement.deletedAt) {
        return res.status(404).json({ success: false, message: "Announcement not found" });
      }

      // ✔ Auto-delete expired announcement
      if (announcement.expiresAt && announcement.expiresAt <= new Date()) {
        await crud.update("announcement", id, { views: announcement.views + 1 });
        return res.status(410).json({ success: false, message: "Announcement expired and auto-deleted" });
      }

      // ✔ Increment views
      await crud.update("announcement", id, {
        views: announcement.views + 1,
      });

      // Fetch fresh version with relations
      const result = await crud.findById("announcement", id, {
        include: { office: true },
      });

      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✔ UPDATE
  async update(req, res) {
    try {
      const { id } = req.params;

      const updated = await crud.update("announcement", id, {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
      });

      return res.status(updated.success ? 200 : 400).json(updated);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✔ SOFT DELETE
  async softDelete(req, res) {
    try {
      const { id } = req.params;

      const deleted = await crud.update("announcement", id, {
        deletedAt: new Date(),
      });

      return res.status(deleted.success ? 200 : 400).json({
        success: deleted.success,
        message: deleted.success ? "Announcement soft-deleted" : deleted.message,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✔ RESTORE
  async restore(req, res) {
    try {
      const { id } = req.params;
      


      const restored = await crud.restoreSoftDeleted("announcement", { id });

      return res.status(restored.success ? 200 : 404).json(restored);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new AnnouncementService();
