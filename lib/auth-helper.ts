import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'
import { getUserIdFromRequest } from './auth'

/**
 * 单用户系统的认证助手函数
 * 当token中的用户ID与数据库不匹配时，自动使用第一个用户
 */
export async function getAuthenticatedUserId(request: NextRequest): Promise<{
  userId: string | null
  response?: NextResponse
}> {
  const userId = getUserIdFromRequest(request)
  
  console.log('getAuthenticatedUserId - 提取的用户ID:', userId)
  
  // 如果没有token，返回错误
  if (!userId) {
    console.log('getAuthenticatedUserId - 无有效的用户ID，返回401错误')
    return {
      userId: null,
      response: NextResponse.json(
        { error: '未授权', details: '需要登录token' },
        { status: 401 }
      )
    }
  }

  try {
    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    console.log('getAuthenticatedUserId - 数据库查询用户结果:', user ? `找到用户 ${user.username}` : '用户不存在')
    
    if (!user) {
      // 单用户模式下，如果token中的用户不存在，使用第一个用户
      const firstUser = await prisma.user.findFirst()
      console.log('getAuthenticatedUserId - 查找第一个用户:', firstUser ? firstUser.id : '没有用户')
      
      if (!firstUser) {
        return {
          userId: null,
          response: NextResponse.json(
            { error: '系统未初始化', details: '请先创建管理员账户' },
            { status: 401 }
          )
        }
      }
      
      return { userId: firstUser.id }
    }
    
    return { userId }
  } catch (error) {
    console.error('认证检查错误:', error)
    return {
      userId: null,
      response: NextResponse.json(
        { error: '认证检查失败' },
        { status: 500 }
      )
    }
  }
}

/**
 * 获取公共访问的用户ID（用于GET操作）
 */
export async function getPublicUserId(request: NextRequest): Promise<string> {
  const userId = getUserIdFromRequest(request)
  
  if (userId) {
    // 如果有token，验证用户
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (user) {
      return userId
    }
  }
  
  // 公共访问或token无效，获取第一个用户
  const firstUser = await prisma.user.findFirst()
  if (!firstUser) {
    throw new Error('系统中没有任何用户，请先初始化')
  }
  
  return firstUser.id
}