import request from "supertest";
import express from "express";
import prisma from "../config/db.js";

// Import router
import authRouter from "../routes/auth.js";

// Create a fresh Express app for testing
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/auth", authRouter);

// Test user data
const testUser = {
  username: "authtestuser",
  email: "authtest@example.com",
  password: "TestPassword123!",
  first_name: "Auth",
  last_name: "Test",
};

// Clean up the test's data before running
beforeAll(async () => {
  await prisma.user.deleteMany({
    where: { email: testUser.email },
  });
});

// Clean up after tests complete
afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: testUser.email },
  });
});
describe("POST /auth/register", () => {
  it("should create a new user", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send(testUser)
      .expect(201);

    expect(response.body).toHaveProperty("message");
    expect(response.body.user).toHaveProperty("id");
    expect(response.body.user.email).toBe(testUser.email);
  });

  it("should reject duplicate email", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send(testUser)
      .expect(400);

    expect(response.body).toHaveProperty("error");
  });
});
describe("POST /auth/login", () => {
  it("should return token for valid credentials", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body).toHaveProperty("token");
  });

  it("should reject invalid password", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: testUser.email,
        password: "WrongPassword123!",
      })
      .expect(401);

    expect(response.body).toHaveProperty("error");
  });

  it("should reject non-existent user", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "nonexistent@example.com",
        password: "SomePassword123!",
      })
      .expect(401);

    expect(response.body).toHaveProperty("error");
  });
});
