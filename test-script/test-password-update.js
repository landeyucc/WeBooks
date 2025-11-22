const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testPasswordUpdate() {
  try {
    // 1. 查看当前空间
    console.log('=== 当前空间状态 ===');
    const spaces = await prisma.space.findMany({
      select: {
        id: true,
        name: true,
        isEncrypted: true,
        passwordHash: true,
        description: true
      }
    });
    
    spaces.forEach((space, index) => {
      console.log((index + 1) + '. ' + space.name + ' (加密: ' + space.isEncrypted + ', 有密码: ' + (space.passwordHash ? '是' : '否') + ')');
    });
    
    // 2. 修复"公司机密"空间的密码
    const companySpace = spaces.find(s => s.name === '公司机密');
    if (companySpace && !companySpace.passwordHash) {
      console.log('\n=== 修复公司机密空间密码 ===');
      const newPassword = 'company123';
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      await prisma.space.update({
        where: { id: companySpace.id },
        data: { passwordHash: passwordHash }
      });
      
      console.log('已为"公司机密"空间设置密码: ' + newPassword);
    }
    
    // 3. 修改"敏感项目"空间的密码
    const sensitiveSpace = spaces.find(s => s.name === '敏感项目');
    if (sensitiveSpace && sensitiveSpace.passwordHash) {
      console.log('\n=== 修改敏感项目空间密码 ===');
      const newPassword = 'newpassword456';
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      await prisma.space.update({
        where: { id: sensitiveSpace.id },
        data: { passwordHash: passwordHash }
      });
      
      console.log('已修改"敏感项目"空间密码为: ' + newPassword);
    }
    
    // 4. 验证修改结果
    console.log('\n=== 修改后空间状态 ===');
    const updatedSpaces = await prisma.space.findMany({
      select: {
        id: true,
        name: true,
        isEncrypted: true,
        passwordHash: true
      }
    });
    
    updatedSpaces.forEach((space, index) => {
      console.log((index + 1) + '. ' + space.name + ' (加密: ' + space.isEncrypted + ', 有密码: ' + (space.passwordHash ? '是' : '否') + ')');
    });
    
    // 5. 测试密码验证功能
    console.log('\n=== 测试密码验证 ===');
    
    // 测试验证"公司机密"空间的密码
    const verifyCompany = await fetch('http://localhost:3000/api/spaces/' + companySpace.id + '/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'company123' })
    });
    
    console.log('公司机密空间验证结果: ' + verifyCompany.status);
    
    // 测试验证"敏感项目"空间的密码（使用旧密码应该失败）
    const verifySensitiveOld = await fetch('http://localhost:3000/api/spaces/' + sensitiveSpace.id + '/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'oldpassword' })
    });
    
    console.log('敏感项目空间（旧密码）验证结果: ' + verifySensitiveOld.status);
    
    // 测试验证"敏感项目"空间的密码（使用新密码应该成功）
    const verifySensitiveNew = await fetch('http://localhost:3000/api/spaces/' + sensitiveSpace.id + '/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'newpassword456' })
    });
    
    console.log('敏感项目空间（新密码）验证结果: ' + verifySensitiveNew.status);
    
  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPasswordUpdate();