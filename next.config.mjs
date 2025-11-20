/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 允许所有外部域名的图片，用于书签图标显示
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
