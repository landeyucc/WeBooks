import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppProvider } from "@/contexts/AppContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CustomDialogProvider } from "@/components/CustomDialogProvider";
import { getSystemConfig } from "./lib/server-config";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSystemConfig();
  
  return {
    title: config?.siteTitle || "Webooks",
    description: config?.seoDescription || "现代化的拟态浏览器书签管理系统",
    keywords: config?.keywords || "书签管理,浏览器书签,bookmark manager",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getSystemConfig();
  
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        {/* FontAwesome CDN */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        {/* Favicon - 使用自定义配置或默认favicon */}
        <link 
          rel="icon" 
          href={config?.faviconUrl || "/default-favicon.ico"} 
          type={config?.faviconUrl?.endsWith('.png') ? 'image/png' : 'image/x-icon'}
          sizes={config?.faviconUrl?.endsWith('.png') ? '32x32' : '16x16'}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AppProvider>
            <CustomDialogProvider>
              {children}
            </CustomDialogProvider>
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
