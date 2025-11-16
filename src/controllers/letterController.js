// controllers/letterController.js
import letterService from "../services/letterService.js";

export const createDirectedLetter = async (req, res) => {
  try {
    const result = await letterService.createDirectedLetter(req.body);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all Directed Letters (supports filters/search/pagination)
export const getDirectedLetters = async (req, res) => {
  try {
    const result = await letterService.getDirectedLetters(req.query);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get one Directed Letter by ID
export const getDirectedLetterById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await letterService.getDirectedLetterById(id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Directed Letter
export const updateDirectedLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await letterService.updateDirectedLetter(id, req.body);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete Directed Letter
export const deleteDirectedLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await letterService.deleteDirectedLetter(id);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

  export const createLetter = async (req, res) => {
    try {
      const result = await letterService.createLetter(req);
      return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  export const getLetters = async (req, res) => {
    try {
      const result = await letterService.getLetters(req);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  export const getLetterById = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await letterService.getLetterById(id);
      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  export const updateLetter = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await letterService.updateLetter(id, req);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  export const deleteLetter = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await letterService.deleteLetter(id);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  export const sendLetterForApproval = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await letterService.sendForApproval(id);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  export const approveLetter = async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedById } = req.body;
      const result = await letterService.approveLetter(id, approvedById);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
;

  export const rejectLetter = async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedById, notes } = req.body;
      const result = await letterService.rejectLetter(id, approvedById, notes);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

