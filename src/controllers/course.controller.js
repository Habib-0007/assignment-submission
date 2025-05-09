import Course from "../models/course.model.js"
import User from "../models/user.model.js"
import { createError } from "../utils/error.js"

// Get all courses (for lecturer: their courses, for student: available courses)
export const getCourses = async (req, res, next) => {
  try {
    let courses

    if (req.user.role === "lecturer") {
      // Lecturers see only their courses
      courses = await Course.find({ lecturer: req.user.id })
        .populate("lecturer", "name email")
        .populate("students", "name email")
    } else {
      // Students see all available courses
      courses = await Course.find().populate("lecturer", "name email")
    }

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    })
  } catch (error) {
    next(error)
  }
}

// Get single course
export const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("lecturer", "name email")
      .populate("students", "name email")

    if (!course) {
      return next(createError(404, "Course not found"))
    }

    // Check if user is authorized to view this course
    if (req.user.role === "lecturer" && course.lecturer._id.toString() !== req.user.id) {
      return next(createError(403, "Not authorized to access this course"))
    }

    res.status(200).json({
      success: true,
      data: course,
    })
  } catch (error) {
    next(error)
  }
}

// Create course (lecturer only)
export const createCourse = async (req, res, next) => {
  try {
    // Add lecturer to req.body
    req.body.lecturer = req.user.id

    const course = await Course.create(req.body)

    res.status(201).json({
      success: true,
      data: course,
    })
  } catch (error) {
    next(error)
  }
}

// Update course (lecturer only)
export const updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id)

    if (!course) {
      return next(createError(404, "Course not found"))
    }

    // Make sure user is the course lecturer
    if (course.lecturer.toString() !== req.user.id) {
      return next(createError(403, "Not authorized to update this course"))
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      data: course,
    })
  } catch (error) {
    next(error)
  }
}

// Delete course (lecturer only)
export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return next(createError(404, "Course not found"))
    }

    // Make sure user is the course lecturer
    if (course.lecturer.toString() !== req.user.id) {
      return next(createError(403, "Not authorized to delete this course"))
    }

    await course.deleteOne()

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (error) {
    next(error)
  }
}

// Enroll in course (student only)
export const enrollCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return next(createError(404, "Course not found"))
    }

    // Check if student is already enrolled
    if (course.students.includes(req.user.id)) {
      return next(createError(400, "Already enrolled in this course"))
    }

    // Add student to course
    course.students.push(req.user.id)
    await course.save()

    // Add course to student's enrolled courses
    await User.findByIdAndUpdate(req.user.id, { $push: { enrolledCourses: course._id } }, { new: true })

    res.status(200).json({
      success: true,
      data: course,
    })
  } catch (error) {
    next(error)
  }
}

// Get enrolled courses (student only)
export const getEnrolledCourses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("enrolledCourses")

    res.status(200).json({
      success: true,
      count: user.enrolledCourses.length,
      data: user.enrolledCourses,
    })
  } catch (error) {
    next(error)
  }
}
