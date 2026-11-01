const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Local disk storage engine for development.
 * To swap to Cloudinary later, replace storageEngine and getFileUrl
 * without changing any controller or middleware code.
 */
const storageEngine = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

/**
 * Returns the URL path for a locally stored file.
 * When switching to Cloudinary, this would return the Cloudinary URL instead.
 */
const getFileUrl = (filename) => {
  return `/api/uploads/${filename}`;
};

/**
 * Returns the absolute path for a locally stored file.
 */
const getFilePath = (filename) => {
  return path.join(uploadsDir, filename);
};

module.exports = { storageEngine, getFileUrl, getFilePath };
