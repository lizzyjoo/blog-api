import express from "express";
import prisma from "../db/prisma.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";

// Get user info, Update profile, Change password, Upload profile picture, Delete account

const router = express.Router();

// public, can view any user's public profile and posts
// might change this to authenticated only later, maybe add friendship system
// view user profile
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// get user posts
router.get("/:id/posts", async (req, res) => {
  const { id } = req.params;
  try {
    const posts = await prisma.post.findMany({
      where: { authorId: Number(id) },
      orderBy: { created_at: "desc" },
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
});

// private, authenticated user can update their profile
router.put("/me", authenticateJWT, async (req, res) => {
  const { first_name, last_name, email, profile_picture } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        first_name,
        last_name,
        email,
        profile_picture,
      },
    });
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// changing password
router.put("/me/password", authenticateJWT, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword },
    });
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to change password" });
  }
});
export default router;
