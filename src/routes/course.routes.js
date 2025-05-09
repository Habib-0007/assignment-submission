import express from "express"
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getEnrolledCourses,
} from "../controllers/course.controller.js"
import { protect, authorize } from "../middleware/auth.middleware.js"

const router = express.Router()

router.use(protect)

router.route("/").get(getCourses).post(authorize("lecturer"), createCourse)

router.route("/enrolled").get(authorize("student"), getEnrolledCourses)

router.route("/:id").get(getCourse).put(authorize("lecturer"), updateCourse).delete(authorize("lecturer"), deleteCourse)

router.route("/:id/enroll").post(authorize("student"), enrollCourse)

export default router
