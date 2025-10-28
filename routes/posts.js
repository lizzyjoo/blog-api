import express from "express";
import prisma from "../db/prisma.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";

const router = express.Router();
// Get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        comments: true,
      },
      orderBy: {
        created_at: "desc",
      },
    }); // returns a list of records, fetch all posts
    if (posts.length === 0) {
      return res.json({ message: "No posts yet." });
    }
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// get specific post by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        comments: true,
      },
    });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// Create a new post
router.post("/", authenticateJWT, async (req, res) => {
  try {
    const { title, content, authorId, created_at, updated_at } = req.body;
    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        authorId: req.user.id, // use the ID from the authenticated user
        created_at: new Date(created_at),
        updated_at: new Date(updated_at),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
    res.status(201).json(newPost); // 201 means created, convert post to JSON
  } catch (error) {
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Update a post: check authentication, check if the user is the author
router.put("/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { title, content, updated_at } = req.body;
  try {
    const updatedPost = await prisma.post.update({
      where: { id: Number(req.params.id) },
      data: {
        title,
        content,
        updated_at: new Date(updated_at),
      },
    });
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ error: "Failed to update post" });
  }
});

// delete a post: user must be logged in and be the author
router.delete("/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.post.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(204).end(); // 204 means No Content
  } catch (error) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

export default router;
