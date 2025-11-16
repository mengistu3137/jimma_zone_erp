import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Supported file types configuration
const FILE_TYPES = {
  images: {
    extensions: [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    mimeTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
    folder: "images",
  },
  documents: {
    extensions: [".pdf", ".doc", ".docx", ".txt"],
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    folder: "documents",
  },
};

// Ensure upload directories exist - SIMPLIFIED
const ensureUploadDirs = () => {
  const baseDirs = ["images", "documents"];

  baseDirs.forEach((baseDir) => {
    const dir = path.join(process.cwd(), "public", "uploads", baseDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      // console.log(`✅ Created directory: ${dir}`);
    }
  });
};

// Initialize directories
ensureUploadDirs();

// Get file type configuration
const getFileTypeConfig = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();

  for (const [type, config] of Object.entries(FILE_TYPES)) {
    if (
      config.extensions.includes(ext) &&
      config.mimeTypes.includes(file.mimetype)
    ) {
      return { type, config };
    }
  }
  return null;
};

// Function to ensure directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    // console.log(`✅ Created directory: ${dirPath}`);
  }
};

// Function to generate unique filename if file exists
const generateUniqueFilename = (filePath, filename) => {
  // Ensure the directory exists first
  ensureDirectoryExists(filePath);

  const parsed = path.parse(filename);
  let counter = 1;
  let newFilename = filename;

  // Check if file exists and generate unique name if needed
  while (fs.existsSync(path.join(filePath, newFilename))) {
    newFilename = `${parsed.name}-${counter}${parsed.ext}`;
    counter++;
  }

  return newFilename;
};

// Storage configuration - SIMPLIFIED (no module subfolders)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileTypeInfo = getFileTypeConfig(file);

    if (!fileTypeInfo) {
      return cb(
        new Error(
          `Unsupported file type. Allowed: ${Object.values(FILE_TYPES)
            .flatMap((config) => config.extensions)
            .join(", ")}`
        )
      );
    }

    const uploadPath = path.join(
      process.cwd(), // Add process.cwd() to get absolute path
      "public",
      "uploads",
      fileTypeInfo.config.folder
    );

    // Ensure directory exists
    ensureDirectoryExists(uploadPath);

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const originalName = path.parse(file.originalname).name;

    // Create base filename with original name and UUID
    const baseFilename = `${originalName}-${uuidv4()}${ext}`;

    // Get the destination path
    const fileTypeInfo = getFileTypeConfig(file);
    const uploadPath = path.join(
      process.cwd(), // Add process.cwd() to get absolute path
      "public",
      "uploads",
      fileTypeInfo.config.folder
    );

    // Ensure directory exists
    ensureDirectoryExists(uploadPath);

    // Check if file exists and generate unique name if needed
    const finalFilename = generateUniqueFilename(uploadPath, baseFilename);

    // console.log(`📁 Generated filename: ${finalFilename}`);
    // console.log(`📁 Upload path: ${uploadPath}`);
    cb(null, finalFilename);
  },
});

// File filter for security
const fileFilter = (req, file, cb) => {
  const fileTypeInfo = getFileTypeConfig(file);

  if (fileTypeInfo) {
    req.fileType = fileTypeInfo.type; // Attach file type to request
    req.fileConfig = fileTypeInfo.config;
    return cb(null, true);
  } else {
    const allowedExtensions = Object.values(FILE_TYPES).flatMap(
      (config) => config.extensions
    );
    cb(
      new Error(
        `Unsupported file type. Allowed types: ${allowedExtensions.join(", ")}`
      )
    );
  }
};

// Create multer instances for different scenarios
export const uploadSingle = (fieldName = "file") =>
  multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: FILE_TYPES.documents.maxSize,
    },
  }).single(fieldName);

export const uploadMultiple = (fieldName = "files", maxCount = 10) =>
  multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: FILE_TYPES.documents.maxSize,
    },
  }).array(fieldName, maxCount);

// Utility functions - UPDATED
export const getFileUrl = (file) => {
  if (!file) return null;

  const fileTypeInfo = getFileTypeConfig(file);
  if (!fileTypeInfo) return null;

  return `/uploads/${fileTypeInfo.config.folder}/${file.filename}`;
};

export const getFilePathFromUrl = (fileUrl) => {
  if (!fileUrl) return null;

  const parts = fileUrl.split("/");
  if (parts.length < 3) return null;

  const folder = parts[parts.length - 2]; // Get folder type (images/documents)
  const filename = parts[parts.length - 1]; // Get filename

  return path.join(process.cwd(), "public", "uploads", folder, filename);
};

export const deleteFile = async (fileUrl) => {
  try {
    if (!fileUrl) return false;

    const filePath = getFilePathFromUrl(fileUrl);

    if (!filePath) return false;

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      // console.log(`✅ Deleted file: ${filePath}`);
      return true;
    }
    // console.log(`⚠️ File not found: ${filePath}`);
    return false;
  } catch (error) {
    // console.error("❌ Error deleting file:", error);
    return false;
  }
};

export const validateFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const allowedExtensions = Object.values(FILE_TYPES).flatMap(
    (config) => config.extensions
  );
  return allowedExtensions.includes(ext);
};

export { FILE_TYPES };
