import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getSystemConfig() {
  try {
    // 获取第一个系统配置
    const config = await prisma.systemConfig.findFirst();

    // 如果没有配置，返回默认配置
    if (!config) {
      return {
        siteTitle: "Webooks",
        seoDescription: "现代化的拟态浏览器书签管理系统",
        keywords: "书签管理,浏览器书签,bookmark manager",
        faviconUrl: "/favicon.ico"
      };
    }

    // 合并数据库配置和默认值，确保不为空
    return {
      siteTitle: config.siteTitle || "Webooks",
      seoDescription: config.seoDescription || "现代化的拟态浏览器书签管理系统",
      keywords: config.keywords || "书签管理,浏览器书签,bookmark manager",
      faviconUrl: config.faviconUrl || "/favicon.ico"
    };
  } catch (error) {
    console.error('获取系统配置失败:', error);
    // 发生错误时返回默认配置
    return {
      siteTitle: "书签管理器 - Bookmark Manager",
      seoDescription: "现代化的浏览器书签管理系统",
      keywords: "书签管理,浏览器书签,bookmark manager",
      faviconUrl: "/favicon.ico"
    };
  }
}