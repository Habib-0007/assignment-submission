import mongoose from "mongoose"

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide an assignment title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide an assignment description"],
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    dueDate: {
      type: Date,
      required: [true, "Please provide a due date"],
    },
    maxMarks: {
      type: Number,
      required: [true, "Please provide maximum marks"],
      default: 100,
    },
  },
  { timestamps: true },
)

const Assignment = mongoose.model("Assignment", assignmentSchema)

export default Assignment
