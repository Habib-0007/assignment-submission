import express from "express"
import {
  getSubmissions,
  getSubmission,
  createSubmission,
  updateSubmission,
  gradeSubmission,
  getSubmissionsByAssignment,
} from "../controllers/submission.controller.js"
import { protect, authorize } from "../middleware/auth.middleware.js"
import { upload } from "../middleware/upload.middleware.js"

const router = express.Router()

router.use(protect)

router.route("/").get(getSubmissions).post(authorize("student"), upload.single("file"), createSubmission)

router.route("/:id").get(getSubmission).put(authorize("student"), upload.single("file"), updateSubmission)

router.route("/:id/grade").put(authorize("lecturer"), gradeSubmission)

router.route("/assignment/:assignmentId").get(authorize("lecturer"), getSubmissionsByAssignment)

export default router
