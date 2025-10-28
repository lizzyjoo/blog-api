import express from "express";
import jwt from "jsonwebtoken";
const app = express();
import cors from "cors";

import userRouter from "./routes/users.js";
import postsRouter from "./routes/posts.js";
import commentRouter from "./routes/comments.js";
import adminRouter from "./routes/admin.js";
import authRouter from "./routes/auth.js";

// Development: allow all origins
app.use(cors());

// Production: restrict to specific origins
const corsOptions = {
  origin: "https://myfrontend.com",
};
// app.use(cors(corsOptions));

// Middleware to parse JSON bodies
app.use(express.json());

// Simple route
app.get("/", (req, res) => res.json({ message: "Welcome to the Blog API!" }));

app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/posts", postsRouter);
app.use("/comments", commentRouter);
app.use("/admin", adminRouter);

// Start the server

const PORT = 3000;
app.listen(PORT, (error) => {
  // This is important!
  // Without this, any startup errors will silently fail
  // instead of giving you a helpful error message.
  if (error) {
    throw error;
  }
  console.log(`My first Express app - listening on port ${PORT}!`);
});
