import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

// rest of your seed code
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

  const adminUser = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@example.com",
      first_name: "Admin",
      last_name: "User",
      password: await bcrypt.hash("admin123", 10),
      isAdmin: true,
    },
  });

  const post1 = await prisma.post.create({
    data: {
      title: "Getting Started with React",
      content:
        "React is a powerful JavaScript library for building user interfaces. In this post, we will explore the basics of React and how to get started with your first component.",
      published: true,
      hidden: false,
      authorId: user1.id,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: "Understanding Node.js Event Loop",
      content:
        "The Node.js event loop is the heart of its asynchronous architecture. Let's dive deep into how it works and why it makes Node.js so powerful for I/O operations.",
      published: true,
      authorId: user2.id,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: "Draft: Advanced TypeScript Patterns",
      content:
        "This is a draft post about advanced TypeScript patterns. Coming soon!",
      published: false, // Explicitly set as draft
      hidden: false,
      authorId: user1.id,
    },
  });

  const post4 = await prisma.post.create({
    data: {
      title: "J. Brahms: Violin Sonata No. 2 in A Major, Op. 100",
      content:
        'In the summer of 1886, Brahms enjoyed a productive and joyful period in Thun, Switzerland, where he composed the sonata. He gave the work the formal title Sonata for Piano and Violin, emphasizing the balanced and intimate partnership between the instruments. This quality was perhaps inspired by the serene yet invigorating surroundings of Thun, which he described as "so full of melodies that one has to be careful not to step on any."The second sonata is traditionally regarded as the most lyrical out of his three violin sonatas. In the work, Brahms includes fragments of songs that he wrote for his close friend and young German contralto Hermine Spies, such as Komm bald! (“Come Soon”), Wie Melodien zieht es (“It Goes Like Melodies”), Auf dem Kirchhofe (“In the Churchyard”), Meine Lieder (“My Songs”), and Meine Liebe ist grün (“My Love Is Green”). The opening movement is in sonata form, and the piano initiates the first and second themes. From opening piano chords, the melody flows continuously between the instruments in easy conversation. The second movement combines the roles of a slow movement and scherzo in alternating sections, with violin and piano often playing in the same register—doubling, crossing, and intertwining. The finale is a rondo built on a simple rising third (A–C) on the violin, heard each time with a slightly different rhythm, as if searching for its proper metric position. These subtle metric ambiguities give the movement its sense of unhurried grace and forward momentum. Brahms’s friend Elisabeth von Herzogenberg described the sonata as “one caress,” capturing the warm and introspective nature of the work, which never strays far from its radiant and openly affectionate center.',
      authorId: adminUser.id,
      created_at: new Date("2023-09-01T12:00:00Z"),
      published: true,
      hidden: false,
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
