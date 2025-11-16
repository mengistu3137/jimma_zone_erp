import crudService from "../services/crudService.js";
import userService from "./userService.js";


const crud = new crudService();
const model = "office";

class OfficeService {
  /** =============================
   *   OFFICE CRUD (Pattern-Matched to AnnouncementService)
   * =============================*/

  // ✔ CREATE
  async create(req, res) {
    try {
      const { name, location, gps_latitude, gps_longitude, phone, email, logo, stamp, parentId } = req.body;

      // Validate required fields
      if (!name) return res.status(400).json({ success: false, message: "Office name is required" });
      // if (!gps_latitude || !gps_longitude)
      //   return res.status(400).json({ success: false, message: "GPS coordinates are required" });

      // Validate parentId using CRUD
      if (parentId) {
        const parent = await crud.findById(model, parentId);
        if (!parent.success)
          return res.status(400).json({ success: false, message: "Invalid parentId provided" });
      }

      const created = await crud.create(model, {
        name,
        location: location || null,
        gps_latitude: Number(gps_latitude),
        gps_longitude: Number(gps_longitude),
        phone: phone || null,
        email: email || null,
        logo: logo || null,
        stamp: stamp || null,
        parentId: parentId || null,
      });

      return res.status(created.success ? 201 : 400).json(created);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  
async findAllSubOffices(officeId) {
    if (!officeId) {
        console.error("Invalid officeId provided:", officeId);
        return [];
    }

    try {
        const directChildren = await crud.findAllWithOutpagination("office",{
            where: {
                parentId: officeId,
            },
            select: {
                id: true,
                name: true,
                parentId: true,
            },
        });

        let allSubOffices = [...directChildren];
        for (const child of directChildren) {
            const descendants = await this.findAllSubOffices(child.id);
            allSubOffices = allSubOffices.concat(descendants);
        }
        return allSubOffices;

    } catch (error) {
        console.error(`Error finding sub-offices for ID ${officeId}:`, error);
        return [];
    }
}


  // ✔ INDEX — includes hierarchy, leaders, children
  async index(req, res) {
    const user = await userService.getUserById(req.user?.id);
    if (!user?.data?.office?.id)
      return res.status(500).json({ success: false, message: "You are not assigned to office, please contact" });
    const subOffices = await this.findAllSubOffices(user?.data?.office?.id);
    const subOfficeIds = subOffices.map((office) => {
      return office.id
    });
    const offices = [user?.data?.office?.id, ...subOfficeIds];

    try {
      const params = crud.parseQueryParams(req.query);
      
      const { search, pageSize, page } = params;
      const condition = {id:{in:offices}};
      if (search)
        condition.OR = [
          {
            name: { contains: search }
          },
          { parent: { name: { contains: search } } },
          {
            phone: { contains: search }
          }
        ];
      const result = await crud.findAll("office", {
        page: page,
        pageSize:pageSize,
        where:{...condition},
        orderBy: params.orderBy || [{ name: "asc" }],
        include: {
          parent: true,
          children: true,
          leaders: {
            include: {
              user: { select: { id: true, name: true, middle_name: true } }
            }
          },
          employees:true

        }
      });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✔ DETAILS — fully using CRUD
  async getDetails(req, res) {
    try {
      const { id } = req.params;

      const result = await crud.findById(MODEL, id, {
        include: {
          parent: true,
          children: true,
          employees: true,
          leaders: { include: { user: true } },
        }
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
      const data = req.body;

      // Validate parentId
      if (data.parentId) {
        const parent = await crud.findById(model, data.parentId);
        if (!parent.success)
          return res.status(400).json({ success: false, message: "Invalid parentId" });
      }
      const { parentId, ...datas } = data;

      const updated = await crud.update(model, id, {...datas,parent:data.parentId});
      return res.status(updated.success ? 200 : 400).json(updated);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✔ SOFT DELETE
  async softDelete(req, res) {
    try {
      const { id } = req.params;

      const deleted = await crud.update(model, id, { deletedAt: new Date() });
      return res.status(deleted.success ? 200 : 400).json({
        success: deleted.success,
        message: deleted.success ? "Office soft-deleted" : deleted.message,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✔ RESTORE
  async restore(req, res) {
    try {
      const { id } = req.params;
      const restored = await crud.restoreSoftDeleted(model, { id });
      return res.status(restored.success ? 200 : 400).json(restored);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /** =============================
   *   LEADERSHIP (Refactored)
   * =============================*/

  async createLeader(req, res) {
    try {
      const { userId, officeId } = req.body;

      if (!userId || !officeId)
        return res.status(400).json({ success: false, message: "userId and officeId are required" });

      const created = await crud.create("officeLeader", { userId, officeId });
      return res.status(created.success ? 201 : 400).json(created);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async leaderIndex(req, res) {
    const params = crud.parseQueryParams(req.query);
    const result = await crud.findAll("officeLeader", {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      filters: params.filters,
      include: {
        user: true,
        office: true
      }
    });
    return res.status(200).json(result);
  }

  async leaderDetails(req, res) {
    const { id } = req.params;
    const result = await crud.findById("officeLeader", id, {
      include: { user: true, office: true }
    });
    return res.status(result.success ? 200 : 404).json(result);
  }

  async leaderUpdate(req, res) {
    const { id } = req.params;
    const updated = await crud.update("officeLeader", id, req.body);
    return res.status(updated.success ? 200 : 400).json(updated);
  }

  async leaderDelete(req, res) {
    const { id } = req.params;
    const deleted = await crud.delete("officeLeader", id);
    return res.status(deleted.success ? 200 : 400).json(deleted);
  }

  /** =============================
   *   OFFICE HIERARCHY
   * =============================*/

  async hierarchy(req, res) {
    try {
      const { officeId:id } = req.params;

      const office = await crud.findById(model, id, {
        include: {
          parent: true,
          children: {
            include: {
              children: true
            }
          },
          leaders: { include: { user: true } },
          _count: { select: { employees: true, users: true } }
        }
      });

      return res.status(office.success ? 200 : 404).json(office);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new OfficeService();
