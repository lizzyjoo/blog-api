import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();

async function main() {
  // clear existing data
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const user1 = await prisma.user.upsert({
    where: { email: "davidsmith@gmail.com" },
    update: {}, // if the user exists, do nothing
    create: {
      username: "davidsmith",
      email: "davidsmith@example.com",
      first_name: "David",
      last_name: "Smith",
      password: await bcrypt.hash("password123", 10),
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "jane@example.com" },
    update: {},
    create: {
      username: "janedoe",
      email: "jane@example.com",
      first_name: "Jane",
      last_name: "Doe",
      password: await bcrypt.hash("password123", 10),
    },
  });

  const post1 = await prisma.post.create({
    data: {
      title: "Getting Started with React",
      content:
        "React is a powerful JavaScript library for building user interfaces. In this post, we will explore the basics of React and how to get started with your first component.",
      published: true,
      authorId: user1.id,
      viewable: true,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: "Understanding Node.js Event Loop",
      content:
        "The Node.js event loop is the heart of its asynchronous architecture. Let's dive deep into how it works and why it makes Node.js so powerful for I/O operations.",
      published: true,
      authorId: user2.id,
      viewable: true,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: "Draft: Advanced TypeScript Patterns",
      content:
        "This is a draft post about advanced TypeScript patterns. Coming soon!",
      published: false, // Explicitly set as draft
      viewable: false, // Override default
      authorId: user1.id,
    },
  });

  const comment1 = await prisma.comment.create({
    data: {
      content:
        "Great introduction! Really helped me understand React components.",
      authorId: user2.id,
      postId: post1.id,
    },
  });
}

console.log("Seeding database...");
main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seeding completed.");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
