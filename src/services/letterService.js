// services/letterService.js
import { getFileUrl } from "../middleware/upload.middleware.js";
import crudService from "./crudService.js";

const crud = new crudService();
const model = "letter";


class LetterService {
  /**DirectLetter */
 async createDirectedLetter(data) {
  try {
    const {
      letterId,
      officeId,        // fromOffice ID
      toOfficeId,
      reason,
      userId
    } = data;

    // Validate required fields
    if (!letterId || !officeId || !toOfficeId || !reason || !userId) {
      return {
        success: false,
        message: "Missing required fields: letterId, officeId, toOfficeId, reason, or userId."
      };
    }

    const directedLetterData = {
      letterId,
      officeId,        // This maps to fromOffice in the schema
      toOfficeId,
      reason,
      userId
    };

    return await crud.create("DirectedLetter", directedLetterData);
  } catch (error) {
    return { success: false, message: error.message };
  }
}

  // ✅ Get all Directed Letters (with filtering, search, pagination)
  async getDirectedLetters(query) {
    const parsed = crud.parseQueryParams(query);

    const options = {
      page: parsed.page,
      pageSize: parsed.pageSize,
      search: parsed.search,
      orderBy: parsed.orderBy,
      filters: parsed.filters,
      include: {
        letter: true,
        fromOffice: true,  
        toOffice: true,
        user: true,
      },
    };

    return await crud.findAll("DirectedLetter", options);
  }

  // ✅ Get Directed Letter by ID
  async getDirectedLetterById(id) {
    return await crud.findById("DirectedLetter", id, {
      include: {
        letter: true,
        fromOffice: true,
        toOffice: true,
        user: true,
      },
    });
  }

  // ✅ Update Directed Letter
  async updateDirectedLetter(id, data) {
    return await crud.update("DirectedLetter", id, data);
  }

  // ✅ Delete Directed Letter
  async deleteDirectedLetter(id) {
    return await crud.delete("DirectedLetter", id);
  }
  /**
   * Create a new letter
   */
 async createLetter(req) {
  try {
    const {
      subject,
      body,
      userId,  
      officeId 
    } = req.body;

    if (!subject || !userId) {
      return {
        success: false,
        message: "Missing required fields: subject or userId.",
      };
    }

    const letterData = {
      subject,
      body: body || "",
      userId,
      officeId: officeId || null,
      status: "draft", // lowercase to match your schema
    };

    return await crud.create("Letter", letterData);
  } catch (error) {
    return { success: false, message: error.message };
  }
}

  /**
   * Get all letters (with pagination/search/filter)
   */
  async getLetters(req) {
    try {
      const queryOptions = crud.parseQueryParams(req.query);
      return await crud.findAll(model, {
        ...queryOptions,
        include: {
          senderOffice: true,
          receiverOffice: true,
          createdBy: true,
          approvedBy: true,
        },
      });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get single letter by ID
   */
  async getLetterById(id) {
    try {
      return await crud.findById(model, id, {
        include: {
          senderOffice: true,
          receiverOffice: true,
          createdBy: true,
          approvedBy: true,
        },
      });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Update a letter
   */
  async updateLetter(id, req) {
    try {
      const {
        title,
        subject,
        body,
        referenceNo,
        receiverName,
        receiverTitle,
        signedByName,
        signedByTitle,
        closingRemark,
        cc,
        notes,
        footerText,
        status,
      } = req.body;

      const fileUrl = req.file ? getFileUrl(req.file) : undefined;

      const updateData = {
        title,
        subject,
        body,
        referenceNo,
        receiverName,
        receiverTitle,
        signedByName,
        signedByTitle,
        closingRemark,
        cc,
        notes,
        footerText,
        ...(fileUrl && { fileUrl }),
        ...(status && { status }),
      };

      return await crud.update(model, id, updateData);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Delete a letter
   */
  async deleteLetter(id) {
    try {
      return await crud.delete(model, id);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Send a draft letter for approval
   */
  async sendForApproval(id) {
    try {
      const letter = await crud.findById(model, id);
      if (!letter.success) return letter;

      if (letter.data.status !== "DRAFT") {
        return {
          success: false,
          message: "Only draft letters can be sent for approval.",
        };
      }

      return await crud.update(model, id, {
        status: "SENT",
        issuedAt: new Date(),
      });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Approve a letter
   */
  async approveLetter(id, approvedById) {
    try {
      const letter = await crud.findById(model, id);
      if (!letter.success) return letter;

      if (letter.data.status !== "SENT") {
        return {
          success: false,
          message: "Only sent letters can be approved.",
        };
      }

      return await crud.update(model, id, {
        status: "APPROVED",
        approvedById,
      });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Reject a letter
   */
  async rejectLetter(id, approvedById, notes) {
    try {
      const letter = await crud.findById(model, id);
      if (!letter.success) return letter;

      if (letter.data.status !== "SENT") {
        return {
          success: false,
          message: "Only sent letters can be rejected.",
        };
      }

      return await crud.update(model, id, {
        status: "REJECTED",
        approvedById,
        notes: notes || "Letter rejected",
      });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new LetterService();
