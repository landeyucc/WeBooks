# 使用官方 Node.js 镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制项目文件
COPY . .

# 复制环境变量
COPY .env .env

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npm start"]
