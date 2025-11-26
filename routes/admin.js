import express from "express";
import prisma from "../db/prisma.js";
import jwt from "jsonwebtoken";
import { authenticateJWT, isAdmin } from "../middleware/authMiddleware.js";

// view admin dashboard stats, manage users, manage posts, manage comments

const router = express.Router();
router.use(authenticateJWT, isAdmin);

// view all users
router.get("/viewusers", async (req, res) => {
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
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// promote a user to admin
router.post("/:id/promote", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.update({
      where: { id: Number(id) },
      data: { role: "admin" },
    });
    res.json({ message: "User promoted to admin successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to promote user" });
  }
});

// revoke admin privileges from a user
router.post("/:id/revoke", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.update({
      where: { id: Number(id) },
      data: { role: "user" },
    });
    res.json({ message: "Admin privileges revoked successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to revoke admin privileges" });
  }
});

// delete any post by ID
router.delete("/posts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.post.delete({ where: { id: Number(id) } });
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// delete any comment by ID
router.delete("/comments/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.comment.delete({ where: { id: Number(id) } });
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// get site statistics
router.get("/stats", async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    const commentCount = await prisma.comment.count();

    res.json({
      users: userCount,
      posts: postCount,
      comments: commentCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;
