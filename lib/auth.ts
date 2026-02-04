import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key'

console.log('Auth模块初始化 - JWT_SECRET长度:', JWT_SECRET.length)
console.log('Auth模块初始化 - JWT_SECRET前10字符:', JWT_SECRET.substring(0, 10))

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  console.log('生成Token，用户ID:', userId)
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
  console.log('Token生成成功，长度:', token.length)
  return token
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    console.log('开始验证Token...')
    console.log('JWT_SECRET:', JWT_SECRET.substring(0, 10) + '...')
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
    console.log('Token验证成功，用户ID:', payload.userId)
    return payload
  } catch (error) {
    console.error('Token验证失败:', error instanceof Error ? error.message : '未知错误')
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT错误类型:', error.name)
    }
    console.error('JWT_SECRET长度:', JWT_SECRET.length)
    return null
  }
}

export function getUserIdFromRequest(request: NextRequest): string | null {
  // 尝试多种方式获取authorization header
  const authHeader = request.headers.get('authorization') || 
                     request.headers.get('Authorization') ||
                     request.headers.get('AUTHORIZATION')
  
  console.log('getUserIdFromRequest - 获取到的Header:', authHeader ? authHeader.substring(0, 30) + '...' : '无')
  
  if (!authHeader) {
    console.log('getUserIdFromRequest - 无Authorization header')
    return null
  }

  // 兼容不同格式: "Bearer xxx" 或直接是token
  let token = authHeader
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  
  console.log('getUserIdFromRequest - Token长度:', token.length)
  console.log('getUserIdFromRequest - Token前20字符:', token.substring(0, 20) + '...')
  
  const payload = verifyToken(token)
  return payload?.userId || null
}
