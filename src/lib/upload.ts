import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import config from "../config";

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
];

// Ensure upload directory exists
const uploadDir = path.resolve(process.cwd(), config.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Custom storage engine
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter function
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const mimeType = file.mimetype;

  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    // It's an image
    cb(null, true);
  } else if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
    // It's a video
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and videos are allowed."));
  }
};

// Middleware to check file size based on type
const checkFileSize = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const mimeType = file.mimetype;
  const fileSize = file.size;

  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    if (fileSize > config.maxImageSize) {
      return cb(new Error(`Image size exceeds the limit of 5MB`));
    }
  } else if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
    if (fileSize > config.maxVideoSize) {
      return cb(new Error(`Video size exceeds the limit of 10MB`));
    }
  }

  cb(null, true);
};

// Create upload middleware for single required file
export const uploadMedia = () => {
  return multer({
    storage,
    fileFilter: (req, file, cb) => {
      fileFilter(req, file, cb);
      // Also check size after filter passes
      checkFileSize(req, file, cb);
    },
    limits: {
      fileSize: config.maxVideoSize,
    },
  }).single("media");
};

// Create upload middleware for optional file
export const uploadMediaOptional = () => {
  return multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (!file) {
        // Allow requests with no file
        return cb(null, false);
      }
      fileFilter(req, file, cb);
      checkFileSize(req, file, cb);
    },
    limits: {
      fileSize: config.maxVideoSize,
    },
  }).single("media");
};

// Helper to determine media type from MIME type
export const getMediaType = (mimetype: string): "image" | "video" | null => {
  if (ALLOWED_IMAGE_TYPES.includes(mimetype)) {
    return "image";
  }
  if (ALLOWED_VIDEO_TYPES.includes(mimetype)) {
    return "video";
  }
  return null;
};

// Helper to get the public URL for the uploaded file
export const getMediaUrl = (filename: string): string => {
  return `/uploads/${filename}`;
};

// Helper to delete a media file
export const deleteMedia = async (mediaPath: string): Promise<void> => {
  const fullPath = path.resolve(
    process.cwd(),
    mediaPath.replace("/uploads/", `${config.uploadDir}/`),
  );
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

export default {
  uploadMedia,
  uploadMediaOptional,
  getMediaType,
  getMediaUrl,
  deleteMedia,
};
