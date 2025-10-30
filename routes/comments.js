import express from "express";
import prisma from "../db/prisma.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";

const router = express.Router();
// Get all comments
router.get("/", async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      include: {
        author: { select: { id: true, username: true } },
        post: {
          select: { id: true, title: true }, // Include post info too
        },
      },

      orderBy: { created_at: "desc" },
    });
    if (comments.length === 0) {
      return res.json({ message: "No comments yet." });
    }
    res.json(comments);
  } catch (error) {
    console.error(error);
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
        author: { select: { id: true, username: true } },
        post: {
          select: { id: true, title: true }, // Include post info too
        },
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
    const { content, postId } = req.body;
    const newComment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: req.user.id, // use the ID from the authenticated user
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
    console.log(error);
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
    // Check if comment exists and user owns it
    const existingComment = await prisma.comment.findUnique({
      where: { id: Number(id) },
    });

    if (!existingComment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (existingComment.authorId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only delete your own comments" });
    }

    await prisma.comment.delete({
      where: { id: Number(id) },
    });

    res.status(204).end(); // 204 No Content for successful delete
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;
