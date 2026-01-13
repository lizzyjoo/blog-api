/**
 * Database Configuration (ES Module)
 *
 * Switches between test and development databases based on NODE_ENV
 */

import { PrismaClient } from "@prisma/client";

const databaseUrl =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: process.env.NODE_ENV === "development" ? ["query"] : [],
});

export default prisma;
