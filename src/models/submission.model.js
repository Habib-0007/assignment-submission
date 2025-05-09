import mongoose from "mongoose"

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    textAnswer: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    filePublicId: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    marks: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
)

// Ensure a student can only submit once per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true })

const Submission = mongoose.model("Submission", submissionSchema)

export default Submission
