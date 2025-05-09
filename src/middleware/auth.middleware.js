import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { createError } from "../utils/error.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return next(createError(401, "Not authorized to access this route"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(createError(404, "User not found"));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(createError(401, "Not authorized to access this route"));
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        createError(
          403,
          `User role ${req.user.role} is not authorized to access this route`
        )
      );
    }
    next();
  };
};
