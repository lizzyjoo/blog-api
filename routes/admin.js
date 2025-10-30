import express from "express";
import prisma from "../db/prisma.js";
import jwt from "jsonwebtoken";
import { authenticateJWT, isAdmin } from "../middleware/authMiddleware.js";

// view admin dashboard stats, manage users, manage posts, manage comments

const router = express.Router();
router.use(authenticateJWT, isAdmin);

// view all users
router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// delete a user by ID
router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
