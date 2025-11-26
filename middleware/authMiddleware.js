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
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // check if token is valid and not expired
    req.user = decoded; // Add user info to request
    next(); // Continue to the route
  } catch (error) {
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

export { authenticateJWT, isAdmin };
