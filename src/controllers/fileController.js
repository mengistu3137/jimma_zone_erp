// controllers/fileController.js
import fileService from "../services/fileService.js";

class FileController {

   async getFileUrl(req, res) {
    const result = await fileService.getFileUrl(req);
    return res.status(result.status).json(result);
  }
  
  async renderFile(req, res) {
    const result = await fileService.renderFile(req.query.filePath, req);
    return res.status(result.status).json(result);
  }

  async uploadSingle(req, res) {
    const result = await fileService.uploadSingle(req, res);
    return res.status(result.status).json(result);
  }

  async uploadMultiple(req, res) {
    const result = await fileService.uploadMultiple(req, res);
    return res.status(result.status).json(result);
  }

  async updateFile(req, res) {
    const result = await fileService.updateFile(req, res);
    return res.status(result.status).json(result);
  }

  async deleteFile(req, res) {
    const result = await fileService.deleteFile(req.body.fileUrl);
    return res.status(result.status).json(result);
  }

  async bulkDeleteFiles(req, res) {
    const result = await fileService.bulkDeleteFiles(req.body.fileUrls);
    return res.status(result.status).json(result);
  }

  getSupportedTypes(req, res) {
    const result = fileService.getSupportedTypes();
    return res.status(result.status).json(result);
  }

  checkFileExists(req, res) {
    const result = fileService.checkFileExists(req.query.fileUrl);
    return res.status(result.status).json(result);
  }
}

export default new FileController();
