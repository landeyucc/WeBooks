import { PrismaClient } from '@prisma/client'

interface DatabaseConfig {
  provider: 'postgresql' | 'sqlite'
  url: string
}

class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

function validateDatabaseConfig(): DatabaseConfig {
  const databaseType = process.env.DATABASE_TYPE || 'postgresql'
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new DatabaseError('DATABASE_URL environment variable is required', 'MISSING_DATABASE_URL')
  }

  let provider: 'postgresql' | 'sqlite'
  if (databaseType === 'sqlite') {
    provider = 'sqlite'
    if (!databaseUrl.startsWith('file:')) {
      throw new DatabaseError('For SQLite, DATABASE_URL must start with "file:"', 'INVALID_SQLITE_URL')
    }
  } else if (databaseType === 'postgresql') {
    provider = 'postgresql'
    if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
      throw new DatabaseError('For PostgreSQL, DATABASE_URL must start with "postgresql://" or "postgres://"', 'INVALID_POSTGRESQL_URL')
    }
  } else {
    throw new DatabaseError(`Unsupported database type: ${databaseType}. Use "sqlite" or "postgresql".`, 'UNSUPPORTED_DATABASE_TYPE')
  }

  process.env.DATABASE_PROVIDER = provider

  return { provider, url: databaseUrl }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let config: DatabaseConfig | null = null

try {
  config = validateDatabaseConfig()
} catch (error) {
  console.error('Database configuration error:', error)
}

const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? ['error' as const, 'warn' as const] 
    : ['error' as const],
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function disconnectPrisma() {
  await prisma.$disconnect()
}

export function getDatabaseProvider(): 'postgresql' | 'sqlite' {
  if (!config) {
    throw new DatabaseError('Database configuration not initialized', 'CONFIG_NOT_INITIALIZED')
  }
  return config.provider
}

export function isSQLiteMode(): boolean {
  return getDatabaseProvider() === 'sqlite'
}

export function isPostgreSQLMode(): boolean {
  return getDatabaseProvider() === 'postgresql'
}

export { DatabaseError }
