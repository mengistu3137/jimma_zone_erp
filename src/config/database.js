// src/config/database.js
import { PrismaClient } from "@prisma/client";

// Global prisma instance in development (to prevent hot-reload issues)
const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['info', 'warn', 'error'],
  errorFormat: 'minimal',
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;