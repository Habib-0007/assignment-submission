import fs from "fs";
import Assignment from "../models/assignment.model.js";
import Course from "../models/course.model.js";
import Submission from "../models/submission.model.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { createError } from "../utils/error.js";

export const getSubmissions = async (req, res, next) => {
  try {
    let submissions;

    if (req.user.role === "lecturer") {
      const courses = await Course.find({ lecturer: req.user.id });
      const courseIds = courses.map((course) => course._id);

      const assignments = await Assignment.find({ course: { $in: courseIds } });
      const assignmentIds = assignments.map((assignment) => assignment._id);

      submissions = await Submission.find({
        assignment: { $in: assignmentIds },
      })
        .populate({
          path: "assignment",
          select: "title course",
          populate: {
            path: "course",
            select: "title code",
          },
        })
        .populate("student", "name email");
    } else {
      submissions = await Submission.find({ student: req.user.id }).populate({
        path: "assignment",
        select: "title course",
        populate: {
          path: "course",
          select: "title code",
        },
      });
    }

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    next(error);
  }
};

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
      .populate("student", "name email");

    if (!submission) {
      return next(createError(404, "Submission not found"));
    }

    if (req.user.role === "lecturer") {
      if (submission.assignment.course.lecturer.toString() !== req.user.id) {
        return next(
          createError(403, "Not authorized to access this submission")
        );
      }
    } else {
      if (submission.student._id.toString() !== req.user.id) {
        return next(
          createError(403, "Not authorized to access this submission")
        );
      }
    }

    res.status(200).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

export const createSubmission = async (req, res, next) => {
  try {
    const { assignmentId, textAnswer } = req.body;

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return next(createError(404, "Assignment not found"));
    }

    const course = await Course.findById(assignment.course);

    if (!course.students.includes(req.user.id)) {
      return next(createError(403, "Not enrolled in this course"));
    }

    if (new Date(assignment.dueDate) < new Date()) {
      return next(createError(400, "Assignment due date has passed"));
    }

    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: req.user.id,
    });

    if (existingSubmission) {
      return next(
        createError(400, "You have already submitted for this assignment")
      );
    }

    let fileData = {};

    if (req.file) {
      const result = await uploadToCloudinary(req.file.path);
      fileData = {
        fileUrl: result.url,
        filePublicId: result.public_id,
      };

      fs.unlinkSync(req.file.path);
    }

    const submission = await Submission.create({
      assignment: assignmentId,
      student: req.user.id,
      textAnswer,
      ...fileData,
    });

    res.status(201).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubmission = async (req, res, next) => {
  try {
    const { textAnswer } = req.body;

    let submission = await Submission.findById(req.params.id);

    if (!submission) {
      return next(createError(404, "Submission not found"));
    }

    if (submission.student.toString() !== req.user.id) {
      return next(createError(403, "Not authorized to update this submission"));
    }

    const assignment = await Assignment.findById(submission.assignment);

    if (new Date(assignment.dueDate) < new Date()) {
      return next(createError(400, "Assignment due date has passed"));
    }

    let fileData = {};

    if (req.file) {
      if (submission.filePublicId) {
        await deleteFromCloudinary(submission.filePublicId);
      }

      const result = await uploadToCloudinary(req.file.path);
      fileData = {
        fileUrl: result.url,
        filePublicId: result.public_id,
      };

      fs.unlinkSync(req.file.path);
    }

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
      }
    );

    res.status(200).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

export const gradeSubmission = async (req, res, next) => {
  try {
    const { marks, feedback } = req.body;

    let submission = await Submission.findById(req.params.id).populate({
      path: "assignment",
      populate: {
        path: "course",
      },
    });

    if (!submission) {
      return next(createError(404, "Submission not found"));
    }

    if (submission.assignment.course.lecturer.toString() !== req.user.id) {
      return next(createError(403, "Not authorized to grade this submission"));
    }

    submission = await Submission.findByIdAndUpdate(
      req.params.id,
      {
        marks,
        feedback,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

export const getSubmissionsByAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId).populate(
      "course"
    );

    if (!assignment) {
      return next(createError(404, "Assignment not found"));
    }

    if (assignment.course.lecturer.toString() !== req.user.id) {
      return next(
        createError(
          403,
          "Not authorized to access submissions for this assignment"
        )
      );
    }

    const submissions = await Submission.find({
      assignment: assignmentId,
    }).populate("student", "name email");

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    next(error);
  }
};
