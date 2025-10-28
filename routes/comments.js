import express from "express";
import prisma from "../db/prisma.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";
import { create } from "domain";

const router = express.Router();
// Get all comments
router.get("/", async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      include: {
        post: true,
        authorId: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: "desc" },
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Get specific comment by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: Number(id) },
      include: {
        post: true,
        authorId: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comment" });
  }
});

// Create a new comment
router.post("/", authenticateJWT, async (req, res) => {
  try {
    const { content, postId, authorId } = req.body;
    const newComment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: req.user.id, // use the ID from the authenticated user
        created_at: new Date(),
        updated_at: new Date(),
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
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// Update a comment
router.put("/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const updatedComment = await prisma.comment.update({
      where: { id: Number(id) },
      data: {
        content,
        updated_at: new Date(),
      },
    });
    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ error: "Failed to update comment" });
  }
});

// Delete a comment
router.delete("/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.comment.delete({
      where: { id: Number(id) },
    });
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;
