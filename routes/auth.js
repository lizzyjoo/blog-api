// auth routes

import express from "express";
import prisma from "../db/prisma.js";
import passport from "../config/passport.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../utils/email.js";
import { isAdmin } from "../middleware/authMiddleware.js";
const router = express.Router();

function isValidUsername(username) {
  // Alphanumeric, underscore, dot, exclamation allowed
  // No spaces, 1-15 characters
  const regex = /^[a-zA-Z0-9_.!]{1,15}$/;
  return regex.test(username);
}

// user registration handle existing username/email
router.post("/register", async (req, res) => {
  console.log("Registration attempt:", req.body);
  try {
    // get form data
    const registeredDate = new Date();
    const { first_name, last_name, username, email, password } = req.body; // need to hash password in production
    // Validate username format
    if (!isValidUsername(username)) {
      return res.status(400).json({
        error:
          "Username must be 1-15 characters and contain only letters, numbers, _, ., or !",
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters",
      });
    }
    // check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });
    if (existingUser) {
      console.log("Existing user found:", existingUser);
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }
    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // create user in db
    const newUser = await prisma.user.create({
      data: {
        first_name,
        last_name,
        username,
        email,
        password: hashedPassword,
        registeredDate,
      },
    });
    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// user login via email or username (both allowed)
router.post("/login", async (req, res) => {
  console.log("Login attempt:", req.body);
  try {
    const { email, username, password } = req.body;
    const cleanEmail = email?.trim().toLowerCase();
    const cleanUsername = username?.trim();
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    } else if (username) {
      user = await prisma.user.findUnique({
        where: { username: cleanUsername },
      });
    } else {
      return res.status(400).json({ error: "Email or username required" });
    }

    if (!user) {
      return res
        .status(401)
        .json({ error: "Username or Password is Incorrect" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ error: "Username or Password is Incorrect" });
    }
    // create JWT token
    const token = jwt.sign(
      // payload and secret
      {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        authMethod: user.googleId
          ? "google"
          : user.githubId
          ? "github"
          : "local",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Login failed" });
  }
});

// GitHub OAuth
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    // Create JWT token
    const token = jwt.sign(
      {
        id: req.user.id,
        username: req.user.username,
        isAdmin: req.user.isAdmin,
        authMethod: "github",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const token = jwt.sign(
      {
        id: req.user.id,
        username: req.user.username,
        isAdmin: req.user.isAdmin,
        authMethod: "google",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// password reset routs
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Don't reveal if email exists or not (security)
    if (!user) {
      return res.json({
        message:
          "If an account with that email exists, you will receive a reset link.",
      });
    }

    // Check if user signed up via OAuth (no password to reset)
    if (user.googleId || user.githubId || !user.password) {
      return res.json({
        message:
          "If an account with that email exists, you will receive a reset link.",
      });
    }

    // generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // expires in 10 min

    // delete any existing reset tokens for this user
    await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

    // make new reset token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetLink);

    res.json({
      message:
        "If an account with that email exists, you will receive a reset link..",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

// Reset password with token
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Find valid token
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    // Check if expired
    if (resetRecord.expiresAt < new Date()) {
      await prisma.passwordReset.delete({ where: { id: resetRecord.id } });
      return res.status(400).json({ error: "Reset link has expired" });
    }

    // Validate password
    if (!newPassword || newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await prisma.passwordReset.delete({ where: { id: resetRecord.id } });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

export default router;
