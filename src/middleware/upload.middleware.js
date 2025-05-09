import multer from "multer"
import path from "path"
import { createError } from "../utils/error.js"

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
  },
})

// Check file type
const fileFilter = (req, file, cb) => {
  // Allow only PDFs
  if (file.mimetype === "application/pdf") {
    cb(null, true)
  } else {
    cb(createError(400, "Only PDF files are allowed"), false)
  }
}

// Initialize upload
export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: fileFilter,
})
