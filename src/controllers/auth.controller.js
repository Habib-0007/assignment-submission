import crypto from "crypto"
import User from "../models/user.model.js"
import { createError } from "../utils/error.js"
import { sendToken } from "../utils/jwtToken.js"
import sendEmail from "../utils/sendEmail.js"

// Register user
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return next(createError(400, "User already exists"))
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
    })

    sendToken(user, 201, res)
  } catch (error) {
    next(error)
  }
}

// Login user
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Check if email and password are provided
    if (!email || !password) {
      return next(createError(400, "Please provide email and password"))
    }

    // Check if user exists
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return next(createError(401, "Invalid credentials"))
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return next(createError(401, "Invalid credentials"))
    }

    sendToken(user, 200, res)
  } catch (error) {
    next(error)
  }
}

// Logout user
export const logout = (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  })
}

// Get current user
export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id)

  res.status(200).json({
    success: true,
    user,
  })
}

// Forgot password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return next(createError(404, "There is no user with that email"))
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken()
    await user.save({ validateBeforeSave: false })

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`

    // Create message
    const html = `
      <h1>You have requested a password reset</h1>
      <p>Please click on the following link to reset your password:</p>
      <a href="${resetUrl}" target="_blank">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        html,
      })

      res.status(200).json({
        success: true,
        message: "Email sent",
      })
    } catch (error) {
      user.resetPasswordToken = undefined
      user.resetPasswordExpire = undefined
      await user.save({ validateBeforeSave: false })

      return next(createError(500, "Email could not be sent"))
    }
  } catch (error) {
    next(error)
  }
}

// Reset password
export const resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.resetToken).digest("hex")

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) {
      return next(createError(400, "Invalid token"))
    }

    // Set new password
    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    sendToken(user, 200, res)
  } catch (error) {
    next(error)
  }
}
