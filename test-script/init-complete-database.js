const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function initializeCompleteDatabase() {
  try {
    console.log('🔄 初始化完整的数据库（包含用户和加密空间）...');
    
    // 删除现有的数据
    console.log('🗑️  清理现有数据...');
    await prisma.bookmark.deleteMany({});
    await prisma.folder.deleteMany({});
    await prisma.space.deleteMany({});
    await prisma.systemConfig.deleteMany({});
    await prisma.user.deleteMany({});
    
    // 创建默认用户（使用bcrypt生成密码哈希）
    console.log('👤 创建默认用户...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: hashedPassword,
        email: 'admin@webooks.ai'
      }
    });
    console.log('✅ 创建用户成功:', user.id);
    
    // 创建系统配置
    console.log('⚙️  创建系统配置...');
    await prisma.systemConfig.create({
      data: {
        userId: user.id,
        siteTitle: 'WeBooks - 我的书签管理器',
        seoDescription: '个人书签管理工具，支持加密空间',
        faviconUrl: '/favicon.ico'
      }
    });
    console.log('✅ 系统配置创建成功');
    
    // 创建公共空间
    console.log('📝 创建空间...');
    const publicSpace = await prisma.space.create({
      data: {
        name: '公共书签',
        description: '这是一个公共空间，每个人都可以访问',
        iconUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=public',
        userId: user.id,
        isEncrypted: false
      }
    });
    console.log('✅ 创建公共空间:', publicSpace.name);
    
    // 创建加密空间1
    const encryptedSpace1 = await prisma.space.create({
      data: {
        name: '敏感项目',
        description: '敏感项目相关资料，需要密码访问',
        iconUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=secret1',
        userId: user.id,
        isEncrypted: true,
        passwordHash: await bcrypt.hash('password123', 10)
      }
    });
    console.log('✅ 创建加密空间:', encryptedSpace1.name);
    
    // 创建加密空间2
    const encryptedSpace2 = await prisma.space.create({
      data: {
        name: '内部资料',
        description: '内部资料空间，需要密码访问',
        iconUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=secret2',
        userId: user.id,
        isEncrypted: true,
        passwordHash: await bcrypt.hash('internal456', 10)
      }
    });
    console.log('✅ 创建加密空间:', encryptedSpace2.name);
    
    // 创建公共空间的文件夹
    console.log('📁 创建公共空间文件夹和书签...');
    const devFolder = await prisma.folder.create({
      data: {
        name: '开发工具',
        description: '日常开发使用的工具网站',
        spaceId: publicSpace.id,
        userId: user.id
      }
    });
    
    const designFolder = await prisma.folder.create({
      data: {
        name: '设计资源',
        description: 'UI/UX设计相关的资源网站',
        spaceId: publicSpace.id,
        userId: user.id
      }
    });
    
    // 为公共空间添加书签
    await prisma.bookmark.createMany({
      data: [
        {
          title: 'GitHub',
          url: 'https://github.com',
          description: '全球最大的代码托管平台',
          iconUrl: 'https://github.com/favicon.ico',
          spaceId: publicSpace.id,
          folderId: devFolder.id,
          userId: user.id
        },
        {
          title: 'Stack Overflow',
          url: 'https://stackoverflow.com',
          description: '程序员问答社区',
          iconUrl: 'https://stackoverflow.com/favicon.ico',
          spaceId: publicSpace.id,
          folderId: devFolder.id,
          userId: user.id
        },
        {
          title: 'Figma',
          url: 'https://figma.com',
          description: '在线设计工具',
          iconUrl: 'https://figma.com/favicon.ico',
          spaceId: publicSpace.id,
          folderId: designFolder.id,
          userId: user.id
        }
      ]
    });
    
    // 为加密空间1创建文件夹和书签
    console.log('📁 创建"敏感项目"空间文件夹和书签...');
    const secretFolder1 = await prisma.folder.create({
      data: {
        name: '机密文档',
        description: '项目机密文档和API文档',
        spaceId: encryptedSpace1.id,
        userId: user.id
      }
    });
    
    await prisma.bookmark.createMany({
      data: [
        {
          title: '内部API文档',
          url: 'https://api.internal.company.com/docs',
          description: '公司内部API文档（机密）',
          iconUrl: '/favicon.ico',
          spaceId: encryptedSpace1.id,
          folderId: secretFolder1.id,
          userId: user.id
        },
        {
          title: '客户管理后台',
          url: 'https://crm.internal.company.com',
          description: '客户关系管理系统（机密）',
          iconUrl: '/favicon.ico',
          spaceId: encryptedSpace1.id,
          folderId: secretFolder1.id,
          userId: user.id
        }
      ]
    });
    
    // 为加密空间2创建文件夹和书签
    console.log('📁 创建"内部资料"空间文件夹和书签...');
    const internalFolder = await prisma.folder.create({
      data: {
        name: '内部流程',
        description: '公司内部工作流程文档',
        spaceId: encryptedSpace2.id,
        userId: user.id
      }
    });
    
    await prisma.bookmark.createMany({
      data: [
        {
          title: '内部办公系统',
          url: 'https://office.internal.company.com',
          description: '公司内部办公系统（机密）',
          iconUrl: '/favicon.ico',
          spaceId: encryptedSpace2.id,
          folderId: internalFolder.id,
          userId: user.id
        },
        {
          title: '财务系统',
          url: 'https://finance.internal.company.com',
          description: '公司财务管理系统（机密）',
          iconUrl: '/favicon.ico',
          spaceId: encryptedSpace2.id,
          folderId: internalFolder.id,
          userId: user.id
        }
      ]
    });
    
    // 设置默认空间为公共空间
    await prisma.systemConfig.update({
      where: { userId: user.id },
      data: { defaultSpaceId: publicSpace.id }
    });
    
    // 验证创建结果
    console.log('\n✅ 数据库初始化完成！验证结果:');
    const spaces = await prisma.space.findMany({
      include: {
        _count: {
          select: { bookmarks: true, folders: true }
        }
      }
    });
    
    console.log(`\n📊 空间统计 (共 ${spaces.length} 个空间):`);
    spaces.forEach((space, index) => {
      console.log(`${index + 1}. ${space.name} ${space.isEncrypted ? '🔒' : '🔓'} (加密: ${space.isEncrypted ? '是' : '否'}) - ${space._count.bookmarks}个书签, ${space._count.folders}个文件夹`);
    });
    
    console.log('\n🔐 登录信息:');
    console.log('用户名: admin');
    console.log('密码: admin123');
    
    console.log('\n🔑 加密空间密码:');
    console.log('- "敏感项目": password123');
    console.log('- "内部资料": internal456');
    
    console.log('\n🎯 测试建议:');
    console.log('1. 首先测试未登录访问 - 应该看到401错误');
    console.log('2. 然后使用 admin/admin123 登录测试');
    console.log('3. 验证已登录用户可以访问所有空间（包括加密空间）');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    await prisma.$disconnect();
  }
}

initializeCompleteDatabase();