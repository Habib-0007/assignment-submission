import express from "express"
import {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentsByCourse,
} from "../controllers/assignment.controller.js"
import { protect, authorize } from "../middleware/auth.middleware.js"

const router = express.Router()

router.use(protect)

router.route("/").get(getAssignments).post(authorize("lecturer"), createAssignment)

router
  .route("/:id")
  .get(getAssignment)
  .put(authorize("lecturer"), updateAssignment)
  .delete(authorize("lecturer"), deleteAssignment)

router.route("/course/:courseId").get(getAssignmentsByCourse)

export default router
