# ============ 构建阶段 ============
FROM node:18-alpine AS builder

WORKDIR /app

# 系统依赖（prisma native、python）
RUN apk add --no-cache python3 make g++ openssl

# 先复制依赖声明层，最大化缓存命中
COPY package*.json ./
RUN npm ci

# 生成 Prisma Client
RUN npx prisma generate

# 源代码
COPY . .

# 构建 Next.js 产物
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build


# ============ 运行阶段 ============
FROM node:18-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl tini curl

# 非 root 用户
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs

# 1. 依赖：只装生产依赖
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# 诊断：确认 next CLI 在生产依赖里（npm start 会调 next start）
RUN node -e "console.log('next CLI:', require.resolve('next/dist/bin/next'))"

# 2. Next.js 构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# 3. 运行时脚本（generate-prisma-schema / init-database / migrate-database 都要跑）
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# 4. 公共资源 & Prisma schema（migrate 要读）
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# 5. 构建产物完整性自检（防止镜像里缺 BUILD_ID）
RUN test -f .next/BUILD_ID && echo "✅ BUILD_ID: $(cat .next/BUILD_ID)" || echo "❌ BUILD_ID MISSING!"
RUN ls -la .next/ | head -15

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=512"

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:3000/api/health || exit 1

# 入口：generate schema → init DB → migrate → next start
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "start"]
