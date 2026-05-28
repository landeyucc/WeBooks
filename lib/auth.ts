import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key'

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
  return token
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
    return payload
  } catch {
    return null
  }
}

export function getUserIdFromRequest(request: NextRequest): string | null {
  // 尝试多种方式获取authorization header
  const authHeader = request.headers.get('authorization') || 
                     request.headers.get('Authorization') ||
                     request.headers.get('AUTHORIZATION')
  
  if (!authHeader) {
    return null
  }

  // 兼容不同格式: "Bearer xxx" 或直接是token
  let token = authHeader
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  
  const payload = verifyToken(token)
  return payload?.userId || null
}
