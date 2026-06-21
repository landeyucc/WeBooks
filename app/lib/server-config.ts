import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getSystemConfig() {
  try {
    const config = await prisma.systemConfig.findFirst({
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (!config) {
      return {
        siteTitle: "Webooks",
        seoDescription: "现代化的拟态浏览器书签管理系统",
        keywords: "书签管理,浏览器书签,bookmark manager",
        faviconUrl: "/favicon.ico",
        defaultTheme: "light",
        defaultThemeType: "neumorphism"
      };
    }

    const siteTitle = config.siteTitle?.trim() || "Webooks";
    const seoDescription = config.seoDescription?.trim() || "现代化的拟态浏览器书签管理系统";
    const keywords = config.keywords?.trim() || "书签管理,浏览器书签,bookmark manager";
    const faviconUrl = config.faviconUrl?.trim() || "/favicon.ico";
    const defaultTheme = config.defaultTheme?.trim() || "light";
    const defaultThemeType = config.defaultThemeType?.trim() || "neumorphism";

    return {
      siteTitle,
      seoDescription,
      keywords,
      faviconUrl,
      defaultTheme,
      defaultThemeType
    };
  } catch {
    return {
      siteTitle: "Webooks",
      seoDescription: "现代化的拟态浏览器书签管理系统",
      keywords: "书签管理,浏览器书签,bookmark manager",
      faviconUrl: "/favicon.ico",
      defaultTheme: "light",
      defaultThemeType: "neumorphism"
    };
  }
}