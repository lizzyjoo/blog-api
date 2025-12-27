import express from "express";
import prisma from "../db/prisma.js";
import bcrypt from "bcrypt";
import { authenticateJWT } from "../middleware/authMiddleware.js";

// Get user info, Update profile, Change password, Upload profile picture, Delete account

const router = express.Router();

router.get("/me", authenticateJWT, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        username: true,
        email: true,
        created_at: true,
        posts: {
          take: 10,
          orderBy: { created_at: "desc" },
          include: {
            author: {
              select: { id: true, username: true },
            },
            comments: true,
          },
        },
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// private, authenticated user can update their profile
router.put("/me", authenticateJWT, async (req, res) => {
  const { first_name, last_name, email } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        first_name,
        last_name,
        email,
      },
    });
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.delete("/me", authenticateJWT, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.user.id } });
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// public, can view any user's public profile and posts
// might change this to authenticated only later, maybe add friendship system
// view user profile
router.get("/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      // only return public info
      select: {
        id: true,
        first_name: true,
        last_name: true,
        username: true,
        posts: {
          take: 10,
          orderBy: { created_at: "desc" },
          include: {
            author: {
              select: { id: true, username: true },
            },
            comments: true,
          },
        },
        _count: {
          select: {
            subscribers: true, // count of followers
            following: true, // count of users they follow
          },
        },

        created_at: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// get user posts
router.get("/:username/posts", async (req, res) => {
  const { username } = req.params;
  try {
    const posts = await prisma.post.findMany({
      where: { username, published: true, hidden: false },
      orderBy: { created_at: "desc" },
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
});

// DEBUG get user saved posts
router.get("/:username/saved", async (req, res) => {});

// Follow a user
router.post("/:username/follow", authenticateJWT, async (req, res) => {
  const { username } = req.params;
  try {
    const userToFollow = await prisma.user.findUnique({
      where: { username },
    });

    if (!userToFollow) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userToFollow.id === req.user.id) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        following: {
          connect: { id: userToFollow.id },
        },
      },
    });

    res.json({ message: `Now following ${username}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

// Unfollow a user
router.delete("/:username/follow", authenticateJWT, async (req, res) => {
  const { username } = req.params;
  try {
    const userToUnfollow = await prisma.user.findUnique({
      where: { username },
    });

    if (!userToUnfollow) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        following: {
          disconnect: { id: userToUnfollow.id },
        },
      },
    });

    res.json({ message: `Unfollowed ${username}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

// Check if following a user
router.get("/:username/follow", authenticateJWT, async (req, res) => {
  const { username } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        following: {
          where: { username },
          select: { id: true },
        },
      },
    });

    res.json({ isFollowing: user.following.length > 0 });
  } catch (error) {
    res.status(500).json({ error: "Failed to check follow status" });
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
