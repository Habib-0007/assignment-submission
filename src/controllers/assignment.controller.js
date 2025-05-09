import Assignment from "../models/assignment.model.js"
import Course from "../models/course.model.js"
import { createError } from "../utils/error.js"


export const getAssignments = async (req, res, next) => {
  try {
    let assignments

    if (req.user.role === "lecturer") {
      
      const courses = await Course.find({ lecturer: req.user.id })
      const courseIds = courses.map((course) => course._id)

      
      assignments = await Assignment.find({ course: { $in: courseIds } }).populate({
        path: "course",
        select: "title code",
      })
    } else {
      
      const user = await req.user.populate("enrolledCourses")
      const courseIds = user.enrolledCourses.map((course) => course._id)

      assignments = await Assignment.find({ course: { $in: courseIds } }).populate({
        path: "course",
        select: "title code",
      })
    }

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    })
  } catch (error) {
    next(error)
  }
}


export const getAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate({
      path: "course",
      select: "title code lecturer",
      populate: {
        path: "lecturer",
        select: "name email",
      },
    })

    if (!assignment) {
      return next(createError(404, "Assignment not found"))
    }

    
    if (req.user.role === "lecturer") {
      if (assignment.course.lecturer._id.toString() !== req.user.id) {
        return next(createError(403, "Not authorized to access this assignment"))
      }
    } else {
      
      const course = await Course.findById(assignment.course._id)
      if (!course.students.includes(req.user.id)) {
        return next(createError(403, "Not enrolled in this course"))
      }
    }

    res.status(200).json({
      success: true,
      data: assignment,
    })
  } catch (error) {
    next(error)
  }
}


export const createAssignment = async (req, res, next) => {
  try {
    const { course: courseId } = req.body

    
    const course = await Course.findById(courseId)

    if (!course) {
      return next(createError(404, "Course not found"))
    }

    if (course.lecturer.toString() !== req.user.id) {
      return next(createError(403, "Not authorized to create assignment for this course"))
    }

    const assignment = await Assignment.create(req.body)

    res.status(201).json({
      success: true,
      data: assignment,
    })
  } catch (error) {
    next(error)
  }
}


export const updateAssignment = async (req, res, next) => {
  try {
    let assignment = await Assignment.findById(req.params.id)

    if (!assignment) {
      return next(createError(404, "Assignment not found"))
    }

    
    const course = await Course.findById(assignment.course)

    if (course.lecturer.toString() !== req.user.id) {
      return next(createError(403, "Not authorized to update this assignment"))
    }

    assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      data: assignment,
    })
  } catch (error) {
    next(error)
  }
}


export const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)

    if (!assignment) {
      return next(createError(404, "Assignment not found"))
    }

    
    const course = await Course.findById(assignment.course)

    if (course.lecturer.toString() !== req.user.id) {
      return next(createError(403, "Not authorized to delete this assignment"))
    }

    await assignment.deleteOne()

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (error) {
    next(error)
  }
}


export const getAssignmentsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params

    
    const course = await Course.findById(courseId)

    if (!course) {
      return next(createError(404, "Course not found"))
    }

    
    if (req.user.role === "lecturer") {
      if (course.lecturer.toString() !== req.user.id) {
        return next(createError(403, "Not authorized to access assignments for this course"))
      }
    } else {
      
      if (!course.students.includes(req.user.id)) {
        return next(createError(403, "Not enrolled in this course"))
      }
    }

    const assignments = await Assignment.find({ course: courseId })

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    })
  } catch (error) {
    next(error)
  }
}
