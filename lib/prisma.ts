import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query' as const, 'error' as const, 'warn' as const] 
    : ['error' as const],
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function disconnectPrisma() {
  await prisma.$disconnect()
}
