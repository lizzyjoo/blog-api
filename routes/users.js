import express from "express";
import prisma from "../db/prisma.js";
import bcrypt from "bcrypt";
import { authenticateJWT } from "../middleware/authMiddleware.js";
import { optionalAuth } from "../middleware/authMiddleware.js";

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
        registeredDate: true,
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
        following: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
          },
        },
        subscribers: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
          },
        },
        _count: {
          select: { subscribers: true, following: true },
        },
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

router.get("/saved", authenticateJWT, async (req, res) => {
  const { sort } = req.query;

  try {
    const savedPosts = await prisma.savedPost.findMany({
      where: { userId: req.user.id },
      include: {
        post: {
          include: {
            author: { select: { id: true, username: true } },
            comments: true,
          },
        },
      },
      orderBy: { savedAt: sort === "oldest" ? "asc" : "desc" },
    });

    // Filter out trashed/hidden/unpublished and only return the posts with savedAt
    const posts = savedPosts
      .filter(
        (sp) => sp.post.published && !sp.post.hidden && !sp.post.trashedAt
      )
      .map((sp) => ({
        ...sp.post,
        savedAt: sp.savedAt, // Include when it was saved
      }));

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch saved posts" });
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

// public, can view any user's public profile and posts
// might change this to authenticated only later, maybe add friendship system
// view user profile
// Increment profile view count
router.get("/:username/profile", optionalAuth, async (req, res) => {
  const { username } = req.params;
  try {
    const isOwnProfile = req.user?.username === username;

    const userCheck = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!userCheck) {
      return res.status(404).json({ error: "User not found" });
    }

    const postFilter = isOwnProfile
      ? { trashedAt: null }
      : { published: true, hidden: false, trashedAt: null };

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        first_name: true,
        last_name: true,
        registeredDate: true,
        profileViews: true,
        created_at: true,
        posts: {
          where: postFilter,
          include: {
            author: { select: { id: true, username: true } },
            comments: true,
          },
          orderBy: { created_at: "desc" },
          take: 1,
        },
        following: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
          },
        },
        subscribers: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
          },
        },
        _count: {
          select: {
            subscribers: true,
            following: true,
            posts: { where: postFilter }, // Same filter for count
          },
        },
      },
    });

    if (!isOwnProfile) {
      await prisma.user.update({
        where: { username },
        data: { profileViews: { increment: 1 } },
      });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user" });
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

router.get("/:username/subscribed", async (req, res) => {});

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

router.get("/:username", optionalAuth, async (req, res) => {
  const { username } = req.params;
  try {
    const isOwnProfile = req.user?.username === username;

    // Check if user exists
    const userCheck = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!userCheck) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user data (without incrementing)
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        first_name: true,
        last_name: true,
        registeredDate: true,
        profileViews: true,
        created_at: true,
        posts: {
          where: isOwnProfile
            ? { trashedAt: null }
            : { published: true, hidden: false, trashedAt: null },
          include: {
            author: { select: { id: true, username: true } },
            comments: true,
          },
          orderBy: { created_at: "desc" },
        },
        following: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
          },
        },
        subscribers: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
          },
        },
        _count: {
          select: { subscribers: true, following: true },
        },
      },
    });

    // Increment view count only for other users
    if (!isOwnProfile) {
      await prisma.user.update({
        where: { username },
        data: { profileViews: { increment: 1 } },
      });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
