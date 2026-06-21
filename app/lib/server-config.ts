import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_CONFIG = {
  siteTitle: "Webooks",
  seoDescription: "现代化的拟态浏览器书签管理系统",
  keywords: "书签管理,浏览器书签,bookmark manager",
  faviconUrl: "/favicon.ico",
  defaultTheme: "light",
  defaultThemeType: "neumorphism"
};

async function safeGetSystemConfigRaw() {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT * FROM system_configs ORDER BY updated_at DESC LIMIT 1`
    );
    if (rows && rows.length > 0) {
      return rows[0];
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSystemConfig() {
  try {
    let config: Record<string, unknown> | null = null;
    
    try {
      config = await prisma.systemConfig.findFirst({
        orderBy: { updatedAt: 'desc' }
      }) as unknown as Record<string, unknown> | null;
    } catch {
      config = await safeGetSystemConfigRaw();
    }

    if (!config) {
      return DEFAULT_CONFIG;
    }

    const getField = (names: string[]): string | null => {
      for (const n of names) {
        if (config![n] !== undefined && config![n] !== null) {
          return String(config![n]);
        }
      }
      return null;
    };

    const siteTitle = getField(['siteTitle', 'site_title', 'siteTitle'])?.trim() || DEFAULT_CONFIG.siteTitle;
    const seoDescription = getField(['seoDescription', 'seo_description'])?.trim() || DEFAULT_CONFIG.seoDescription;
    const keywords = getField(['keywords'])?.trim() || DEFAULT_CONFIG.keywords;
    const faviconUrl = getField(['faviconUrl', 'favicon_url'])?.trim() || DEFAULT_CONFIG.faviconUrl;
    const defaultTheme = getField(['defaultTheme', 'default_theme'])?.trim() || DEFAULT_CONFIG.defaultTheme;
    const defaultThemeType = getField(['defaultThemeType', 'default_theme_type'])?.trim() || DEFAULT_CONFIG.defaultThemeType;

    return {
      siteTitle,
      seoDescription,
      keywords,
      faviconUrl,
      defaultTheme,
      defaultThemeType
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}