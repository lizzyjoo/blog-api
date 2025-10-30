// auth routes

import express from "express";
import prisma from "../db/prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const router = express.Router();

// user registration
router.post("/register", async (req, res) => {
  try {
    // get form data
    const {
      first_name,
      last_name,
      username,
      email,
      password,
      profile_picture,
    } = req.body; // need to hash password in production
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

// user login
router.post("/login", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (username) {
      user = await prisma.user.findUnique({ where: { username } });
    } else {
      return res.status(400).json({ error: "Email or username required" });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Password is incorrect" });
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
      },
    });
    res.json({ message: "Login successful", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
