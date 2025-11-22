const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // 创建管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const user = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: hashedPassword,
      email: 'admin@example.com'
    }
  })

  // 创建空间，包含 systemCardUrl 和加密字段
  const space1 = await prisma.space.create({
    data: {
      name: '工作空间',
      description: '我的工作相关书签',
      iconUrl: 'https://via.placeholder.com/32x32/4F46E5/FFFFFF?text=W',
      systemCardUrl: 'https://images.unsplash.com/photo-1486312338219-ce68e2c6b21d?w=400&h=600&fit=crop&crop=center',
      isEncrypted: false,
      passwordHash: null,
      userId: user.id
    }
  })

  const space2 = await prisma.space.create({
    data: {
      name: '学习空间',
      description: '学习资源和技术文档',
      iconUrl: 'https://via.placeholder.com/32x32/10B981/FFFFFF?text=L',
      systemCardUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=600&fit=crop&crop=center',
      isEncrypted: false,
      passwordHash: null,
      userId: user.id
    }
  })

  const space3 = await prisma.space.create({
    data: {
      name: '娱乐空间',
      description: '娱乐和游戏相关',
      iconUrl: 'https://via.placeholder.com/32x32/F59E0B/FFFFFF?text=E',
      systemCardUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop&crop=center',
      isEncrypted: false,
      passwordHash: null,
      userId: user.id
    }
  })

  // 创建文件夹
  const workFolder1 = await prisma.folder.create({
    data: {
      name: '开发工具',
      description: '代码编辑器和开发工具',
      spaceId: space1.id,
      userId: user.id
    }
  })

  const workFolder2 = await prisma.folder.create({
    data: {
      name: 'API文档',
      description: '各种API文档',
      spaceId: space1.id,
      userId: user.id
    }
  })

  const workSubFolder = await prisma.folder.create({
    data: {
      name: '前端框架',
      description: 'React, Vue等前端框架文档',
      spaceId: space1.id,
      parentFolderId: workFolder2.id,
      userId: user.id
    }
  })

  const studyFolder1 = await prisma.folder.create({
    data: {
      name: '编程教程',
      description: '编程学习资源',
      spaceId: space2.id,
      userId: user.id
    }
  })

  const studyFolder2 = await prisma.folder.create({
    data: {
      name: '技术博客',
      description: '优质技术博客',
      spaceId: space2.id,
      userId: user.id
    }
  })

  const entertainmentFolder1 = await prisma.folder.create({
    data: {
      name: '游戏',
      description: '游戏相关网站',
      spaceId: space3.id,
      userId: user.id
    }
  })

  // 创建书签
  await prisma.bookmark.createMany({
    data: [
      {
        title: 'Visual Studio Code',
        url: 'https://code.visualstudio.com',
        description: '微软开发的免费代码编辑器',
        iconUrl: 'https://code.visualstudio.com/favicon.ico',
        spaceId: space1.id,
        folderId: workFolder1.id,
        userId: user.id
      },
      {
        title: 'GitHub',
        url: 'https://github.com',
        description: '全球最大的代码托管平台',
        iconUrl: 'https://github.com/favicon.ico',
        spaceId: space1.id,
        folderId: workFolder1.id,
        userId: user.id
      },
      {
        title: 'React官方文档',
        url: 'https://react.dev',
        description: 'React官方文档和教程',
        iconUrl: 'https://react.dev/favicon.ico',
        spaceId: space1.id,
        folderId: workSubFolder.id,
        userId: user.id
      },
      {
        title: 'MDN Web Docs',
        url: 'https://developer.mozilla.org',
        description: 'Web技术权威文档',
        iconUrl: 'https://developer.mozilla.org/favicon.ico',
        spaceId: space1.id,
        folderId: workFolder2.id,
        userId: user.id
      },
      {
        title: 'JavaScript高级程序设计',
        url: 'https://book.douban.com/subject/10546125/',
        description: '经典的JavaScript学习书籍',
        iconUrl: 'https://img3.doubanio.com/favicon.ico',
        spaceId: space2.id,
        folderId: studyFolder1.id,
        userId: user.id
      },
      {
        title: '阮一峰的博客',
        url: 'https://ruanyifeng.com',
        description: '著名技术博主的博客',
        iconUrl: 'https://www.ruanyifeng.com/favicon.ico',
        spaceId: space2.id,
        folderId: studyFolder2.id,
        userId: user.id
      },
      {
        title: 'Steam',
        url: 'https://store.steampowered.com',
        description: '全球最大的数字游戏平台',
        iconUrl: 'https://store.steampowered.com/favicon.ico',
        spaceId: space3.id,
        folderId: entertainmentFolder1.id,
        userId: user.id
      },
      {
        title: 'YouTube',
        url: 'https://youtube.com',
        description: '视频分享平台',
        iconUrl: 'https://youtube.com/favicon.ico',
        spaceId: space3.id,
        userId: user.id
      }
    ]
  })

  console.log('数据库种子数据已成功创建！')
  console.log('管理员账号: admin / admin123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })