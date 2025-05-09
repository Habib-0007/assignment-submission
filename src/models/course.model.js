import mongoose from "mongoose"

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a course title"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Please provide a course code"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide a course description"],
      trim: true,
    },
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
)

const Course = mongoose.model("Course", courseSchema)

export default Course
