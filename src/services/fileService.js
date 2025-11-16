// services/fileService.js
import fs from "fs";
import {
  uploadSingle,
  uploadMultiple,
  getFileUrl,
  deleteFile,
  FILE_TYPES,
  validateFileType,
  getFilePathFromUrl,
} from "../middleware/upload.middleware.js";

class FileService {
// fileService.js

 async getFileUrl(req) {
    try {
        const { path } = req.body;

        if (!path) {
            return {
                success: false,
                status: 400,
                message: "Path is required",
            };
        }

        // Example: You host files under /uploads in your server
        const baseUrl = process.env.BASE_URL || "http://localhost:5000";

        const fileUrl = `${baseUrl}/${path}`;

        return {
            success: true,
            status: 200,
            url: fileUrl,
        };

    } catch (error) {
        return {
            success: false,
            status: 500,
            message: error.message,
        };
    }
}





  // Render file
  async renderFile(filePath, req) {
    if (!filePath) {
      return {
        success: false,
        status: 400,
        message: "filePath query parameter is required",
      };
    }

    const resolvedPath = getFilePathFromUrl(filePath);

    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      return {
        success: false,
        status: 404,
        message: "File not found.",
      };
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const url = `${baseUrl}${filePath.startsWith("/") ? filePath : `/${filePath}`}`;

    return {
      success: true,
      status: 200,
      message: "File URL generated successfully",
      data: { url },
    };
  }

  // Upload single file
  uploadSingle(req, res) {
    return new Promise((resolve) => {
      uploadSingle("file")(req, res, (err) => {
        if (err) {
          return resolve({
            success: false,
            status: 400,
            message: err.message,
          });
        }

        if (!req.file) {
          return resolve({
            success: false,
            status: 400,
            message: "No file uploaded",
          });
        }

        const fileUrl = getFileUrl(req.file);

        resolve({
          success: true,
          status: 200,
          message: "File uploaded successfully",
          data: {
            url: fileUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            type: req.fileType,
          },
        });
      });
    });
  }

  // Upload multiple files
  uploadMultiple(req, res) {
    return new Promise((resolve) => {
      uploadMultiple("files", 10)(req, res, (err) => {
        if (err) {
          return resolve({
            success: false,
            status: 400,
            message: err.message,
          });
        }

        if (!req.files || req.files.length === 0) {
          return resolve({
            success: false,
            status: 400,
            message: "No files uploaded",
          });
        }

        const files = req.files.map((file) => ({
          url: getFileUrl(file),
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          type: req.fileType,
        }));

        resolve({
          success: true,
          status: 200,
          message: `${files.length} files uploaded successfully`,
          data: files,
        });
      });
    });
  }

  // Update file
  async updateFile(req, res) {
    return new Promise((resolve) => {
      uploadSingle("file")(req, res, async (err) => {
        if (err) {
          return resolve({
            success: false,
            status: 400,
            message: err.message,
          });
        }

        if (!req.file) {
          return resolve({
            success: false,
            status: 400,
            message: "No file uploaded",
          });
        }

        try {
          const { oldFileUrl } = req.body;

          if (oldFileUrl) {
            await deleteFile(oldFileUrl);
          }

          const fileUrl = getFileUrl(req.file);

          return resolve({
            success: true,
            status: 200,
            message: "File updated successfully",
            data: {
              url: fileUrl,
              filename: req.file.filename,
              originalName: req.file.originalname,
              size: req.file.size,
              mimetype: req.file.mimetype,
              type: req.fileType,
              oldFileUrl,
            },
          });
        } catch (error) {
          return resolve({
            success: false,
            status: 500,
            message: "Error updating file",
          });
        }
      });
    });
  }

  // Delete file
  async deleteFile(fileUrl) {
    if (!fileUrl) {
      return {
        success: false,
        status: 400,
        message: "File URL is required",
      };
    }

    const filename = fileUrl.split("/").pop();

    if (!validateFileType(filename)) {
      return {
        success: false,
        status: 400,
        message: "Invalid file type",
      };
    }

    const deleted = await deleteFile(fileUrl);

    if (!deleted) {
      return {
        success: false,
        status: 404,
        message: "File not found or already deleted",
      };
    }

    return {
      success: true,
      status: 200,
      message: "File deleted successfully",
      data: { fileUrl },
    };
  }

  // Bulk delete
  async bulkDeleteFiles(fileUrls) {
    if (!fileUrls?.length) {
      return {
        success: false,
        status: 400,
        message: "Array of file URLs is required",
      };
    }

    for (const fileUrl of fileUrls) {
      const filename = fileUrl.split("/").pop();
      if (!validateFileType(filename)) {
        return {
          success: false,
          status: 400,
          message: `Invalid file type in URL: ${fileUrl}`,
        };
      }
    }

    const results = await Promise.all(
      fileUrls.map(async (fileUrl) => {
        const deleted = await deleteFile(fileUrl);
        return {
          fileUrl,
          success: deleted,
          error: deleted ? null : "File not found",
        };
      })
    );

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return {
      success: true,
      status: 200,
      message: `Bulk delete completed: ${successful.length} successful, ${failed.length} failed`,
      data: { successful, failed },
    };
  }

  // Get supported types
  getSupportedTypes() {
    const typesInfo = Object.entries(FILE_TYPES).map(([type, config]) => ({
      type,
      extensions: config.extensions,
      maxSize: config.maxSize,
      maxSizeMB: Math.round(config.maxSize / 1024 / 1024),
    }));

    return {
      success: true,
      status: 200,
      data: typesInfo,
    };
  }

  // Check file exists
  checkFileExists(fileUrl) {
    if (!fileUrl) {
      return {
        success: false,
        status: 400,
        message: "File URL is required",
      };
    }

    const filePath = getFilePathFromUrl(fileUrl);
    const exists = filePath && fs.existsSync(filePath);

    return {
      success: true,
      status: 200,
      data: { exists },
    };
  }
}

export default new FileService();
