import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import { createError } from "../utils/error.js";

export const getCourses = async (req, res, next) => {
  try {
    let courses;

    if (req.user.role === "lecturer") {
      courses = await Course.find({ lecturer: req.user.id })
        .populate("lecturer", "name email")
        .populate("students", "name email");
    } else {
      courses = await Course.find().populate("lecturer", "name email");
    }

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("lecturer", "name email")
      .populate("students", "name email");

    if (!course) {
      return next(createError(404, "Course not found"));
    }

    if (
      req.user.role === "lecturer" &&
      course.lecturer._id.toString() !== req.user.id
    ) {
      return next(createError(403, "Not authorized to access this course"));
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    req.body.lecturer = req.user.id;

    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return next(createError(404, "Course not found"));
    }

    if (course.lecturer.toString() !== req.user.id) {
      return next(createError(403, "Not authorized to update this course"));
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return next(createError(404, "Course not found"));
    }

    if (course.lecturer.toString() !== req.user.id) {
      return next(createError(403, "Not authorized to delete this course"));
    }

    await course.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

export const enrollCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return next(createError(404, "Course not found"));
    }

    if (course.students.includes(req.user.id)) {
      return next(createError(400, "Already enrolled in this course"));
    }

    course.students.push(req.user.id);
    await course.save();

    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { enrolledCourses: course._id } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const getEnrolledCourses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("enrolledCourses");

    res.status(200).json({
      success: true,
      count: user.enrolledCourses.length,
      data: user.enrolledCourses,
    });
  } catch (error) {
    next(error);
  }
};
