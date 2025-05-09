import express from "express"
import User from "../models/user.model.js"
import { protect } from "../middleware/auth.middleware.js"
import { createError } from "../utils/error.js"

const router = express.Router()

router.use(protect)


router.get("/", async (req, res, next) => {
  try {
    const users = await User.find().select("-password")

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    })
  } catch (error) {
    next(error)
  }
})


router.get("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password")

    if (!user) {
      return next(createError(404, "User not found"))
    }

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
})

router.put("/updateprofile", async (req, res, next) => {
  try {
    const { name, email } = req.body

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password")

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
})

router.put("/updatepassword", async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(req.user.id).select("+password")


    const isMatch = await user.comparePassword(currentPassword)

    if (!isMatch) {
      return next(createError(401, "Current password is incorrect"))
    }

    user.password = newPassword
    await user.save()

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    })
  } catch (error) {
    next(error)
  }
})

export default router
