import fs from "fs"
import Assignment from "../models/assignment.model.js"
import Course from "../models/course.model.js"
import Submission from "../models/submission.model.js"
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import { createError } from "../utils/error.js"

// Get all submissions (for lecturer: submissions for their assignments, for student: their submissions)
export const getSubmissions = async (req, res, next) => {
  try {
    let submissions

    if (req.user.role === "lecturer") {
      // Get courses created by the lecturer
      const courses = await Course.find({ lecturer: req.user.id })
      const courseIds = courses.map((course) => course._id)

      // Get assignments for those courses
      const assignments = await Assignment.find({ course: { $in: courseIds } })
      const assignmentIds = assignments.map((assignment) => assignment._id)

      // Get submissions for those assignments
      submissions = await Submission.find({ assignment: { $in: assignmentIds } })
        .populate({
          path: "assignment",
          select: "title course",
          populate: {
            path: "course",
            select: "title code",
          },
        })
        .populate("student", "name email")
    } else {
      // Get submissions made by the student
      submissions = await Submission.find({ student: req.user.id }).populate({
        path: "assignment",
        select: "title course",
        populate: {
          path: "course",
          select: "title code",
        },
      })
    }

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    })
  } catch (error) {
    next(error)
  }
}

// Get single submission
export const getSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate({
        path: "assignment",
        select: "title course",
        populate: {
          path: "course",
          select: "title code lecturer",
        },
      })
      .populate("student", "name email")

    if (!submission) {
      return next(createError(404, "Submission not found"))
    }

    // Check if user is authorized to view this submission
    if (req.user.role === "lecturer") {
      if (submission.assignment.course.lecturer.toString() !== req.user.id) {
        return next(createError(403, "Not authorized to access this submission"))
      }
    } else {
      if (submission.student._id.toString() !== req.user.id) {
        return next(createError(403, "Not authorized to access this submission"))
      }
    }

    res.status(200).json({
      success: true,
      data: submission,
    })
  } catch (error) {
    next(error)
  }
}

// Create submission (student only)
export const createSubmission = async (req, res, next) => {
  try {
    const { assignmentId, textAnswer } = req.body

    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId)

    if (!assignment) {
      return next(createError(404, "Assignment not found"))
    }

    // Check if student is enrolled in the course
    const course = await Course.findById(assignment.course)

    if (!course.students.includes(req.user.id)) {
      return next(createError(403, "Not enrolled in this course"))
    }

    // Check if due date has passed
    if (new Date(assignment.dueDate) < new Date()) {
      return next(createError(400, "Assignment due date has passed"))
    }

    // Check if student has already submitted
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: req.user.id,
    })

    if (existingSubmission) {
      return next(createError(400, "You have already submitted for this assignment"))
    }

    let fileData = {}

    // If file is uploaded
    if (req.file) {
      // Upload to Cloudinary
      const result = await uploadToCloudinary(req.file.path)
      fileData = {
        fileUrl: result.url,
        filePublicId: result.public_id,
      }

      // Delete file from server
      fs.unlinkSync(req.file.path)
    }

    // Create submission
    const submission = await Submission.create({
      assignment: assignmentId,
      student: req.user.id,
      textAnswer,
      ...fileData,
    })

    res.status(201).json({
      success: true,
      data: submission,
    })
  } catch (error) {
    next(error)
  }
}

// Update submission (student only - before due date)
export const updateSubmission = async (req, res, next) => {
  try {
    const { textAnswer } = req.body

    let submission = await Submission.findById(req.params.id)

    if (!submission) {
      return next(createError(404, "Submission not found"))
    }

    // Check if user is the submission owner
    if (submission.student.toString() !== req.user.id) {
      return next(createError(403, "Not authorized to update this submission"))
    }

    // Check if due date has passed
    const assignment = await Assignment.findById(submission.assignment)

    if (new Date(assignment.dueDate) < new Date()) {
      return next(createError(400, "Assignment due date has passed"))
    }

    let fileData = {}

    // If file is uploaded
    if (req.file) {
      // Delete previous file from Cloudinary if exists
      if (submission.filePublicId) {
        await deleteFromCloudinary(submission.filePublicId)
      }

      // Upload new file to Cloudinary
      const result = await uploadToCloudinary(req.file.path)
      fileData = {
        fileUrl: result.url,
        filePublicId: result.public_id,
      }

      // Delete file from server
      fs.unlinkSync(req.file.path)
    }

    // Update submission
    submission = await Submission.findByIdAndUpdate(
      req.params.id,
      {
        textAnswer: textAnswer || submission.textAnswer,
        ...fileData,
        submittedAt: Date.now(),
      },
      {
        new: true,
        runValidators: true,
      },
    )

    res.status(200).json({
      success: true,
      data: submission,
    })
  } catch (error) {
    next(error)
  }
}

// Grade submission (lecturer only)
export const gradeSubmission = async (req, res, next) => {
  try {
    const { marks, feedback } = req.body

    let submission = await Submission.findById(req.params.id).populate({
      path: "assignment",
      populate: {
        path: "course",
      },
    })

    if (!submission) {
      return next(createError(404, "Submission not found"))
    }

    // Check if user is the course lecturer
    if (submission.assignment.course.lecturer.toString() !== req.user.id) {
      return next(createError(403, "Not authorized to grade this submission"))
    }

    // Update submission with marks and feedback
    submission = await Submission.findByIdAndUpdate(
      req.params.id,
      {
        marks,
        feedback,
      },
      {
        new: true,
        runValidators: true,
      },
    )

    res.status(200).json({
      success: true,
      data: submission,
    })
  } catch (error) {
    next(error)
  }
}

// Get submissions by assignment (lecturer only)
export const getSubmissionsByAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params

    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId).populate("course")

    if (!assignment) {
      return next(createError(404, "Assignment not found"))
    }

    // Check if user is the course lecturer
    if (assignment.course.lecturer.toString() !== req.user.id) {
      return next(createError(403, "Not authorized to access submissions for this assignment"))
    }

    const submissions = await Submission.find({ assignment: assignmentId }).populate("student", "name email")

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    })
  } catch (error) {
    next(error)
  }
}
