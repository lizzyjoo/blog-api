// auth routes

import express from "express";
import prisma from "../db/prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { isAdmin } from "../middleware/authMiddleware.js";
const router = express.Router();

// user registration handle existing username/email
router.post("/register", async (req, res) => {
  console.log("Registration attempt:", req.body);
  const subscribers = 0; // default value
  try {
    // get form data
    const registeredDate = new Date();
    const { first_name, last_name, username, email, password } = req.body; // need to hash password in production
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
        profile_picture, // optional, if empty will use default value
        registeredDate,
        subscribers,
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
      { id: user.id, username: user.username },
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
        profile_picture: user.profile_picture,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
