const { PrismaClient } = require('@prisma/client');

async function verifyAdmin() {
  const prisma = new PrismaClient();
  
  try {
    // 查询所有用户
    const users = await prisma.user.findMany();
    console.log('数据库中的用户列表:');
    console.log(users);
    
    // 检查是否存在admin用户
    const adminUser = await prisma.user.findUnique({
      where: {
        username: 'admin'
      }
    });
    
    if (adminUser) {
      console.log('\n✓ 管理员用户验证成功！');
      console.log('用户名:', adminUser.username);
      console.log('邮箱:', adminUser.email);
      console.log('创建时间:', adminUser.createdAt);
    } else {
      console.log('\n✗ 管理员用户验证失败！未找到admin用户');
    }
  } catch (error) {
    console.error('验证过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdmin();