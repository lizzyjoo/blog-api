// auth middleware to protect routes
import jwt from "jsonwebtoken";

const authenticateJWT = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  // Extract token
  const token = authHeader.split(" ")[1]; // "Bearer TOKEN"
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log("Decoded:", decoded);
    next();
  } catch (error) {
    console.log("JWT Error:", error.message); // Add this
    console.log("Token received:", token); // And this
    return res.status(403).json({ error: "Invalid token" });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: "admin" },
    });
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin privileges required" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};

// middleware/authMiddleware.js
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(); // No token, continue without user
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    // Invalid token, continue without user
  }
  next();
};

export { authenticateJWT, isAdmin, optionalAuth };
