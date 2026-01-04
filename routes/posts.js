import express from "express";
import prisma from "../db/prisma.js";
import { authenticateJWT, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
// Get all posts
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { authorId, filter, sort } = req.query;

    const where = {
      trashedAt: null, // By default, exclude trashed posts
    };

    // Public feed
    if (!filter && !authorId) {
      where.published = true;
      where.hidden = false;
    }

    // Viewing specific author's posts
    if (authorId) {
      where.authorId = Number(authorId);

      const isOwnProfile = req.user && req.user.id === Number(authorId);

      if (isOwnProfile) {
        // Own profile - apply filter
        switch (filter) {
          case "published":
            where.published = true;
            where.hidden = false;
            break;
          case "drafts":
            where.published = false;
            break;
          case "trash":
            delete where.trashedAt; // Remove the null check
            where.trashedAt = { not: null }; // Only trashed
            break;
          case "all":
          default:
            // All non-trashed posts (already set)
            break;
        }
      } else {
        // Other's profile - only published, not hidden
        where.published = true;
        where.hidden = false;
      }
    }

    let orderBy;
    switch (sort) {
      case "likes":
        orderBy = { likes: "desc" };
        break;
      case "views":
        orderBy = { views: "desc" };
        break;
      case "comments":
        orderBy = { comments: { _count: "desc" } };
        break;
      case "recent":
      default:
        orderBy = { created_at: "desc" };
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, username: true } },
        comments: true,
      },
      orderBy,
    });

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

router.get("/subscribed", authenticateJWT, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        following: {
          include: {
            posts: {
              where: {
                published: true,
                hidden: false,
                trashedAt: null,
              },
              include: {
                author: { select: { id: true, username: true } },
                comments: true,
              },
              orderBy: { created_at: "desc" },
            },
          },
        },
      },
    });

    // Flatten: each followed user has posts, combine them all
    const posts = user.following
      .flatMap((followedUser) => followedUser.posts)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch subscribed posts" });
  }
});

// search posts
router.get("/search", async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Search query required" });
  }

  try {
    const posts = await prisma.post.findMany({
      where: {
        published: true,
        hidden: false,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        author: {
          select: { id: true, username: true },
        },
        comments: true,
      },
      orderBy: { created_at: "desc" },
    });

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Search failed" });
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
    // Add validation
    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Content is required" });
    }
    if (title.length > 50) {
      return res
        .status(400)
        .json({ error: "Title must be under 200 characters" });
    }
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

// Trash a post (soft delete)
router.put("/:id/trash", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const post = await prisma.post.findUnique({ where: { id: Number(id) } });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.authorId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updatedPost = await prisma.post.update({
      where: { id: Number(id) },
      data: { trashedAt: new Date() },
    });

    res.json({ message: "Post moved to trash", post: updatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to trash post" });
  }
});

// Restore from trash
router.put("/:id/restore", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const post = await prisma.post.findUnique({ where: { id: Number(id) } });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.authorId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updatedPost = await prisma.post.update({
      where: { id: Number(id) },
      data: { trashedAt: null },
    });

    res.json({ message: "Post restored", post: updatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to restore post" });
  }
});

// Update a post: check authentication, check if the user is the author
router.put("/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { title, content, published } = req.body;
  try {
    const updatedPost = await prisma.post.update({
      where: { id: Number(req.params.id) },
      data: {
        title,
        content,
        published,
      },
    });
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ error: "Failed to update post" });
  }
});

// increment view count
router.post("/:id/view", async (req, res) => {
  const { id } = req.params;
  try {
    // if user is logged in, see if they have alr viewed
    if (req.user) {
      const existingView = await prisma.postView.findUnique({
        where: {
          userId_postId: {
            userId: req.user.id,
            postId: Number(id),
          },
        },
      });

      if (existingView) {
        // just return view count without incrementing
        const post = await prisma.post.findUnique({
          where: { id: Number(id) },
          select: { views: true },
        });
        return res.json({ views: post.views, alreadyViewed: true });
      }
      const post = await prisma.post.update({
        where: { id: Number(id) },
        data: { views: { increment: 1 } },
      });

      res.json({ views: post.views, alreadyViewed: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update view count" });
  }
});

router.post("/:id/like", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    // Check if already liked
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        likedPosts: {
          where: { id: Number(id) },
          select: { id: true },
        },
      },
    });

    if (user.likedPosts.length > 0) {
      return res.status(400).json({ error: "Already liked this post" });
    }

    // Add like
    await prisma.post.update({
      where: { id: Number(id) },
      data: {
        likes: { increment: 1 },
        likedBy: { connect: { id: req.user.id } },
      },
    });

    res.json({ message: "Post liked" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to like post" });
  }
});

// Unlike a post
router.delete("/:id/like", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.post.update({
      where: { id: Number(id) },
      data: {
        likes: { decrement: 1 },
        likedBy: { disconnect: { id: req.user.id } },
      },
    });

    res.json({ message: "Post unliked" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to unlike post" });
  }
});

// Save a post
router.post("/:id/save", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    // Check if already saved
    const existing = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: req.user.id,
          postId: Number(id),
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Already saved this post" });
    }

    await prisma.savedPost.create({
      data: {
        userId: req.user.id,
        postId: Number(id),
      },
    });

    res.json({ message: "Post saved" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save post" });
  }
});

// Unsave a post
router.delete("/:id/save", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.savedPost.delete({
      where: {
        userId_postId: {
          userId: req.user.id,
          postId: Number(id),
        },
      },
    });

    res.json({ message: "Post unsaved" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to unsave post" });
  }
});
router.get("/:id/status", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    // Check if liked - through User
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        likedPosts: {
          where: { id: Number(id) },
          select: { id: true },
        },
      },
    });

    // Check if saved - query SavedPost directly
    const saved = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: req.user.id,
          postId: Number(id),
        },
      },
    });

    res.json({
      isLiked: user.likedPosts.length > 0,
      isSaved: !!saved,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get status" });
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
    await prisma.savedPost.deleteMany({ where: { postId } });
    await prisma.postView.deleteMany({ where: { postId } });
    await prisma.comment.deleteMany({ where: { postId } });

    await prisma.post.delete({
      where: { id: Number(id) },
    });
    res.status(204).end(); // 204 means No Content
  } catch (error) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

export default router;
