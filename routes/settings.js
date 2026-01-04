import express from "express";
import prisma from "../db/prisma.js";
import { authenticateJWT, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. get: account information
router.get("/account", authenticateJWT, (req, res) => {});
// 2. get: subscription list
// 3. put: change password
// 4. delete: subscription
// 5. delete: account

// changing password /settings/password
router.put("/password", authenticateJWT, async (req, res) => {
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

router.delete("/account/delete", authenticateJWT, async (req, res) => {
  console.log("working?");
  try {
    const userId = req.user.id;

    // Delete in order (children before parent)
    await prisma.savedPost.deleteMany({ where: { userId } });
    await prisma.postView.deleteMany({ where: { userId } });
    await prisma.comment.deleteMany({ where: { authorId: userId } });
    await prisma.post.deleteMany({ where: { authorId: userId } });
    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
