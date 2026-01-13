/**
 * Test Setup File (ES Module)
 */

import prisma from "../config/db.js";

// Clean up database before all tests run
beforeAll(async () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "Tests must be run with NODE_ENV=test to protect production data"
    );
  }

  console.log("🧹 Cleaning test database...");

  // Delete in order that respects foreign key constraints
  await prisma.passwordReset.deleteMany({});
  await prisma.postView.deleteMany({});
  await prisma.savedPost.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("✅ Test database cleaned");
}, 10000); // timeout goes here instead

// Disconnect Prisma after all tests complete
afterAll(async () => {
  await prisma.$disconnect();
});
