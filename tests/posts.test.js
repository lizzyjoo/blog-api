import request from "supertest";
import express from "express";
import prisma from "../config/db.js";

import authRouter from "../routes/auth.js";
import postRouter from "../routes/posts.js";

// Create a fresh Express app for testing
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/auth", authRouter);
app.use("/posts", postRouter);

let authToken;
let testUserId;
let testPostId;

const testUser = {
  username: "postTestUser",
  email: "posttest@example.com",
  password: "TestPassword123!",
  first_name: "Post",
  last_name: "Tester",
};

// Setup: create test user and get token
// Setup: create test user and get token
beforeAll(async () => {
  // Clean up any existing test data
  await prisma.comment.deleteMany({
    where: { author: { email: testUser.email } },
  });
  await prisma.post.deleteMany({
    where: { author: { email: testUser.email } },
  });
  await prisma.user.deleteMany({
    where: { email: testUser.email },
  });

  // Register user
  const registerResponse = await request(app)
    .post("/auth/register")
    .send(testUser);

  testUserId = registerResponse.body.user?.id;

  // Login to get token
  const loginResponse = await request(app).post("/auth/login").send({
    email: testUser.email,
    password: testUser.password,
  });

  authToken = loginResponse.body.token;

  console.log("Auth token received:", authToken ? "Yes" : "No");
}, 10000);
afterAll(async () => {
  // Clean up test data
  await prisma.comment.deleteMany({
    where: { author: { email: testUser.email } },
  });
  await prisma.post.deleteMany({
    where: { author: { email: testUser.email } },
  });
  await prisma.user.deleteMany({
    where: { email: testUser.email },
  });
});

describe("GET /posts", () => {
  it("should return an array of posts", async () => {
    const response = await request(app).get("/posts").expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe("POST /posts", () => {
  it("should create a post when authenticated", async () => {
    const newPost = {
      title: "My Test Post",
      content: "This is the content of my test post about music theory.",
    };

    const response = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${authToken}`)
      .send(newPost)
      .expect(201);

    expect(response.body).toHaveProperty("id");
    expect(response.body.title).toBe(newPost.title);
    expect(response.body.content).toBe(newPost.content);

    // Save for later tests
    testPostId = response.body.id;
  });

  it("should reject post creation without authentication", async () => {
    const response = await request(app)
      .post("/posts")
      .send({
        title: "Unauthorized Post",
        content: "This should fail",
      })
      .expect(401);

    expect(response.body).toHaveProperty("error");
  });

  it("should reject post with empty title", async () => {
    const response = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "",
        content: "Content without a title",
      })
      .expect(400);

    expect(response.body).toHaveProperty("error");
  });
});

describe("GET /posts/:id", () => {
  it("should return a single post by id", async () => {
    const response = await request(app).get(`/posts/${testPostId}`).expect(200);

    expect(response.body.id).toBe(testPostId);
    expect(response.body).toHaveProperty("title");
    expect(response.body).toHaveProperty("content");
  });

  it("should return 404 for non-existent post", async () => {
    const response = await request(app).get("/posts/99999").expect(404);

    expect(response.body).toHaveProperty("error");
  });
});

describe("PUT /posts/:id", () => {
  it("should update post when owner is authenticated", async () => {
    const updatedData = {
      title: "Updated Test Post Title",
      content: "This content has been updated.",
    };

    const response = await request(app)
      .put(`/posts/${testPostId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatedData)
      .expect(200);

    expect(response.body.title).toBe(updatedData.title);
    expect(response.body.content).toBe(updatedData.content);
  });

  it("should reject update without authentication", async () => {
    const response = await request(app)
      .put(`/posts/${testPostId}`)
      .send({
        title: "Hacked Title",
      })
      .expect(401);

    expect(response.body).toHaveProperty("error");
  });
});

describe("DELETE /posts/:id", () => {
  it("should reject delete without authentication", async () => {
    const response = await request(app)
      .delete(`/posts/${testPostId}`)
      .expect(401);

    expect(response.body).toHaveProperty("error");
  });

  it("should delete post when owner is authenticated", async () => {
    await request(app)
      .delete(`/posts/${testPostId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(204);

    // Verify it's deleted
    await request(app).get(`/posts/${testPostId}`).expect(404);
  });
});
