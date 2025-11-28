const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

// Auth controller
const authController = {
  register: async (req, res, next) => {
    try {
      const User = require("../models/User");
      const { name, email, password, role, specialization, licenseNumber } =
        req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        role,
        specialization,
        licenseNumber,
      });

      // Generate token
      const token = user.generateAuthToken();

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const User = require("../models/User");
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Please provide email and password",
        });
      }

      // Find user with password
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Generate token
      const token = user.generateAuthToken();

      res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  getMe: async (req, res, next) => {
    try {
      const User = require("../models/User");
      const user = await User.findById(req.user.id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const User = require("../models/User");
      const { name, specialization } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { name, specialization },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
};

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", protect, authController.getMe);
router.put("/profile", protect, authController.updateProfile);

module.exports = router;
