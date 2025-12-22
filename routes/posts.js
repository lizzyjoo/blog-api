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

router.post("/", authenticateJWT, async (req, res) => {
  try {
    const { title, content } = req.body;
    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        authorId: req.user.id,
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
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Update a post: check authentication, check if the user is the author
router.put("/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const updatedPost = await prisma.post.update({
      where: { id: Number(req.params.id) },
      data: {
        title,
        content,
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
    const existingPost = await prisma.post.findUnique({
      where: { id: Number(id) },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isAdmin: true },
    });

    // check if the logged-in user is the author of the post or an admin
    if (existingPost.authorId !== req.user.id && !user.isAdmin) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this post" });
    }

    await prisma.post.delete({
      where: { id: Number(id) },
    });
    res.status(204).end(); // 204 means No Content
  } catch (error) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

export default router;
