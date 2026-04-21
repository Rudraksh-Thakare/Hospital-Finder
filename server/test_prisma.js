const dotenv = require('dotenv');
dotenv.config();
console.log('DB URL:', process.env.DATABASE_URL);
const { PrismaClient } = require('@prisma/client');
try {
  const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  console.log('Client OK');
} catch (error) {
  console.error('Error creating PrismaClient:', error);
}
